#!/bin/bash
# 检查 Zeabur 部署版本

ZEABUR_URL="${1:-https://igotitback.zeabur.app}"

echo "🔍 检查部署版本"
echo "服务器: $ZEABUR_URL"
echo ""

# 1. 检查健康状态
echo "1️⃣ 健康检查..."
curl -s "$ZEABUR_URL/health"
echo -e "\n"

# 2. 检查版本信息
echo "2️⃣ 版本信息..."
curl -s "$ZEABUR_URL/version"
echo -e "\n"

# 3. 显示本地最新提交
echo "3️⃣ 本地最新提交..."
git log --oneline -3
echo ""

echo "========================================"
echo "💡 对比提示:"
echo "   - 服务器 commit 应该匹配本地最新提交"
echo "   - 如果不匹配，说明 Zeabur 还在用旧代码"
