package com.cinephile.ui.quiz

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.cinephile.data.local.CinephileDatabase
import com.cinephile.data.model.Difficulty
import com.cinephile.data.model.Movie
import com.cinephile.data.model.Quiz
import com.cinephile.data.model.QuizAttempt
import com.cinephile.data.model.Watchlist
import com.cinephile.data.repository.QuizRepository
import com.cinephile.data.repository.WatchlistRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// question types gated by difficulty — EASY: year only, MEDIUM: +director, HARD: +actor
enum class QuestionType { RELEASE_YEAR, DIRECTOR, ACTOR }

// single generated quiz question with shuffled answer options
data class QuizQuestion(
    val type: QuestionType,
    val movieTitle: String,
    val correctAnswer: String,
    val options: List<String>   // always 4 options, shuffled
)

// display model pairing a Quiz with its source watchlist name for the list screen
data class QuizDisplayItem(val quiz: Quiz, val watchlistName: String)

// sealed play state — drives the quiz play screen UI
sealed class QuizPlayState {
    object Loading : QuizPlayState()
    object NoMovies : QuizPlayState()
    data class Playing(
        val question: QuizQuestion,
        val index: Int,
        val total: Int,
        val selectedAnswer: String? = null,
        val answered: Boolean = false     // true after user picks an answer or timer expires
    ) : QuizPlayState()
    data class Finished(val score: Int, val total: Int, val maxScore: Int) : QuizPlayState()
}

