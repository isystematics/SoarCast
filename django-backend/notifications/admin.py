from django.contrib import admin
from django.utils.html import linebreaks
from django.utils.safestring import mark_safe

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('get_notification_type_display', 'date')
    list_filter = ('notification_type',)
    readonly_fields = ('subject', 'notification_type', 'date', 'message_html', 'read')
    exclude = ('message',)

    def message_html(self, obj):
        return mark_safe(linebreaks(obj.message))
