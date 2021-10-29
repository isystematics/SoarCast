from django.urls import path
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenObtainSlidingView,
    TokenRefreshSlidingView,
)
from drf_yasg2 import openapi
from drf_yasg2.views import get_schema_view
from rest_framework import permissions
from .views import *

schema_view = get_schema_view(
   openapi.Info(
      title="Mission API",
      default_version='v1',
      description="API for Mission Control project",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email=""),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.IsAuthenticated,),

)

app_list = AppViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
app_detail = AppViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
variable_set_list = VariableSetViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
variable_set_detail = VariableSetViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
variable_list = VariableViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
variable_detail = VariableViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
conditions_list = ConditionViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
condition_detail = ConditionViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
condition_variables_list = ConditionVariableViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
condition_variable_detail = ConditionVariableViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
playbook_list = PlaybookViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
playbook_detail = PlaybookViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
playbook_item_list = PlaybookItemViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
playbook_item_detail = PlaybookItemViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
runner_list = RunnerViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
runner_detail = RunnerViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
mapping_list = MappingViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
mapping_detail = MappingViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
map_item_list = MapItemViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
map_item_detail = MapItemViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
playbook_mapping_list = PlaybookMappingViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
playbook_mapping_detail = PlaybookMappingViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
run_status_list = RunStatusViewSet.as_view({
    'get': 'list',
})
run_status_detail = RunStatusViewSet.as_view({
    'get': 'retrieve',
    'delete': 'destroy'
})
executions_list = ExecutionViewSet.as_view({
    'get': 'list',
})
execution_detail = ExecutionViewSet.as_view({
    'get': 'retrieve',
    'delete': 'destroy'
})
email_setting_list = EmailSettingView.as_view({
    'get': 'list',
    'post': 'create'
})
email_setting_detail = EmailSettingView.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
redis_setting_list = RedisSettingView.as_view({
    'get': 'list',
    'post': 'create'
})
redis_setting_detail = RedisSettingView.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
group_list = GroupViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
group_detail = GroupViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
app_user_list = AppUserViewSet.as_view({
    'get': 'list',
    'post': 'create'
})
app_user_detail = AppUserViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
user_list = UserView.as_view({
    'get': 'list',
    'post': 'create'
})
user_detail = UserView.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy'
})
secret_request_list = SecretsRequestView.as_view({
    'get': 'list',
    'post': 'create'
})
secret_request_detail = SecretsRequestView.as_view({
    'get': 'retrieve',
    'put': 'update',
})
audit_log = AuditEntryView.as_view({
    'get': 'list',
})

urlpatterns = [
    path('token/create/', TokenObtainSlidingView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshSlidingView.as_view(), name='token_refresh'),
    # path('token/create/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('swagger/', login_required(schema_view.with_ui('swagger', cache_timeout=0)), name='schema-swagger-ui'),
    path('redoc/', login_required(schema_view.with_ui('redoc', cache_timeout=0)), name='schema-redoc'),
    path('modules/', ModuleListView.as_view(), name='api-module-list'),
    path('expected-variables/', ExpectedVariablelView.as_view(), name='api-expected-variables'),
    path('apps/', app_list, name='api-app-list'),
    path('app/<int:pk>/', app_detail, name='api-app-detail'),
    path('app-groups/', group_list, name='api-group-list'),
    path('app-group/<int:pk>/', group_detail, name='api-group-detail'),
    path('app-users/', app_user_list, name='api-app-users-list'),
    path('app-user/<int:pk>/', app_user_detail, name='api-app-users-detail'),
    path('users/', user_list, name='api-users-list'),
    path('user/<int:pk>/', user_detail, name='api-users-detail'),
    path('app-user/<int:pk>/refresh-token/', AppUserRefreshToken.as_view(), name='api-app-users-refresh-token'),
    path('audit-entries/', audit_log, name='api-audit-entries-list'),
    path('audit-entry/<int:pk>/', audit_log, name='api-audit-entries-list'),
    path('redis-settings/', redis_setting_list, name='api-redis-setting-list'),
    path('redis-setting/<int:pk>/', redis_setting_detail, name='api-redis-setting-detail'),
    path('email-settings/', email_setting_list, name='api-email-setting-list'),
    path('email-setting/<int:pk>/', email_setting_detail, name='api-email-setting-detail'),
    path('playbook-items/', playbook_item_list, name='api-playbook-items-list'),
    path('playbook-item/<int:pk>/', playbook_item_detail, name='api-playbook-item-detail'),
    path('playbooks/', playbook_list, name='api-playbook-list'),
    path('runners/', runner_list, name='api-runner-list'),
    path('runner/execute/<int:pk>/', ExecuteRunnerView.as_view(), name='api-runner-execute'),
    path('runner/<int:pk>/', runner_detail, name='api-runner-detail'),
    path('executions/', executions_list, name='api-executions-list'),
    path('execution/<int:pk>/', execution_detail, name='api-execution-detail'),
    path('run-statuses/', run_status_list, name='api-run-status-list'),
    path('run-status/<int:pk>/', run_status_detail, name='api-run-status-detail'),
    path('mappings/', mapping_list, name='api-mapping-list'),
    path('mapping/<int:pk>/', mapping_detail, name='api-mapping-detail'),
    path('map-items/', map_item_list, name='api-map-item-list'),
    path('map-item/<int:pk>/', map_item_detail, name='api-map-item-detail'),
    path('playbook-mappings/', playbook_mapping_list, name='api-playbook-mapping-list'),
    path('playbook-mapping/<int:pk>/', playbook_mapping_detail, name='api-playbook-mapping-detail'),
    path('playbook/execute/<int:pk>/', ExecutePlaybookView.as_view(), name='api-playbook-execute'),
    path('playbook/<int:pk>/', playbook_detail, name='api-playbook-detail'),
    path('variable-sets/', variable_set_list, name='api-variable-set-list'),
    path('variable-set/<int:pk>/', variable_set_detail, name='api-variable-set-detail'),
    path('variables/', variable_list, name='api-variable-list'),
    path('variable/<int:pk>/', variable_detail, name='api-variable-detail'),
    path('condition-variables/', condition_variables_list, name='api-condition-variables-list'),
    path('condition-variable/<int:pk>/', condition_variable_detail, name='api-condition-variable-detail'),
    path('conditions/', conditions_list, name='api-conditions-list'),
    path('condition/<int:condition_pk>/variables/', condition_variables_list, name='api-condition-variables-detail'),
    path('condition/<int:pk>/', condition_detail, name='api-condition-detail'),
    path('function/<int:pk>/', FunctionDetailView.as_view(), name='api-function-detail'),
    path('request-secrets/', secret_request_list, name='api-request-secrets-list'),
    path('request-secrets/<str:pk>/', secret_request_detail, name='api-request-secret-detail'),
    # do not add urls after this comment
    path('<str:app_prefix>/<str:api_alias>/', ExecuteRunnerAPIView.as_view(), name='api-execute'),
    path('<str:app_prefix>/', AppUserAPIView.as_view(), name='api-app-create-user'),
]
