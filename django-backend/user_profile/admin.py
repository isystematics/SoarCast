from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils.safestring import mark_safe
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from notifications.models import EmailNotificationProfile
from user_profile.forms import EmailNotificationProfileForm


class TOTPDeviceInline(admin.StackedInline):
    model = TOTPDevice
    fields = ('name', 'add')
    readonly_fields = ('name', 'add')
    verbose_name = "MFA Device"
    verbose_name_plural = "MFA Devices"

    def add(self, obj):
        if obj.id:
            return ''
        else:
            url = reverse('mfa-add')
            return mark_safe('<a href="{}">Add device</a>'.format(url))

    def device(self, obj):
        if not obj:
            return False
        if not hasattr(self, 'device_exists') and obj:
            self.device_exists = obj.totpdevice_set.exists()
        return self.device_exists

    def get_extra(self, request, obj=None, **kwargs):
        if self.device(obj):
            return 0
        return 1

    def get_readonly_fields(self, request, obj=None):
        if self.device(obj):
            return ('name', 'confirmed',)
        else:
            return self.readonly_fields

    def get_fields(self, request, obj=None):
        if self.device(obj):
            return ('name', 'confirmed',)
        else:
            return self.fields

    def has_add_permission(self, request, obj=None):
        if self.device(obj):
            return False
        return True


class TokenInline(admin.TabularInline):
    model = OutstandingToken
    fields = ('token', 'created_at', 'expires_at', 'revoke')
    readonly_fields = ('token', 'revoke', 'created_at', 'expires_at' )
    ordering = ('-created_at', )
    extra = 1

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request, obj=None):
        if OutstandingToken.objects.filter(user=obj).exists():
            return False

        return True

    def has_delete_permission(self, request, obj=None):
        return False

    def revoke(self, obj):
        if not obj.id:
            url = reverse('refresh-token-admin', args=(obj.user.id, ))
            return mark_safe('<a href="{}">Create token</a>'.format(url))
        try:
            obj.blacklistedtoken
            return 'REVOKED'
        except BlacklistedToken.DoesNotExist:
            url = reverse('refresh-token-admin', args=(obj.user.id, ))
            return mark_safe('<a href="{}">Revoke token</a>'.format(url))


class EmailNotificationProfileInline(admin.StackedInline):
    fields = ('email', 'notification_types',)
    form = EmailNotificationProfileForm
    model = EmailNotificationProfile


class CustomUserAdmin(UserAdmin):
    inlines = (TOTPDeviceInline, TokenInline, EmailNotificationProfileInline)

    def get_queryset(self, request):
        """Only allow users to edit their own user profile"""
        if not request.user.is_superuser:
            return User.objects.filter(username=request.user.username)
        return super().get_queryset(request)

    def get_fieldsets(self, request, obj=None):
        """Don't allow non superusers to edit permissions"""
        if not obj:
            return self.add_fieldsets
        fs = super().get_fieldsets(request, obj)
        if request.user.is_superuser:
            return fs
        else:
            return tuple(i for i in fs if i[0] != 'Permissions')


# Register new CustomUserAdmin to use the ProfileInline created above
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


class BaseAdminPerm(admin.ModelAdmin):
    def has_module_permission(self, request):
        if request.user.is_superuser:
            return True
        return False
