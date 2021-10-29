from django.urls import path

from .views import (
    SaltMasterViewSet,
    SyncModulesView,
    UpdateMinionsView,
    MinionView,
    UpdateKEYView,
    KeValueView,
    ModulesRepoViewSet,
    CeleryDetailView
)

saltmasters = SaltMasterViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
saltmaster_detail = SaltMasterViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
repos = ModulesRepoViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
repos_detail = ModulesRepoViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
minions = MinionView.as_view({
    'get': 'list',
})
minion_update = MinionView.as_view({
    'patch': 'partial_update',
})

urlpatterns = [
    path('list/', saltmasters, name='api-salt-masters-list'),
    path('minions/', minions, name='api-minions-list'),
    path('minions/keys/', UpdateKEYView.as_view(), name='api-minions-key-actions'),
    path('minion/<int:pk>/', minion_update, name='api-minions-update'),
    path('redis/<path:key>/', KeValueView.as_view(), name='api-redis-key'),
    path('<int:pk>/', saltmaster_detail, name='api-salt-master-detail'),
    path('repo/', repos, name='api-repo-list'),
    path('repo/<int:pk>/', repos_detail, name='api-repo-detail'),
    path('task-detail/<uuid:task_id>/', CeleryDetailView.as_view(), name='api-task-details'),
    path('repo/sync-modules/', SyncModulesView.as_view(), name='api-repo-sync-module'),
    path('repo/sync-modules/<int:pk>/', SyncModulesView.as_view(), name='api-repo-sync-modules'),
    path('<int:pk>/update-minions/', UpdateMinionsView.as_view(), name='api-salt-master-update-minions'),
]
