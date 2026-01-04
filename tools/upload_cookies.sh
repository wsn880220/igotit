#!/bin/bash
# 上传 cookies 到服务器
# 使用方法: ./upload_cookies.sh [服务器URL]

set -e

# 配置
COOKIES_FILE="cookies.txt"
ADMIN_KEY="${ADMIN_SECRET_KEY:-f3b6beb013a0d86bff6b36185198264408c9dcf9be6f24cd52b9c8c41b997ae6}"

# 获取服务器 URL（参数或默认）
if [ -n "$1" ]; then
  SERVER_URL="$1"
elif [ -n "$ZEABUR_URL" ]; then
  SERVER_URL="$ZEABUR_URL"
else
  SERVER_URL="http://localhost:3000"
fi

echo "🚀 上传 cookies 到服务器"
echo "   服务器: $SERVER_URL"
echo "   文件: $COOKIES_FILE"
echo ""

# 检查文件
if [ ! -f "$COOKIES_FILE" ]; then
  echo "❌ 错误: 未找到 $COOKIES_FILE"
  echo "   请确保在项目根目录运行此脚本"
  exit 1
fi

# 检查管理员密钥
if [ -z "$ADMIN_KEY" ] || [ "$ADMIN_KEY" = "your_admin_key_here" ]; then
  echo "❌ 错误: 未配置 ADMIN_SECRET_KEY"
  echo "   请设置环境变量: export ADMIN_SECRET_KEY=你的密钥"
  exit 1
fi

# 读取 cookies 内容并转义为 JSON
COOKIES_CONTENT=$(cat "$COOKIES_FILE" | jq -Rs .)

# 上传
echo "📤 正在上传..."
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/admin/update-cookies" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d "{\"cookies\": $COOKIES_CONTENT}" \
  -w "\nHTTP_STATUS:%{http_code}")

# 提取 HTTP 状态码
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

# 打印结果
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ 上传成功！"
  echo ""
  echo "$BODY" | jq .
else
  echo "❌ 上传失败 (HTTP $HTTP_STATUS)"
  echo ""
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi
