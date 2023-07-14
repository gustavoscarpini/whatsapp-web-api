# reference https://developers.google.com/web/tools/puppeteer/troubleshooting#setting_up_chrome_linux_sandbox
FROM node:current-alpine

# manually installing chrome
# to work on arm chips
RUN apk add chromium

# skips puppeteer installing chrome and points to correct binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package*.json .

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD [ "node", "index.js" ]
