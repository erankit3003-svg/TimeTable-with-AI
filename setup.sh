#!/bin/bash

echo "===================================="
echo "  Timetable Generator Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js not found. Please install Node.js v14 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd /app/server
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend installation failed"
    exit 1
fi

echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd /app/client
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend installation failed"
    exit 1
fi

echo ""
echo "===================================="
echo "  ✅ Setup Complete!"
echo "===================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend:"
echo "   cd /app/server && node server.js"
echo ""
echo "2. Start Frontend (in new terminal):"
echo "   cd /app/client && npm start"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "===================================="