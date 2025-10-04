# Multi-stage Dockerfile for Flow API Service
# Optimized for production deployment on Google Cloud Run

# Stage 1: Build dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with optimizations
RUN npm install --no-audit --no-fund

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application (if needed)
RUN npm run build || echo "No build step required"

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 flow

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Copy package files
COPY package*.json ./

# Install only production dependencies with optimizations
RUN npm install --only=production --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder --chown=flow:nodejs /app/src ./src
COPY --from=builder --chown=flow:nodejs /app/migrations ./migrations

# Copy necessary config files
COPY --chown=flow:nodejs package.json ./

# Set environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_OPTIONS="--max-old-space-size=512"

# Expose port
EXPOSE 8080

# Health check optimized for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER flow

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]