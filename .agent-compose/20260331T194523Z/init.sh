#!/bin/bash
# Dev environment bootstrap for Run Tunnel Game
# Safe to run multiple times (idempotent)

set -e
cd "$(dirname "$0")/../.."

# Install dependencies if not already installed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "node_modules exists, skipping install"
fi

echo "Setup complete. Run 'npm run dev' to start."
