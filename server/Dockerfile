FROM node:20-bookworm-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048

# Install curl for healthchecks, then install dependencies
COPY package*.json ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --omit=dev --quiet

# Copy project files
COPY . .

# Create logs directory and set permission for node user
RUN mkdir -p /usr/src/app/logs && \
    chown -R node:node /usr/src/app

# Switch to non-root
USER node

EXPOSE 5000

CMD ["node", "server.js"]
