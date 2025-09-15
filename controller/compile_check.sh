#!/bin/bash

# Pre-compilation check script for Arduino controller
# Run this before committing to catch compilation errors

echo "🔧 Running compilation check..."

# Navigate to controller directory
cd "$(dirname "$0")"

# Run PlatformIO compilation
pio run --silent

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    exit 0
else
    echo "❌ Compilation failed! Fix errors before committing."
    exit 1
fi