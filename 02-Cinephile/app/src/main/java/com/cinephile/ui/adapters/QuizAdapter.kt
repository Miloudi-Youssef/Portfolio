package com.cinephile.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.cinephile.R
import com.cinephile.databinding.ItemQuizBinding
import com.cinephile.ui.quiz.QuizDisplayItem

// quiz list adapter — shows quiz name, source watchlist, difficulty badge, and last score
class QuizAdapter(
    private val onCardClick: (QuizDisplayItem) -> Unit,
    private val onDeleteClick: (QuizDisplayItem) -> Unit  // long-press triggers delete confirm
) : ListAdapter<QuizDisplayItem, QuizAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemQuizBinding) :
        RecyclerView.ViewHolder(binding.root) {

        // bind quiz card — difficulty color, last score badge, and click listeners
        fun bind(item: QuizDisplayItem) {
            binding.tvQuizName.text = item.quiz.name
            binding.tvWatchlistName.text = item.watchlistName

            // difficulty color — green/yellow/red matching Easy/Medium/Hard
            val diffColor = when (item.quiz.difficulty) {
                "EASY" -> Color.parseColor("#4CAF50")
                "HARD" -> Color.parseColor("#E50914")
                else   -> Color.parseColor("#F5C518")
            }
            binding.tvDifficulty.text = item.quiz.difficulty
                .lowercase().replaceFirstChar { it.uppercase() }
            binding.tvDifficulty.setTextColor(diffColor)

            // last score badge — hidden if quiz has never been played
            val score = item.quiz.lastScore
            if (score != null) {
                binding.tvLastScore.visibility = android.view.View.VISIBLE
                binding.tvLastScore.text =
                    binding.root.context.getString(R.string.last_score, score)
            } else {
                binding.tvLastScore.visibility = android.view.View.GONE
            }
            binding.root.setOnClickListener { onCardClick(item) }
            binding.root.setOnLongClickListener { onDeleteClick(item); true }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemQuizBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    companion object {
        // DiffUtil — compare by quiz id, then by full content equality
        private val DIFF = object : DiffUtil.ItemCallback<QuizDisplayItem>() {
            override fun areItemsTheSame(a: QuizDisplayItem, b: QuizDisplayItem) =
                a.quiz.id == b.quiz.id
            override fun areContentsTheSame(a: QuizDisplayItem, b: QuizDisplayItem) = a == b
        }
    }
}
