package com.cinephile.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.cinephile.data.model.Watchlist
import com.cinephile.databinding.ItemWatchlistBinding

// display model pairing a watchlist with its movie count for the list screen
data class WatchlistItem(val watchlist: Watchlist, val movieCount: Int)

// watchlist list adapter — gold Favorites card style, swipe-delete blocked for Favorites
class WatchlistAdapter(
    private val onWatchlistClick: (Watchlist) -> Unit,
    private val onWatchlistLongClick: (Watchlist) -> Unit,    // opens rename dialog
    private val onSetCurrentClick: (Watchlist) -> Unit,
    private val onDeleteClick: (Watchlist) -> Unit
) : ListAdapter<WatchlistItem, WatchlistAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemWatchlistBinding) :
        RecyclerView.ViewHolder(binding.root) {

        // bind watchlist card — favorites get distinct gold styling; regular cards are plain
        fun bind(item: WatchlistItem) {
            val wl = item.watchlist
            binding.tvWatchlistName.text = wl.name
            binding.tvMovieCount.text =
                binding.root.context.getString(com.cinephile.R.string.movie_count, item.movieCount)
            // "current" badge — shown next to the name of the active watchlist
            binding.tvCurrentBadge.visibility =
                if (wl.isCurrent) View.VISIBLE else View.GONE
            binding.root.setOnClickListener { onWatchlistClick(wl) }
            binding.root.setOnLongClickListener { onWatchlistLongClick(wl); true }
            binding.btnSetCurrent.setOnClickListener { onSetCurrentClick(wl) }
            binding.btnRename.setOnClickListener { onWatchlistLongClick(wl) }
            binding.btnDelete.setOnClickListener { onDeleteClick(wl) }

            if (wl.isFavorites) {
                // favorites watchlist — gold card, star icon, no rename/delete buttons
                binding.root.setCardBackgroundColor(Color.parseColor("#F5C518"))
                binding.root.cardElevation = 6f
                binding.ivStarIcon.visibility = View.VISIBLE
                binding.ivStarIcon.setColorFilter(Color.parseColor("#1A1A1A"))
                binding.btnRename.visibility = View.GONE
                binding.btnDelete.visibility = View.GONE
                binding.tvWatchlistName.textSize = 18f
                binding.tvWatchlistName.setTextColor(Color.parseColor("#1A1A1A"))
                binding.tvMovieCount.setTextColor(Color.parseColor("#333333"))
                binding.tvCurrentBadge.setTextColor(Color.parseColor("#1A1A1A"))
            } else {
                // regular watchlist — surface card with theme colors, rename/delete visible
                binding.root.setCardBackgroundColor(
                    binding.root.context.getColor(com.cinephile.R.color.colorSurface)
                )
                binding.root.cardElevation = 2f
                binding.ivStarIcon.visibility = View.GONE
                binding.btnRename.visibility = View.VISIBLE
                binding.btnDelete.visibility = View.VISIBLE
                binding.tvWatchlistName.textSize = 16f
                binding.tvWatchlistName.setTextColor(
                    binding.root.context.getColor(com.cinephile.R.color.colorOnBackground)
                )
                binding.tvMovieCount.setTextColor(Color.parseColor("#AAAAAA"))
                binding.tvCurrentBadge.setTextColor(
                    binding.root.context.getColor(com.cinephile.R.color.colorAccent)
                )
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemWatchlistBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    companion object {
        // DiffUtil — compare by watchlist id, then by full content equality
        private val DIFF = object : DiffUtil.ItemCallback<WatchlistItem>() {
            override fun areItemsTheSame(a: WatchlistItem, b: WatchlistItem) =
                a.watchlist.id == b.watchlist.id
            override fun areContentsTheSame(a: WatchlistItem, b: WatchlistItem) = a == b
        }
    }
}
