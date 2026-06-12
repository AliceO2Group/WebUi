# Base image
FROM node:22-alpine3.20 AS base

# Working directory
WORKDIR /usr/src/app

# Install Python 3, build tools, pkg-config, and necessary dependencies for canvas
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    bash \
    pkgconf \
    cairo-dev \
    pango-dev \
    pixman-dev \
    jpeg-dev \
    giflib-dev \
    musl-dev

# Export port
EXPOSE 8080

FROM base AS dependencies

# Install dependencies early for Docker layer caching
COPY package*.json ./
RUN npm ci --silent

FROM dependencies AS chromiumdependencies
# Required for Puppeteer
RUN apk add --no-cache \
    chromium=131.0.6778.108-r0 \
    freetype=2.13.2-r0 \
    freetype-dev=2.13.2-r0 \
    harfbuzz=8.5.0-r0 \
    ca-certificates=20260413-r0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

FROM chromiumdependencies AS sourcechromium
# Copy the rest of the application code
COPY . .

FROM dependencies AS development
RUN npm i -g nodemon --save-dev
CMD ["npm", "run", "dev-networked-mount"]

FROM sourcechromium AS test
CMD ["npm", "run", "test"]

# For GH Actions only
FROM sourcechromium AS coverage-ci
CMD ["npm", "run", "coverage-lcov"]

# For local coverage
FROM sourcechromium AS coverage-local
CMD ["npm", "run", "coverage-local"]
