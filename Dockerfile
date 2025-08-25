# Production Dockerfile for Koepon API
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    postgresql-client \
    redis \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Create logs directory
RUN mkdir -p /app/logs && chown nestjs:nodejs /app/logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Start command with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]