#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo " Starting Absensi Development Servers"
echo "========================================"
echo ""

# Check if backend is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Backend already running on port 3001${NC}"
else
    echo -e "${BLUE}Starting Backend Server...${NC}"
    cd backend
    npm run start:dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}Backend started! (PID: $BACKEND_PID)${NC}"
fi

echo ""

# Check if web admin is running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}Web Admin already running on port 5173${NC}"
else
    echo -e "${BLUE}Starting Web Admin...${NC}"
    cd web-admin
    npm run dev > ../logs/web-admin.log 2>&1 &
    WEBADMIN_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}Web Admin started! (PID: $WEBADMIN_PID)${NC}"
fi

echo ""
echo "========================================"
echo " Development Servers Status"
echo "========================================"
echo "Backend API:     http://localhost:3001/api"
echo "Web Admin:       http://localhost:5173"
echo "API Health:      http://localhost:3001/api/health"
echo "========================================"
echo ""

echo "Waiting for servers to be ready..."
sleep 5

echo ""
echo "Checking servers..."

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Backend is responding"
else
    echo -e "${YELLOW}[WAIT]${NC} Backend is starting... (may take 10-20 seconds)"
fi

# Check web admin
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Web Admin is responding"
else
    echo -e "${YELLOW}[WAIT]${NC} Web Admin is starting... (may take 5-10 seconds)"
fi

echo ""
echo "========================================"
echo " Quick Commands"
echo "========================================"
echo "- View Backend Logs:  tail -f logs/backend.log"
echo "- View Web Logs:      tail -f logs/web-admin.log"
echo "- Stop All:           ./stop-dev.sh"
echo "========================================"
echo ""
