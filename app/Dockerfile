FROM node:20-jammy

RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

RUN echo "=== Chrome info ===" && (command -v google-chrome || command -v google-chrome-stable || echo "not in PATH") && (ls -la /usr/bin/google-chrome* 2>/dev/null || echo "no /usr/bin/google-chrome*") && (ls -la /opt/google/chrome* 2>/dev/null || echo "no /opt/google/chrome*") && echo "=== done ==="

WORKDIR /app
COPY package*.json ./
RUN npm ci && rm -rf ~/.npm
COPY . .
RUN npm run build

EXPOSE 5173
ENV NODE_OPTIONS=--max-old-space-size=768
CMD ["node", "server.js"]
