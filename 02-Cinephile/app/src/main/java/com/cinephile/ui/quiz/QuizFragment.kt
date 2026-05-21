package com.cinephile.ui.quiz

import android.graphics.Color
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
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.cinephile.R
import com.cinephile.data.model.Difficulty
import com.cinephile.data.model.Watchlist
import com.cinephile.databinding.FragmentQuizBinding
import com.cinephile.ui.adapters.QuizAdapter
import kotlinx.coroutines.launch

// quiz list screen — shows all saved quizzes, create new quiz via watchlist+difficulty dialogs
class QuizFragment : Fragment() {

    private var _binding: FragmentQuizBinding? = null
    private val binding get() = _binding!!

    private val viewModel: QuizViewModel by viewModels {
        QuizViewModel.factory(requireContext())
    }

    private val adapter = QuizAdapter(
        // navigate to quiz detail screen on card tap
        onCardClick = { item ->
            findNavController().navigate(
                QuizFragmentDirections.actionQuizToQuizDetail(item.quiz.id)
            )
        },
        // delete quiz — confirm first via dark dialog, then delete quiz + attempt history
        onDeleteClick = { item ->
            AlertDialog.Builder(requireContext())
                .setMessage(R.string.delete_quiz_confirm)
                .setPositiveButton(R.string.ok) { _, _ -> viewModel.deleteQuiz(item.quiz) }
                .setNegativeButton(R.string.cancel, null)
                .show()
                .also { applyDarkStyle(it) }
        }
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQuizBinding.inflate(inflater, container, false)
        return binding.root
    }

    // onViewCreated — wire list, new-quiz button, and empty-state visibility
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.rvQuizzes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvQuizzes.adapter = adapter

        // new quiz — step 1: pick a watchlist
        binding.btnNewQuiz.setOnClickListener {
            viewLifecycleOwner.lifecycleScope.launch {
                val watchlists = viewModel.fetchWatchlists()
                if (_binding == null) return@launch
                showWatchlistPickerDialog(watchlists)
            }
        }

        // quiz list — show empty placeholder when no quizzes exist
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.quizItems.collect { items ->
                adapter.submitList(items)
                binding.tvEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
            }
        }
    }

    // quiz creation step 1 — pick the source watchlist for question generation
    private fun showWatchlistPickerDialog(watchlists: List<Watchlist>) {
        if (watchlists.isEmpty()) {
            AlertDialog.Builder(requireContext())
                .setMessage(getString(R.string.create_watchlist_first))
                .setPositiveButton(R.string.ok, null)
                .show()
                .also { applyDarkStyle(it) }
            return
        }
        val names = watchlists.map { it.name }.toTypedArray()
        val listAdapter = makeWhiteTextAdapter(names)
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.select_watchlist)))
            .setAdapter(listAdapter) { _, which ->
                showDifficultyDialog(watchlists[which])
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { applyDarkStyle(it) }
    }

    // quiz creation step 2 — pick difficulty (controls which question types are generated)
    private fun showDifficultyDialog(watchlist: Watchlist) {
        val options = arrayOf(
            getString(R.string.difficulty_easy_desc),
            getString(R.string.difficulty_medium_desc),
            getString(R.string.difficulty_hard_desc)
        )
        val difficulties = arrayOf(Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD)
        val listAdapter = makeWhiteTextAdapter(options)
        AlertDialog.Builder(requireContext())
            .setCustomTitle(makeDarkTitle(getString(R.string.pick_difficulty)))
            .setAdapter(listAdapter) { _, which ->
                viewModel.createQuiz(watchlist.id, watchlist.name, difficulties[which])
            }
            .setNegativeButton(R.string.cancel, null)
            .show()
            .also { applyDarkStyle(it) }
    }

    // dark dialog list adapter — forces item text white so it reads on #1E1E1E background
    private fun makeWhiteTextAdapter(items: Array<String>): ArrayAdapter<String> =
        object : ArrayAdapter<String>(requireContext(), android.R.layout.simple_list_item_1, items) {
            override fun getView(pos: Int, convertView: View?, parent: ViewGroup): View =
                (super.getView(pos, convertView, parent) as TextView)
                    .also { it.setTextColor(Color.WHITE) }
        }

    // dark dialog styling — applied after show() so buttons are accessible
    private fun applyDarkStyle(dialog: AlertDialog) {
        val dp = resources.displayMetrics.density
        dialog.window?.setBackgroundDrawable(
            GradientDrawable().apply {
                setColor(Color.parseColor("#1E1E1E"))
                cornerRadius = 12f * dp
            }
        )
        val red = Color.parseColor("#E50914")
        dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(red)
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(red)
    }

    // dark title TextView used with setCustomTitle() to avoid internal ID hacks
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

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
