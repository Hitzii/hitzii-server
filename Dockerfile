FROM node:14.17.2
# ENV NODE_ENV=production
EXPOSE 3031
WORKDIR /hitzii_backend

COPY ["package.json", "package-lock.json*", "./"]

# RUN npm install --production

COPY . .

# En caso de querer trabajar desde el contenedor en modo desarrollo.
# RUN npm run start

RUN npm install
RUN npm run build


CMD [ "node", "./build/app.js" ]

# CMD [ "node", "server.js" ]
# CMD [ " npm run dev" ]