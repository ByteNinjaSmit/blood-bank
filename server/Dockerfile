FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --quiet

# Build the TypeScript src/ tree into dist/ so the legacy server.js
# can mount /api/v2 via `require('./dist/v2-router')`.
FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Production deps only (build deps stay in the build stage).
COPY package*.json ./
RUN npm ci --omit=dev --quiet

# App source + compiled TS output.
COPY --from=build /usr/src/app/dist ./dist
COPY . .

RUN mkdir -p /usr/src/app/logs && \
    chown -R node:node /usr/src/app

USER node

EXPOSE 5000

CMD ["node", "server.js"]
