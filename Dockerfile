FROM nginx:latest

COPY . /app

WORKDIR /app

EXPOSE 3006

CMD [ "nginx","-c","/app/nginx/nginx.conf" ]
