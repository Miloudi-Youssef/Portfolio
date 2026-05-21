package com.cinephile.ui.watchlist

import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.cinephile.R
import com.cinephile.data.model.Watchlist
import com.cinephile.databinding.FragmentWatchlistBinding
import com.cinephile.ui.adapters.WatchlistAdapter
import kotlinx.coroutines.launch

// watchlist list screen — swipe-to-delete, FAB create, inline rename/set-current buttons
class WatchlistFragment : Fragment() {

    private var _binding: FragmentWatchlistBinding? = null
    private val binding get() = _binding!!

    private val viewModel: WatchlistViewModel by viewModels {
        WatchlistViewModel.factory(requireContext())
    }

    private val adapter = WatchlistAdapter(
        // navigate to watchlist detail on tap
        onWatchlistClick = { wl ->
            findNavController().navigate(
                WatchlistFragmentDirections.actionWatchlistToWatchlistDetail(wl.id)
            )
        },
        // long-press opens rename dialog; blocked for the Favorites watchlist
        onWatchlistLongClick = { wl ->
            if (!wl.isFavorites) showRenameDialog(wl.id, wl.name)
        },
        onSetCurrentClick = { wl -> viewModel.setCurrentWatchlist(wl.id) },
        onDeleteClick = { wl -> showDeleteDialog(wl) }
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWatchlistBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — attach adapter, swipe-delete helper, FAB, and list observer
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvWatchlists.layoutManager = LinearLayoutManager(requireContext())
        binding.rvWatchlists.adapter = adapter

        // swipe delete — disabled for the Favorites watchlist row
        ItemTouchHelper(object : ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT or ItemTouchHelper.RIGHT) {
            override fun onMove(rv: RecyclerView, vh: RecyclerView.ViewHolder, t: RecyclerView.ViewHolder) = false
            override fun getSwipeDirs(rv: RecyclerView, vh: RecyclerView.ViewHolder): Int {
                val pos = vh.adapterPosition
                if (pos == RecyclerView.NO_POSITION) return 0
                // favorites watchlist — hidden from swipe delete
                if (adapter.currentList[pos].watchlist.isFavorites) return 0
                return super.getSwipeDirs(rv, vh)
            }
            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                val pos = viewHolder.adapterPosition
                if (pos == RecyclerView.NO_POSITION) return
                viewModel.deleteWatchlist(adapter.currentList[pos].watchlist)
            }
        }).attachToRecyclerView(binding.rvWatchlists)

        // FAB — create new watchlist dialog
        binding.fabAdd.setOnClickListener { showCreateWatchlistDialog() }

        // watchlist list — show empty placeholder when no watchlists exist
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.watchlistItems.collect { items ->
                adapter.submitList(items)
                binding.tvEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    // create watchlist dialog — pre-fills a numbered default name
    private fun showCreateWatchlistDialog() {
        val count = adapter.currentList.size + 1
        val defaultName = getString(R.string.new_watchlist) + " $count"
        val input = makeEditText(defaultName, getString(R.string.watchlist_name_hint))
        input.selectAll()
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.new_watchlist)))
            .setView(wrapInPaddedContainer(input))
            .setPositiveButton(R.string.ok) { _, _ ->
                val name = input.text.toString().trim()
                if (name.isNotEmpty()) viewModel.createWatchlist(name)
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { dialog -> applyDarkDialogStyle(dialog, input) }
    }

    // delete watchlist dialog — dark dialog with red buttons
    private fun showDeleteDialog(watchlist: Watchlist) {
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.delete_watchlist)))
            .setMessage(getString(R.string.delete_watchlist_confirm))
            .setPositiveButton(R.string.ok) { _, _ -> viewModel.deleteWatchlist(watchlist) }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { dialog ->
                // dark dialog styling — applied after show() when buttons are available
                val dp = resources.displayMetrics.density
                dialog.window?.setBackgroundDrawable(
                    android.graphics.drawable.GradientDrawable().apply {
                        setColor(android.graphics.Color.parseColor("#1E1E1E"))
                        cornerRadius = 12f * dp
                    }
                )
                val red = android.graphics.Color.parseColor("#E50914")
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(red)
                dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(red)
                dialog.findViewById<android.widget.TextView>(android.R.id.message)
                    ?.setTextColor(android.graphics.Color.parseColor("#CCCCCC"))
            }
    }

    // rename watchlist dialog — pre-fills the current name for editing
    private fun showRenameDialog(id: Long, currentName: String) {
        val input = makeEditText(currentName, getString(R.string.watchlist_name_hint))
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.rename_watchlist)))
            .setView(wrapInPaddedContainer(input))
            .setPositiveButton(R.string.ok) { _, _ ->
                val name = input.text.toString().trim()
                if (name.isNotEmpty()) viewModel.renameWatchlist(id, name)
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { dialog -> applyDarkDialogStyle(dialog, input) }
    }

    // dark dialog styling — must be called after show() so buttons are accessible
    private fun applyDarkDialogStyle(dialog: AlertDialog, input: EditText) {
        val dp = resources.displayMetrics.density
        dialog.window?.setBackgroundDrawable(
            GradientDrawable().apply {
                setColor(Color.parseColor("#1E1E1E"))
                cornerRadius = 12f * dp
            }
        )
        val red = Color.parseColor("#E50914")
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(red)
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(red)
        input.requestFocus()
    }

    // white bold title TextView used with setCustomTitle() to avoid internal ID hacks
    private fun makeDarkTitle(title: String): TextView {
        val px = (20 * resources.displayMetrics.density).toInt()
        return TextView(requireContext()).apply {
            text = title
            textSize = 18f
            setTextColor(Color.WHITE)
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPaddingRelative(px, px, px, px / 2)
        }
    }

    // styled EditText for watchlist name input inside dialogs
    private fun makeEditText(text: String, hint: String) = EditText(requireContext()).apply {
        setText(text)
        this.hint = hint
        setSingleLine()
        setTextColor(Color.WHITE)
        setHintTextColor(Color.parseColor("#999999"))
    }

    // wrap an EditText in a padded FrameLayout for dialog content
    private fun wrapInPaddedContainer(input: EditText): FrameLayout {
        val pad = (20 * resources.displayMetrics.density).toInt()
        return FrameLayout(requireContext()).apply {
            setPadding(pad, pad / 2, pad, 0)
            addView(input)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
