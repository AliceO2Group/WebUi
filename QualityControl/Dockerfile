# Base image
FROM registry.access.redhat.com/ubi9/nodejs-20 as base

# Working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci


# Copy project files
COPY . .

# Export port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]