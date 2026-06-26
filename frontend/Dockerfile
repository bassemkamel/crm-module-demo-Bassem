# Development image for the Next.js frontend.
# Source is bind-mounted via docker-compose for hot reload; node_modules and
# .next are kept inside the container so host/container artifacts don't clash.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
