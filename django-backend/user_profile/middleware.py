from urllib.parse import urlparse, urlunparse

from django.contrib import messages
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.http import HttpResponseRedirect, QueryDict
from django.urls import resolve, reverse

from django.utils.deprecation import MiddlewareMixin as BaseMiddleware
from django.utils.translation import gettext_lazy as _
from django_otp import DEVICE_ID_SESSION_KEY
from django_otp.models import Device

from .utils import check_password_expired


class ExpiredPasswordMiddleware(BaseMiddleware):

    def process_request(self, request):
        if request.user.is_authenticated and not request.user.is_superuser:
            next_url = resolve(request.path).url_name
            # Authenticated users must be allowed to access
            # "change password" page and "log out" page.
            # even if password is expired.
            if next_url not in ['/logout/', 'change-password', 'jsi18n' 'favicon.ico']:
                if check_password_expired(request.user):
                    redirect_field_name = REDIRECT_FIELD_NAME
                    change_password_url = reverse('change-password')
                    url_bits = list(urlparse(change_password_url))
                    querystring = QueryDict(url_bits[4], mutable=True)
                    querystring[redirect_field_name] = next_url
                    url_bits[4] = querystring.urlencode(safe="/")

                    return HttpResponseRedirect(urlunparse(url_bits))


class MFAdMiddleware(BaseMiddleware):

    def process_request(self, request):
        user = request.user
        if user.is_authenticated and user.totpdevice_set.filter(confirmed=True).exists():
            persistent_id = request.session.get(DEVICE_ID_SESSION_KEY)
            device = self._device_from_persistent_id(persistent_id) if persistent_id else None
            if not device or device.user_id != user.pk:
                next_url = resolve(request.path).url_name
                if next_url not in ['/logout/', 'mfa-verify', 'jsi18n' 'favicon.ico', 'logout']:
                    if DEVICE_ID_SESSION_KEY in request.session:
                        del request.session[DEVICE_ID_SESSION_KEY]
                    redirect_field_name = REDIRECT_FIELD_NAME
                    change_password_url = reverse('mfa-verify')
                    url_bits = list(urlparse(change_password_url))
                    querystring = QueryDict(url_bits[4], mutable=True)
                    querystring[redirect_field_name] = next_url
                    url_bits[4] = querystring.urlencode(safe="/")

                    return HttpResponseRedirect(urlunparse(url_bits))
        # elif device and not user.is_authenticated:
        #     del request.session[DEVICE_ID_SESSION_KEY]

    def _device_from_persistent_id(self, persistent_id):
        # Convert legacy persistent_id values (these used to be full import
        # paths). This won't work for apps with models in sub-modules, but that
        # should be pretty rare. And the worst that happens is the user has to
        # log in again.
        if persistent_id.count('.') > 1:
            parts = persistent_id.split('.')
            persistent_id = '.'.join((parts[-3], parts[-1]))

        device = Device.from_persistent_id(persistent_id)

        return device