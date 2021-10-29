import logging
from django.db import models

from app.utils import write_secret, read_secret

log = logging.getLogger(__name__)


class SaltMasterConfig(models.Model):
    name = models.CharField(max_length=255)
    api_url = models.URLField()
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

    @property
    def valid_credentials(self):
        from saltmaster.utils import call_salt
        data = [{
            "username": self.username,
            "password": self.password,
            "eauth": "pam"
        }]
        try:
            response = call_salt('{}/login'.format(self.api_url), data)
            return True if response.status_code < 400 else False
        except:
            return False

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        if self.valid_credentials:
            super().save(force_insert, force_update, using, update_fields)
        elif force_insert or force_update:
            super().save(force_insert, force_update, using, update_fields)
        else:
            return


class Minion(models.Model):
    ACCEPTED, DENIED, REJECTED, UNACCEPTED, DISCONNECTED = range(0, 5)

    STATUSES = (
        (ACCEPTED, 'Accepted'),
        (DENIED, 'Denied'),
        (REJECTED, 'Rejected'),
        (UNACCEPTED, 'Unaccepted'),
        (DISCONNECTED, 'Unaccepted - Disconnected'),
    )
    salt = models.ForeignKey(SaltMasterConfig, related_name='minions', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    status = models.SmallIntegerField(choices=STATUSES)
    last_ping = models.BooleanField(default=False)
    last_ping_date = models.DateTimeField(null=True)
    mission_control_minion = models.BooleanField(default=False)

    def __str__(self):
        return '{} / {} Last ping: {}'.format(self.salt.name, self.name, self.last_ping)


class ModulesRepo(models.Model):
    repo = models.CharField(max_length=255, unique=True,
                            help_text='repo example https://eugen_h@bitbucket.org/isys-apps/soarcast-salt-test.git')
    access_token = models.CharField(max_length=128, help_text='token or password '
                                                              'https://bitbucket.org/account/settings/app-passwords/')

    def save(self, **kwargs):
        if self.access_token and self.access_token != 'Has value':
            write_secret('public', self.repo, self.access_token)
            self.access_token = 'Has value'
        return super().save(**kwargs)

    def __str__(self):
        return self.repo

    @property
    def repo_url(self):
        return self.repo.replace('@', ':{}@'.format(read_secret('public', self.repo)))
