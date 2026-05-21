package com.cinephile.ui.recommendation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import android.content.res.Configuration
import androidx.recyclerview.widget.GridLayoutManager
import com.cinephile.databinding.FragmentRecommendationBinding
import com.cinephile.ui.adapters.MovieAdapter
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

// recommendation screen — personalized grid with genre chip filter and refresh FAB
class RecommendationFragment : Fragment() {

    private var _binding: FragmentRecommendationBinding? = null
    private val binding get() = _binding!!

    private val viewModel: RecommendationViewModel by viewModels {
        RecommendationViewModel.factory(requireContext())
    }

    private val adapter = MovieAdapter(
        onMovieClick = { movie ->
            findNavController().navigate(
                RecommendationFragmentDirections.actionRecommendationToDetails(movie.id)
            )
        }
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRecommendationBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — grid layout, genre chips, refresh FAB, and all state observers
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // grid columns — 4 in landscape, 2 in portrait
        val columns = if (resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE) 4 else 2
        binding.rvRecommendations.layoutManager = GridLayoutManager(requireContext(), columns)
        binding.rvRecommendations.adapter = adapter

        binding.btnRefresh.setOnClickListener { viewModel.loadRecommendations() }

        // genre chips filter — TMDB genre IDs mapped from chip view IDs
        binding.chipGroupGenres.setOnCheckedStateChangeListener { _, checkedIds ->
            val genreId = when (checkedIds.firstOrNull()) {
                binding.chipAction.id    -> 28
                binding.chipScifi.id     -> 878
                binding.chipDrama.id     -> 18
                binding.chipComedy.id    -> 35
                binding.chipThriller.id  -> 53
                binding.chipHorror.id    -> 27
                binding.chipAnimation.id -> 16
                else                     -> null  // "All" chip — no genre filter
            }
            viewModel.setGenreFilter(genreId)
        }

        // loading spinner
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isLoading.collect { loading ->
                binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            }
        }

        // recommendations grid
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.recommendations.collect { movies ->
                adapter.submitList(movies)
            }
        }

        // hasData — show empty state or grid (null = loading, no UI change yet)
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.hasData.collect { hasData ->
                when (hasData) {
                    false -> {
                        binding.tvEmpty.visibility = View.VISIBLE
                        binding.rvRecommendations.visibility = View.GONE
                    }
                    true -> {
                        binding.tvEmpty.visibility = View.GONE
                        binding.rvRecommendations.visibility = View.VISIBLE
                    }
                    null -> {}
                }
            }
        }

        // trending banner — visible when there is no user profile yet (no favorites/ratings)
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isPersonalized.collect { personalized ->
                binding.tvTrendingBanner.visibility =
                    if (personalized) View.GONE else View.VISIBLE
            }
        }

        // error snackbar — display once then clear so it doesn't re-show on recompose
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.error.collect { msg ->
                if (msg != null) {
                    Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
                    viewModel.clearError()
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
