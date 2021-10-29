from rest_framework import serializers

from .models import *


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display')

    class Meta:
        model = Notification
        fields = '__all__'


