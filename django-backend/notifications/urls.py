from django.urls import path

from .views import (
    UpdateNotificationsView
)


urlpatterns = [
    path('update-notifications/', UpdateNotificationsView.as_view(), name='update-notifications'),
]
