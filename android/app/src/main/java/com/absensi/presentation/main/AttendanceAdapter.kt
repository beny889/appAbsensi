package com.absensi.presentation.main

import android.graphics.BitmapFactory
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.absensi.databinding.ItemAttendanceBinding
import com.absensi.domain.model.AttendanceRecord
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CircleCrop

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
                // Tampilkan posisi saja, sembunyikan jika kosong
                if (attendance.userPosition.isNotEmpty()) {
                    tvUserPosition.text = attendance.userPosition
                    tvUserPosition.visibility = View.VISIBLE
                } else {
                    tvUserPosition.visibility = View.GONE
                }

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

                // Load profile image or show initial
                loadProfileImage(attendance)
            }
        }

        private fun loadProfileImage(attendance: AttendanceRecord) {
            val faceImageUrl = attendance.faceImageUrl

            if (!faceImageUrl.isNullOrEmpty()) {
                // Check if it's a base64 data URI
                if (faceImageUrl.startsWith("data:image")) {
                    // Extract base64 data from data URI
                    try {
                        val base64Data = faceImageUrl.substringAfter(",")
                        val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)

                        if (bitmap != null) {
                            Glide.with(itemView.context)
                                .load(bitmap)
                                .transform(CircleCrop())
                                .into(binding.ivProfileImage)

                            binding.ivProfileImage.visibility = View.VISIBLE
                            binding.tvProfileIcon.visibility = View.GONE
                            return
                        }
                    } catch (e: Exception) {
                        // Fall through to show initial
                    }
                } else {
                    // Regular URL
                    Glide.with(itemView.context)
                        .load(faceImageUrl)
                        .transform(CircleCrop())
                        .into(binding.ivProfileImage)

                    binding.ivProfileImage.visibility = View.VISIBLE
                    binding.tvProfileIcon.visibility = View.GONE
                    return
                }
            }

            // Fallback: Show initial letter
            binding.tvProfileIcon.text = attendance.userName.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
            binding.tvProfileIcon.visibility = View.VISIBLE
            binding.ivProfileImage.visibility = View.GONE
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
