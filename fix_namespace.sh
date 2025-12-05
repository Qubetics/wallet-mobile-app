#!/bin/bash

set -e

echo "🔍 Scanning node_modules for build.gradle + AndroidManifest pairs..."

# Find ALL possible build.gradle files in node_modules
find node_modules -type f -name "build.gradle" | while read -r GRADLE_FILE; do

  echo "--------------------------------------------------"
  echo "📁 Checking: $GRADLE_FILE"

  MODULE_DIR=$(dirname "$GRADLE_FILE")

  # Possible manifest locations
  M1="$MODULE_DIR/src/main/AndroidManifest.xml"          # typical RN module
  M2="$MODULE_DIR/main/AndroidManifest.xml"              # rare
  M3="$MODULE_DIR/src/AndroidManifest.xml"               # lottie/react-native structure
  M4="$MODULE_DIR/../src/android/src/AndroidManifest.xml" # nested src/android/src
  M5="$MODULE_DIR/../../src/android/src/AndroidManifest.xml" # deep case
  M6="$MODULE_DIR/../src/main/AndroidManifest.xml"       # backup

  # Detect correct manifest by priority
  if [ -f "$M1" ]; then MANIFEST="$M1"
  elif [ -f "$M2" ]; then MANIFEST="$M2"
  elif [ -f "$M3" ]; then MANIFEST="$M3"
  elif [ -f "$M4" ]; then MANIFEST="$M4"
  elif [ -f "$M5" ]; then MANIFEST="$M5"
  elif [ -f "$M6" ]; then MANIFEST="$M6"
  else
    echo "❌ No AndroidManifest.xml → skipping"
    continue
  fi

  echo "📄 Manifest found: $MANIFEST"

  # Extract package name
  PACKAGE=$(grep -o 'package="[^"]*"' "$MANIFEST" | sed 's/package="//;s/"//')

  if [ -z "$PACKAGE" ]; then
    echo "❌ Could not extract package → skipping"
    continue
  fi

  echo "📦 Package: $PACKAGE"

  # Skip if namespace already exists
  if grep -q "namespace" "$GRADLE_FILE"; then
    echo "✔ Namespace already present → skipping"
    continue
  fi

  echo "🛠 Inserting namespace into: $GRADLE_FILE"

  # Insert namespace one line below "android {"
awk -v ns="namespace \"$PACKAGE\"" '
  /android[[:space:]]*\{/ {
    print;
    print "    " ns;
    next
  }
  { print }
' "$GRADLE_FILE" > "${GRADLE_FILE}.tmp" && mv "${GRADLE_FILE}.tmp" "$GRADLE_FILE"

  echo "✨ Namespace added!"
done

echo "🎉 ALL DONE — All discovered modules patched."
