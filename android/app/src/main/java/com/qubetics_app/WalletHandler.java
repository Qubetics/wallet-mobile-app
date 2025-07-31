package com.qubetics_app;

import android.util.Log;

import com.google.protobuf.ByteString;

import org.json.JSONException;
import org.json.JSONObject;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Optional;

import wallet.core.java.AnySigner;
import wallet.core.jni.AnyAddress;
import wallet.core.jni.Base58;
import wallet.core.jni.CoinType;
import wallet.core.jni.HDWallet;
import wallet.core.jni.Hash;
import wallet.core.jni.PrivateKey;
import wallet.core.jni.PublicKey;
import wallet.core.jni.SolanaAddress;
import wallet.core.jni.proto.Common;
import wallet.core.jni.proto.Solana;
import wallet.core.jni.proto.WalletConnect;
import wallet.core.jni.WalletConnectRequest;

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


    public static JSONObject signSolanaTransfer(String pvtKey, String toAddress, String amount, String recentBlockhash) throws Exception {
        HDWallet hdWallet = new HDWallet(pvtKey, "");
        PrivateKey solanaPrivateKey = hdWallet.getKeyForCoin(CoinType.SOLANA);

        long amountLong = Long.parseLong(amount);

        Solana.Transfer transferMessage = Solana.Transfer.newBuilder()
                .setRecipient(toAddress)
                .setValue(amountLong)
                .build();

        Solana.SigningInput signingInput = Solana.SigningInput.newBuilder()
                .setTransferTransaction(transferMessage)
                .setRecentBlockhash(recentBlockhash)
                .setPrivateKey(ByteString.copyFrom(solanaPrivateKey.data()))
                .setTxEncoding(Solana.Encoding.Base64)
                .build();

        Solana.SigningOutput output = AnySigner.sign(signingInput, CoinType.SOLANA, Solana.SigningOutput.parser());
        JSONObject txnObj = new JSONObject();
        txnObj.put("rawTxn", output.getEncoded());
        txnObj.put("signature", output.getSignatures(0).getSignature());

        return txnObj;
    }

    public static JSONObject signSolanaTokenTransfer(String pvtKey, String fromAddress, String toAddress, String tokenMintAddress, String amount, String recentBlockhash, String decimal) throws Exception {
        HDWallet hdWallet = new HDWallet(pvtKey, "");
        PrivateKey solanaPrivateKey = hdWallet.getKeyForCoin(CoinType.SOLANA);

        Solana.TokenTransfer tokenTransferMessage = Solana.TokenTransfer.newBuilder()
                .setTokenMintAddress(tokenMintAddress)
                .setSenderTokenAddress(fromAddress)
                .setRecipientTokenAddress(toAddress)
                .setAmount(Long.parseLong(amount))
                .setDecimals(Integer.parseInt(decimal))
                .build();

        Solana.SigningInput signingInput = Solana.SigningInput.newBuilder()
                .setTokenTransferTransaction(tokenTransferMessage)
                .setRecentBlockhash(recentBlockhash)
                .setPrivateKey(ByteString.copyFrom(solanaPrivateKey.data()))
                .setTxEncoding(Solana.Encoding.Base64)
                .build();

        Solana.SigningOutput output = AnySigner.sign(signingInput, CoinType.SOLANA, Solana.SigningOutput.parser());
        JSONObject txnObj = new JSONObject();
        txnObj.put("rawTxn", output.getEncoded());
        txnObj.put("signature", output.getSignatures(0).getSignature());

        return txnObj;
    }

    public static JSONObject createTokenAccountSigner(String pvtKey, String mainAddress, String tokenMintAddress, String tokenAddress, String recentBlockhash) throws Exception {
        HDWallet hdWallet = new HDWallet(pvtKey, "");
        PrivateKey solanaPrivateKey = hdWallet.getKeyForCoin(CoinType.SOLANA);

        Solana.CreateTokenAccount createAccountMessage = Solana.CreateTokenAccount.newBuilder()
                .setMainAddress(mainAddress)
                .setTokenMintAddress(tokenMintAddress)
                .setTokenAddress(tokenAddress)
                .build();

        Solana.SigningInput signingInput = Solana.SigningInput.newBuilder()
                .setCreateTokenAccountTransaction(createAccountMessage)
                .setRecentBlockhash(recentBlockhash)
                .setPrivateKey(ByteString.copyFrom(solanaPrivateKey.data()))
                .setTxEncoding(Solana.Encoding.Base64)
                .build();

        Solana.SigningOutput output = AnySigner.sign(signingInput, CoinType.SOLANA, Solana.SigningOutput.parser());
        JSONObject txnObj = new JSONObject();
        txnObj.put("rawTxn", output.getEncoded());
        txnObj.put("signature", output.getSignatures(0).getSignature());

        return txnObj;
    }

    public static JSONObject signWalletConnectRequest(String pvtKey, String requestPayload , String solAddress) throws Exception {
        HDWallet hdWallet = new HDWallet(pvtKey, "");
        PrivateKey solanaPrivateKey = hdWallet.getKeyForCoin(CoinType.SOLANA);

        String payload = "{\"transaction\":\"\"}";
        String finalPayload = payload.substring(0, 16) + requestPayload + payload.substring(16);

        WalletConnect.ParseRequestInput parsingInput = WalletConnect.ParseRequestInput.newBuilder()
                .setMethod(WalletConnect.Method.SolanaSignTransaction)
                .setPayload(finalPayload)
                .build();

        byte[] parsingOutputBytes = WalletConnectRequest.parse(CoinType.SOLANA, parsingInput.toByteArray());
        WalletConnect.ParseRequestOutput parsingOutput = WalletConnect.ParseRequestOutput.parseFrom(parsingOutputBytes);

        if (parsingOutput.getError() != Common.SigningError.OK) {
            throw new RuntimeException("Parsing error: " + parsingOutput.getError());
        }

        Solana.SigningInput signingInput = parsingOutput.getSolana().toBuilder()
                .setPrivateKey(ByteString.copyFrom(solanaPrivateKey.data()))
                .setTxEncoding(Solana.Encoding.Base64)
                .build();

        Solana.SigningOutput output = AnySigner.sign(signingInput, CoinType.SOLANA, Solana.SigningOutput.parser());
        List<Solana.PubkeySignature> signatures = output.getSignaturesList();
        Optional<Solana.PubkeySignature> filteredSig = signatures.stream()
                .filter(sig -> {
                    String pubkeyBase58 = sig.getPubkey();
                    return pubkeyBase58.equals(solAddress) || pubkeyBase58.contains(solAddress);
                })
                .findFirst();
        JSONObject txnObj = new JSONObject();
        txnObj.put("rawTxn", output.getEncoded());
        txnObj.put("signature", filteredSig
                .map(Solana.PubkeySignature::getSignature)
                .orElse(""));

        return txnObj;
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
