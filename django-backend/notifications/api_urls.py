from django.urls import path

from .views import (
    NotificationView,
    UpdateNotificationReadView
)


urlpatterns = [
    path('list/', NotificationView.as_view(), name='api-notifications-list'),
    path('mark-as-read/', UpdateNotificationReadView.as_view(), name='api-notifications-mark-as-read'),
]
