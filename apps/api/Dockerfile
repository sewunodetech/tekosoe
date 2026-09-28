# Build dari root repo: docker build -f apps/api/Dockerfile .
# Dijalankan dengan tsx langsung dari source (paket @tekosoe/shared berupa source TypeScript).
FROM node:22-slim
WORKDIR /repo
COPY . .
RUN npm ci -w @tekosoe/api -w @tekosoe/shared --include-workspace-root
ENV NODE_ENV=production
WORKDIR /repo/apps/api
EXPOSE 8787
CMD ["npm", "start"]
