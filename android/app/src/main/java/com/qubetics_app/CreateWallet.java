package com.qubetics_app;

import android.util.Log;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import org.json.JSONObject;

public class CreateWallet extends ReactContextBaseJavaModule {

    CreateWallet(ReactApplicationContext context) {
        super(context);
        System.loadLibrary("TrustWalletCore");
    }

    @NonNull
    @Override
    public String getName() {
        return "CreateWallet";
    }

    @ReactMethod
    public void generateMnemonics(Callback callback) {
        wallet.core.jni.HDWallet wallet = new wallet.core.jni.HDWallet(128, "");
        String mnemonics = wallet.mnemonic();
        JSONObject addresses = WalletHandler.generateAddresses(mnemonics);
        callback.invoke(addresses.toString());
    }

    @ReactMethod
    public void generateAddressFromMnemonics(String mnemonics, Callback callback) {
        JSONObject addresses = WalletHandler.generateAddresses(mnemonics);
        callback.invoke(addresses.toString());
    }

    @ReactMethod
    public void clearGarbageCollection() {
        System.runFinalization();
        Runtime.getRuntime().gc();
        System.gc();
    }

    @ReactMethod
    public void signSolanaTransaction(String pvtKey, String toAddress, String amount, String recentBlockhash, Callback callback) {
        try {
            JSONObject txnObj = new JSONObject();//WalletHandler.signSolanaTransfer(pvtKey, toAddress, amount, recentBlockhash);
            callback.invoke(txnObj.toString());
        } catch (Exception e) {
            callback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void signSolanaTokenTransaction(String pvtKey, String fromAddress, String toAddress, String tokenMintAddress, String amount, String recentBlockhash, String decimal, Callback callback) {
        try {
            JSONObject txnObj = new JSONObject();//WalletHandler.signSolanaTokenTransfer(pvtKey, fromAddress, toAddress, tokenMintAddress, amount, recentBlockhash, decimal);
            callback.invoke(txnObj.toString());
        } catch (Exception e) {
            callback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void createTokenAccountSigner(String pvtKey, String mainAddress, String tokenMintAddress, String tokenAddress, String recentBlockhash, Callback callback) {
        try {
            JSONObject txnObj =new JSONObject();// WalletHandler.createTokenAccountSigner(pvtKey, mainAddress, tokenMintAddress, tokenAddress, recentBlockhash);
            callback.invoke(txnObj.toString());
        } catch (Exception e) {
            callback.invoke(e.getMessage());
        }
    }

    @ReactMethod
    public void signSolanaWalletConnectRequest(String pvtKey, String requestPayload, String solAddress, Callback callback) {
        Log.d("SolanaAddress", solAddress);
        try {
            JSONObject txnObj =  new JSONObject();//WalletHandler.signWalletConnectRequest(pvtKey, requestPayload ,solAddress);
            callback.invoke(txnObj.toString());
        } catch (Exception e) {
            callback.invoke(e.getMessage());
        }
    }
}
