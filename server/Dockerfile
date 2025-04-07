FROM node:22.13.1-alpine
RUN [ ! -e /lib/libssl.so.3 ] && ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3 || echo "Link already exists"
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY . .

EXPOSE 3000

# the program we want to run!
CMD ["npm", "run", "dev"]
