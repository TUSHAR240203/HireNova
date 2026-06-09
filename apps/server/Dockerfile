# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lock and workspaces config files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/
COPY packages/ts-config/package*.json ./packages/ts-config/

# Install dependencies
RUN npm ci

# Copy codebase
COPY tsconfig*.json ./
COPY packages/ts-config/ ./packages/ts-config/
COPY packages/types/ ./packages/types/
COPY apps/server/ ./apps/server/

# Compile TypeScript
RUN npm run build -w @hirenova/server

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package config files for installation
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/types/package*.json ./packages/types/

# Install only production dependencies
RUN npm ci --only=production

# Copy built server code and types package from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/types ./packages/types

EXPOSE 3000

CMD ["node", "apps/server/dist/server.js"]
