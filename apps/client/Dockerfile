# Stage 1: Build Vite / React application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lock and workspaces configs
COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
COPY packages/types/package*.json ./packages/types/
COPY packages/ts-config/package*.json ./packages/ts-config/

# Install dependencies
RUN npm ci

# Copy codebase
COPY tsconfig*.json ./
COPY packages/ts-config/ ./packages/ts-config/
COPY packages/types/ ./packages/types/
COPY apps/client/ ./apps/client/

# Compile assets using Vite
RUN npm run build -w @hirenova/client

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration for SPA routing fallback
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy build assets from builder stage
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
