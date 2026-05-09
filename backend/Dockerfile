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
RUN npm run build
# Garante que dist/ e uploads/ tenham permissão correta (evita EACCES ao montar volumes)
RUN mkdir -p /app/dist /app/uploads/arts /app/uploads/mockups /app/public/placeholders \
    && chown -R node:node /app/dist /app/uploads /app/public
USER node
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
# Copia os placeholders para a imagem de produção
COPY --from=builder /app/public ./public

RUN mkdir -p /app/uploads/arts /app/uploads/mockups \
    && chown -R node:node /app/dist /app/uploads /app/public

USER node
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
