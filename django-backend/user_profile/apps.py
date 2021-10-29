from django.apps import AppConfig


class UserProfileConfig(AppConfig):
    name = 'user_profile'
    verbose_name = 'Profiles'
    verbose_name_plural = 'Profiles'

    def ready(self):
        from . import signals