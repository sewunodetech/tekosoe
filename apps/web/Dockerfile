# syntax=docker/dockerfile:1
# Next.js (next build + next start). Build dari root repo (npm workspaces):
#   docker build -f apps/web/Dockerfile .
# Filter konteks ada di apps/web/Dockerfile.dockerignore.

FROM node:22-slim
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
# Dev dependencies ikut: next build butuh typescript + tailwind.
RUN npm ci -w @tekosoe/web --include-workspace-root && npm cache clean --force

# @tekosoe/shared dikonsumsi sebagai source TypeScript (transpilePackages).
COPY packages/shared packages/shared
COPY apps/web apps/web

WORKDIR /repo/apps/web
RUN npm run build && chown -R node:node .next

USER node
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npx", "next", "start"]
