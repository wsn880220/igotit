#!/bin/bash
# Cookies 转换脚本 - 用于 Zeabur 部署
# 使用方法: ./scripts/convert_cookies.sh

set -e

COOKIES_FILE="cookies.txt"

echo "=========================================="
echo "YouTube Cookies 转换工具"
echo "=========================================="
echo ""

# 检查 cookies.txt 是否存在
if [ ! -f "$COOKIES_FILE" ]; then
    echo "❌ 错误: cookies.txt 文件不存在"
    echo ""
    echo "请先导出 YouTube cookies:"
    echo "1. 安装浏览器扩展 'Get cookies.txt LOCALLY'"
    echo "2. 在 YouTube.com 导出 cookies"
    echo "3. 保存为 cookies.txt 到项目根目录"
    echo ""
    exit 1
fi

echo "✅ 找到 cookies.txt 文件"
echo ""

# 转换为 base64
echo "🔄 转换 cookies 为 base64 格式..."
COOKIES_BASE64=$(base64 -i "$COOKIES_FILE")

echo "✅ 转换完成"
echo ""
echo "=========================================="
echo "在 Zeabur 设置以下环境变量:"
echo "=========================================="
echo ""
echo "变量名: YOUTUBE_COOKIES_BASE64"
echo ""
echo "变量值:"
echo "$COOKIES_BASE64"
echo ""
echo "=========================================="
echo ""
echo "或使用 Zeabur CLI (如果已安装):"
echo ""
echo "zeabur env set YOUTUBE_COOKIES_BASE64 \"$COOKIES_BASE64\""
echo ""
echo "=========================================="
echo ""
echo "💡 提示:"
echo "1. Cookies 会过期，建议每 1-2 周更新一次"
echo "2. 可以在 Zeabur 控制台的 Variables 页面修改环境变量"
echo "3. 修改后需要重新部署服务"
echo ""
