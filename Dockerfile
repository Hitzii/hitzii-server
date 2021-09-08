# syntax=docker/dockerfile:1
FROM node:14.17.2
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "./build/app.js"]