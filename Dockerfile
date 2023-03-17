# builder image
FROM node:current-alpine AS typescript_builder

WORKDIR /home/node/app

COPY . /home/node/app

RUN npm install typescript@4.4.2 -g
RUN npm install --only=development
RUN npm run compile

# final image
FROM node:current-alpine

WORKDIR /home/node/screensy

# copy files for the rendezvous
COPY --from=typescript_builder /home/node/app/screensy-rendezvous/rendezvous-websocketserver.js /home/node/screensy/screensy-rendezvous/
COPY --from=typescript_builder /home/node/app/screensy-rendezvous/rendezvous-websocketserver.js.map /home/node/screensy/screensy-rendezvous/

# copy files for the website
COPY --from=typescript_builder /home/node/app/screensy-website/translations /home/node/screensy/screensy-website/translations
COPY --from=typescript_builder /home/node/app/screensy-website/styles.css /home/node/screensy/screensy-website/
COPY --from=typescript_builder /home/node/app/screensy-website/screensy.js /home/node/screensy/screensy-website/
COPY --from=typescript_builder /home/node/app/screensy-website/screensy.js.map /home/node/screensy/screensy-website/
COPY --from=typescript_builder /home/node/app/screensy-website/webserver.js /home/node/screensy/screensy-website/
COPY --from=typescript_builder /home/node/app/screensy-website/webserver.js.map /home/node/screensy/screensy-website/

# copy main
COPY --from=typescript_builder /home/node/app/app.js /home/node/screensy/
COPY --from=typescript_builder /home/node/app/app.js.map /home/node/screensy/

# copy package
COPY package.json /home/node/screensy/
COPY package-lock.json /home/node/screensy/

RUN npm install --only=production

# port for website
EXPOSE 8080
EXPOSE 4000

CMD [ "npm", "start" ]