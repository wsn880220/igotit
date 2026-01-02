# ================================
# IGotIt Backend Dockerfile
# ================================
FROM node:18-slim

# 安装 Python 和系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端依赖文件
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm ci --only=production

# 安装 Python 依赖（yt-dlp）
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# 复制后端代码
COPY server.js ./
COPY channels.json ./
COPY get_subtitles.py ./
COPY .env.example* ./ 2>/dev/null || true

# 设置 Python 脚本为可执行
RUN chmod +x get_subtitles.py 2>/dev/null || true

# 创建非 root 用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 设置环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["node", "server.js"]
