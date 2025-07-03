### Dockerfile for production Express app
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.example .env

# Expose port
EXPOSE 5000

# Run the server
CMD ["node", "src/server.js"]
