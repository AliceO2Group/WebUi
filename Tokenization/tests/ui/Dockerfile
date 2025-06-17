FROM node:22-slim

WORKDIR /tests/ui

# system dependencies for running Chrome
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils libu2f-udev libvulkan1 libxshmfence1 libxss1 --no-install-recommends && \
    curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --silent

COPY . .

CMD ["sh", "-c", "npx wait-on http://reverse-proxy:8080 && npm run test"]