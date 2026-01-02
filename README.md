# IGotIt - YouTube 字幕学习助手

一个帮助你通过 YouTube 视频学习英语的工具，提供字幕获取、实时翻译和单词查询功能。

## ✨ 功能特性

- 📺 支持 YouTube 视频字幕提取
- 🔤 实时单词翻译（基于智谱 AI）
- 📝 句子翻译
- 🎯 推荐学习视频

## 🚀 Zeabur 一键部署

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates?repository=https://github.com/wsn880220/igotit)

**自动部署流程：**
1. 点击上方按钮跳转到 Zeabur
2. 选择 **Docker Compose** 部署
3. 上传项目中的 `docker-compose-zeabur.yml` 文件
4. 配置环境变量：`ZHIPU_API_KEY`（从 https://open.bigmodel.cn/ 获取）
5. 点击部署，Zeabur 会自动拉取最新镜像

> 镜像由 GitHub Actions 自动构建，每次推送代码到 main 分支都会自动更新。

## 🛠️ 本地开发

### 前提条件

- Node.js 18+
- Python 3.8+
- ffmpeg
- pnpm（推荐）或 npm

### 项目结构

```
igotit/
├── packages/
│   ├── frontend/    # React + Vite 前端
│   └── backend/     # Express + Python 后端
```

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
cd packages/frontend && npm install
cd ../backend && npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp packages/backend/.env.example packages/backend/.env

# 编辑 .env 文件，填入你的 API Key
ZHIPU_API_KEY=your-api-key-here
```

### 启动开发服务器

```bash
# 启动前端
pnpm dev

# 启动后端（新终端）
pnpm dev:backend
```

访问 http://localhost:5173

## 🐳 Docker 本地运行

```bash
# 使用 Docker Compose 启动前后端
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问：
- 前端：http://localhost:80
- 后端 API：http://localhost:3000

## 🔧 构建生产版本

```bash
# 构建前端
pnpm build

# 预览前端构建产物
cd packages/frontend
pnpm preview
```

## 📄 许可证

MIT
