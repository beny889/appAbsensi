package com.absensi.presentation.main

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.absensi.databinding.FragmentHomeBinding
import com.absensi.presentation.camera.CameraActivity
import com.absensi.util.Constants
import java.text.SimpleDateFormat
import java.util.*

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val viewModel: HomeViewModel by viewModels()
    private lateinit var attendanceAdapter: AttendanceAdapter

    private val dateFormat = SimpleDateFormat("EEEE, dd MMM yyyy", Locale("id", "ID"))
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale("id", "ID"))

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupSwipeRefresh()
        setupRecyclerView()
        setupObservers()
        setupListeners()
        updateDateTime()
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.apply {
            // Set refresh indicator colors
            setColorSchemeResources(
                android.R.color.holo_blue_bright,
                android.R.color.holo_green_light,
                android.R.color.holo_orange_light,
                android.R.color.holo_red_light
            )

            // Handle refresh action
            setOnRefreshListener {
                viewModel.loadTodayAttendance()
            }
        }
    }

    private fun setupRecyclerView() {
        attendanceAdapter = AttendanceAdapter()
        binding.rvAttendanceList.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = attendanceAdapter
        }
    }

    private fun setupObservers() {
        // Observe loading state for SwipeRefresh
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.swipeRefresh.isRefreshing = isLoading
        }

        // Observe today's attendance list
        viewModel.todayAttendanceList.observe(viewLifecycleOwner) { list ->
            if (list.isEmpty()) {
                binding.rvAttendanceList.visibility = View.GONE
                binding.layoutEmpty.visibility = View.VISIBLE
            } else {
                binding.rvAttendanceList.visibility = View.VISIBLE
                binding.layoutEmpty.visibility = View.GONE
                attendanceAdapter.submitList(list)
            }
        }
    }

    private fun setupListeners() {
        binding.btnCheckIn.setOnClickListener {
            if (checkPermissions()) {
                openCamera(isCheckIn = true)
            } else {
                requestPermissions()
            }
        }

        binding.btnCheckOut.setOnClickListener {
            if (checkPermissions()) {
                openCamera(isCheckIn = false)
            } else {
                requestPermissions()
            }
        }
    }

    private fun updateDateTime() {
        val currentDate = Date()
        binding.tvDate.text = dateFormat.format(currentDate)
        binding.tvTime.text = timeFormat.format(currentDate)

        // Update time every second to show seconds
        binding.root.postDelayed({ updateDateTime() }, 1000)
    }

    private fun checkPermissions(): Boolean {
        val cameraPermission = ContextCompat.checkSelfPermission(
            requireContext(),
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        return cameraPermission
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(
            requireActivity(),
            arrayOf(Manifest.permission.CAMERA),
            Constants.REQUEST_CAMERA_PERMISSION
        )
    }

    private fun openCamera(isCheckIn: Boolean) {
        val intent = Intent(requireContext(), CameraActivity::class.java)
        intent.putExtra(CameraActivity.EXTRA_IS_CHECK_IN, isCheckIn)
        startActivity(intent)
    }

    private fun openCameraForRegistration() {
        val intent = Intent(requireContext(), CameraActivity::class.java)
        intent.putExtra(CameraActivity.EXTRA_MODE, CameraActivity.MODE_REGISTRATION)
        startActivity(intent)
    }

    override fun onResume() {
        super.onResume()
        // Reload attendance list when returning from camera
        viewModel.loadTodayAttendance()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
