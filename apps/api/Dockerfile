# Build dari root repo: docker build -f apps/api/Dockerfile .
# Dijalankan dengan tsx langsung dari source (paket @tekosoe/shared berupa source TypeScript).
FROM node:22-slim
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @tekosoe/api...
ENV NODE_ENV=production
WORKDIR /repo/apps/api
EXPOSE 8787
CMD ["pnpm", "start"]
