import base64
import redis
import logging

from django.core.mail import get_connection, EmailMultiAlternatives
from django.utils.html import linebreaks

from .authentication import create_hashed_token
from django.conf import settings
from django.contrib import admin, messages
from django_celery_beat.models import PeriodicTask, CrontabSchedule
import hvac

log = logging.getLogger(__name__)

vault_kwargs = {
    'url': settings.VAULT_HOST,
    'verify': settings.VAULT_VERIFY_CERTIFICATE
}
if hasattr(settings, 'VAULT_TOKEN'):
    vault_kwargs['token'] = settings.VAULT_TOKEN
hvac_client = hvac.Client(**vault_kwargs)


def write_secret(path: str, key: str, value: str):
    path = '{}/{}'.format(settings.VAULT_ROOT_PATH, path)
    exist_secrets = read_secrets(path)
    exist_secrets[key] = value
    hvac_client.write(path=path, **exist_secrets)


def write_secrets(path: str, data: dict):
    hvac_client.write(path='{}/{}'.format(settings.VAULT_ROOT_PATH, path), **data)


def read_secrets(path):
    if settings.VAULT_ROOT_PATH not in path:
        path = '{}/{}'.format(settings.VAULT_ROOT_PATH, path)
    secrets = hvac_client.read(path)
    return secrets.get('data', {}) if secrets else {}


def read_secret(path, key):
    secrets = hvac_client.read(path='{}/{}'.format(settings.VAULT_ROOT_PATH, path))
    return secrets.get('data', {}).get(key)


def generate_key(request, app, user):
    api_token = create_hashed_token(app=app, user=user)
    if request:
        messages.success(request, 'API key: {}'.format(api_token.decode()))
    return api_token


def parse_line(line, names=None):
    if not names:
        names = []
    add_index = 0
    pillar_index = line.find('pillar')
    start_index = pillar_index+6

    #if this __pillar__
    if line[start_index] == "_":
        start_index += 2
        add_index = 2
    #if __pillar__[ or pillar[
    if line[start_index] == "[":
        start_index = start_index+2
        end_index = line[start_index:].find("]") - 1 + start_index
    # if __pillar__.get( or pillar.get(
    else:
        start_index = start_index + 6
        end_index = line[start_index:].find(")") - 1 + start_index

    names.append(line[start_index:end_index])
    line = line[end_index+add_index:]
    if 'pillar' in line:
        parse_line(line, names)

    result = []
    for name in names:
        if ',' in name:
            name = name[:name.index(',')-1]
        result.append(name)
    return result


def parse_module_file(function, file_obj):
    lines = file_obj.readlines()
    from app.models import ExpectedVariable
    for line in lines:
        line = line.decode()
        if 'pillar' in line:
            names = parse_line(line)
            for name in names:
                if name != '':
                    ExpectedVariable.objects.get_or_create(function=function, name=name)


def create_or_update_periodic_task(runner, task_name, task_args):
    minute, hour, day_of_week, day_of_month, month_of_year = runner.schedule.split(' ')
    if hasattr(runner, 'celery_periodic_runner') and runner.celery_periodic_runner:
        interval = runner.celery_periodic_runner.crontab
        task = runner.celery_periodic_runner
    else:
        task = PeriodicTask()
        interval = CrontabSchedule()
    interval.minute = minute
    interval.hour = hour
    interval.day_of_week = day_of_week
    interval.day_of_month = day_of_month
    interval.month_of_year = month_of_year
    interval.save()

    task.name = 'Execute {} {} {}'.format(runner._meta.model_name, runner.name, runner.id)
    task.crontab = interval
    task.task = task_name
    task.args = task_args
    task.save()
    runner.celery_periodic_runner = task


def get_redis_connection(connection_data=None):
    if not connection_data:
        from app.models import RedisSetting
        redis_data = RedisSetting.objects.first()
        if not redis_data:
            return None

        connection_data = {
            'host': redis_data.host,
            'port': redis_data.port,
            'password': read_secret('public', 'redis-password') if redis_data.password else ''
        }
        if redis_data.ssl_connection:
            connection_data['connection_class'] = redis.SSLConnection
            connection_data['ssl_cert_reqs'] = u'required' if redis_data.verify_certificate else u'none'

    redis_pool = redis.ConnectionPool(**connection_data)
    return redis.Redis(connection_pool=redis_pool)
