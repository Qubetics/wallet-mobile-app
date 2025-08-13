package com.qubetics_app.wireguard

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import com.wireguard.config.Config
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets


class WireguardVpnService: VpnService() {
    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        intent?.getStringExtra("WIREGUARD_CONFIG")?.let { configStr ->
            try {
                val config = Config.parse(
                    ByteArrayInputStream(configStr.toByteArray(StandardCharsets.UTF_8))
                )
                setupTunnel(config)
            } catch (e: Exception) {
                Log.e("WireguardVPN", "Error parsing config: ${e.message}")
            }
        }
        return START_STICKY
    }

    fun setupTunnel(config: Config): Boolean {
        try {
            val interfaceConfig = config.`interface` // Use backticks for reserved keyword
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

            // Protect the VPN service from routing its own traffic
            // Since GoBackend.getSocket() is unavailable, we rely on GoBackend managing sockets internally
            vpnInterface = builder.establish()
            return vpnInterface != null
        } catch (e: Exception) {
            Log.e("VpnService", "Failed to setup tunnel: ${e.message}", e)
            return false
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
}