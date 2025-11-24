#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo " Launching scrcpy for Android Device"
echo "========================================"
echo ""

# Find scrcpy executable
SCRCPY_PATH=""
ADB_PATH=""

# Check common locations
if [ -f "/c/scrcpy/scrcpy-win64-v3.1/scrcpy.exe" ]; then
    SCRCPY_PATH="/c/scrcpy/scrcpy-win64-v3.1/scrcpy.exe"
    ADB_PATH="/c/scrcpy/scrcpy-win64-v3.1/adb.exe"
elif [ -f "C:\scrcpy\scrcpy-win64-v3.1\scrcpy.exe" ]; then
    SCRCPY_PATH="C:\scrcpy\scrcpy-win64-v3.1\scrcpy.exe"
    ADB_PATH="C:\scrcpy\scrcpy-win64-v3.1\adb.exe"
else
    # Try to find in C:\scrcpy
    FOUND=$(find /c/scrcpy -maxdepth 2 -name "scrcpy.exe" 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
        SCRCPY_PATH="$FOUND"
        ADB_PATH="$(dirname "$FOUND")/adb.exe"
    else
        # Try system PATH
        if command -v scrcpy &> /dev/null; then
            SCRCPY_PATH="scrcpy"
            ADB_PATH="adb"
        fi
    fi
fi

# Check if scrcpy is found
if [ -z "$SCRCPY_PATH" ]; then
    echo -e "${RED}ERROR: scrcpy not found!${NC}"
    echo ""
    echo "Please install scrcpy:"
    echo "  Windows: Download from https://github.com/Genymobile/scrcpy/releases"
    echo "           Extract to C:\scrcpy\"
    echo "  macOS:   brew install scrcpy"
    echo "  Linux:   sudo apt install scrcpy"
    echo "  Arch:    sudo pacman -S scrcpy"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found scrcpy: $SCRCPY_PATH${NC}"
echo ""

# Check if adb is available
if [ "$ADB_PATH" = "adb" ]; then
    if ! command -v adb &> /dev/null; then
        echo -e "${RED}ERROR: adb not found!${NC}"
        echo ""
        echo "Please install Android SDK Platform Tools"
        echo ""
        exit 1
    fi
fi

echo -e "${BLUE}Checking for connected Android devices...${NC}"
"$ADB_PATH" devices
echo ""

# Check if any device is connected
DEVICE_COUNT=$("$ADB_PATH" devices 2>/dev/null | grep -v "List of devices" | grep "device$" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}WARNING: No Android devices detected!${NC}"
    echo ""
    echo "Please make sure:"
    echo "  1. USB Debugging is enabled on your device"
    echo "  2. Device is connected via USB"
    echo "  3. You have authorized the computer on your device"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to cancel..."
else
    echo -e "${GREEN}✓ Found $DEVICE_COUNT device(s)${NC}"
fi

echo ""
echo -e "${GREEN}Starting scrcpy with optimized settings...${NC}"
echo "  - Stay awake enabled"
echo "  - Screen turned off (battery saving)"
echo "  - Power off on close"
echo ""

# Launch scrcpy with optimal settings for development
"$SCRCPY_PATH" --stay-awake --turn-screen-off --power-off-on-close

echo ""
echo "scrcpy closed."
