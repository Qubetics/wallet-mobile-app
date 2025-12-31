package com.qubetics_app.nativeBridge

import android.util.Log
import com.facebook.react.bridge.*
import com.google.gson.Gson
import com.qubetics_app.network.ApiClient
import com.qubetics_app.network.ApiService
import kotlinx.coroutines.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody

class NetworkModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val api: ApiService =
        ApiClient.retrofit.create(ApiService::class.java)

    private val gson = Gson()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun getName() = "NetworkModule"

    @ReactMethod
    fun makeRequest(
        endpoint: String,
        method: String,
        params: ReadableMap?,
        token: String,
        promise: Promise
    ) {
        scope.launch {
            try {
                val authHeader =
                    if (token.isNotEmpty()) "Bearer $token" else ""

                val response = when (method.uppercase()) {

                    // =========================
                    // GET → Query Params
                    // =========================
                    "GET" -> {
                        api.getRequest(
                            endpoint,
                            authHeader,
                            readableMapToStringMap(params)
                        )
                    }

                    // =========================
                    // POST → JSON Body (IMPORTANT)
                    // =========================
                    "POST" -> {
                        val jsonBody = params?.let {
                            Gson().toJson(readableMapToAnyMap(it))
                        }

                        val body = jsonBody?.toRequestBody(
                            "application/json".toMediaType()
                        )

                        api.postRequest(endpoint, authHeader, body)
                    }

                    else -> throw IllegalArgumentException("Unsupported HTTP method")
                }

                if (response.isSuccessful) {
                    promise.resolve(Gson().toJson(response.body()))
                } else {
                    promise.reject(
                        "API_ERROR",
                        response.errorBody()?.string()
                    )
                }

            } catch (e: Exception) {
                promise.reject("NETWORK_ERROR", e.message)
            }
        }
    }
    private fun readableMapToStringMap(map: ReadableMap?): Map<String, String> {
        val result = mutableMapOf<String, String>()
        map ?: return result

        val iterator = map.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()

            when (map.getType(key)) {
                ReadableType.String ->
                    result[key] = map.getString(key)!!

                ReadableType.Number ->
                    result[key] = map.getDouble(key).toString()

                ReadableType.Boolean ->
                    result[key] = map.getBoolean(key).toString()

                else -> {
                    // ❗ Ignore Map / Array in GET
                }
            }
        }
        return result
    }

    private fun readableMapToAnyMap(map: ReadableMap): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>()
        val iterator = map.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            when (map.getType(key)) {

                ReadableType.String ->
                    result[key] = map.getString(key)

                ReadableType.Number ->
                    result[key] = map.getDouble(key)

                ReadableType.Boolean ->
                    result[key] = map.getBoolean(key)

                ReadableType.Map ->
                    result[key] = readableMapToAnyMap(map.getMap(key)!!)

                ReadableType.Array ->
                    result[key] = readableArrayToList(map.getArray(key)!!)

                ReadableType.Null ->
                    result[key] = null
            }
        }
        return result
    }

    private fun readableArrayToList(array: ReadableArray): List<Any?> {
        val list = mutableListOf<Any?>()

        for (i in 0 until array.size()) {
            when (array.getType(i)) {
                ReadableType.String -> list.add(array.getString(i))
                ReadableType.Number -> list.add(array.getDouble(i))
                ReadableType.Boolean -> list.add(array.getBoolean(i))
                ReadableType.Map -> list.add(readableMapToAnyMap(array.getMap(i)!!))
                ReadableType.Array -> list.add(readableArrayToList(array.getArray(i)!!))
                ReadableType.Null -> list.add(null)
            }
        }
        return list
    }


    private fun readableMapToMap(map: ReadableMap?): Map<String, String> {
        val result = mutableMapOf<String, String>()
        map ?: return result

        val iterator = map.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            result[key] = map.getString(key) ?: ""
        }
        return result
    }
}
