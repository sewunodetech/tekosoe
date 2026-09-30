# syntax=docker/dockerfile:1
# Envio HyperIndex (production: `envio start`). Build dari root repo (npm workspaces):
#   docker build -f packages/indexer/Dockerfile .
# Butuh Postgres + Hasura; lihat docker-compose.yml di root untuk stack lengkap.
# Filter konteks ada di packages/indexer/Dockerfile.dockerignore.

FROM node:22-slim
WORKDIR /repo

# npm ci memvalidasi lockfile root terhadap semua workspace, jadi semua package.json ikut.
# Lockfile memuat envio-linux-x64, jadi binary Linux terpasang di sini (CLI tidak jalan di Windows).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
COPY packages/indexer/package.json packages/indexer/
RUN npm ci -w @tekosoe/indexer && npm cache clean --force

COPY packages/indexer/config.yaml packages/indexer/schema.graphql packages/indexer/tsconfig.json packages/indexer/
COPY packages/indexer/src packages/indexer/src

WORKDIR /repo/packages/indexer
# Codegen saat build supaya kesalahan config/schema ketahuan sebelum container jalan.
RUN npx envio codegen && chown -R node:node /repo/packages/indexer

USER node
ENV ENVIO_TUI=false \
    ENVIO_INDEXER_PORT=9898
EXPOSE 9898

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.ENVIO_INDEXER_PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "envio", "start"]
