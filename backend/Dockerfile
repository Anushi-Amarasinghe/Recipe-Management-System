FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json /app/backend/
RUN cd /app/backend && npm install

COPY backend /app/backend
COPY frontend /app/frontend

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]
