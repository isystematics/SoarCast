from __future__ import absolute_import

import os

from celery import Celery
from celery.schedules import crontab

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mission.settings')
app = Celery('mission')

# Using a string here means the worker will not have to
# pickle the object when using Windows.
app.config_from_object('django.conf:settings',)
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'update-minions': {
        'task': 'saltmaster.tasks.update_salt_masters_minions',
        'schedule': crontab(minute=0, hour='*/6', day_of_week='*'),
        'args': (),
    },
    'update-modules': {
        'task': 'saltmaster.tasks.sync_git_modules',
        'schedule': crontab(minute=0, hour='*/1', day_of_week='*'),
        'args': (),
    },
    'check-timeout': {
        'task': 'saltmaster.tasks.find_and_close_time_outed_runners',
        'schedule': crontab(minute='*', hour='*', day_of_week='*'),
        'args': (),
    },
}
