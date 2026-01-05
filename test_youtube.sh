#!/bin/bash
# YouTube 字幕获取测试脚本

echo "=========================================="
echo "YouTube 字幕获取测试"
echo "=========================================="
echo ""

TEST_VIDEO="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "📹 测试视频: $TEST_VIDEO"
echo ""

# 测试 1: 检查 yt-dlp 是否存在
echo "✓ 检查 1: yt-dlp 是否安装"
if [ -f ./venv/bin/yt-dlp ]; then
    echo "  ✅ yt-dlp 已安装"
else
    echo "  ❌ yt-dlp 未找到"
    exit 1
fi
echo ""

# 测试 2: 无 cookies
echo "✓ 检查 2: 无 cookies 尝试"
PROXY_ARGS=""
if [ -n "$PROXY_URL" ]; then
    echo "  🌐 使用代理: $PROXY_URL"
    PROXY_ARGS="--proxy $PROXY_URL"
fi

./venv/bin/yt-dlp $PROXY_ARGS \
    --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    --extractor-args "youtube:player_client=web" \
    --list-subs "$TEST_VIDEO" 2>&1 | head -n 10

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "  ✅ 无需 cookies 即可访问"
else
    echo "  ⚠️  需要 cookies"
fi
echo ""

# 测试 3: 使用 cookies (如果存在)
echo "✓ 检查 3: 使用 cookies"
if [ -f cookies.txt ]; then
    echo "  ✅ cookies.txt 已找到"
    ./venv/bin/yt-dlp $PROXY_ARGS \
        --cookies cookies.txt \
        --list-subs "$TEST_VIDEO" 2>&1 | head -n 10
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "  ✅ 使用 cookies 成功"
    else
        echo "  ❌ cookies 可能已过期"
    fi
else
    echo "  ⚠️  cookies.txt 不存在"
    echo "  💡 请按照 COOKIES_SETUP.md 导出 cookies"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
