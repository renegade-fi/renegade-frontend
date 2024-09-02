#!/bin/bash

PACKAGE_NAME="@renegade-fi/tradingview-charts"

# Create necessary directories
mkdir -p ./public/static/datafeeds/udf/dist
mkdir -p ./public/static/charting_library

# Remove existing files and directories if they exist
rm -rf ./public/static/datafeeds/udf/dist/bundle.js
rm -rf ./public/static/charting_library

# Copy the bundle.js file
cp ./node_modules/$PACKAGE_NAME/datafeeds/udf/dist/bundle.js ./public/static/datafeeds/udf/dist/bundle.js

# Copy the entire charting_library folder
cp -r ./node_modules/$PACKAGE_NAME/charting_library ./public/static/charting_library

echo "TradingView files copied successfully."