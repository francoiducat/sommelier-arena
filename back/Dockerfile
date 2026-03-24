# Build context must be the repo root so partykit.json and back/game.ts are both accessible.
# Example: docker build -f back/Dockerfile -t sommelier-arena-back .
#
# partykit is installed in an isolated /pk directory to avoid macOS vs Linux native
# binary conflicts — workerd ships platform-specific binaries that must be installed
# on the target OS. uuid goes in /app/node_modules so partykit's bundler (esbuild)
# can resolve it from back/game.ts during the build step.
FROM node:20-slim
WORKDIR /pk
RUN npm install partykit
WORKDIR /app
RUN echo '{"dependencies":{"uuid":"^9.0.0"}}' > package.json && npm install
COPY partykit.json ./
# Copy entire back/ directory so refactored modules (types.ts, utils.ts, etc.) are available
COPY back/ ./back/
EXPOSE 1999
ENV PATH="/pk/node_modules/.bin:$PATH"
CMD ["partykit", "dev", "--port", "1999"]
