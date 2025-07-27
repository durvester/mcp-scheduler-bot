#!/bin/bash

# Test Practice Fusion MCP Server with MCP Inspector
echo "🔍 Testing Practice Fusion MCP Server with MCP Inspector..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Create .env file with your Practice Fusion credentials"
    echo "   See README.md for configuration details"
    echo ""
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Check if inspector is installed
if ! command -v mcp-inspector &> /dev/null; then
    echo "📦 Installing MCP Inspector..."
    npm install -g @modelcontextprotocol/inspector
fi

echo "🚀 Launching MCP Inspector..."
echo ""
echo "📝 What to test in the Inspector:"
echo "   1. Resources tab: practice://facilities, practice://users"
echo "   2. Tools tab: get_facilities, search_patients, get_users"
echo "   3. Prompts tab: schedule-appointment, patient-intake"
echo ""
echo "🌐 Inspector will open at: http://localhost:5173"
echo "🔐 OAuth flow will open in browser for authentication"
echo ""
echo "Press Ctrl+C to stop the inspector"
echo "---"

# Launch inspector
npx @modelcontextprotocol/inspector build/index.js