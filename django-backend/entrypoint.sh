#!/bin/bash

set -e

cd /app

python3 manage.py collectstatic --noinput

python3 manage.py makemigrations

python3 manage.py migrate

uwsgi --uid 33 --gid 33 --socket :8000 --master --enable-threads --module mission.wsgi