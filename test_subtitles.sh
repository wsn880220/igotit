#!/bin/bash
# 字幕获取测试脚本 (youtube-transcript-api)

echo "=========================================="
echo "Subtitle Fetching Test (youtube-transcript-api)"
echo "=========================================="
echo ""

TEST_VIDEO="NvLlyKydkZE"
echo "📹 Test Video ID: $TEST_VIDEO"
echo ""

# Check for PROXY_URL
if [ -n "$PROXY_URL" ]; then
    echo "  🌐 Using Proxy: $PROXY_URL"
else
    echo "  ⚠️  No PROXY_URL set. Connection might fail if IP is blocked."
fi
echo ""

# Run the python script directly
echo "🚀 Running get_subtitles.py..."
result=$(./venv/bin/python3 packages/backend/get_subtitles.py "$TEST_VIDEO")

# Check exit code
if [ $? -eq 0 ]; then
    # Check if result contains error
    if echo "$result" | grep -q "\"error\""; then
        echo "  ❌ Error: $(echo "$result" | grep -o '"error": "[^"]*"' | cut -d'"' -f4)"
        exit 1
    else
        echo "  ✅ Success!"
        echo "  📝 Subtitle Count: $(echo "$result" | grep -o '"text":' | wc -l)"
        echo "  📝 Title: $(echo "$result" | grep -o '"title": "[^"]*"' | cut -d'"' -f4)"
    fi
else
    echo "  ❌ Python script failed."
    exit 1
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
