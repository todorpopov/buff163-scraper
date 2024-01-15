FROM node:18

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app

RUN npm run build
RUN npm run playwright_install
# RUN npx playwright install chromium
# RUN npx playwright install-deps

EXPOSE 3000

CMD [ "npx", "nest", "start" ]