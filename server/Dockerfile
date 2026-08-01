FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci --quiet

# Compile the TypeScript src/ tree into dist/. dist/server.js is the
# only entrypoint — the legacy JS monolith was removed.
FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048

# `upgrade` matters as much as `install`: the node:20-bookworm-slim tag
# lags Debian security updates, and the CI Trivy gate fails the build on
# fixable HIGH/CRITICAL in libgnutls30, libcap2 and friends.
RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Production deps only (build deps stay in the build stage).
COPY package*.json ./
RUN npm ci --omit=dev --quiet

# Drop the build-time JS toolchain from the runtime image. npm bundles its
# own vendored copies of tar, minimatch, glob, cross-spawn, brace-expansion
# and sigstore, which carry most of the image's reported CVEs — none of it
# is reachable once the container is just `node dist/server.js`, but a
# scanner cannot know that, and neither can an attacker with a shell.
# Nothing at runtime shells out to npm/npx/yarn; the healthcheck uses curl.
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
      /opt/yarn-v*

# App source + compiled TS output.
COPY --from=build /usr/src/app/dist ./dist
COPY . .

RUN mkdir -p /usr/src/app/logs && \
    chown -R node:node /usr/src/app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
