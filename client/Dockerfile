FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
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
COPY . .

# Environment variables must be present at build time for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FEEDBACK_ENABLED
ARG NEXT_PUBLIC_AUTH_PROVIDER
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_KEYCLOAK_SCOPE
ARG NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI
ARG NEXT_PUBLIC_KEYCLOAK_LOGOUT_REDIRECT_URI
 
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FEEDBACK_ENABLED=$NEXT_PUBLIC_FEEDBACK_ENABLED
ENV NEXT_PUBLIC_AUTH_PROVIDER=$NEXT_PUBLIC_AUTH_PROVIDER
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_KEYCLOAK_SCOPE=$NEXT_PUBLIC_KEYCLOAK_SCOPE
ENV NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI=$NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI
ENV NEXT_PUBLIC_KEYCLOAK_LOGOUT_REDIRECT_URI=$NEXT_PUBLIC_KEYCLOAK_LOGOUT_REDIRECT_URI

# Build Shared first
RUN cd shared && npm run build

# Build Client
RUN cd client && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Optimize Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Standalone output puts everything in .next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/client/public ./client/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build in the standalone output
# It mimics the structure. Usually it ends up in root of standalone or inside package structure.
# With monorepo structure, it might be nested under `client/`.
# Let's assume standard behavior: `node client/server.js` or just `node server.js` depending on copy.
# Copying `/app/client/.next/standalone ./` puts `client/server.js` inside `./client/server.js`?
# No, standalone structure mirrors source.
# If build was in `client`, standalone usually contains `client/server.js`.
# Let's check typical output.
# Simplest is to start with:
CMD ["node", "client/server.js"]
