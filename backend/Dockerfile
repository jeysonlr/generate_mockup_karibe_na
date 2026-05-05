# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
# openssl3 (requerido pelo Prisma no Alpine), build tools para o Sharp
RUN apk add --no-cache libc6-compat openssl openssl-dev python3 make g++ vips-dev

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm install

# ---- Development ----
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 3333
CMD ["npm", "run", "start:dev"]

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl vips-dev

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/uploads/arts /app/uploads/mockups

EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
