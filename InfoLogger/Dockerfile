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
COPY . .



# Installs modules from package-lock.json if there are changes, this ensures reproducible build
RUN npm --silent ci

# Install nodemon (for development only)
RUN npm i nodemon

#
# ---- Development ----
FROM developmentdependencies AS development

# Expose the port to the Docker instance (not the host!)
EXPOSE 8080

# Run start script as specified in package.json
CMD [ "npm", "run", "start:dev" ]

#
# ---- Test ----
FROM developmentdependencies AS test
    
# Run start script as specified in package.json
CMD [ "npm", "run", "test" ]

# ---- Production Dependencies ----
FROM base AS productiondependencies

# Copy package.json and package-lock.json to the container.
COPY package*.json ./

# Installs modules from package-lock.json, this ensures reproducible build.
RUN npm --silent ci --production    

 # Copy all files, filtered by .dockerignore, to the container with added dev dependancies.
COPY . .
RUN rm -r ./test
RUN rm eslint.config.js


# ---- Simul ----
FROM developmentdependencies AS simul

# Expose simul server port.
EXPOSE 6102

# Run simul script as specified in package.json
CMD [ "npm", "run", "simul" ]

# ---- Production ----
FROM productiondependencies AS production

# Expose the port to the Docker instance (not the host!)
EXPOSE 8080

# Run start script as specified in package.json
CMD [ "npm", "start" ]