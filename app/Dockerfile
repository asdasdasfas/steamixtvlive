FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates fonts-liberation wget --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json .puppeteerrc.cjs ./
RUN npm install && rm -rf ~/.npm
COPY . .
RUN npm run build

EXPOSE 5173
ENV NODE_OPTIONS=--max-old-space-size=768
CMD ["node", "server.js"]
