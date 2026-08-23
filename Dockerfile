# Standalone frontend image. Build context is this frontend repository; the
# public contract arrives as the reviewed v0.3.1 tarball in vendor/.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
RUN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget --quiet --output-document=- http://127.0.0.1/health/live || exit 1
