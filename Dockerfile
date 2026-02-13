# Build stage
# Force rebuild: 2026-02-13T12:42
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all root config files at once
COPY .dockerignore package.json tsconfig.json turbo.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all packages
COPY packages ./packages

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Install dependencies
RUN pnpm install --frozen-lockfile 2>&1 | tail -20 || pnpm install --no-frozen-lockfile

# Build shared package first
RUN pnpm --filter @boltalka/shared build 2>&1 | tail -20 || true

# Build backend
RUN pnpm --filter @boltalka/backend build 2>&1 | tail -20

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Copy root config files
COPY tsconfig.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy packages structure
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Generate prisma client
RUN pnpm --filter @boltalka/backend prisma generate

# Return to app root for CMD execution
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["node", "/app/packages/backend/dist/main.js"]
