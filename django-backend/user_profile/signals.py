from django.db.models.signals import post_save
from django.dispatch import receiver

from django.contrib.auth.models import User, Permission


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if not instance.is_superuser:
            for p in Permission.objects.filter(codename__in=['view_accessprofile', 'view_assigndummy']):
                instance.user_permissions.add(p)
                instance.is_staff = True
                instance.save()