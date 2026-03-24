FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
# Docker mode: docs are served at root (localhost:3002/) by default.
# Use the DOCS_BASE_URL build arg to control the base path at build time.
# Example (production build with docs under /docs):
#   docker build --build-arg DOCS_BASE_URL=/docs -t sommelier-docs .
# Example (local build with root base path):
#   docker build --build-arg DOCS_BASE_URL=/ -t sommelier-docs .
ARG DOCS_BASE_URL=/
ENV DOCS_BASE_URL=$DOCS_BASE_URL
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
