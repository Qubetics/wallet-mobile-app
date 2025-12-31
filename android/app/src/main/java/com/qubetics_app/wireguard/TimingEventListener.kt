package com.qubetics_app.wireguard

import android.util.Log
import okhttp3.Call
import okhttp3.EventListener
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy

class TimingEventListener : EventListener() {

    private var dnsStartTime = 0L

    override fun dnsStart(call: Call, domainName: String) {
        dnsStartTime = System.currentTimeMillis()
    }

    override fun dnsEnd(call: Call, domainName: String, inetAddressList: List<InetAddress>) {
        val dnsTime = System.currentTimeMillis() - dnsStartTime
        Log.d("TimingEventListener", "DNS resolved in ${dnsTime}ms")
    }

    override fun connectStart(
        call: Call,
        inetSocketAddress: InetSocketAddress,
        proxy: Proxy
    ) {
        Log.d("TimingEventListener", "TCP connect start")
    }

    override fun secureConnectStart(call: Call) {
        Log.d("TimingEventListener", "TLS handshake start")
    }
}
