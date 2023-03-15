# website
FROM node:14.16-alpine3.13 AS typescript_builder

WORKDIR /home/node/app

COPY screensy-website/tsconfig.json ./
COPY screensy-website/screensy.ts ./

RUN npm install typescript@4.4.2 -g
RUN tsc

FROM golang:1.15 as go_builder

WORKDIR /go/src/app

COPY screensy-website/main.go ./
COPY screensy-website/go.mod ./

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o screensy-website .

# rendezvous
FROM node:14.16-alpine3.13 AS builder

WORKDIR /home/node/app

COPY screensy-rendezvous/tsconfig.json ./
COPY screensy-rendezvous/server.ts ./

COPY screensy-rendezvous/package.json ./
COPY screensy-rendezvous/package-lock.json ./

RUN npm install --only=development
RUN npx tsc

# prepare final image
FROM node:14.16-alpine3.13

# copy files from the website (typescript_builder)
COPY --from=typescript_builder /home/node/app/screensy.js ./web/
COPY --from=typescript_builder /home/node/app/screensy.js.map ./web/
COPY --from=typescript_builder /home/node/app/screensy.ts ./web/

# copy files from the website (go_builder)
COPY --from=go_builder /go/src/app/screensy-website ./web/

# copy resource files for the website
COPY screensy-website/translations/ ./web/translations
COPY screensy-website/styles.css ./web/

# copy files from the rendezvous (builder)
COPY --from=builder /home/node/app/server.js ./rend
COPY --from=builder /home/node/app/server.js.map ./rend
COPY --from=builder /home/node/app/server.ts ./rend

# copy resource files for rendezvous
COPY screensy-rendezvous/package.json ./rend
COPY screensy-rendezvous/package-lock.json ./rend

RUN cd rend && npm install --only=production

# install caddy n coturn
RUN apk update
RUN apk add caddy
RUN apk add coturn

# copy config for caddy and coturn
COPY turnserver.conf /etc/coturn/turnserver.conf
COPY Caddyfile /etc/caddy/Caddyfile

# port for website
EXPOSE 80
EXPOSE 443
EXPOSE 3478

CMD [ "cd", "web", "&&", "./screensy-website", "&", "cd", "rend", "&&", "npm", "start" ]