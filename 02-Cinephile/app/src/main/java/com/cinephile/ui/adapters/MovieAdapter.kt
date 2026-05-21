package com.cinephile.ui.adapters

import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.cinephile.data.model.Movie
import com.cinephile.databinding.ItemMovieBinding

// movie grid/list adapter — used in search, recommendation, and watchlist detail screens
class MovieAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onMovieLongClick: (Movie) -> Unit = {}  // long-press to add to current watchlist
) : ListAdapter<Movie, MovieAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemMovieBinding) :
        RecyclerView.ViewHolder(binding.root) {

        init {
            // press animation — slight scale-down on touch for tactile feedback
            binding.root.setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN ->
                        v.animate().scaleX(0.95f).scaleY(0.95f).setDuration(100).start()
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(100).start()
                }
                false
            }
        }

        // bind movie data — load poster, set text fields, attach click listeners
        fun bind(movie: Movie) {
            binding.tvTitle.text = movie.title
            binding.tvDirector.text = movie.director ?: ""
            binding.tvReleaseDate.text = movie.releaseDate.take(4)  // show year only
            // load poster — w500 for grid display
            binding.ivPoster.load(
                movie.posterPath?.let { "https://image.tmdb.org/t/p/w500$it" }
            ) {
                crossfade(300)
            }
            // fade-in animation per card as it binds
            binding.root.alpha = 0f
            binding.root.animate().alpha(1f).setDuration(300).start()
            binding.root.setOnClickListener { onMovieClick(movie) }
            binding.root.setOnLongClickListener { onMovieLongClick(movie); true }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemMovieBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    companion object {
        // DiffUtil — compare by TMDB movie id, then by full content equality
        private val DIFF = object : DiffUtil.ItemCallback<Movie>() {
            override fun areItemsTheSame(a: Movie, b: Movie) = a.id == b.id
            override fun areContentsTheSame(a: Movie, b: Movie) = a == b
        }
    }
}
