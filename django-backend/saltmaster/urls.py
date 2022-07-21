from django.urls import path
from .views import (
    ManageKeyView,
    SyncModuleView,
    KeyValue
)

urlpatterns = [
    path('manage-key/<int:minion_id>/<str:operation>/', ManageKeyView.as_view(), name='manage-key'),
    path('redis-key-value/<path:key>/', KeyValue.as_view(), name='redis-key-value'),
    path('sync-module/<int:salt_id>/<int:minion_id>/', SyncModuleView.as_view(), name='sync-module'),
]
