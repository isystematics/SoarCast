from .settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'mission',
        'USER': 'postgres',
        'PASSWORD': '',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
DEBUG = True

VAULT_HOST = 'http://127.0.0.1:8200'
VAULT_ROOT_PATH = 'mission'
# VAULT_TOKEN = 's.xxxxxxxxxxxxx'
VAULT_TOKEN = ''
MODULES_PATH = '/Volumes/second/work/mission-control/modules/'
VAULT_VERIFY_CERTIFICATE = False
TOKEN_LIFE_TIME = 365
SIMPLE_JWT = {
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.SlidingToken',),
    'SLIDING_TOKEN_LIFETIME': timedelta(days=365),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}