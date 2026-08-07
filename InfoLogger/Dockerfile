#
# ---- Base ----
FROM node:22-alpine AS base

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Create app directory
WORKDIR /home/node/app

#
# ---- Development Dependencies ----
FROM base AS developmentdependencies

# Installs Git and packages required for Puppeteer
# https://pkgs.alpinelinux.org/packages
RUN apk add --no-cache \
    chromium \
    freetype \
    freetype-dev

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy all files, except those ignored by .dockerignore, to the container
COPY package*.json ./
# Installs modules from package-lock.json if there are changes, this ensures reproducible build
RUN npm --silent ci


#
# ---- Development ----
FROM developmentdependencies AS development

# Expose the port to the Docker instance (not the host!)
EXPOSE 8080

# Run the container as a non-root user 1000:1000, which is the default user in the node:22-alpine image
USER 1000:1000

# Run start script as specified in package.json
CMD [ "npm", "run", "start:dev" ]

#
# ---- Test ----
FROM developmentdependencies AS test

# 
COPY . .

USER 1000:1000

# Run start script as specified in package.json
CMD [ "npm", "run", "test" ]

#
# ---- Simul ----
FROM base AS simul
COPY package.json ./
COPY test/live-simulator ./test/live-simulator
EXPOSE 6102

USER 1000:1000

CMD [ "npm", "run", "simul" ]
