# Development image for the Next.js frontend.
# Source is bind-mounted via docker-compose for hot reload; node_modules and
# .next are kept inside the container so host/container artifacts don't clash.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# Use `npm install` rather than `npm ci`: the lockfile may be generated on a
# different platform (e.g. Windows host) and omit Linux-only optional deps,
# which makes `npm ci` fail. install resolves the right binaries at build time.
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
