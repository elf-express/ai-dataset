# 創建包含pnpm的基礎鏡像
FROM node:20-alpine AS pnpm-base
RUN npm install -g pnpm@9

# 構建階段
FROM pnpm-base AS builder
WORKDIR /app

# 添加構建參數，用於識別目標平台
ARG TARGETPLATFORM

# 安裝構建依賴
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    build-base \
    pixman-dev \
    pkgconfig

# 複製依賴文件和npm配置並安裝(.npmrc中可配置國內源加速)
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install

# 複製原始碼
COPY . .

# 根據目標平台設置Prisma二進制目標並構建應用
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        echo "Configuring for ARM64 platform"; \
        sed -i 's/binaryTargets = \[.*\]/binaryTargets = \["linux-musl-arm64-openssl-3.0.x"\]/' prisma/schema.prisma; \
        PRISMA_CLI_BINARY_TARGETS="linux-musl-arm64-openssl-3.0.x" pnpm build; \
    else \
        echo "Configuring for AMD64 platform (default)"; \
        sed -i 's/binaryTargets = \[.*\]/binaryTargets = \["linux-musl-openssl-3.0.x"\]/' prisma/schema.prisma; \
        PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x" pnpm build; \
    fi

# 構建完成後移除開發依賴，只保留生產依賴
RUN pnpm prune --prod

# 運行階段
FROM pnpm-base AS runner
WORKDIR /app

# 只安裝運行時依賴
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

# 複製package.json和.env文件
COPY package.json .env ./

# 從構建階段複製精簡後的node_modules（只包含生產依賴）
COPY --from=builder /app/node_modules ./node_modules

# 從構建階段複製構建產物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/electron ./electron
COPY --from=builder /app/prisma ./prisma

# 設置生產環境
ENV NODE_ENV=production

EXPOSE 1717
CMD ["pnpm", "start"]
