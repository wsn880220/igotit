# Zeabur 部署指南

本项目可以一键部署到 Zeabur 平台。

## ⚠️ 重要提示

**YouTube bot 检测问题：**
- Zeabur 使用云基础设施，IP 可能被 YouTube 封锁
- 部署后可能需要配置 cookies 或使用住宅代理
- 建议先测试是否能正常获取字幕

## 部署步骤

### 1. 准备 GitHub 仓库

确保代码已推送到 GitHub：

```bash
git add .
git commit -m "Prepare for Zeabur deployment"
git push origin main
```

### 2. 部署后端到 Zeabur

1. 登录 [Zeabur](https://zeabur.com)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 添加服务，选择 "Dockerfile/Node.js"
5. 配置：
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. **环境变量**（必须设置）：
   ```
   ZHIPU_API_KEY = 你的智谱AI密钥
   PORT = 3000
   NODE_ENV = production
   ```

7. 部署完成后，Zeabur 会自动分配一个域名，例如：
   ```
   https://your-backend.zeabur.app
   ```

### 3. 部署前端到 Zeabur

1. 在同一项目中添加新服务
2. 选择 "Prebuilt/Static"
3. 配置：
   - **Root Directory**: `/`（项目根目录）
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`

4. **环境变量**（必须设置）：
   ```
   VITE_API_URL = https://your-backend.zeabur.app
   ```

5. 部署完成

### 4. 测试部署

1. 访问前端 URL
2. 输入 YouTube 视频链接
3. 检查是否能正常获取字幕

**如果字幕获取失败，显示 "Sign in to confirm you're not a bot"：**
- 说明 Zeabur IP 被 YouTube 封锁
- 需要配置 cookies 或使用其他部署方案

## 环境变量说明

### 后端环境变量
| 变量名 | 说明 | 必填 |
|--------|------|------|
| `ZHIPU_API_KEY` | 智谱 AI API 密钥 | ✅ |
| `PORT` | 服务器端口 | ❌（默认 3000） |
| `NODE_ENV` | 运行环境 | ❌（默认 production） |

### 前端环境变量
| 变量名 | 说明 | 必填 |
|--------|------|------|
| `VITE_API_URL` | 后端 API 地址 | ✅（生产环境） |

## 域名配置（可选）

### 绑定自定义域名

1. 在 Zeabur 项目设置中选择 "Domains"
2. 添加你的域名
3. 按照提示配置 DNS 记录

### 示例配置
```
前端: app.yourdomain.com → 前端服务
后端: api.yourdomain.com → 后端服务
```

## 故障排查

### 问题 1: CORS 错误
**原因**: 前端无法连接后端

**解决**:
1. 检查 `VITE_API_URL` 是否正确
2. 确保后端 CORS 配置正确
3. 查看浏览器控制台错误信息

### 问题 2: 字幕获取失败
**原因**: YouTube bot 检测

**解决**:
1. 使用 cookies.txt（详见 COOKIES_SETUP.md）
2. 或使用住宅代理
3. 或更换部署方案（家用电脑 + 内网穿透）

### 问题 3: 翻译功能不工作
**原因**: API Key 未配置或无效

**解决**:
1. 检查 `ZHIPU_API_KEY` 环境变量
2. 确认 API Key 有效且有余额

## 替代部署方案

如果 Zeabur 部署后字幕获取失败，建议：

### 方案 A: 前后端分离
- **前端**: Zeabur（静态托管）
- **后端**: 家用电脑 + ngrok

### 方案 B: 使用住宅代理
- 在 Zeabur 后端配置住宅代理
- 需要 Webshare 等代理服务

### 方案 C: 其他平台
- Railway
- Render
- 便宜的 VPS（RackNerd）

## 费用估算

- Zeabur 免费额度：足够小规模使用
- 超出后按量计费，约 $5-10/月
- 如需住宅代理：$20-50/月

## 更多帮助

- [Zeabur 官方文档](https://zeabur.com/docs)
- [项目 COOKIES_SETUP.md](./COOKIES_SETUP.md)
