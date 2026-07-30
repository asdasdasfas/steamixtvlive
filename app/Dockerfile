FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci && rm -rf ~/.npm
COPY . .
RUN npm run build

EXPOSE 5173
ENV NODE_OPTIONS=--max-old-space-size=768
CMD ["node", "server.js"]
