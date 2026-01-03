# 🚀 IGotIt 部署指南 (Zeabur)

本文档提供两种部署方案。**强烈推荐方案二：前后端分离部署**，因为它最稳定、最不容易出错。

---

## ✅ 方案二：前后端分离部署 (最推荐)

这个方案将 API 服务和前端页面分开部署，互不干扰，彻底解决 Monorepo 路径报错问题。

### 1. 部署后端 (Backend)
1.  在 Zeabur 创建新服务 (Git)。
2.  **Settings -> Root Directory**: `/packages/backend`
3.  **Environment Variables**:
    *   `YOUTUBE_COOKIES_BASE64`: (你的 Cookies Base64)
4.  等待部署成功，复制服务域名 (例如: `backend-xxx.zeabur.app`)。

### 2. 配置前端连接
1.  在本地修改前端配置或环境变量。如果是 Zeabur，最简单的方法是在 Zeabur 前端服务的设置里填。
2.  (本地测试可选) 在 `packages/frontend/.env` 中添加 `VITE_API_BASE_URL=http://localhost:3000`。

### 3. 部署前端 (Frontend)
1.  在 Zeabur 创建另一个新服务 (Git)。
2.  **Settings -> Root Directory**: `/packages/frontend`
3.  **Environment Variables**:
    *   `VITE_API_BASE_URL`: `https://backend-xxx.zeabur.app` (填你第一步拿到的域名，注意要有 https://)
4.  Zeabur 会自动识别 React 项目并部署。

这样，用户访问前端 (例如 `frontend-xxx.zeabur.app`)，前端会自动去请求 `backend-xxx.zeabur.app` 获取数据。

---

## ⚠️ 方案一：单体合并部署 (Legacy)

将前端打包进后端容器，统一部署。
*   **优点**: 只有一个域名，省钱。
*   **缺点**: 构建路径容易出错。

如果想用此方案，请确保根目录的 `Dockerfile` 配置正确，并设置 Zeabur Root Directory 为项目根目录。

---

## ❓ 常见问题

### Q: "Network Error" / 前端连不上后端
**原因**: 前端不知道后端地址，请求发到自己身上了。
**解决**: 检查前端服务的环境变量 `VITE_API_BASE_URL` 是否正确填写了后端的公网地址。

### Q: 跨域错误 (CORS)
**原因**: 后端不允许前端域名的请求。
**解决**: 确保 `server.js` 中配置了 `app.use(cors())` (已默认开启)。
