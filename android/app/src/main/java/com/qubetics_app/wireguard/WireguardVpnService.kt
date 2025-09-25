package com.qubetics_app.wireguard

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import com.qubetics_app.MainActivity
import com.wireguard.config.Config
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets
import com.qubetics_app.R;

class WireguardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val CHANNEL_ID = "WireGuardVpnChannel"

    @SuppressLint("ForegroundServiceType")
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start foreground service with notification IMMEDIATELY
        startForeground(1, createNotification())

        // Parse config and setup tunnel
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
            .setSmallIcon(R.drawable.ic_stat_name) // better icon for VPN
            .setContentIntent(pendingIntent)
            .setOngoing(true) // makes it persistent
            .build()
    }

    fun setupTunnel(config: Config): Boolean {
        return try {
            val interfaceConfig = config.`interface`
            val address = interfaceConfig.addresses.firstOrNull()
                ?: throw IllegalStateException("No addresses configured")

            val builder = Builder()
                .addAddress(address.address, address.mask)
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

    // Restart service if app is swiped away
    override fun onTaskRemoved(rootIntent: Intent?) {
        val restartIntent = Intent(applicationContext, WireguardVpnService::class.java)
        restartIntent.putExtra("WIREGUARD_CONFIG", rootIntent?.getStringExtra("WIREGUARD_CONFIG"))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent)
        } else {
            startService(restartIntent)
        }
        super.onTaskRemoved(rootIntent)
    }
}
