# ================================
# Backend Only Dockerfile
# 只负责后端运行 (Node + Python)
# 部署时请设置 Zeabur 的 Root Directory 为 packages/backend
# ================================
FROM node:18-slim

# 1. 安装 Python 环境和 ffmpeg (用于 yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. 复制依赖文件
COPY package*.json ./

# 3. 安装 Node 依赖
# 使用 npm ci 保证确定性，只安装生产依赖
RUN npm ci --only=production

# 4. 安装 Python 依赖 (yt-dlp)
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# 5. 复制源代码
COPY server.js ./
COPY channels.json ./
COPY get_subtitles.py ./
# 如果有 .env.example 则复制，没有也不报错
COPY .env.example* ./

# 6. 权限设置
RUN chmod +x get_subtitles.py
RUN chown -R node:node /app
USER node

# 7. 启动
EXPOSE 3000
CMD ["node", "server.js"]
