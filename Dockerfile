FROM node:14.17.2
# ENV NODE_ENV=production
EXPOSE 3031
# WORKDIR ./

COPY ["package.json", "package-lock.json*", "./"]

# RUN npm install --production
RUN npm install


COPY . .
RUN npm run build

CMD [ "node", "./build/app.js" ]

# CMD [ "node", "server.js" ]
# CMD [ " npm run dev" ]