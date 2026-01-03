# ================================
# IGotIt Frontend Dockerfile
# ================================
# 构建阶段
FROM node:18-slim AS builder

WORKDIR /app

# 复制 package.json 和源代码
COPY package.json ./
COPY index.html ./
COPY vite.config.js ./
COPY public ./public
COPY src ./src

# 安装依赖并构建
RUN npm install
RUN npm run build

# 生产阶段 - 使用 Node + serve
FROM node:18-slim

WORKDIR /app

# 安装 serve
RUN npm install -g serve

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /app/dist

# 暴露端口
EXPOSE 80

# 启动服务
CMD ["serve", "-s", "dist", "-l", "80"]
