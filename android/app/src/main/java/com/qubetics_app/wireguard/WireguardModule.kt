//@file:Suppress("DEPRECATION")
//
package com.qubetics_app.wireguard

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.wireguard.android.backend.GoBackend
import com.wireguard.crypto.KeyPair

import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets

class WireguardModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "WireguardModule"
    private val backend: GoBackend = GoBackend(reactContext)
    private var tunnel: VpnTunnel? = null
    private var isConnected: Boolean = false

    override fun getName(): String = "WireGuardVPNModule"

    init {
        tunnel = VpnTunnel()
    }

    // Request code for VPN permission
    private val VPN_PERMISSION_REQUEST_CODE = 1001

    // Method to prepare VPN (check and request permission)
    @ReactMethod
    fun prepareVpn(promise: Promise) {
        val activity = reactContext.currentActivity ?: run {
            promise.reject("E_ACTIVITY_NULL", "Activity is null")
            return
        }

        val prepareIntent = VpnService.prepare(activity)
        if (prepareIntent != null) {
            // Permission is needed, launch the VPN permission dialog
            try {
                // Register an ActivityResultLauncher or use startActivityForResult
                reactContext.addActivityEventListener(object : ActivityEventListener {
                    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
                        if (requestCode == VPN_PERMISSION_REQUEST_CODE) {
                            if (resultCode == Activity.RESULT_OK) {
                                promise.resolve(false) // Permission granted
                            } else {
                                promise.reject("E_PERMISSION_DENIED", "VPN permission denied by user")
                            }
                        }
                    }

                    override fun onNewIntent(intent: Intent?) {}
                })

                activity.startActivityForResult(prepareIntent, VPN_PERMISSION_REQUEST_CODE)
            } catch (e: Exception) {
                promise.reject("E_PERMISSION_ERROR", "Failed to request VPN permission: ${e.message}")
            }
        } else {
            // Permission already granted
            promise.resolve(false)
        }
    }
    @ReactMethod
    fun generateWGKeyPair (promise: Promise){
        try {
            val keyPair = KeyPair()
            val result = Arguments.createMap().apply {
                putString("privateKey", keyPair.privateKey.toBase64())
                putString("publicKey", keyPair.publicKey.toBase64())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KEY_GEN_ERROR", "Failed to generate WireGuard key pair", e)
        }
    }
    @ReactMethod
    fun getVpnConfig(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("WireGuardPrefs", Context.MODE_PRIVATE)
            val config = prefs.getString("last_config", null)
            if (config != null) {
                promise.resolve(config)
            } else {
                promise.reject("E_NO_CONFIG", "No VPN config found")
            }
        } catch (e: Exception) {
            Log.e("WireguardModule", "getVpnConfig: ${e.message}", e)
            promise.reject("E_VPN_CONFIG", "Failed to get VPN config: ${e.message}")
        }
    }

    // Method to connect VPN with configuration
    @ReactMethod
    fun connectVpn(configString: String, promise: Promise) {
        val activity = reactContext.currentActivity ?: run {
            promise.reject("E_ACTIVITY_NULL", "Activity is null")
            return
        }

        Thread {
            try {
                val config = Config.parse(
                    ByteArrayInputStream(configString.toByteArray(StandardCharsets.UTF_8))
                )

                tunnel?.let {
                    // Start the VPN service
//                    val intent = Intent(activity, WireguardVpnService::class.java)
//                    reactContext.startService(intent)


                    val intent = Intent(activity, WireguardVpnService::class.java)
                    intent.putExtra("WIREGUARD_CONFIG", configString)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        reactContext.startForegroundService(intent)
                    } else {
                        reactContext.startService(intent)
                    }

                    Log.e(TAG, "connectVpn: SERVICE STARTED", )
                    // Setup and connect the tunnel
                    val service = WireguardVpnService()
                    Log.e(TAG, "connectVpn: SERVICE STARTED"+service, )

                    if (service.setupTunnel(config)) {
                        backend.setState(it, Tunnel.State.UP, config)
                        saveLastConfig(configString)

                        isConnected = true
                        reactContext.runOnUiQueueThread {
                            sendEvent("VpnStatus", "Connected")
                            promise.resolve("VPN Connected")
                        }
                    } else {
                        reactContext.runOnUiQueueThread {
                            promise.reject("E_VPN_SETUP_FAILED", "Failed to setup VPN tunnel")
                        }
                    }
                } ?: run {
                    promise.reject("E_TUNNEL_NULL", "Tunnel is null")
                }
            } catch (e: Exception) {
                Log.e("WireguardModule", "Failed to connect: ${e.message}", e)
                reactContext.runOnUiQueueThread {
                    promise.reject("E_VPN_ERROR", "VPN connection failed: ${e.message}")
                }
            }
        }.start()
    }
    private fun saveLastConfig(config: String) {
        val prefs = reactContext.getSharedPreferences("WireGuardPrefs", Context.MODE_PRIVATE)
        prefs.edit().putString("last_config", config).apply()
    }

    @ReactMethod
    fun removeLastConfig(){
        val prefs = reactContext.getSharedPreferences("WireGuardPrefs", Context.MODE_PRIVATE)
        prefs.edit().remove("last_config").apply()
    }
    // Method to disconnect VPN
    @ReactMethod
    fun disconnectVpn(promise: Promise) {
        try {
            tunnel?.let {
                backend.setState(it, Tunnel.State.DOWN, null)
                isConnected = false
                removeLastConfig()
                // Stop the VPN service
                reactContext.stopService(Intent(reactContext, WireguardVpnService::class.java))
                reactContext.runOnUiQueueThread {
                    sendEvent("VpnStatus", "Disconnected")
                    promise.resolve("VPN Disconnected")
                }
            } ?: run {
                promise.reject("E_TUNNEL_NULL", "Tunnel is null")
            }
        } catch (e: Exception) {
            Log.e("WireguardModule", "Failed to disconnect: ${e.message}", e)
            reactContext.runOnUiQueueThread {
                promise.reject("E_VPN_ERROR", "Failed to disconnect: ${e.message}")
            }
        }
    }

    // Method to get VPN status
    @ReactMethod
    fun getVpnStatus(promise: Promise) {
        promise.resolve(if (isConnected) "Connected" else "Disconnected")
    }

    // Method to fetch server country
    @ReactMethod
    fun fetchServerCountry(ip: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = java.net.URL("http://ip-api.com/json/$ip")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                if (connection.responseCode == java.net.HttpURLConnection.HTTP_OK) {
                    val reader = java.io.BufferedReader(java.io.InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()

                    val jsonObject = org.json.JSONObject(response)
                    val country = jsonObject.getString("country")
                    reactContext.runOnUiQueueThread {
                        promise.resolve(country)
                    }
                } else {
                    reactContext.runOnUiQueueThread {
                        promise.reject("E_API_ERROR", "Failed to fetch country: API Error")
                    }
                }
                connection.disconnect()
            } catch (e: Exception) {
                Log.e("WireguardModule", "fetchServerCountry: ${e.message}", e)
                reactContext.runOnUiQueueThread {
                    promise.reject("E_API_ERROR", "Failed to fetch country: ${e.message}")
                }
            }
        }
    }

    // Helper method to send events to JavaScript
    private fun sendEvent(eventName: String, status: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, status)
    }

    inner class VpnTunnel : Tunnel {
        override fun getName(): String = "wg0"

        override fun onStateChange(newState: Tunnel.State) {
            reactContext.runOnUiQueueThread {
                when (newState) {
                    Tunnel.State.UP -> {
                        isConnected = true
                        sendEvent("VpnStatus", "Connected")
                    }
                    Tunnel.State.DOWN -> {
                        isConnected = false
                        sendEvent("VpnStatus", "Disconnected")
                    }
                    else -> {}
                }
            }
        }
    }
}