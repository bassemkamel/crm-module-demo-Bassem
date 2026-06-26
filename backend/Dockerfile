# Development image for the NestJS backend.
# Source is bind-mounted via docker-compose for hot reload; node_modules are
# kept inside the container (anonymous volume) so host/container binaries match.
FROM node:22-alpine

WORKDIR /app

# Needed by Prisma engines on Alpine (added now so later phases work unchanged).
RUN apk add --no-cache openssl

COPY package*.json ./
# npm install (not ci) so platform-specific Prisma engine deps resolve correctly
# when building the Linux image from a non-Linux host.
RUN npm install --no-audit --no-fund

COPY . .

# Pre-generate the Prisma client into the image (also regenerated at runtime by
# the entrypoint to stay in sync with the mounted schema).
RUN npx prisma generate

EXPOSE 3001

# Regenerate the Prisma client (the node_modules volume may lag the schema) and
# apply pending migrations before starting the app. Idempotent on every boot.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]
