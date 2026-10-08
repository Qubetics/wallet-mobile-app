package com.qubetics_app;



import org.json.JSONObject;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import wallet.core.jni.Base58;
import wallet.core.jni.CoinType;
import wallet.core.jni.HDWallet;

public class WalletHandler {

    public static JSONObject generateAddresses(String mnemonics) {
        try {
            HDWallet hdWallet = new HDWallet(mnemonics, "");
            CoinType coinEth = CoinType.ETHEREUM;
            CoinType coinCosmos = CoinType.COSMOS;
            CoinType coinBtc = CoinType.BITCOIN;

            String ethSeeds = toHexString(hdWallet.getKeyForCoin(coinEth).data());
            String btcSeeds = toWIF(hdWallet.getKeyForCoin(coinBtc).data(), true);

            final JSONObject objectBTC = new JSONObject();
            final JSONObject objectETH = new JSONObject();
            objectBTC.put("address", hdWallet.getAddressForCoin(coinBtc));
            objectBTC.put("pvtKey", btcSeeds);
            objectETH.put("address", hdWallet.getAddressForCoin(coinEth));
            objectETH.put("pvtKey", "0x" + ethSeeds);

            final JSONObject addresses = new JSONObject();
            addresses.put("eth", objectETH);
            addresses.put("btc", objectBTC);
            addresses.put("mnemonics", mnemonics);

            return addresses;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    // Utility methods

    public static String toHexString(byte[] byteArray) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : byteArray) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }

    public static String toWIF(byte[] keyData, boolean compressed) {
        byte[] versionedKey = new byte[keyData.length + 1];
        versionedKey[0] = (byte) 0x80;
        System.arraycopy(keyData, 0, versionedKey, 1, keyData.length);

        byte[] keyWithCompression;
        if (compressed) {
            keyWithCompression = new byte[versionedKey.length + 1];
            System.arraycopy(versionedKey, 0, keyWithCompression, 0, versionedKey.length);
            keyWithCompression[versionedKey.length] = 0x01;
        } else {
            keyWithCompression = versionedKey;
        }

        try {
            MessageDigest sha256Digest = MessageDigest.getInstance("SHA-256");
            byte[] hash1 = sha256Digest.digest(keyWithCompression);
            byte[] hash2 = sha256Digest.digest(hash1);

            byte[] checksum = new byte[4];
            System.arraycopy(hash2, 0, checksum, 0, 4);

            byte[] wifBytes = new byte[keyWithCompression.length + checksum.length];
            System.arraycopy(keyWithCompression, 0, wifBytes, 0, keyWithCompression.length);
            System.arraycopy(checksum, 0, wifBytes, keyWithCompression.length, checksum.length);

            return Base58.encodeNoCheck(wifBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
