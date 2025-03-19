# Base image
FROM node:22-alpine3.20 AS base

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

# Working directory
WORKDIR /usr/src/app


# Export port
EXPOSE 8080

## Development stage
FROM base AS dev
COPY package*.json ./
RUN npm --silent ci
COPY . .
RUN npm install -g nodemon
CMD ["npm", "run", "dev"]

## Test stage
FROM base AS test

# Needed for chromium:
RUN apk add --no-cache \
    chromium=131.0.6778.108-r0 \
    freetype=2.13.2-r0 \
    freetype-dev=2.13.2-r0 \
    harfbuzz=8.5.0-r0 \
    ca-certificates=20241121-r1

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --silent
COPY . .

CMD ["npm", "run", "test"]
