from django.apps import AppConfig


class CustomAppConfig(AppConfig):
    name = 'app'

    def ready(self):
        from . import signals
