# syntax=docker/dockerfile:1

# ---- dependencies ----------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- typecheck (never ship code that does not compile) ---------------------
FROM deps AS build
COPY tsconfig.json vitest.config.ts drizzle.config.ts ./
COPY src ./src
COPY test ./test
RUN npx tsc --noEmit -p tsconfig.json

# ---- runtime ---------------------------------------------------------------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Production dependencies only: tsx, pg, drizzle-orm and friends are runtime deps,
# drizzle-kit/typescript/vitest are not.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# src + drizzle are enough for the app and for the pre-deploy `npm run db:migrate`.
COPY --chown=node:node src ./src
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node tsconfig.json drizzle.config.ts ./

USER node
EXPOSE 3000

# Railway uses its own healthcheck against /health; this covers plain `docker run`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# --env-file-if-exists keeps the image usable when the platform injects env vars.
CMD ["node", "--env-file-if-exists=.env", "--import", "tsx", "src/index.ts"]
