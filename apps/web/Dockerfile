# syntax=docker/dockerfile:1
# Web statis (ADR 0012): `next build` (output: "export") lalu nginx melayani apps/web/out.
# Build dari root repo (npm workspaces):
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.mulalabs.biz.id \
#     --build-arg NEXT_PUBLIC_ENVIO_GRAPHQL_URL=https://graphql.mulalabs.biz.id/v1/graphql .
# Nilai NEXT_PUBLIC_* ter-inline saat build: ganti URL = build ulang image.
# Filter konteks ada di apps/web/Dockerfile.dockerignore.

# ---- build ----------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
RUN npm ci -w @tekosue/web -w @tekosue/shared --include-workspace-root

COPY packages/shared packages/shared
COPY apps/web apps/web

ARG NEXT_PUBLIC_SITE_URL=https://tekosue.xyz
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIO_GRAPHQL_URL
ARG NEXT_PUBLIC_ANDROID_APK_URL
ARG NEXT_PUBLIC_APP_DOWNLOAD_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @tekosue/web

# ---- serve ----------------------------------------------------------------
FROM nginx:1.27-alpine AS serve
COPY --from=build /repo/apps/web/out /usr/share/nginx/html
COPY apps/web/deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
