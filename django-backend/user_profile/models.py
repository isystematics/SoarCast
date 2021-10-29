from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class PasswordHistory(models.Model):
    """
    Contains single password history for user.
    """
    class Meta:
        verbose_name = _("password history")
        verbose_name_plural = _("password histories")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="password_history", on_delete=models.CASCADE)
    password = models.CharField(max_length=255)  # encrypted password
    timestamp = models.DateTimeField(default=timezone.now)  # password creation time


class LoginAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="login_attempts", on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
