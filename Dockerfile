# Multi-stage Vite build. The build context is `webapp/`; only the public
# contracts package, frontend source, and public OpenDecks assets are copied.
# Native TexasSolver files and SolverOutputs are excluded by .dockerignore.
FROM node:22-bookworm-slim AS build

WORKDIR /workspace
ENV CI=true
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY contracts/package.json contracts/pnpm-lock.yaml ./contracts/
COPY contracts/tsconfig.base.json contracts/tsconfig.json contracts/tsconfig.build.json ./contracts/
COPY contracts/src ./contracts/src
RUN pnpm --dir contracts install --frozen-lockfile && pnpm --dir contracts build

COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
COPY frontend/tsconfig.base.json frontend/tsconfig.json frontend/vite.config.ts frontend/index.html ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
RUN pnpm --dir frontend install --frozen-lockfile && pnpm --dir frontend build

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --output-document=- http://127.0.0.1/health/live || exit 1
