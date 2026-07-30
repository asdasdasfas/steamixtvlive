FROM node:20-slim

RUN apt-get update && apt-get install -y chromium --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && rm -rf ~/.npm
COPY . .

RUN npm run build

EXPOSE 5173
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
ENV NODE_OPTIONS=--max-old-space-size=768
CMD ["node", "server.js"]
