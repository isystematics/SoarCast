from django import template
from django.db import connection

from notifications.models import Notification

register = template.Library()


@register.simple_tag(takes_context=True)
def get_notifications(context):
    if not hasattr(context, 'request') or not context['request'].user.is_authenticated:
        return [], False
    notifications = Notification.objects.order_by('read', '-date')
    read = notifications.filter(read=False).exists()
    return notifications[:5] if not read else notifications.filter(read=False), read
