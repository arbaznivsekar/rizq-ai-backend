#!/bin/bash

# Quick script to backfill company logos for existing jobs
# Usage: ./backfill-logos.sh

echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo ""
echo "🚀 Running logo backfill..."
npx ts-node scripts/backfill-logos.ts


