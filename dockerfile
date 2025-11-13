
# Etapa 1: dependencias
FROM node:20-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# Etapa 2: build
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# Etapa 3: runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

RUN apk add --no-cache libc6-compat ca-certificates curl

# Copia artefactos de build (standalone mode)
# Next.js standalone mode creates a minimal server in .next/standalone
# The standalone directory already includes node_modules and server.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Public folder must be copied to the same directory as server.js for Next.js to serve it
COPY --from=builder /app/public ./public

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && chown -R nextjs:nodejs /app \
 && chmod -R 755 /app/public
USER nextjs

EXPOSE 8080
# Start Next.js server from standalone build
# The standalone build includes server.js in the root
CMD ["node", "server.js"]