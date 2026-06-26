# Development image for the NestJS backend.
# Source is bind-mounted via docker-compose for hot reload; node_modules are
# kept inside the container (anonymous volume) so host/container binaries match.
FROM node:22-alpine

WORKDIR /app

# Needed by Prisma engines on Alpine (added now so later phases work unchanged).
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
