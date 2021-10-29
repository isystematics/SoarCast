"""mission URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import django.contrib.auth.views as auth_views
from django.contrib import admin
from django.contrib.admin.sites import NotRegistered
from django.urls import path, include
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_celery_beat.models import PeriodicTask, IntervalSchedule, CrontabSchedule, SolarSchedule, ClockedSchedule
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

admin.site.site_header = 'MissionControl'
admin.site.site_title = 'MissionControl'
admin.site.index_title = 'Welcome to MissionControl'

# Remove django_celery_beat from admin interface
try:
    # admin.site.unregister(PeriodicTask)
    admin.site.unregister(IntervalSchedule)
    # admin.site.unregister(CrontabSchedule)
    admin.site.unregister(SolarSchedule)
    admin.site.unregister(TOTPDevice)
    admin.site.unregister(ClockedSchedule)
    admin.site.unregister(OutstandingToken)
    admin.site.unregister(BlacklistedToken)
except NotRegistered:
    pass

urlpatterns = [
    path('jet/', include('jet.urls', 'jet')),
    path('admin/password_reset/', auth_views.PasswordResetView.as_view(), name='admin_password_reset', ),
    path('', admin.site.urls),
    path('user/', include('user_profile.urls')),
    path('api/v1/notification/', include('notifications.api_urls')),
    path('api/v1/saltmaster/', include('saltmaster.api_urls')),
    path('api/v1/', include('app.api_urls')),
    path('app/', include('app.urls')),
    path('saltmaster/', include('saltmaster.urls')),
    path('notifications/', include('notifications.urls')),
]
