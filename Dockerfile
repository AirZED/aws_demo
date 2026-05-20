# ── Stage 1: Build ───────────────────────────────────────────
# Use the full Node image to compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm install

# Copy source code and compile
COPY src/ ./src/
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────
# Use a lean image — no TypeScript compiler, no devDeps
FROM node:20-alpine AS production

WORKDIR /app

# Copy only what we need to run the app
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

# The port our app listens on
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "dist/index.js"]