// ViewModel for quiz list, quiz creation, play session, and attempt history
class QuizViewModel(
    private val quizRepo: QuizRepository,
    private val watchlistRepo: WatchlistRepository
) : ViewModel() {

    companion object {
        // timer — 15 seconds per question; score bonus decays with time
        const val TIMER_SECONDS = 15

        // factory — builds repos from the shared Room database instance
        fun factory(context: Context) = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val db = CinephileDatabase.getInstance(context)
                return QuizViewModel(
                    QuizRepository(db.quizDao(), db.quizAttemptDao()),
                    WatchlistRepository(db.watchlistDao())
                ) as T
            }
        }
    }

    // all watchlists — used to populate watchlist picker in quiz creation
    val watchlists: StateFlow<List<Watchlist>> = watchlistRepo.getAllWatchlists()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // quiz display items — combine quizzes with watchlist names for the list screen
    val quizItems: StateFlow<List<QuizDisplayItem>> =
        combine(quizRepo.getAllQuizzes(), watchlistRepo.getAllWatchlists()) { quizzes, lists ->
            quizzes.map { quiz ->
                QuizDisplayItem(quiz, lists.find { it.id == quiz.watchlistId }?.name ?: "—")
            }
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _timeRemaining = MutableStateFlow(TIMER_SECONDS)
    val timeRemaining: StateFlow<Int> = _timeRemaining.asStateFlow()

    // timer job — cancelled on answer, navigation, or new question
    private var timerJob: Job? = null

    // one-shot watchlist fetch for the quiz creation dialog
    suspend fun fetchWatchlists(): List<Watchlist> =
        watchlistRepo.getAllWatchlists().firstOrNull() ?: emptyList()

    // create a new quiz for a given watchlist and difficulty
    fun createQuiz(watchlistId: Long, watchlistName: String, difficulty: Difficulty) {
        viewModelScope.launch {
            quizRepo.insert(Quiz(
                name = "Quiz - $watchlistName",
                watchlistId = watchlistId,
                difficulty = difficulty.name
            ))
        }
    }

    // delete quiz — clears attempt history first to avoid orphaned rows
    fun deleteQuiz(quiz: Quiz) {
        viewModelScope.launch {
            quizRepo.deleteAttemptsForQuiz(quiz.id)
            quizRepo.delete(quiz)
        }
    }

    // attempt history — live Flow for the detail screen
    fun getAttempts(quizId: Long): Flow<List<QuizAttempt>> = quizRepo.getAttemptsForQuiz(quizId)

    private val _playState = MutableStateFlow<QuizPlayState>(QuizPlayState.Loading)
    val playState: StateFlow<QuizPlayState> = _playState.asStateFlow()

    // in-memory quiz session state
    private var questions: List<QuizQuestion> = emptyList()
    private var currentIndex = 0
    private var score = 0

    // loadQuizForPlay — generate questions from watchlist movies, reset session state
    fun loadQuizForPlay(quizId: Long) {
        timerJob?.cancel()
        viewModelScope.launch {
            _playState.value = QuizPlayState.Loading
            val quiz = quizRepo.getAllQuizzes().firstOrNull()?.find { it.id == quizId }
                ?: return@launch
            val movies = watchlistRepo.getMoviesForWatchlist(quiz.watchlistId).firstOrNull()
                ?: emptyList()
            if (movies.isEmpty()) {
                _playState.value = QuizPlayState.NoMovies
                return@launch
            }
            // quiz generation — up to 10 questions, filtered by difficulty
            questions = generateQuestions(movies, quiz.difficulty)
            if (questions.isEmpty()) {
                _playState.value = QuizPlayState.NoMovies
                return@launch
            }
            currentIndex = 0
            score = 0
            emitCurrentQuestion()
        }
    }

    // submitAnswer — cancel timer, award points based on remaining time, lock buttons
    fun submitAnswer(answer: String) {
        val state = _playState.value as? QuizPlayState.Playing ?: return
        if (state.answered) return
        timerJob?.cancel()
        if (answer == state.question.correctAnswer) {
            // time-based bonus: fast = 3pts, medium = 2pts, slow = 1pt
            score += when {
                _timeRemaining.value > 10 -> 3
                _timeRemaining.value > 5  -> 2
                else                      -> 1
            }
        }
        _playState.value = state.copy(selectedAnswer = answer, answered = true)
    }

    // nextQuestion — advance index or transition to Finished state
    fun nextQuestion() {
        timerJob?.cancel()
        currentIndex++
        if (currentIndex >= questions.size) {
            _playState.value = QuizPlayState.Finished(
                score    = score,
                total    = questions.size,
                maxScore = questions.size * 3
            )
        } else {
            emitCurrentQuestion()
        }
    }

    // saveScore — persist score and add attempt record; only runs when Finished
    fun saveScore(quizId: Long) {
        val state = _playState.value as? QuizPlayState.Finished ?: return
        viewModelScope.launch {
            withContext(NonCancellable) {
                quizRepo.updateScore(quizId, state.score)
                quizRepo.insertAttempt(QuizAttempt(
                    quizId   = quizId,
                    score    = state.score,
                    maxScore = state.maxScore
                ))
            }
        }
    }

    // push the current question into the play state and start the countdown timer
    private fun emitCurrentQuestion() {
        _playState.value = QuizPlayState.Playing(
            question = questions[currentIndex],
            index    = currentIndex,
            total    = questions.size
        )
        startTimer()
    }

    // timer — counts down from TIMER_SECONDS, calls onTimeout at 0
    private fun startTimer() {
        timerJob?.cancel()
        _timeRemaining.value = TIMER_SECONDS
        timerJob = viewModelScope.launch {
            for (i in TIMER_SECONDS - 1 downTo 0) {
                delay(1000)
                _timeRemaining.value = i
                if (i == 0) onTimeout()
            }
        }
    }

    // Time ran out — show correct answer in gold, no score awarded, selectedAnswer stays null
    private fun onTimeout() {
        val state = _playState.value as? QuizPlayState.Playing ?: return
        if (state.answered) return
        _playState.value = state.copy(answered = true)
    }

    // quiz generation — maps difficulty to the allowed question types
    private fun allowedTypes(difficulty: String): Set<QuestionType> = when (difficulty) {
        Difficulty.EASY.name   -> setOf(QuestionType.RELEASE_YEAR)
        Difficulty.MEDIUM.name -> setOf(QuestionType.RELEASE_YEAR, QuestionType.DIRECTOR)
        else                   -> setOf(QuestionType.RELEASE_YEAR, QuestionType.DIRECTOR, QuestionType.ACTOR)
    }

    // quiz generation — shuffle movies, try to build up to 10 questions
    private fun generateQuestions(movies: List<Movie>, difficulty: String): List<QuizQuestion> {
        val allowed = allowedTypes(difficulty)
        val result = mutableListOf<QuizQuestion>()
        for (movie in movies.shuffled()) {
            if (result.size >= 10) break
            val q = tryBuildQuestion(movie, movies, allowed) ?: continue
            result.add(q)
        }
        return result
    }

    // tryBuildQuestion — pick a random eligible question type for this movie
    private fun tryBuildQuestion(
        movie: Movie,
        all: List<Movie>,
        allowed: Set<QuestionType>
    ): QuizQuestion? {
        val types = mutableListOf<QuestionType>()
        if (QuestionType.RELEASE_YEAR in allowed && movie.releaseDate.take(4).toIntOrNull() != null)
            types += QuestionType.RELEASE_YEAR
        if (QuestionType.DIRECTOR in allowed && movie.director != null)
            types += QuestionType.DIRECTOR
        if (QuestionType.ACTOR in allowed && movie.cast.isNotEmpty())
            types += QuestionType.ACTOR
        if (types.isEmpty()) return null

        return when (types.random()) {
            QuestionType.RELEASE_YEAR -> buildYearQuestion(movie)
            QuestionType.DIRECTOR     -> buildDirectorQuestion(movie, all)
            QuestionType.ACTOR        -> buildActorQuestion(movie, all)
        }
    }

    // fallback wrong answers — used when the watchlist is too small to supply enough distractors
    private val fallbackDirectors = listOf(
        "James Cameron", "Steven Spielberg", "Christopher Nolan",
        "Martin Scorsese", "Ridley Scott", "Quentin Tarantino"
    )
    private val fallbackActors = listOf(
        "Tom Hanks", "Meryl Streep", "Leonardo DiCaprio",
        "Cate Blanchett", "Denzel Washington", "Brad Pitt"
    )

    // build release year question — 3 wrong years from ±5 offset, shuffled with correct
    private fun buildYearQuestion(movie: Movie): QuizQuestion? {
        val year = movie.releaseDate.take(4).toIntOrNull() ?: return null
        val wrongs = mutableSetOf<Int>()
        val offsets = ((-5..-1) + (1..5)).shuffled()
        for (o in offsets) { if (wrongs.size < 3) wrongs.add(year + o) }
        if (wrongs.size < 3) return null
        return QuizQuestion(
            type          = QuestionType.RELEASE_YEAR,
            movieTitle    = movie.title,
            correctAnswer = year.toString(),
            options       = (wrongs.map { it.toString() } + year.toString()).shuffled()
        )
    }

    // build director question — distractors from other watchlist movies + famous fallbacks
    private fun buildDirectorQuestion(movie: Movie, all: List<Movie>): QuizQuestion? {
        val correct = movie.director ?: return null
        val wrongs = (all.filter { it.id != movie.id }.mapNotNull { it.director } + fallbackDirectors)
            .filter { it != correct }.distinct().shuffled().take(3)
        if (wrongs.size < 3) return null
        return QuizQuestion(
            type          = QuestionType.DIRECTOR,
            movieTitle    = movie.title,
            correctAnswer = correct,
            options       = (wrongs + correct).shuffled()
        )
    }

    // build actor question — pick a random cast member; distractors from other casts + fallbacks
    private fun buildActorQuestion(movie: Movie, all: List<Movie>): QuizQuestion? {
        val correct = movie.cast.randomOrNull()?.name ?: return null
        val wrongs = (all.filter { it.id != movie.id }.flatMap { it.cast }.map { it.name } + fallbackActors)
            .filter { it != correct }.distinct().shuffled().take(3)
        if (wrongs.size < 3) return null
        return QuizQuestion(
            type          = QuestionType.ACTOR,
            movieTitle    = movie.title,
            correctAnswer = correct,
            options       = (wrongs + correct).shuffled()
        )
    }
}
