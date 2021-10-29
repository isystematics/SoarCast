import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import Notification, EmailNotificationProfile
from notifications.utils import send_notification_email

log = logging.getLogger(__name__)


@receiver(post_save, sender=Notification)
def create_profiles(created, instance, **kwargs):
    emails = EmailNotificationProfile.objects.filter(
        notification_types__contains=[instance.notification_type]
    ).values_list('email', flat=True)
    send_notification_email(instance, emails)
