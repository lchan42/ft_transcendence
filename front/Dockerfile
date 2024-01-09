FROM node:latest

WORKDIR /app
COPY ./package* .
COPY tailwind.config.js .
RUN npm i
COPY . .
EXPOSE 5173

CMD ["npm", "run", "dev"]

#debug
#CMD tail -f /dev/null
