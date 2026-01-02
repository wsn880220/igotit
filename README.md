# iGotit - YouTube 学习助手

一个帮助你通过 YouTube 视频学习英语的工具，提供字幕获取、实时翻译和单词查询功能。

## ✨ 功能特性

- 📺 支持 YouTube 视频字幕提取
- 🔤 实时单词翻译（基于智谱 AI）
- 📝 句子翻译
- 🎯 推荐学习视频

## 🚀 一键部署到 Zeabur

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates)

### 环境变量配置

部署时需要设置以下环境变量：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `ZHIPU_AI_API_KEY` | 智谱 AI API 密钥 | ✅ 是 |
| `NODE_ENV` | 运行环境 | ⚠️ 设为 `production` |
| `PORT` | 服务端口 | ❌ 默认 3000 |

获取智谱 AI API Key：https://open.bigmodel.cn/

## 🛠️ 本地开发

### 前提条件

- Node.js 18+
- Python 3.8+
- ffmpeg

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装 Python 依赖
pip3 install yt-dlp
```

### 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 .env 文件，填入你的 API Key
```

### 启动开发服务器

```bash
# 启动前端（终端 1）
npm run dev

# 启动后端（终端 2）
cd server
npm start
```

访问 http://localhost:5173

## 📦 生产构建

```bash
# 构建前端
npm run build

# 启动生产服务器（前后端一体）
cd server
NODE_ENV=production npm start
```

访问 http://localhost:3000

## 🐳 Docker 部署

```bash
# 构建镜像（从 server 目录）
cd server
docker build -t igotit .

# 运行容器
docker run -p 3000:3000 \
  -e ZHIPU_AI_API_KEY=your-api-key \
  -e NODE_ENV=production \
  igotit
```

## 📄 许可证

MIT
