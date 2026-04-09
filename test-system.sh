#!/bin/bash

echo "========================================"
echo "  Timetable Generator - System Test"
echo "========================================"
echo ""

API_URL="http://localhost:3001/api"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

test_api() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local expected=$4
    
    echo -n "Testing: $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$API_URL$endpoint")
    else
        response=$(curl -s "$API_URL$endpoint")
    fi
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Response: $response"
        ((FAIL++))
    fi
}

echo -e "${BLUE}Starting API Tests...${NC}"
echo ""

# Test 1: Health Check
test_api "Health Check" "/health" "GET" "OK"

# Test 2: Get All Data
test_api "Get All Data" "/data" "GET" "success"

# Test 3: Get Teachers
response=$(curl -s "$API_URL/data")
teacher_count=$(echo "$response" | grep -o '"id":"T0' | wc -l)
echo -n "Testing: Teachers Data... "
if [ "$teacher_count" -ge 5 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found $teacher_count teachers)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Found $teacher_count teachers, expected 5)"
    ((FAIL++))
fi

# Test 4: Get Rooms
room_count=$(echo "$response" | grep -o '"id":"R1' | wc -l)
echo -n "Testing: Rooms Data... "
if [ "$room_count" -ge 3 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found $room_count rooms)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Found $room_count rooms)"
    ((FAIL++))
fi

# Test 5: Get Subjects
subject_count=$(echo "$response" | grep -o '"id":"SUB' | wc -l)
echo -n "Testing: Subjects Data... "
if [ "$subject_count" -ge 7 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found $subject_count subjects)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Found $subject_count subjects)"
    ((FAIL++))
fi

# Test 6: Generate Timetable
echo -n "Testing: Generate Timetable... "
gen_response=$(curl -s -X POST "$API_URL/generate")
if echo "$gen_response" | grep -q '"success":true'; then
    session_count=$(echo "$gen_response" | grep -o '"id":"TT' | wc -l)
    echo -e "${GREEN}✓ PASS${NC} (Generated $session_count sessions)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test 7: Get Timetable
test_api "Get Timetable" "/timetable" "GET" "success"

# Test 8: Detect Conflicts
echo -n "Testing: Conflict Detection... "
conflict_response=$(curl -s -X POST "$API_URL/conflict")
if echo "$conflict_response" | grep -q '"success":true'; then
    conflict_count=$(echo "$conflict_response" | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✓ PASS${NC} (Found $conflict_count conflicts)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test 9: Check JSON Files
echo -n "Testing: JSON Data Files... "
file_count=0
for file in teachers.json rooms.json subjects.json timetable.json; do
    if [ -f "/app/data/$file" ]; then
        ((file_count++))
    fi
done
if [ "$file_count" -eq 4 ]; then
    echo -e "${GREEN}✓ PASS${NC} (All files exist)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Missing files)"
    ((FAIL++))
fi

# Test 10: Server Process
echo -n "Testing: Server Process... "
if pgrep -f "node server.js" > /dev/null; then
    echo -e "${GREEN}✓ PASS${NC} (Server is running)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Server not running)"
    ((FAIL++))
fi

# Test 11: Frontend Build
echo -n "Testing: Frontend Build... "
if [ -d "/app/client/build" ] && [ -f "/app/client/build/index.html" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Build exists)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Build missing)"
    ((FAIL++))
fi

# Test 12: Static File Serving
echo -n "Testing: Static Files... "
status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/")
if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Serving static files)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $status_code)"
    ((FAIL++))
fi

echo ""
echo "========================================"
echo -e "  Test Results"
echo "========================================"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo -e "Total:  $((PASS + FAIL))"
echo "========================================"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "System is ready for deployment!"
    echo ""
    echo "Access the application at:"
    echo -e "${BLUE}http://localhost:3001${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Check server logs: cat /tmp/timetable-server.log"
    exit 1
fi
