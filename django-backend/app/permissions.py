from rest_framework import permissions
from .models import App, AppUser


class AppTokenPermission(permissions.BasePermission):
    message = 'This API should be used only with app Token'

    def has_permission(self, request, view):
        return isinstance(request.user, App)


class UserTokenPermission(permissions.BasePermission):
    message = 'This API should be used only with user Token'

    def has_permission(self, request, view):
        return isinstance(request.user, AppUser)
