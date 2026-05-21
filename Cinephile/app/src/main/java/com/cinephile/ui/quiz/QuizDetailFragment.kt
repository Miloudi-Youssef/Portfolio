package com.cinephile.ui.quiz

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.cinephile.R
import com.cinephile.data.model.Difficulty
import com.cinephile.data.model.QuizAttempt
import com.cinephile.databinding.FragmentQuizDetailBinding
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// quiz detail screen — shows quiz metadata, difficulty badge, and attempt history
class QuizDetailFragment : Fragment() {

    private var _binding: FragmentQuizDetailBinding? = null
    private val binding get() = _binding!!

    private val args by lazy { QuizDetailFragmentArgs.fromBundle(requireArguments()) }

    private val viewModel: QuizViewModel by viewModels {
        QuizViewModel.factory(requireContext())
    }

    // attempt history adapter — inline private class, no DiffUtil needed (small list)
    private val attemptAdapter = AttemptAdapter()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQuizDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — wire up attempt list, collect quiz metadata and attempt history
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvAttempts.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAttempts.adapter = attemptAdapter

        // quiz metadata — name, watchlist, difficulty badge color
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.quizItems.collect { items ->
                val item = items.find { it.quiz.id == args.quizId } ?: return@collect
                binding.tvQuizName.text = item.quiz.name
                binding.tvWatchlistName.text = item.watchlistName

                // difficulty badge — color-coded green/yellow/red
                val (label, color) = when (item.quiz.difficulty) {
                    Difficulty.EASY.name  -> getString(R.string.difficulty_easy_desc) to Color.parseColor("#4CAF50")
                    Difficulty.HARD.name  -> getString(R.string.difficulty_hard_desc) to Color.parseColor("#E50914")
                    else                  -> getString(R.string.difficulty_medium_desc) to Color.parseColor("#F5C518")
                }
                binding.tvDifficulty.text = label
                binding.tvDifficulty.setTextColor(color)
            }
        }

        // attempt history — show list or "no attempts yet" placeholder
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.getAttempts(args.quizId).collect { attempts ->
                if (attempts.isEmpty()) {
                    binding.tvHistoryHeader.visibility = View.GONE
                    binding.rvAttempts.visibility = View.GONE
                    binding.tvNoAttempts.visibility = View.VISIBLE
                } else {
                    binding.tvHistoryHeader.visibility = View.VISIBLE
                    binding.rvAttempts.visibility = View.VISIBLE
                    binding.tvNoAttempts.visibility = View.GONE
                    attemptAdapter.submitList(attempts)
                }
            }
        }

        // navigate to quiz play screen
        binding.btnPlay.setOnClickListener {
            findNavController().navigate(
                QuizDetailFragmentDirections.actionQuizDetailToQuizPlay(args.quizId)
            )
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    // attempt history adapter — simple list with date and score per row
    private class AttemptAdapter : RecyclerView.Adapter<AttemptAdapter.VH>() {

        private var items: List<QuizAttempt> = emptyList()

        // submitList — full replace; list is short so notifyDataSetChanged is fine
        fun submitList(list: List<QuizAttempt>) {
            items = list
            notifyDataSetChanged()
        }

        class VH(val view: View) : RecyclerView.ViewHolder(view)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            VH(LayoutInflater.from(parent.context).inflate(R.layout.item_quiz_attempt, parent, false))

        override fun getItemCount() = items.size

        // bind attempt row — format timestamp as "MMM d, yyyy  HH:mm" and show score/max
        override fun onBindViewHolder(holder: VH, position: Int) {
            val attempt = items[position]
            val sdf = SimpleDateFormat("MMM d, yyyy  HH:mm", Locale.getDefault())
            holder.view.findViewById<TextView>(R.id.tv_attempt_date).text =
                sdf.format(Date(attempt.timestamp))
            holder.view.findViewById<TextView>(R.id.tv_attempt_score).text =
                "${attempt.score} / ${attempt.maxScore} pts"
        }
    }
}
