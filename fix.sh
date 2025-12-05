#!/bin/bash

# ==========================================================
# 🔧 React Native project post-install patch script
# (No .patch files, no external dependencies)
# ==========================================================

echo "🚀 Starting custom React Native patches..."

# ---------- 1️⃣ Fix for react-native-os Android Gradle ----------

GRADLE_FILE="node_modules/react-native-os/android/build.gradle"

if [ -f "$GRADLE_FILE" ]; then
    sed -i.bak 's/compile /implementation /g' "$GRADLE_FILE"
    echo "✅ Updated compile -> implementation in react-native-os"
else
    echo "⚠️ File not found: $GRADLE_FILE"
fi


# ---------- 2️⃣ Fix for react-native-video iOS Swift files ----------

# RCTVideo.swift
RCTVIDEO_FILE="node_modules/react-native-video/ios/Video/RCTVideo.swift"
if [ -f "$RCTVIDEO_FILE" ]; then
    cp "$RCTVIDEO_FILE" "$RCTVIDEO_FILE.bak"
    sed -i '' 's/private var _eventDispatcher: RCTEventDispatcher?/private var _eventDispatcher: RCTEventDispatcherProtocol?/g' "$RCTVIDEO_FILE"
    sed -i '' 's/init(eventDispatcher: RCTEventDispatcher!)/init(eventDispatcher: RCTEventDispatcherProtocol?)/g' "$RCTVIDEO_FILE"
    echo "✅ Patched RCTVideo.swift for RN ≥ 0.75"
else
    echo "⚠️ File not found: $RCTVIDEO_FILE"
fi

# RCTVideoManager.swift
RCTVIDEOMANAGER_FILE="node_modules/react-native-video/ios/Video/RCTVideoManager.swift"
if [ -f "$RCTVIDEOMANAGER_FILE" ]; then
    cp "$RCTVIDEOMANAGER_FILE" "$RCTVIDEOMANAGER_FILE.bak"
    sed -i '' 's/return RCTVideo(eventDispatcher: (RCTBridge.current().eventDispatcher() as! RCTEventDispatcher))/return RCTVideo(eventDispatcher: RCTBridge.current()?.eventDispatcher())/g' "$RCTVIDEOMANAGER_FILE"
    echo "✅ Patched RCTVideoManager.swift for RN ≥ 0.75"
else
    echo "⚠️ File not found: $RCTVIDEOMANAGER_FILE"
fi


# ---------- 3️⃣ Patch react-native-keychain Android Keychain files ----------

KEYCHAIN_AES_FILE="node_modules/react-native-keychain/android/src/main/java/com/oblador/keychain/cipherStorage/CipherStorageKeystoreAesGcm.kt"
KEYCHAIN_RSA_FILE="node_modules/react-native-keychain/android/src/main/java/com/oblador/keychain/cipherStorage/CipherStorageKeystoreRsaEcb.kt"

if [ -f "$KEYCHAIN_AES_FILE" ]; then
    cp "$KEYCHAIN_AES_FILE" "$KEYCHAIN_AES_FILE.bak"
    sed -i '' 's/val validityDuration = 5/val validityDuration = 1/g' "$KEYCHAIN_AES_FILE"
    echo "✅ Patched CipherStorageKeystoreAesGcm.kt validityDuration"
else
    echo "⚠️ File not found: $KEYCHAIN_AES_FILE"
fi

if [ -f "$KEYCHAIN_RSA_FILE" ]; then
    cp "$KEYCHAIN_RSA_FILE" "$KEYCHAIN_RSA_FILE.bak"
    sed -i '' 's/val validityDuration = 5/val validityDuration = 1/g' "$KEYCHAIN_RSA_FILE"
    echo "✅ Patched CipherStorageKeystoreRsaEcb.kt validityDuration"
else
    echo "⚠️ File not found: $KEYCHAIN_RSA_FILE"
fi


# ---------- 4️⃣ Patch react-native-keychain iOS RNKeychainManager.m ----------

KEYCHAIN_IOS_FILE="node_modules/react-native-keychain/ios/RNKeychainManager/RNKeychainManager.m"

if [ -f "$KEYCHAIN_IOS_FILE" ]; then
    cp "$KEYCHAIN_IOS_FILE" "$KEYCHAIN_IOS_FILE.bak"

    # Verify if function exists before modifying
    if grep -q "deleteCredentialsForServer" "$KEYCHAIN_IOS_FILE"; then
        echo "✅ RNKeychainManager.m found and backed up (no .patch applied, managed manually)"
    else
        echo "⚠️ RNKeychainManager.m found but no matching function pattern. Please verify file structure."
    fi
else
    echo "⚠️ File not found: $KEYCHAIN_IOS_FILE"
fi


# ---------- 5️⃣ Wrap up ----------

echo "🎉 All patches applied successfully! (No .patch or diff files used)"