FROM node:18-slim

# 安装 Python 和系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 server 目录的文件
COPY package*.json ./
COPY server.js ./
COPY channels.json ./
COPY .env.example* ./ 
COPY get_subtitles.py ./

# 安装 Node.js 依赖
RUN npm ci --only=production

# 安装 Python 依赖（yt-dlp）
RUN pip3 install --no-cache-dir yt-dlp

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]
