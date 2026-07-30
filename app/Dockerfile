FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci && rm -rf ~/.npm
COPY . .
RUN npm run build

EXPOSE 5173
ENV NODE_OPTIONS=--max-old-space-size=768
CMD ["node", "server.js"]
