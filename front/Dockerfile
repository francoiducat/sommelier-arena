FROM node:20-alpine AS builder
WORKDIR /app

# PUBLIC_PARTYKIT_HOST is baked into the Astro static build at build time.
# In Docker Mode B, the browser connects to localhost:3000 (nginx) which
# proxies /parties/ to the back container. So we set it to localhost:3000.
ARG PUBLIC_PARTYKIT_HOST=localhost:3000
ENV PUBLIC_PARTYKIT_HOST=$PUBLIC_PARTYKIT_HOST

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
