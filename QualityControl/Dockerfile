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

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy the full application
COPY . .


# Export port
EXPOSE 8080

## Development stage
FROM base AS dev
RUN npm install -g nodemon
CMD ["npm", "run", "dev"]

## Test stage
FROM base AS test

# Needed for chromium:
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libstdc++ \
    libx11 \
    libx11-dev \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxi \
    libxtst \
    libc6-compat \
    alsa-lib \
    at-spi2-core \
    cairo \
    pango \
    dbus \
    ttf-dejavu

CMD ["npm", "run", "test"]
