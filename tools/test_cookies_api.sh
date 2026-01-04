#!/bin/bash
# 快速测试 Cookies 管理 API

ADMIN_KEY="f3b6beb013a0d86bff6b36185198264408c9dcf9be6f24cd52b9c8c41b997ae6"
SERVER_URL="http://localhost:3000"

echo "🧪 测试 Cookies 管理 API"
echo "========================================"

# 测试 1: 健康检查
echo ""
echo "1️⃣ 测试健康检查..."
curl -s "$SERVER_URL/health"
echo ""

# 测试 2: 检查 cookies 状态（初始）
echo ""
echo "2️⃣ 检查 cookies 状态（初始）..."
curl -s -X GET "$SERVER_URL/api/admin/cookies-status" \
  -H "X-Admin-Key: $ADMIN_KEY"
echo ""

# 测试 3: 创建测试 cookies 文件
echo ""
echo "3️⃣ 创建测试 cookies..."
cat > /tmp/test_api_cookies.txt << 'EOF'
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1735980000	TEST_COOKIE	test_value
.youtube.com	TRUE	/	TRUE	1735980000	__Secure-TEST	secure_value
.youtube.com	TRUE	/	TRUE	1735980000	VISITOR_INFO1_LIVE	visitor_test
.youtube.com	TRUE	/	TRUE	1735980000	LOGIN_INFO	login_test
EOF

# 测试 4: 上传 cookies
echo ""
echo "4️⃣ 上传 cookies..."
COOKIES_JSON=$(cat /tmp/test_api_cookies.txt | python3 -c 'import sys, json; print(json.dumps(sys.stdin.read()))')
curl -s -X POST "$SERVER_URL/api/admin/update-cookies" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d "{\"cookies\": $COOKIES_JSON}"
echo ""

# 测试 5: 再次检查状态（应该显示已上传）
echo ""
echo "5️⃣ 检查 cookies 状态（上传后）..."
curl -s -X GET "$SERVER_URL/api/admin/cookies-status" \
  -H "X-Admin-Key: $ADMIN_KEY"
echo ""

# 测试 6: 删除 cookies
echo ""
echo "6️⃣ 删除 cookies..."
curl -s -X DELETE "$SERVER_URL/api/admin/delete-cookies" \
  -H "X-Admin-Key: $ADMIN_KEY"
echo ""

# 测试 7: 验证已删除
echo ""
echo "7️⃣ 验证删除..."
curl -s -X GET "$SERVER_URL/api/admin/cookies-status" \
  -H "X-Admin-Key: $ADMIN_KEY"
echo ""

echo ""
echo "========================================"
echo "✅ 测试完成"
