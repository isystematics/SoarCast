from django.urls import path
from .views import (
    ManageKeyView,
    KeyValue
)

urlpatterns = [
    path('manage-key/<int:minion_id>/<str:operation>/', ManageKeyView.as_view(), name='manage-key'),
    path('redis-key-value/<path:key>/', KeyValue.as_view(), name='redis-key-value'),
]
