# AUREA API — production/staging image
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (workspace-aware: copy root manifests if monorepo build)
COPY package.json package-lock.json* ./
# When built from apps/api context, dependencies are local
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY knexfile.cjs ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "src/app.js"]
