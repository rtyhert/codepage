FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY client/package.json client/package-lock.json* ./client/
COPY server/package.json server/package-lock.json* ./server/
RUN cd client && npm ci && cd ../server && npm ci

COPY client/ ./client/
COPY server/ ./server/
COPY server/prisma/ ./server/prisma/

RUN cd client && npm run build
RUN cd server && npm run build && npx prisma generate

FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=build /app/server/dist/ ./server/dist/
COPY --from=build /app/server/node_modules/ ./server/node_modules/
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/prisma/ ./server/prisma/
COPY --from=build /app/client/dist/ ./client/dist/

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/server
CMD ["node", "dist/index.js"]
