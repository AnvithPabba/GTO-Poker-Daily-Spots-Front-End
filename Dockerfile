# Static frontend foundation. The React/Vite application is implemented later.
# public/ includes only the public placeholder site and OpenDecks CC0 card art;
# solver outputs and private configuration are never copied into this image.
# Build from the webapp directory:
#   docker build -f frontend/Dockerfile -t poker-trainer-frontend:dev .

FROM nginx:1.27-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/public /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --output-document=- http://127.0.0.1/health/live || exit 1
