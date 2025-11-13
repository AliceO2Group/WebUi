# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /var/workspace

# ---- Dependencies (for production) ----
FROM base AS dependencies
COPY webapp/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Dev Dependencies (for tests) ----
FROM base AS dev-dependencies

# Installs packages required for Puppeteer 
RUN apk add --no-cache \
    chromium \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY webapp . 

RUN npm --silent install

# ---- Build  ----
FROM base AS build
COPY webapp/package*.json ./
RUN npm i --only=production && npm cache clean --force
COPY webapp .
RUN npm run build

# ---- Test ----
FROM dev-dependencies AS test
CMD ["npm", "run", "test"]

# ---- Coverage ----
FROM dev-dependencies AS coverage
CMD ["npm", "run", "coverage"]

# ---- Production  ----
FROM nginx:alpine AS production
COPY --from=build /var/workspace/build/client /usr/share/nginx/html
COPY docker/provisioning/nginx/conf.d/production.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM nginx:1.27 AS reverse-proxy
COPY ./docker/provisioning/nginx/conf.d/default.conf /etc/nginx/conf.d
EXPOSE 8080

# ---- Vault ----
FROM hashicorp/vault:1.20
COPY ./docker/vault/vault.crt ./docker/vault/vault.key ./docker/vault/ca.crt /vault/config/
COPY ./docker/vault/central-system-client.crt /vault/config/central-system-client.crt
COPY ./docker/vault/vault-init.sh /usr/local/bin/vault-init.sh
RUN chmod +x /usr/local/bin/vault-init.sh