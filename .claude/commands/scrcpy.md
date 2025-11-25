---
description: Launch scrcpy for Android device screen mirroring
---

Launch scrcpy untuk mirror layar Android device ke komputer untuk keperluan development dan testing.

**Langkah-langkah:**

1. **Cari scrcpy executable** di lokasi umum:
   - C:\scrcpy\scrcpy-win64-*\scrcpy.exe
   - /c/scrcpy/scrcpy-win64-*/scrcpy.exe
   - System PATH (scrcpy command)

2. **Check ADB connection** dengan device:
   - Gunakan adb.exe dari folder yang sama dengan scrcpy
   - List semua devices yang terkoneksi

3. **Launch scrcpy** dengan optimized settings:
   - `--stay-awake` - Keep device awake
   - `--turn-screen-off` - Turn off device screen (battery saving)
   - `--power-off-on-close` - Power off when scrcpy closes

**Implementation:**

```bash
# Step 1: Find scrcpy executable
SCRCPY_PATH=""

# Check common locations
if [ -f "/c/scrcpy/scrcpy-win64-v3.1/scrcpy.exe" ]; then
    SCRCPY_PATH="/c/scrcpy/scrcpy-win64-v3.1"
elif [ -f "C:\scrcpy\scrcpy-win64-v3.1\scrcpy.exe" ]; then
    SCRCPY_PATH="C:\scrcpy\scrcpy-win64-v3.1"
else
    # Try to find in C:\scrcpy
    FOUND=$(find /c/scrcpy -maxdepth 2 -name "scrcpy.exe" 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
        SCRCPY_PATH=$(dirname "$FOUND")
    else
        # Try system PATH
        if command -v scrcpy >/dev/null 2>&1; then
            SCRCPY_PATH="scrcpy"
        fi
    fi
fi

# Step 2: Check if scrcpy found
if [ -z "$SCRCPY_PATH" ] || [ "$SCRCPY_PATH" = "scrcpy" -a ! command -v scrcpy >/dev/null 2>&1 ]; then
    echo "❌ scrcpy not found!"
    echo ""
    echo "Install scrcpy dari salah satu cara berikut:"
    echo ""
    echo "**Windows:**"
    echo "  1. Download dari: https://github.com/Genymobile/scrcpy/releases"
    echo "  2. Extract ke C:\scrcpy\"
    echo ""
    echo "**Or using Chocolatey:**"
    echo "  choco install scrcpy"
    echo ""
    echo "**Mac:**"
    echo "  brew install scrcpy"
    echo ""
    echo "**Linux:**"
    echo "  sudo apt install scrcpy"
    exit 1
fi

# Step 3: Check ADB connection
echo "🔍 Checking for connected devices..."

if [ "$SCRCPY_PATH" = "scrcpy" ]; then
    ADB_CMD="adb"
    SCRCPY_CMD="scrcpy"
else
    ADB_CMD="$SCRCPY_PATH/adb.exe"
    SCRCPY_CMD="$SCRCPY_PATH/scrcpy.exe"
fi

# Get device list
DEVICES=$("$ADB_CMD" devices 2>/dev/null | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android device connected!"
    echo ""
    echo "**Setup Instructions:**"
    echo "1. Connect your Android device via USB"
    echo "2. Enable USB Debugging:"
    echo "   - Settings → About Phone"
    echo "   - Tap 'Build Number' 7 times"
    echo "   - Settings → Developer Options"
    echo "   - Enable 'USB Debugging'"
    echo "3. Accept the USB debugging prompt on your device"
    echo "4. Run /scrcpy again"
    exit 1
fi

# Show connected devices
echo "✅ Found $DEVICES device(s):"
"$ADB_CMD" devices | grep "device$"
echo ""

# Step 4: Launch scrcpy
echo "🚀 Launching scrcpy..."
echo "📱 Device screen will be mirrored to your PC"
echo ""

# Run in background
cd "$(dirname "$SCRCPY_CMD")" 2>/dev/null || true
"$SCRCPY_CMD" --stay-awake --turn-screen-off --power-off-on-close &

echo "✅ scrcpy launched!"
echo ""

# Step 5: Setup ADB reverse for backend connection
echo "🔧 Setting up ADB reverse for backend connection..."
"$ADB_CMD" reverse tcp:3001 tcp:3001 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ ADB reverse tcp:3001 setup successful!"
    echo "   Android app can now access backend at localhost:3001"
else
    echo "⚠️  ADB reverse setup failed (device may need to be unlocked)"
fi
echo ""

echo "**Controls:**"
echo "  - Click & drag: Touch & swipe"
echo "  - Scroll: Mouse wheel"
echo "  - Ctrl+C: Copy (from device)"
echo "  - Ctrl+V: Paste (to device)"
echo "  - Power button: Right-click"
echo "  - Ctrl+O: Turn screen on"
echo "  - Ctrl+S: Take screenshot"
echo ""
```
