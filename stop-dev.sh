#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "========================================"
echo " Stopping Development Servers"
echo "========================================"
echo ""

# Stop backend
BACKEND_PID=$(lsof -ti:3001)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "Stopping Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    echo -e "${GREEN}Backend stopped.${NC}"
else
    echo -e "${RED}Backend not running.${NC}"
fi

echo ""

# Stop web admin
WEBADMIN_PID=$(lsof -ti:5173)
if [ ! -z "$WEBADMIN_PID" ]; then
    echo -e "Stopping Web Admin (PID: $WEBADMIN_PID)..."
    kill $WEBADMIN_PID
    echo -e "${GREEN}Web Admin stopped.${NC}"
else
    echo -e "${RED}Web Admin not running.${NC}"
fi

echo ""
echo "========================================"
echo " All servers stopped!"
echo "========================================"
