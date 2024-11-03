#!/bin/bash

# Set the package name
PACKAGE_NAME="@/lib/charts"

# Create necessary directories
mkdir -p ./public/static/datafeeds/udf/dist
mkdir -p ./public/static/fonts

# Remove existing files and directories if they exist
rm -rf ./public/static/datafeeds/udf/dist/bundle.js
rm -rf ./public/static/charting_library

# Copy the bundle.js file
cp ./node_modules/$PACKAGE_NAME/datafeeds/udf/dist/bundle.js ./public/static/datafeeds/udf/dist/bundle.js

# Copy the entire charting_library folder
cp -r ./node_modules/$PACKAGE_NAME/charting_library ./public/static/charting_library

# Font downloading section
S3_BUCKET="testnet-fonts"
S3_REGION="us-east-2"
FONT_NAMES="Aime-Regular.woff2 Favorit.ttf FavoritExtended.woff2 FavoritLight.ttf FavoritMono.ttf"
DOWNLOAD_DIR="./public/static/fonts"

# Function to download a file from S3 using curl
download_from_s3() {
  local file_name="$1"
  local url="https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${file_name}"
  curl --silent --remote-name "$url"
}

# Convert space-separated font names to an array
IFS=' ' read -ra font_names <<< "$FONT_NAMES"

# Loop through the font files and download each one
for font_name in "${font_names[@]}"; do
  echo "Downloading $font_name..."
  download_from_s3 "$font_name"
  mv "$font_name" "$DOWNLOAD_DIR/"
  echo "Downloaded and moved $font_name to $DOWNLOAD_DIR."
done

echo "All font files downloaded to $DOWNLOAD_DIR."
