# --------------------------
# Stage 1: Build stage
# --------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL (needed for Prisma)
RUN apk update && apk add --no-cache openssl bash git

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (dev + prod) for building
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# --------------------------
# Stage 2: Production stage
# --------------------------
FROM node:18-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy compiled code from build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose the port (optional, docker-compose handles it)
EXPOSE 8080