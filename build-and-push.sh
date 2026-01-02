#!/bin/bash

# IGotIT - Docker 镜像构建和推送脚本
# 用于构建前后端镜像并推送到 Docker Hub 或 GitHub Container Registry

set -e

# 配置
# 修改为你自己的 Docker Hub 用户名或 GitHub 用户名
REGISTRY="docker.io"  # 可选: docker.io 或 ghcr.io
USERNAME="your-username"  # 修改为你的用户名
IMAGE_NAME_PREFIX="igotit"

# 镜像标签
VERSION=${1:-latest}

echo "======================================"
echo "IGotIt Docker 镜像构建工具"
echo "======================================"
echo "Registry: $REGISTRY"
echo "Username: $USERNAME"
echo "Version: $VERSION"
echo ""

# 检查是否已登录
if [ "$REGISTRY" = "ghcr.io" ]; then
    echo "检查 GitHub Container Registry 登录状态..."
    if ! docker info | grep -q "Username: $USERNAME"; then
        echo "请先登录: echo \"ghp_TOKEN\" | docker login ghcr.io -u USERNAME --password-stdin"
        exit 1
    fi
else
    echo "检查 Docker Hub 登录状态..."
    if ! docker info | grep -q "Username"; then
        echo "请先登录: docker login"
        exit 1
    fi
fi

# 构建前端镜像
echo ""
echo "🔨 构建前端镜像..."
docker build -t $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:$VERSION ./packages/frontend/
docker tag $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:$VERSION $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:latest

# 构建后端镜像
echo ""
echo "🔨 构建后端镜像..."
docker build -t $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:$VERSION ./packages/backend/
docker tag $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:$VERSION $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:latest

# 推送镜像
echo ""
echo "📤 推送前端镜像..."
docker push $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:$VERSION
docker push $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:latest

echo ""
echo "📤 推送后端镜像..."
docker push $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:$VERSION
docker push $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:latest

echo ""
echo "✅ 完成！"
echo ""
echo "前端镜像: $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-frontend:$VERSION"
echo "后端镜像: $REGISTRY/$USERNAME/$IMAGE_NAME_PREFIX-backend:$VERSION"
