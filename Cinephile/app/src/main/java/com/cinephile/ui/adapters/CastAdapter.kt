package com.cinephile.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.cinephile.data.model.Actor
import com.cinephile.databinding.ItemCastBinding

// horizontal cast strip on the details screen — circular actor photos with name and character
class CastAdapter : ListAdapter<Actor, CastAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val binding: ItemCastBinding) :
        RecyclerView.ViewHolder(binding.root) {

        // bind actor name, character role, and load poster with circle crop
        fun bind(actor: Actor) {
            binding.tvActorName.text = actor.name
            binding.tvCharacter.text = actor.character
            // load poster — w185 thumbnail; placeholder shown when profilePath is null
            binding.ivActorPhoto.load(
                actor.profilePath?.let { "https://image.tmdb.org/t/p/w185$it" }
            ) {
                crossfade(200)
                transformations(CircleCropTransformation())
                placeholder(android.R.drawable.ic_menu_myplaces)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemCastBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) =
        holder.bind(getItem(position))

    companion object {
        // DiffUtil — compare by TMDB actor id, then by full content equality
        private val DIFF = object : DiffUtil.ItemCallback<Actor>() {
            override fun areItemsTheSame(a: Actor, b: Actor) = a.id == b.id
            override fun areContentsTheSame(a: Actor, b: Actor) = a == b
        }
    }
}
