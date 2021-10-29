from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models


class Notification(models.Model):
    NEW_FUNCTION, NEW_MINION, SALT_ERROR, NOT_COVERED_FILE_IN_CONDITION, NEW_MODULE = range(0, 5)
    TYPE_CHOICES = (
        (NEW_FUNCTION, "New Function in module"),
        (NEW_MINION, "New Minion"),
        (SALT_ERROR, "Salt Error"),
        (NOT_COVERED_FILE_IN_CONDITION, "Not Covered File in Condition"),
        (NEW_MODULE, "New module"),
    )
    notification_type = models.SmallIntegerField(choices=TYPE_CHOICES)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    date = models.DateTimeField(auto_now_add=True, editable=False)
    read = models.BooleanField(default=False)

    def __str__(self):
        return '{} - {}'.format(self.get_notification_type_display(), self.date)


def _default_notifications():
    return [x[0] for x in Notification.TYPE_CHOICES]


class EmailNotificationProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_notification_settings')
    email = models.EmailField()
    notification_types = ArrayField(
        models.SmallIntegerField(choices=Notification.TYPE_CHOICES),
        default=_default_notifications
    )
