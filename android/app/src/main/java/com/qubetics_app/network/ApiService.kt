package com.qubetics_app.network

import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET
    suspend fun getRequest(
        @Url url: String,
        @Header("Authorization") token: String,
        @QueryMap params: Map<String, String>
    ): Response<Any>

    @POST
    suspend fun postRequest(
        @Url url: String,
        @Header("Authorization") token: String,
        @Body body: RequestBody?
    ): Response<Any>
}
