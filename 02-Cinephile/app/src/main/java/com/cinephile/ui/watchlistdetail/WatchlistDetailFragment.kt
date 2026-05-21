package com.cinephile.ui.watchlistdetail

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.cinephile.databinding.FragmentWatchlistDetailBinding
import com.cinephile.ui.adapters.WatchlistMovieAdapter
import kotlinx.coroutines.launch

// watchlist detail screen — shows all movies in a single watchlist with inline remove
class WatchlistDetailFragment : Fragment() {

    private var _binding: FragmentWatchlistDetailBinding? = null
    private val binding get() = _binding!!

    private val args by lazy { WatchlistDetailFragmentArgs.fromBundle(requireArguments()) }

    private val viewModel: WatchlistDetailViewModel by viewModels {
        WatchlistDetailViewModel.factory(requireContext(), args.watchlistId)
    }

    private val adapter = WatchlistMovieAdapter(
        // navigate to movie detail on row tap
        onMovieClick = { movie ->
            findNavController().navigate(
                WatchlistDetailFragmentDirections.actionWatchlistDetailToDetails(movie.id)
            )
        },
        // remove movie from this watchlist only — does not delete it from the db
        onRemoveClick = { movie -> viewModel.removeMovie(movie.id) }
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWatchlistDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — wire list adapter, collect name, favorites banner, and movie list
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvMovies.layoutManager = LinearLayoutManager(requireContext())
        binding.rvMovies.adapter = adapter

        // watchlist name — shown as the screen title
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.watchlistName.collect { name ->
                binding.tvWatchlistName.text = name
            }
        }

        // favorites banner — gold strip shown only for the Favorites watchlist
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isFavorites.collect { isFav ->
                binding.tvFavoritesBanner.visibility = if (isFav) View.VISIBLE else View.GONE
            }
        }

        // movie list — show empty placeholder when the watchlist has no movies
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.movies.collect { movies ->
                adapter.submitList(movies)
                binding.tvEmpty.visibility = if (movies.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
