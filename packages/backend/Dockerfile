# ================================
# IGotIt 单服务 Dockerfile
# 构建前端 + 启动后端，实现一键部署
# ================================

# ================================
# 阶段 1: 构建前端
# ================================
FROM node:18-slim AS frontend-builder

WORKDIR /build

# 复制前端代码
COPY packages/frontend/package*.json ./
COPY packages/frontend/index.html ./
COPY packages/frontend/vite.config.js ./
COPY packages/frontend/public ./public
COPY packages/frontend/src ./src

# 安装依赖并构建
RUN npm install
RUN npm run build

# ================================
# 阶段 2: 构建后端（最终镜像）
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
COPY packages/backend/package*.json ./

# 安装 Node.js 依赖
RUN npm ci --only=production

# 安装 Python 依赖（yt-dlp）
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# 复制后端代码
COPY packages/backend/server.js ./
COPY packages/backend/channels.json ./
COPY packages/backend/get_subtitles.py ./
COPY packages/backend/.env.example* ./ 2>/dev/null || true

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /build/dist ./dist

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

# 启动命令，确保 NODE_ENV 正确设置
CMD ["sh", "-c", "NODE_ENV=production node server.js"]
