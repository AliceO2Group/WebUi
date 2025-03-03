# Base image
FROM registry.access.redhat.com/ubi9/nodejs-20 as base

# Working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci


# Copy configuration file
COPY . .
COPY ./config-default.js ./config.js

# Export port
EXPOSE 8080

# --- Development ---
FROM base as development
ENV NODE_ENV=development
CMD ["npm", "start"]

# --- Test ---
FROM base as test
ENV NODE_ENV=test
CMD ["npm", "run", "test"]

# --- Production ---
FROM base as production
ENV NODE_ENV=production
CMD ["npm", "start"]