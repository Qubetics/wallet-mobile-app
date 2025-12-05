#!/bin/bash

echo "----------------------------------------"
echo "  🔧 React Native SSL + VisionCamera Fix"
echo "----------------------------------------"
echo ""
echo "Select Build Type:"
echo "1) Debug"
echo "2) Release"
echo ""

read -p "Enter choice (1 or 2): " choice

echo ""
echo "Applying fixes..."
echo ""

############################################
#  FIX 1: react-native-ssl-pinning
############################################

SSL_DIR="node_modules/react-native-ssl-pinning/android/src/main/java/com/toyberman/Utils"

if [ -d "$SSL_DIR" ]; then
  echo ""
  echo "🔧 Fixing SSL Pinning (react-native-ssl-pinning)..."

  if [ "$choice" == "1" ]; then
    echo "➡ DEBUG build selected: Keeping BuildConfig.DEBUG"
    sed -i '' 's/false/BuildConfig.DEBUG/g' $SSL_DIR/*.java 2>/dev/null
  elif [ "$choice" == "2" ]; then
    echo "➡ RELEASE build selected: Removing BuildConfig.DEBUG completely"
    sed -i '' 's/BuildConfig.DEBUG/false/g' $SSL_DIR/*.java 2>/dev/null
  fi

  BUILD_GRADLE="node_modules/react-native-ssl-pinning/android/build.gradle"
  if ! grep -q "namespace \"com.toyberman\"" "$BUILD_GRADLE"; then
    echo "Adding namespace to SSL Pinning build.gradle..."
    sed -i '' '/android {/a\
    \    namespace "com.toyberman"
    ' "$BUILD_GRADLE"
  fi
else
  echo "⚠️ SSL Pinning directory not found. Skipping."
fi


############################################
#  FIX 2: react-native-vision-camera
############################################

VC_DIR="node_modules/react-native-vision-camera"

if [ -d "$VC_DIR" ]; then
  echo ""
  echo "🔧 Fixing VisionCamera FrameworkAPI issues..."

  grep -rl "FrameworkAPI" $VC_DIR/android/src/main/java | while read -r file ; do
    sed -i '' 's/import .*FrameworkAPI.*//g' "$file"
  done

  grep -rl "@FrameworkAPI" $VC_DIR/android/src/main/java | while read -r file ; do
    sed -i '' 's/@FrameworkAPI//g' "$file"
  done

else
  echo "⚠️ VisionCamera directory not found. Skipping."
fi


############################################
# Finish
############################################

echo ""
echo "----------------------------------------"
echo "  🎉 Fixes Applied Successfully!"
echo "  Now run:"
echo "    cd android && ./gradlew clean"
echo "    npx react-native run-android"
echo "----------------------------------------"
