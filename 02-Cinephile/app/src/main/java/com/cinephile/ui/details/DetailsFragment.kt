package com.cinephile.ui.details

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import coil.load
import com.cinephile.R
import com.cinephile.data.model.Watchlist
import com.cinephile.databinding.FragmentDetailsBinding
import com.cinephile.ui.adapters.CastAdapter
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

// movie detail screen — backdrop, poster, synopsis, cast strip, rating bar, watchlist dialog
class DetailsFragment : Fragment() {

    private var _binding: FragmentDetailsBinding? = null
    private val binding get() = _binding!!

    private val args by lazy { DetailsFragmentArgs.fromBundle(requireArguments()) }

    private val viewModel: DetailsViewModel by viewModels {
        DetailsViewModel.factory(requireContext(), args.movieId)
    }

    private val castAdapter = CastAdapter()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDetailsBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — wire cast RecyclerView, collect movie state, set up all action buttons
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // cast strip — horizontal linear layout
        binding.rvCast.layoutManager =
            LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        binding.rvCast.adapter = castAdapter

        // observe movie data — populate all UI fields whenever the cache or network updates
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.movie.collect { movie ->
                movie ?: return@collect
                binding.tvTitle.text = movie.title
                binding.tvDirector.text = movie.director
                    ?.let { getString(R.string.director_label, it) } ?: ""
                binding.tvReleaseDate.text = movie.releaseDate
                    .takeIf { it.isNotEmpty() }
                    ?.let { getString(R.string.release_date_label, it) } ?: ""
                binding.tvOverview.text = movie.overview
                // load backdrop — fall back to poster if no backdrop available
                val backdropUrl = movie.backdropPath
                    ?.let { "https://image.tmdb.org/t/p/w780$it" }
                    ?: movie.posterPath?.let { "https://image.tmdb.org/t/p/w500$it" }
                binding.ivBackdrop.load(backdropUrl) { crossfade(400) }
                // load poster thumbnail
                binding.ivPoster.load(
                    movie.posterPath?.let { "https://image.tmdb.org/t/p/w500$it" }
                ) { crossfade(300) }
                // rating bar — restore saved rating and show numeric label
                binding.ratingBar.rating = movie.userRating
                binding.tvRatingLabel.text = if (movie.userRating > 0) movie.userRating.toString() else ""
                updateFavoriteIcon(movie.isFavorite)
                castAdapter.submitList(movie.cast)
            }
        }

        // watchlist button label — toggles between "Add" and "Remove" based on membership
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isInAnyWatchlist.collect { inList ->
                binding.btnWatchlist.text = getString(
                    if (inList) R.string.remove_from_watchlist else R.string.add_to_watchlist
                )
            }
        }

        // rating bar — persist rating on user change only (not programmatic restore)
        binding.ratingBar.setOnRatingBarChangeListener { _, rating, fromUser ->
            if (fromUser) {
                viewModel.setRating(rating)
                binding.tvRatingLabel.text = rating.toString()
            }
        }

        // favorites button — toggle; also syncs with the Favorites watchlist in the VM
        binding.btnFavorite.setOnClickListener {
            viewModel.toggleFavorite()
        }

        // watchlist dialog — show picker to add, or removal list if already in one or more
        binding.btnWatchlist.setOnClickListener {
            if (viewModel.isInAnyWatchlist.value) {
                viewLifecycleOwner.lifecycleScope.launch {
                    val containing = viewModel.fetchWatchlistsContainingMovie()
                    if (_binding == null) return@launch
                    // skip picker if only in one watchlist — remove directly
                    if (containing.size == 1) {
                        viewModel.removeFromWatchlist(containing[0].id)
                        Snackbar.make(binding.root, getString(R.string.removed_from_watchlist_named, containing[0].name), Snackbar.LENGTH_SHORT).show()
                    } else {
                        showRemoveFromWatchlistDialog(containing)
                    }
                }
            } else {
                viewLifecycleOwner.lifecycleScope.launch {
                    val watchlists = viewModel.fetchWatchlists()
                    if (_binding == null) return@launch
                    showWatchlistPickerDialog(watchlists)
                }
            }
        }
    }

    // watchlist dialog — pick which watchlist to remove this movie from
    private fun showRemoveFromWatchlistDialog(watchlists: List<Watchlist>) {
        val names = watchlists.map { it.name }
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.remove_from_watchlist)))
            .setAdapter(makeDarkListAdapter(names)) { _, which ->
                val chosen = watchlists[which]
                viewModel.removeFromWatchlist(chosen.id)
                Snackbar.make(
                    binding.root,
                    getString(R.string.removed_from_watchlist_named, chosen.name),
                    Snackbar.LENGTH_SHORT
                ).show()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { applyDarkDialogStyle(it) }
    }

    // watchlist picker dialog — choose which watchlist to add this movie to
    private fun showWatchlistPickerDialog(watchlists: List<Watchlist>) {
        if (watchlists.isEmpty()) {
            Snackbar.make(binding.root, getString(R.string.create_watchlist_first), Snackbar.LENGTH_SHORT).show()
            return
        }
        val names = watchlists.map { it.name }
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.add_to_watchlist)))
            .setAdapter(makeDarkListAdapter(names)) { _, which ->
                val chosen = watchlists[which]
                viewModel.addToWatchlist(chosen.id)
                Snackbar.make(
                    binding.root,
                    getString(R.string.added_to_watchlist_named, chosen.name),
                    Snackbar.LENGTH_SHORT
                ).show()
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { applyDarkDialogStyle(it) }
    }

    private fun makeDarkListAdapter(items: List<String>): ArrayAdapter<String> =
        object : ArrayAdapter<String>(requireContext(), android.R.layout.simple_list_item_1, items) {
            override fun getView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                val view = super.getView(position, convertView, parent)
                (view as? TextView)?.setTextColor(Color.WHITE)
                return view
            }
        }

    private fun applyDarkDialogStyle(dialog: AlertDialog) {
        val dp = resources.displayMetrics.density
        dialog.window?.setBackgroundDrawable(
            GradientDrawable().apply {
                setColor(Color.parseColor("#1E1E1E"))
                cornerRadius = 12f * dp
            }
        )
        val red = Color.parseColor("#E50914")
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(red)
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(red)
    }

    private fun makeDarkTitle(title: String): TextView {
        val px = (20 * resources.displayMetrics.density).toInt()
        return TextView(requireContext()).apply {
            text = title
            textSize = 18f
            setTextColor(Color.WHITE)
            setTypeface(null, Typeface.BOLD)
            setPaddingRelative(px, px, px, px / 2)
        }
    }

    // favorites icon — filled star when favorited, outline when not
    private fun updateFavoriteIcon(isFavorite: Boolean) {
        binding.btnFavorite.setImageResource(
            if (isFavorite) android.R.drawable.btn_star_big_on
            else android.R.drawable.btn_star_big_off
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
