FROM node:20

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app

RUN npx playwright install --with-deps chromium
RUN npm run build

EXPOSE 3000

CMD [ "npx", "nest", "start" ]