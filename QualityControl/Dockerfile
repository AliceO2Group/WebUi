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
RUN npm ci
RUN npm i -g nodemon --save-dev


# Copy project files
COPY . .

# Export port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "dev"]
