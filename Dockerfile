FROM node:lts

WORKDIR /app
COPY ./package.json ./
COPY ./yarn.lock ./
RUN yarn --pure-lockfile
COPY . .
RUN yarn build

EXPOSE 3000
ENTRYPOINT [ "node", "dist/app.js" ]