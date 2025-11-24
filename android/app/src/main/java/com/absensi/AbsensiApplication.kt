package com.absensi

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class AbsensiApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize app-wide components here
    }
}
