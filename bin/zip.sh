#!/usr/bin/env bash
set -euo pipefail

PLUGIN_SLUG="wpflowforms"
PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
OUT_FILE="$PLUGIN_ROOT/$PLUGIN_SLUG.zip"

echo "Building $PLUGIN_SLUG.zip..."

# Copy plugin files into a correctly named subdirectory
mkdir "$TMP_DIR/$PLUGIN_SLUG"
cp -r \
  "$PLUGIN_ROOT/assets" \
  "$PLUGIN_ROOT/build" \
  "$PLUGIN_ROOT/includes" \
  "$PLUGIN_ROOT/languages" \
  "$PLUGIN_ROOT/templates" \
  "$PLUGIN_ROOT/readme.txt" \
  "$PLUGIN_ROOT/wpflowforms.php" \
  "$TMP_DIR/$PLUGIN_SLUG/"

# Create the zip
cd "$TMP_DIR"
zip -r "$OUT_FILE" "$PLUGIN_SLUG" --quiet

# Cleanup
rm -rf "$TMP_DIR"

echo "Done: $OUT_FILE"
