from django.urls import path
from .views import (
    RefreshToken,
    test,
    RequestSecretsView,
    SubmitSecretsView,
    ThankYouView,
    CovertVariableToSet
)

urlpatterns = [
    path('refresh/app/<int:app_id>/', RefreshToken.as_view(), name='refresh-app-token'),
    path('refresh/user/<int:user_id>/', RefreshToken.as_view(), name='refresh-user-token'),
    path('convert/<int:function>/', CovertVariableToSet.as_view(), name='convert-function-to-set'),
    path('check-email/', test, name='check-email'),
    path('request-secrets/<int:set_id>/', RequestSecretsView.as_view(), name='request-secrets'),
    path('submit-secrets/<str:set_id>/', SubmitSecretsView.as_view(), name='submit-secrets'),
    path('thanks', ThankYouView.as_view(), name='thank-you'),
]
