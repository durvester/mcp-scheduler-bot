#!/bin/bash

# Test HTTP Transport Script
echo "🧪 Testing HTTP Transport functionality..."

# Set environment for HTTP transport testing
export TRANSPORT_TYPE=http
export HTTP_PORT=3000
export HTTP_HOST=127.0.0.1
export HTTP_REQUIRE_ORIGIN_VALIDATION=false
export HTTP_ENABLE_CORS=true

# Credentials no longer required at startup - server will start without them
# OAuth will trigger only when tools/resources are accessed

echo "📝 Test Configuration:"
echo "   Transport: $TRANSPORT_TYPE"
echo "   Host: $HTTP_HOST"
echo "   Port: $HTTP_PORT"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Cannot proceed with tests."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Compile the test script
echo "🔨 Building test script..."
npx tsc src/test-http-transport.ts --outDir build --target es2020 --module esnext --moduleResolution node

if [ $? -ne 0 ]; then
    echo "❌ Test script compilation failed."
    exit 1
fi

echo "✅ Test script compiled!"
echo ""

# Start server in background
echo "🚀 Starting HTTP server in background..."
node build/index.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Run tests
echo "🧪 Running HTTP transport tests..."
echo ""

node build/test-http-transport.js

TEST_EXIT_CODE=$?

# Stop the server
echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests completed successfully!"
else
    echo "❌ Some tests failed. Check the output above for details."
fi

exit $TEST_EXIT_CODE