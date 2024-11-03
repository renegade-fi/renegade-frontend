#!/bin/bash

SUBMODULE_PATH="./lib/charts"

# Check if submodule exists
if [ ! -d "$SUBMODULE_PATH" ]; then
    echo "Error: TradingView submodule not found at $SUBMODULE_PATH"
    echo "Please ensure you've initialized the submodule with:"
    echo "git submodule update --init --recursive"
    exit 1
fi

# Create necessary directories
mkdir -p ./public/static/datafeeds/udf/dist
mkdir -p ./public/static/charting_library

# Remove existing files and directories if they exist
rm -rf ./public/static/datafeeds/udf/dist/bundle.js
rm -rf ./public/static/charting_library

# Copy the bundle.js file
cp $SUBMODULE_PATH/datafeeds/udf/dist/bundle.js ./public/static/datafeeds/udf/dist/bundle.js

# Copy the entire charting_library folder
cp -r $SUBMODULE_PATH/charting_library ./public/static/charting_library

echo "TradingView files copied successfully."