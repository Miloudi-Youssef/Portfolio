package com.cinephile.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.cinephile.data.model.Movie
import com.cinephile.databinding.ItemWatchlistMovieBinding

// adapter for movies inside a watchlist detail screen — thumbnail row with inline remove button
class WatchlistMovieAdapter(
    private val onMovieClick: (Movie) -> Unit,
    private val onRemoveClick: (Movie) -> Unit  // triggers remove from this watchlist only
) : ListAdapter<Movie, WatchlistMovieAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemWatchlistMovieBinding) :
        RecyclerView.ViewHolder(binding.root) {

        // bind movie row — load poster thumbnail, set title and year, wire buttons
        fun bind(movie: Movie) {
            binding.tvTitle.text = movie.title
            binding.tvReleaseDate.text = movie.releaseDate.take(4)  // year only
            // load poster — w500 size (same as grid; cropped to 60×90dp by the layout)
            binding.ivPoster.load(
                movie.posterPath?.let { "https://image.tmdb.org/t/p/w500$it" }
            )
            binding.root.setOnClickListener { onMovieClick(movie) }
            binding.btnRemove.setOnClickListener { onRemoveClick(movie) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemWatchlistMovieBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    companion object {
        // DiffUtil — compare by movie id, then by full content equality
        private val DIFF = object : DiffUtil.ItemCallback<Movie>() {
            override fun areItemsTheSame(a: Movie, b: Movie) = a.id == b.id
            override fun areContentsTheSame(a: Movie, b: Movie) = a == b
        }
    }
}
