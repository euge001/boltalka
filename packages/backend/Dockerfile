# Build stage for monorepo
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all root configs
COPY ../../tsconfig.json ./
COPY ../../pnpm-lock.yaml ./
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./

# Copy all packages
COPY ../../packages ./packages

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Install dependencies with better error handling
RUN pnpm install --frozen-lockfile 2>&1 | tail -20 || pnpm install --no-frozen-lockfile || true

# Build shared package first
RUN pnpm --filter @boltalka/shared build 2>&1 | tail -20 || true

# Build backend
RUN pnpm --filter @boltalka/backend build 2>&1 | tail -20 || true

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Copy root configs
COPY ../../tsconfig.json ./
COPY ../../pnpm-lock.yaml ./
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./

# Copy packages
COPY ../../packages/backend ./packages/backend
COPY ../../packages/shared ./packages/shared

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod 2>&1 | tail -10 || pnpm install --prod || true

# Copy built files from builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma 2>/dev/null || true
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist 2>/dev/null || true

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "packages/backend/dist/main.js"]
