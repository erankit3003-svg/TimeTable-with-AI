#!/bin/bash

echo "🚀 Starting Timetable Generator Frontend..."
echo ""

cd /app/client

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Starting React app..."
npm start