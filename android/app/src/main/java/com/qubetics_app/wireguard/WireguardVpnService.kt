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
import android.system.OsConstants
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.qubetics_app.MainActivity
import com.qubetics_app.R
import com.wireguard.config.Config
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.ByteArrayInputStream
import java.io.FileInputStream
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class WireguardVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private val CHANNEL_ID = "WireGuardVpnChannel"
    private val TAG = "WireguardVpnService"
    val client = OkHttpClient.Builder()
        .eventListener(NetworkTimingListener())
        .connectTimeout(240, TimeUnit.SECONDS)
        .readTimeout(240, TimeUnit.SECONDS)     // allow late response
        .writeTimeout(240, TimeUnit.SECONDS)
        .callTimeout(240, TimeUnit.SECONDS)
        .build()

    @SuppressLint("WrongConstant")
    @RequiresApi(Build.VERSION_CODES.Q)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.getStringExtra("WIREGUARD_CONFIG")?.let { configStr ->
            try {
                val config = Config.parse(
                    ByteArrayInputStream(configStr.toByteArray(StandardCharsets.UTF_8))
                )
                if (!setupTunnel(config)) {
                    Log.e(TAG, "❌ Failed to setup VPN tunnel")
                    stopSelf()
                } else {
                    Log.i(TAG, "✅ VPN tunnel established successfully")

                    startPacketLogging() // optional logging
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED
                        } else {
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST
                        }

                        startForeground(1, createNotification(), serviceType)
                    } else {
                        startForeground(1, createNotification())
                    }

                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing config: ${e.message}")
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
            val cidrMask = iface.addresses.first().mask

            val builder = Builder()
                .addAddress(address, cidrMask)
                .addRoute("0.0.0.0", 0)
                .setMtu(1300)
                .setSession("wg0")
                .addDisallowedApplication("com.qubetics.wallet")

            // ✅ Use DNS from config if present; otherwise fallback to public
            if (iface.dnsServers.isNotEmpty()) {
                iface.dnsServers.forEach { dns ->
                    try {
                        builder.addDnsServer(dns.hostAddress ?: "1.1.1.1")
                    } catch (e: Exception) {
                        Log.w(TAG, "Invalid DNS: ${e.message}")
                    }
                }
            } else {
                builder.addDnsServer("1.1.1.1")
                builder.addDnsServer("8.8.8.8")
                builder.addDnsServer("9.9.9.9")
            }

            // ✅ Restrict to IPv4 to avoid Android IPv6 routing issues
            try {
                builder.allowFamily(OsConstants.AF_INET)
            } catch (e: Exception) {
                Log.w(TAG, "allowFamily(AF_INET) not supported: ${e.message}")
            }

            // ✅ Ensure your app traffic is included in VPN tunnel
            try {
                builder.addAllowedApplication("com.qubetics.wallet")
            } catch (e: Exception) {
                Log.w(TAG, "addAllowedApplication failed: ${e.message}")
            }

            // ✅ Optional: Block non-VPN traffic (force all through VPN)
            try {
                builder.setBlocking(true)
            } catch (e: Exception) {
                Log.w(TAG, "setBlocking not supported: ${e.message}")
            }

            vpnInterface = builder.establish()
            val isEstablished = vpnInterface != null
            Log.d(TAG, "VPN established = $isEstablished")
            isEstablished
        } catch (e: Exception) {
            Log.e(TAG, "Failed to setup tunnel: ${e.message}", e)
            false
        }
    }

    /** Logs incoming packets for debugging (VPN → device) */
    private fun startPacketLogging() {
        vpnInterface?.fileDescriptor?.let { fd ->
            val input = FileInputStream(fd)
            Thread {
                val buffer = ByteArray(32767)
                while (true) {
                    try {
                        val readLen = input.read(buffer)
                        if (readLen > 0) {
                            val recvPacket = buffer.copyOf(readLen)
                            Log.d(TAG, "📥 Received Packet (${readLen} bytes): ${recvPacket.toHexStringPrefix()}")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Packet logging error: ${e.message}", e)
                        break
                    }
                }
            }.start()
        }
    }

    private fun ByteArray.toHexStringPrefix(maxBytes: Int = 64): String {
        val len = minOf(size, maxBytes)
        return take(len).joinToString(" ") { String.format("%02X", it) }
    }

    override fun onDestroy() {
        try {
            vpnInterface?.close()
            vpnInterface = null
            Log.i(TAG, "VPN tunnel closed")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to close tunnel: ${e.message}", e)
        }
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)

        val workRequest = OneTimeWorkRequestBuilder<VpnRestartWorker>()
            .setInitialDelay(5, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }
}
