# ============================================================================
# ExecuTrain API - Dockerfile
# Express + PostgreSQL (Prisma 7)
# ============================================================================

# ---------- Build stage ----------
FROM node:24-slim AS build

WORKDIR /app

# Copy package files first untuk cache layer
COPY package.json package-lock.json* ./

# Install semua dependencies (dev dibutuhkan utk prisma generate)
RUN npm install

# Copy prisma schema + config
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client (wajib utk runtime)
RUN npx prisma generate

# ---------- Runtime stage ----------
FROM node:24-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8000

WORKDIR /app

# Non-root user (best practice)
RUN groupadd --system app && useradd --system --gid app app

# Copy dependencies (node_modules lengkap dari build stage)
COPY --from=build --chown=app:app /app/node_modules ./node_modules

# Copy aplikasi
COPY --chown=app:app server.js ./
COPY --chown=app:app src ./src
COPY --chown=app:app prisma ./prisma
COPY --chown=app:app prisma.config.ts ./

USER app

EXPOSE 8000

# Jalankan server langsung (bukan nodemon — nodemon hanya utk dev)
CMD ["node", "server.js"]
