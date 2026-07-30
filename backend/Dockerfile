FROM node:22-alpine AS dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY frontend ./frontend
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
WORKDIR /app/backend
EXPOSE 3000
CMD ["npm", "start"]

