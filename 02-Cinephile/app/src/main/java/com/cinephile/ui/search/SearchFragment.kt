package com.cinephile.ui.search

import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.cinephile.R
import com.cinephile.databinding.FragmentSearchBinding
import com.cinephile.ui.adapters.MovieAdapter
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.launch

// search screen — landing mode (logo + search bar) and results mode (grid + filter panel)
class SearchFragment : Fragment() {

    private var _binding: FragmentSearchBinding? = null
    private val binding get() = _binding!!

    private val viewModel: SearchViewModel by viewModels {
        SearchViewModel.factory(requireContext())
    }

    // inResultsMode — recomputed from ViewModel so rotation doesn't reset the screen
    private var inResultsMode = false

    // back callback — enabled only in results mode; returns to landing on back press
    private val backCallback = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() {
            resetToLanding()
        }
    }

    private val adapter = MovieAdapter(
        onMovieClick = { movie ->
            findNavController().navigate(
                SearchFragmentDirections.actionSearchToDetails(movie.id)
            )
        },
        // long-press — add to the currently-active watchlist
        onMovieLongClick = { movie ->
            lifecycleScope.launch {
                val added = viewModel.addToCurrentWatchlist(movie)
                val msg = if (added)
                    getString(R.string.added_to_watchlist)
                else
                    getString(R.string.no_current_watchlist)
                Snackbar.make(binding.root, msg, Snackbar.LENGTH_SHORT).show()
            }
        }
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSearchBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — restore state after rotation, wire all input and scroll listeners
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.resultsRecycler.layoutManager = GridLayoutManager(requireContext(), 2)
        binding.resultsRecycler.adapter = adapter

        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, backCallback)

        // restore mode from ViewModel so rotation doesn't bounce back to landing
        inResultsMode = viewModel.lastQuery.isNotEmpty() || viewModel.hasSearched
        applyMode(inResultsMode)

        // restore filter field values from ViewModel
        binding.searchInput.setText(viewModel.lastQuery)
        viewModel.lastYear?.let { binding.filterYear.setText(it.toString()) }
        viewModel.lastActorName?.let { binding.filterActor.setText(it) }
        viewModel.lastDirectorName?.let { binding.filterDirector.setText(it) }

        // filter panel toggle — show/hide the collapsible filter panel
        binding.btnToggleFilters.setOnClickListener {
            binding.filterPanel.visibility =
                if (binding.filterPanel.visibility == View.VISIBLE) View.GONE else View.VISIBLE
        }

        binding.btnSearch.setOnClickListener { doSearch() }
        binding.btnApplyFilters.setOnClickListener { doSearch() }
        // keyboard search action triggers search
        binding.searchInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) { doSearch(); true } else false
        }

        // infinite scroll — load next page when reaching the bottom of the list
        binding.resultsRecycler.addOnScrollListener(object : RecyclerView.OnScrollListener() {
            override fun onScrolled(recyclerView: RecyclerView, dx: Int, dy: Int) {
                if (dy > 0 && !recyclerView.canScrollVertically(1)) {
                    viewModel.loadMoreResults()
                }
            }
        })

        // genre spinner — populate from TMDB genre list; restore previously selected genre
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.genres.collect { genres ->
                val labels = listOf(getString(R.string.filter_genre_hint)) + genres.map { it.name }
                val spinnerAdapter = object : ArrayAdapter<String>(
                    requireContext(), android.R.layout.simple_spinner_item, labels
                ) {
                    override fun getView(pos: Int, convertView: android.view.View?, parent: android.view.ViewGroup): android.view.View =
                        (super.getView(pos, convertView, parent) as TextView).apply { setTextColor(Color.BLACK) }
                    override fun getDropDownView(pos: Int, convertView: android.view.View?, parent: android.view.ViewGroup): android.view.View =
                        (super.getDropDownView(pos, convertView, parent) as TextView).apply { setTextColor(Color.BLACK); setBackgroundColor(Color.WHITE) }
                }
                spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                binding.spinnerGenre.adapter = spinnerAdapter
                // restore previously selected genre after adapter is replaced
                binding.spinnerGenre.setSelection(viewModel.lastGenreIndex)
            }
        }

        // loading spinner
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isLoading.collect { loading ->
                binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
            }
        }

        // search results grid
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.searchResults.collect { results ->
                adapter.submitList(results)
                updateResultsUi(results)
            }
        }

        // error snackbar — show once then clear
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.error.collect { msg ->
                if (msg != null) {
                    Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
                    viewModel.clearError()
                }
            }
        }
    }

    // applyMode — switch between landing (logo + spacers) and results (grid + filter toggle)
    private fun applyMode(resultsMode: Boolean) {
        inResultsMode = resultsMode
        backCallback.isEnabled = resultsMode

        val landingVis = if (resultsMode) View.GONE else View.VISIBLE
        val resultsCtrlVis = if (resultsMode) View.VISIBLE else View.GONE

        // landing-only views — logo and centering spacers
        binding.spacerTop.visibility = landingVis
        binding.spacerBottom.visibility = landingVis
        binding.ivSearchLogo.visibility = landingVis
        // results-only controls
        binding.btnToggleFilters.visibility = resultsCtrlVis
    }

    // resetToLanding — clear results and return to the landing layout
    private fun resetToLanding() {
        adapter.submitList(emptyList())
        binding.filterPanel.visibility = View.GONE
        binding.tvEmpty.visibility = View.GONE
        binding.resultsRecycler.visibility = View.GONE
        applyMode(false)  // also disables backCallback
    }

    // updateResultsUi — show results grid or empty-state label depending on search state
    private fun updateResultsUi(results: List<com.cinephile.data.model.Movie>) {
        val hasResults = results.isNotEmpty()
        val showEmpty = inResultsMode && !hasResults && viewModel.hasSearched
        binding.tvEmpty.visibility = if (showEmpty) View.VISIBLE else View.GONE
        binding.resultsRecycler.visibility = if (hasResults) View.VISIBLE else View.GONE
    }

    // doSearch — read all filter fields and fire a fresh search via the ViewModel
    private fun doSearch() {
        // switch to results mode immediately, before the network call returns
        applyMode(true)

        val query = binding.searchInput.text.toString().trim()
        val year = binding.filterYear.text.toString().toIntOrNull()
        val genrePos = binding.spinnerGenre.selectedItemPosition
        // genrePos 0 is the placeholder "Genre" row, not a real genre
        val genreId = if (genrePos > 0) viewModel.genres.value.getOrNull(genrePos - 1)?.id else null
        val actor = binding.filterActor.text.toString().trim().takeIf { it.isNotEmpty() }
        val director = binding.filterDirector.text.toString().trim().takeIf { it.isNotEmpty() }
        viewModel.search(query, year, genreId, genrePos, actor, director)
    }

    // lock portrait on search — prevents mid-search rotation resetting the filter panel
    override fun onResume() {
        super.onResume()
        requireActivity().requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    override fun onPause() {
        super.onPause()
        requireActivity().requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
