#!/bin/bash
# 检查 Cookies 状态
# 使用方法: ./check_cookies.sh [服务器URL]

set -e

ADMIN_KEY="${ADMIN_SECRET_KEY:-f3b6beb013a0d86bff6b36185198264408c9dcf9be6f24cd52b9c8c41b997ae6}"

# 获取服务器 URL
if [ -n "$1" ]; then
  SERVER_URL="$1"
elif [ -n "$ZEABUR_URL" ]; then
  SERVER_URL="$ZEABUR_URL"
else
  SERVER_URL="http://localhost:3000"
fi

echo "🔍 检查 Cookies 状态"
echo "   服务器: $SERVER_URL"
echo ""

# 调用 API
RESPONSE=$(curl -s -X GET "$SERVER_URL/api/admin/cookies-status" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -w "\nHTTP_STATUS:%{http_code}")

# 提取状态码
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

# 显示结果
if [ "$HTTP_STATUS" = "200" ]; then
  echo "$BODY" | jq .
  
  # 解析质量分数
  SCORE=$(echo "$BODY" | jq -r '.quality.score // 0')
  
  if [ "$SCORE" -ge 80 ]; then
    echo ""
    echo "✅ Cookies 质量: 优秀 ($SCORE/100)"
  elif [ "$SCORE" -ge 50 ]; then
    echo ""
    echo "⚠️  Cookies 质量: 一般 ($SCORE/100)"
    echo "   建议重新导出更完整的 cookies"
  else
    echo ""
    echo "❌ Cookies 质量: 差 ($SCORE/100)"
    echo "   请重新导出 cookies，确保勾选「保持登录」"
  fi
else
  echo "❌ 请求失败 (HTTP $HTTP_STATUS)"
  echo "$BODY"
  exit 1
fi
