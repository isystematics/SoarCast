from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from .views import (
    TOTPCreateView,
    TOTPVerifyView,
    ChangePasswordView,
RefreshTokenView
)

urlpatterns = [
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('mfa/add/', TOTPCreateView.as_view(), name='mfa-add'),
    path('mfa/verify/', TOTPVerifyView.as_view(), name='mfa-verify'),
    path('refresh-token/<int:user_id>/', RefreshTokenView.as_view(), name='refresh-token-admin'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.MEDIA_ROOT)
