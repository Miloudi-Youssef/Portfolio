package com.cinephile.ui.quiz

import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.cinephile.R
import com.cinephile.databinding.FragmentQuizPlayBinding
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.launch

// active quiz play screen — countdown timer, 4 answer buttons, progress bar, result panel
class QuizPlayFragment : Fragment() {

    private var _binding: FragmentQuizPlayBinding? = null
    private val binding get() = _binding!!

    private val args by lazy { QuizPlayFragmentArgs.fromBundle(requireArguments()) }

    private val viewModel: QuizViewModel by viewModels {
        QuizViewModel.factory(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQuizPlayBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — kick off quiz load, wire timer, play state, and back button
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewModel.loadQuizForPlay(args.quizId)

        // answer button references for bulk show/hide/color operations
        val answerButtons = listOf(
            binding.btnAnswer1, binding.btnAnswer2,
            binding.btnAnswer3, binding.btnAnswer4
        )

        binding.btnNext.setOnClickListener { viewModel.nextQuestion() }

        // timer — color changes: white → yellow (≤8s) → red (≤5s)
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.timeRemaining.collect { seconds ->
                binding.tvTimer.text = seconds.toString()
                binding.tvTimer.setTextColor(when {
                    seconds <= 5 -> Color.parseColor("#E50914")
                    seconds <= 8 -> Color.parseColor("#F5C518")
                    else         -> ContextCompat.getColor(requireContext(), R.color.colorOnBackground)
                })
            }
        }

        // play state — route each state to its own render function
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.playState.collect { state ->
                when (state) {
                    is QuizPlayState.Loading  -> showLoading(answerButtons)
                    is QuizPlayState.NoMovies -> showNoMovies(answerButtons)
                    is QuizPlayState.Playing  -> showQuestion(state, answerButtons)
                    is QuizPlayState.Finished -> showFinished(state)
                }
            }
        }

        // back / finish — save score before popping; only works if the quiz reached Finished state
        binding.btnBack.setOnClickListener {
            viewModel.saveScore(args.quizId)
            findNavController().popBackStack()
        }
    }

    // loading state — hide all interactive elements while questions are being generated
    private fun showLoading(buttons: List<MaterialButton>) {
        binding.tvQuestion.text = ""
        binding.tvQuestionProgress.text = ""
        binding.tvTimer.visibility = View.GONE
        binding.btnNext.visibility = View.GONE
        buttons.forEach { it.visibility = View.GONE }
        binding.layoutResult.visibility = View.GONE
    }

    // no movies state — watchlist is empty, can't generate questions
    private fun showNoMovies(buttons: List<MaterialButton>) {
        binding.tvQuestion.text = getString(R.string.no_results)
        binding.tvQuestionProgress.text = ""
        binding.tvTimer.visibility = View.GONE
        binding.btnNext.visibility = View.GONE
        buttons.forEach { it.visibility = View.GONE }
        binding.layoutResult.visibility = View.GONE
    }

    // question state — render question text, answer options, feedback colors after answering
    private fun showQuestion(state: QuizPlayState.Playing, buttons: List<MaterialButton>) {
        binding.layoutResult.visibility = View.GONE
        buttons.forEach { it.visibility = View.VISIBLE }

        // progress indicator
        binding.tvQuestionProgress.text =
            getString(R.string.question_of, state.index + 1, state.total)
        binding.quizProgressBar.max = state.total
        binding.quizProgressBar.progress = state.index + 1

        // question text — format differs per question type
        val q = state.question
        binding.tvQuestion.text = when (q.type) {
            QuestionType.RELEASE_YEAR -> getString(R.string.question_release_year, q.movieTitle)
            QuestionType.DIRECTOR     -> getString(R.string.question_director, q.movieTitle)
            QuestionType.ACTOR        -> getString(R.string.question_actor, q.movieTitle)
        }

        // answer buttons — after answering: correct=gold, wrong selected=red, others=neutral
        q.options.forEachIndexed { i, option ->
            buttons[i].text = option
            resetButtonColor(buttons[i])
            if (state.answered) {
                val isCorrect  = option == q.correctAnswer
                val isSelected = option == state.selectedAnswer
                when {
                    isCorrect  -> buttons[i].backgroundTintList =
                        ContextCompat.getColorStateList(requireContext(), R.color.colorAccent)
                    isSelected -> buttons[i].backgroundTintList =
                        ContextCompat.getColorStateList(requireContext(), R.color.colorPrimary)
                }
                // disable clicks once answered
                buttons[i].setOnClickListener(null)
            } else {
                buttons[i].setOnClickListener { viewModel.submitAnswer(option) }
            }
        }

        // Timer visible while answering, hidden once answered
        binding.tvTimer.visibility = if (state.answered) View.GONE else View.VISIBLE
        // Next button appears only after answering
        binding.btnNext.visibility = if (state.answered) View.VISIBLE else View.GONE
    }

    // finished state — hide all question UI and show the score result panel
    private fun showFinished(state: QuizPlayState.Finished) {
        binding.tvQuestion.text = ""
        binding.tvQuestionProgress.text = ""
        binding.tvTimer.visibility = View.GONE
        binding.btnNext.visibility = View.GONE
        listOf(binding.btnAnswer1, binding.btnAnswer2,
            binding.btnAnswer3, binding.btnAnswer4).forEach { it.visibility = View.GONE }
        binding.layoutResult.visibility = View.VISIBLE
        binding.tvScore.text = getString(R.string.your_score, state.score, state.maxScore)
    }

    // reset button to default surface color before re-applying answer feedback
    private fun resetButtonColor(button: MaterialButton) {
        button.backgroundTintList =
            ContextCompat.getColorStateList(requireContext(), R.color.colorSurface)
    }

    // lock portrait during quiz play — prevents layout thrash mid-game
    override fun onResume() {
        super.onResume()
        requireActivity().requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    // restore free rotation when leaving quiz play
    override fun onPause() {
        super.onPause()
        requireActivity().requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
