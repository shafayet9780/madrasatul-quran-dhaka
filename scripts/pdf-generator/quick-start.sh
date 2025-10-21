#!/bin/bash

# PDF Generator Quick Start Script
# This script helps you get the PDF Generator running quickly

echo "🚀 PDF Generator Quick Start"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the pdf-generator directory"
    echo "   cd scripts/pdf-generator"
    exit 1
fi

echo "📋 Checking setup..."

# Run setup script
echo "🔧 Running setup..."
node setup.js

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔍 Checking environment..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please copy .env.local from the main project or create .env manually"
    echo "   cp ../../.env.local .env"
    exit 1
fi

echo ""
echo "🧪 Running setup tests..."
node test-setup.js

echo ""
echo "⚠️  If you see Sharp module errors, the app will automatically use a fallback image processor."
echo "   This is normal and the PDF Generator will still work correctly."

echo ""
echo "🎯 Starting PDF Generator..."
echo "   Server will start on http://localhost:3001"
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
