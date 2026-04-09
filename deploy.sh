#!/bin/bash

echo "====================================="
echo " Timetable Generator - Deployment"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kill existing processes
echo -e "${BLUE}Stopping existing processes...${NC}"
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# Build frontend
echo -e "${BLUE}Building React frontend...${NC}"
cd /app/client
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Start backend server (serves both API and static files)
echo ""
echo -e "${BLUE}Starting backend server...${NC}"
cd /app/server
node server.js > /tmp/timetable-server.log 2>&1 &
SERVER_PID=$!

sleep 3

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ Server is running (PID: $SERVER_PID)${NC}"
    echo ""
    echo "====================================="
    echo -e "${GREEN} Deployment Successful! ${NC}"
    echo "====================================="
    echo ""
    echo "Access the application at:"
    echo -e "${BLUE}http://localhost:3001${NC}"
    echo ""
    echo "API Health Check:"
    echo -e "${BLUE}http://localhost:3001/api/health${NC}"
    echo ""
    echo "Server logs: /tmp/timetable-server.log"
    echo "PID: $SERVER_PID"
    echo "====================================="
else
    echo -e "${RED}✗ Server failed to start${NC}"
    echo "Check logs: cat /tmp/timetable-server.log"
    exit 1
fi
