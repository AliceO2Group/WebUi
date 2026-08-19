#
# ---- Base ----
FROM node:22-alpine AS base

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

#
# ---- Development Dependencies ----
FROM base AS developmentdependencies

# Must be set before `npm ci` otherwise Puppeteer will try to install Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
# Installs modules from package-lock.json if there are changes, this ensures reproducible build
RUN npm --silent ci


#
# ---- Development ----
FROM developmentdependencies AS development

EXPOSE 8080

# Run the container as a non-root user 1000:1000, which is the default user in the node:22-alpine image
USER 1000:1000

CMD [ "npm", "run", "start:dev" ]

#
# ---- Test ----
FROM developmentdependencies AS test

RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy all files, except those ignored by .dockerignore
COPY . .

USER 1000:1000

CMD [ "npm", "run", "test" ]

#
# ---- Simul ----
FROM base AS simul

COPY test/live-simulator ./test/live-simulator
COPY test/fake-data ./test/fake-data
COPY test/utils ./test/utils
EXPOSE 6102

USER 1000:1000

CMD [ "node", "test/live-simulator/runInfoLoggerServer.js" ]
