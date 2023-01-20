FROM node:18-alpine as builder
WORKDIR /etc/logto
ENV CI=true

COPY . .

# Install dependencies and build
RUN npm add --location=global pnpm@^7.14.0
RUN pnpm package:sync; exit 0
RUN pnpm i
RUN pnpm build

# Prune unnecessary files for production
RUN rm -rf node_modules packages/**/node_modules
RUN rm -rf packages/**/src
RUN rm -rf packages/**/tsconfig*.json
RUN rm -rf packages/**/*.config.js

FROM ghcr.io/logto-io/logto:1.0.0-rc.3 as app

WORKDIR /etc/logto

COPY --from=builder /etc/logto/packages/ ./packages/core/connectors

EXPOSE 3001
EXPOSE 3002
ENTRYPOINT ["npm", "start"]
