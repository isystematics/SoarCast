FROM phusion/baseimage:master-amd64

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

USER root
RUN mkdir /app
WORKDIR /app
COPY ./ /app/

RUN apt update -y \
    && apt upgrade -y \
    && apt install make libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl build-essential \
       python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 \
       libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info -y \
    && pip3 install -r /app/requirements.txt \
    && chmod 755 /app/entrypoint.sh

USER $USER

RUN mkdir -p /vol/web/media
RUN mkdir -p /vol/web/static
RUN chmod -R 755 /vol/web
RUN mkdir www-data:www-data /app/media/
RUN chown www-data:www-data /app/media/

ENTRYPOINT ["/bin/bash", "entrypoint.sh"]