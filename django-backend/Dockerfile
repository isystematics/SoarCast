FROM phusion/baseimage:master-amd64

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

USER root
RUN mkdir /app
WORKDIR /app
COPY ./ /app/

RUN apt update -y \
    && apt upgrade -y \
    && apt install git python3-pip make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl -y \
    && pip3 install -r /app/requirements.txt \
    && chmod 755 /app/entrypoint.sh

RUN mkdir -p /vol/web/media
RUN mkdir -p /vol/web/static
RUN chmod -R 755 /vol/web

ENTRYPOINT ["/bin/bash", "entrypoint.sh"]