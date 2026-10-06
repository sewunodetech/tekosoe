# syntax=docker/dockerfile:1
# Build dari root repo (npm workspaces, satu package-lock.json di root):
#   docker build -f apps/api/Dockerfile .
# Railway: Root Directory = "/", Dockerfile Path = "apps/api/Dockerfile".
# Filter konteks ada di apps/api/Dockerfile.dockerignore (BuildKit memakainya otomatis).

# ---- dependencies ----------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
RUN npm ci -w @tekosue/api --include-workspace-root

# ---- typecheck (never ship code that does not compile) ---------------------
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run typecheck -w @tekosue/api

# ---- runtime ---------------------------------------------------------------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo

# Production dependencies only: tsx, pg, drizzle-orm and friends are runtime deps,
# drizzle-kit/typescript/vitest are not.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
RUN npm ci -w @tekosue/api --omit=dev && npm cache clean --force

# src + drizzle are enough for the app and for the pre-deploy `npm run db:migrate`.
COPY --chown=node:node packages/shared packages/shared
COPY --chown=node:node apps/api/src apps/api/src
COPY --chown=node:node apps/api/drizzle apps/api/drizzle
COPY --chown=node:node apps/api/docs/openapi.yaml apps/api/docs/openapi.yaml
COPY --chown=node:node apps/api/tsconfig.json apps/api/drizzle.config.ts apps/api/

USER node
WORKDIR /repo/apps/api
EXPOSE 3000

# Railway uses its own healthcheck against /health; this covers plain `docker run`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# --env-file-if-exists keeps the image usable when the platform injects env vars.
CMD ["node", "--env-file-if-exists=.env", "--import", "tsx", "src/index.ts"]
