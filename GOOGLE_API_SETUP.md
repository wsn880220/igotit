# Google Cloud Translation API 配置指南

## 📝 获取 API Key 步骤

### 1. 访问 Google Cloud Console
https://console.cloud.google.com/

### 2. 创建新项目（如果还没有）
- 点击顶部的项目选择器
- 点击"新建项目"
- 项目名称：`igotit-translator`
- 点击"创建"

### 3. 启用 Cloud Translation API
- 在搜索框搜索："Cloud Translation API"
- 点击"启用"按钮
- 等待几秒钟完成启用

### 4. 创建 API 密钥
- 左侧菜单：APIs & Services > Credentials（凭据）
- 点击顶部"+ CREATE CREDENTIALS"（创建凭据）
- 选择"API key"（API 密钥）
- 复制生成的 API 密钥

### 5. 配置到项目
在 `/Users/wangyoudu/Development/Web/igotit/server/` 目录创建 `.env` 文件：

```bash
GOOGLE_TRANSLATE_API_KEY=你复制的API密钥
```

### 6. 重启服务器
```bash
# 按 Ctrl+C 停止服务器，然后重新运行：
cd /Users/wangyoudu/Development/Web/igotit/server
node server.js
```

---

## 💰 费用说明

### Translation API v2 (Basic) - 我们使用的版本

**免费额度：**
- 每月前 500,000 字符：**完全免费** ✅

**付费价格：**
- $20 美元 / 每 100 万字符
- 约 ¥0.14 人民币 / 每 1000 字符

**实际使用估算：**
```
假设每天翻译 100 个单词：
- 每个单词平均 6 个字符
- 每天 = 600 字符
- 每月 = 18,000 字符
- 结果：完全在免费额度内！✅
```

---

## ✅ 验证配置是否成功

启动服务器后，查看日志：

**成功配置：**
```
✅ Google 翻译 API 已启用
🚀 服务器已启动在 http://localhost:3000
```

**未配置：**
```
⚠️  未配置 Google 翻译 API Key，将使用备用方案
🚀 服务器已启动在 http://localhost:3000
```

---

## 🔒 安全提示

1. **不要提交 .env 文件到 Git**
   - 已在 `.gitignore` 中忽略
   - API Key 是私密信息

2. **限制 API Key 权限**
   - 在 Google Cloud Console
   - 编辑 API Key
   - 限制为只能访问 "Cloud Translation API"
   - 添加应用限制（如 IP 地址）

---

## 🆚 对比其他版本

| 版本 | 价格 | 我们用吗 |
|------|------|---------|
| **Translation API v2 (Basic)** | $20/百万字符 | ✅ **是的** |
| Translation API v3 (Advanced) | $20/百万字符 | ❌ 太复杂 |
| Translation with LLM | $100-150/百万字符 | ❌ 太贵 |

---

## 📞 需要帮助？

如果配置过程中遇到问题：
1. 检查 API Key 是否正确复制
2. 确保 Translation API 已启用
3. 查看服务器启动日志
4. .env 文件路径是否正确

现在就可以去获取 API Key 了！
