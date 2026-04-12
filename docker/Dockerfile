FROM node:20-alpine

WORKDIR /app

# Install all deps (including dev — needed to build frontend)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build frontend (Vue → dist/)
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "server/server.js"]
