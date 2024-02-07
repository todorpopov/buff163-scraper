FROM node:20-alpine

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 3000

CMD [ "npx", "nest", "start" ]