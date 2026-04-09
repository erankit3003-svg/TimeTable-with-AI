#!/bin/bash

echo "🚀 Starting Timetable Generator Backend..."
echo ""

cd /app/server

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Starting server on port 5000..."
node server.js