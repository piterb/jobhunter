FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Copy workspace definitions to satisfy NPM Workspaces
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./

# Copy Shared & Server Source
COPY shared/ ./shared/
COPY server/ ./server/
# Client source not needed for server build

# Build Shared First (as dependency)
RUN cd shared && npm run build

# Build Server
RUN cd server && npm run build

# Production image, copy all the files and run server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy dependencies (including devDeps build tools might be overkill but safest for monorepo symlinks)
# Ideally we would prune devDeps, but with workspaces it's tricky.
# For now, copy all modules to ensure symlinks work.
COPY --from=deps /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json

# Identify user
USER expressjs

# Expose port (Cloud Run defaults to 8080 usually, Express to 3000?)
# Check server/index.ts usually. 
# Default to PORT env var.

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/dist/index.js"]
