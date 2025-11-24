package com.absensi.presentation.main

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.absensi.databinding.ItemAttendanceBinding
import com.absensi.domain.model.AttendanceRecord

class AttendanceAdapter : ListAdapter<AttendanceRecord, AttendanceAdapter.AttendanceViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AttendanceViewHolder {
        val binding = ItemAttendanceBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return AttendanceViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AttendanceViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class AttendanceViewHolder(
        private val binding: ItemAttendanceBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(attendance: AttendanceRecord) {
            binding.apply {
                tvUserName.text = attendance.userName
                tvUserPosition.text = attendance.userPosition

                // Format check-in time
                tvCheckInTime.text = if (attendance.checkInTime.isNotEmpty()) {
                    "Masuk: ${attendance.checkInTime}"
                } else {
                    "Masuk: -"
                }

                // Format check-out time
                tvCheckOutTime.text = if (attendance.checkOutTime.isNotEmpty()) {
                    "Pulang: ${attendance.checkOutTime}"
                } else {
                    "Pulang: -"
                }

                // Update status badge
                if (attendance.checkOutTime.isNotEmpty()) {
                    tvStatus.text = "SELESAI"
                    tvStatus.setBackgroundColor(0xFF9E9E9E.toInt()) // Gray
                } else {
                    tvStatus.text = "HADIR"
                    tvStatus.setBackgroundColor(0xFF4CAF50.toInt()) // Green
                }

                // Set profile icon (you can customize this based on user)
                tvProfileIcon.text = attendance.userName.firstOrNull()?.toString() ?: "?"
            }
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<AttendanceRecord>() {
        override fun areItemsTheSame(oldItem: AttendanceRecord, newItem: AttendanceRecord): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: AttendanceRecord, newItem: AttendanceRecord): Boolean {
            return oldItem == newItem
        }
    }
}
