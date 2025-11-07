# Use Node.js 22 for WebSocket compatibility
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code and config
COPY src ./src
COPY tsconfig.json ./
COPY script.sh ./

# Make script executable
RUN chmod +x script.sh

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create directories for rooms and uploads
RUN mkdir -p rooms uploads

# Expose port
EXPOSE 5959

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5959

# Health check for WebSocket endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5959/health || exit 1

# Start the application using the script
CMD ["sh", "script.sh"]
