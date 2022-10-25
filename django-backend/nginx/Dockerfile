# Use an official Python runtime as a parent image
FROM nginx

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY ./uwsgi_params /etc/nginx/uwsgi_params

WORKDIR /app

EXPOSE 80