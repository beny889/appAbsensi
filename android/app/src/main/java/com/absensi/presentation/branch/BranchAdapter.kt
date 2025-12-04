package com.absensi.presentation.branch

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.absensi.R
import com.absensi.data.remote.dto.BranchDto

/**
 * Adapter for displaying list of branches in RecyclerView
 */
class BranchAdapter(
    private val onBranchClick: (BranchDto) -> Unit
) : ListAdapter<BranchDto, BranchAdapter.BranchViewHolder>(BranchDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BranchViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_branch, parent, false)
        return BranchViewHolder(view, onBranchClick)
    }

    override fun onBindViewHolder(holder: BranchViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class BranchViewHolder(
        itemView: View,
        private val onBranchClick: (BranchDto) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {

        private val nameText: TextView = itemView.findViewById(R.id.textBranchName)
        private val codeText: TextView = itemView.findViewById(R.id.textBranchCode)
        private val cityText: TextView = itemView.findViewById(R.id.textBranchCity)

        fun bind(branch: BranchDto) {
            nameText.text = branch.name
            codeText.text = branch.code

            // Show city if available
            if (branch.city != null) {
                cityText.text = branch.city
                cityText.visibility = View.VISIBLE
            } else {
                cityText.visibility = View.GONE
            }

            // Click listener
            itemView.setOnClickListener {
                onBranchClick(branch)
            }
        }
    }

    class BranchDiffCallback : DiffUtil.ItemCallback<BranchDto>() {
        override fun areItemsTheSame(oldItem: BranchDto, newItem: BranchDto): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: BranchDto, newItem: BranchDto): Boolean {
            return oldItem == newItem
        }
    }
}
