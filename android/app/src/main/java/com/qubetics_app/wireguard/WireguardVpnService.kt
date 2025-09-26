package com.qubetics_app.wireguard

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.qubetics_app.MainActivity
import com.qubetics_app.R
import com.wireguard.config.Config
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class WireguardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val CHANNEL_ID = "WireGuardVpnChannel"

    @SuppressLint("WrongConstant")
    @RequiresApi(Build.VERSION_CODES.Q)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start foreground service immediately
        startForeground(
            1,
            createNotification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )

        intent?.getStringExtra("WIREGUARD_CONFIG")?.let { configStr ->
            try {
                val config = Config.parse(
                    ByteArrayInputStream(configStr.toByteArray(StandardCharsets.UTF_8))
                )
                if (!setupTunnel(config)) {
                    Log.e("WireguardVPN", "Failed to setup VPN tunnel")
                    stopSelf()
                }
            } catch (e: Exception) {
                Log.e("WireguardVPN", "Error parsing config: ${e.message}")
                stopSelf()
            }
        }

        return START_STICKY
    }

    private fun createNotification(): Notification {
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "WireGuard VPN",
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("WireGuard VPN")
            .setContentText("VPN is running")
            .setSmallIcon(R.drawable.ic_stat_name)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    fun setupTunnel(config: Config): Boolean {
        return try {
            val iface = config.`interface`
            val address = iface.addresses.firstOrNull()?.address
                ?: throw IllegalStateException("No addresses configured")

            val builder = Builder()
                .addAddress(address, iface.addresses.first().mask)
                .addDnsServer("1.1.1.1")
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0)
                .addRoute("::", 0)
                .setMtu(1400)
                .setSession("wg0")

            vpnInterface = builder.establish()
            vpnInterface != null
        } catch (e: Exception) {
            Log.e("VpnService", "Failed to setup tunnel: ${e.message}", e)
            false
        }
    }

    override fun onDestroy() {
        try {
            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e("VpnService", "Failed to close tunnel: ${e.message}", e)
        }
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)

        // Use WorkManager to restart VPN if killed
        val workRequest = OneTimeWorkRequestBuilder<VpnRestartWorker>()
            .setInitialDelay(5, TimeUnit.SECONDS) // restart after 5 sec
            .build()

        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }
}
