import json
from base64 import b32encode
from collections import OrderedDict
from urllib.parse import quote, urlencode


from django.contrib import auth, messages
from django.contrib.auth.hashers import make_password
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from django_otp import devices_for_user, DEVICE_ID_SESSION_KEY
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import SlidingToken

from .forms import ChangePasswordForm, MFAVerifyForm, MFAVerifyShortForm
from .models import PasswordHistory


def get_user_totp_device(user, confirmed=None):
    devices = devices_for_user(user, confirmed=confirmed)
    for device in devices:
        if isinstance(device, TOTPDevice):
            return device


class TOTPCreateView(LoginRequiredMixin, TemplateView):
    template_name = 'mfa/add.html'
    """
    Use this endpoint to set up a new TOTP device
    """

    def config_url(self, device):
        """
        A URL for configuring Google Authenticator or similar.

        See https://github.com/google/google-authenticator/wiki/Key-Uri-Format.
        The issuer is taken from :setting:`OTP_TOTP_ISSUER`, if available.

        """

        label = device.user.get_username()
        params = OrderedDict()

        params['secret'] = b32encode(device.bin_key)
        params['algorithm'] = 'SHA1'
        params['digits'] = device.digits
        params['period'] = device.step

        urlencoded_params = urlencode(params)
        issuer = 'MissionControl'
        issuer = issuer.replace(':', '')
        label = '{}:{}'.format(issuer, label)
        urlencoded_params += '&issuer={}'.format(quote(issuer))  # encode issuer as per RFC 3986, not quote_plus

        url = 'otpauth://totp/{}?{}'.format(quote(label), urlencoded_params)

        return url

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        device = get_user_totp_device(user)
        if not device:
            device = user.totpdevice_set.create(confirmed=False)
        context['config_url'] = self.config_url(device)
        return context


class TOTPVerifyView(LoginRequiredMixin, FormView):
    """
    Use this endpoint to verify/enable a TOTP device
    """
    template_name = 'mfa/verify.html'

    def get_form(self, form_class=None):
        """Return an instance of the form to be used in this view."""
        device = get_user_totp_device(self.request.user)
        if device.confirmed:
            form_class = MFAVerifyShortForm
        else:
            form_class = MFAVerifyForm
        return form_class(instance=device, **self.get_form_kwargs())

    def form_valid(self, form):
        instance = form.instance
        if not instance.confirmed:
            instance.confirmed = True
            instance.name = form.cleaned_data.get('name')
            instance.save()
            messages.add_message(
                self.request,
                messages.SUCCESS,
                "Device {} was added successfully".format(instance.name)
            )
        self.request.session[DEVICE_ID_SESSION_KEY] = instance.persistent_id
        return super().form_valid(form)

    def get_success_url(self):
        return self.request.GET.get('next', '/')


class ChangePasswordView(LoginRequiredMixin, FormView):
    template_name = "admin/password_change.html"
    form_class = ChangePasswordForm
    redirect_field_name = "next"
    messages = {
        "password_changed": {
            "level": messages.SUCCESS,
            "text": _("Password successfully changed.")
        }
    }
    form_password_field = "password_new"
    fallback_url_setting = "ACCOUNT_PASSWORD_CHANGE_REDIRECT_URL"

    def get(self, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return redirect("account_password_reset")
        return super(ChangePasswordView, self).get(*args, **kwargs)

    def post(self, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return HttpResponseForbidden()
        return super(ChangePasswordView, self).post(*args, **kwargs)

    def form_valid(self, form):
        self.change_password(form)
        self.create_password_history(form, self.request.user)
        self.after_change_password()
        return redirect(self.get_success_url())

    def create_password_history(self, form, user):
        password = form.cleaned_data[self.form_password_field]
        PasswordHistory.objects.create(
            user=user,
            password=make_password(password)
        )

    def get_user(self):
        return self.request.user

    def get_form_kwargs(self):
        """
        Returns the keyword arguments for instantiating the form.
        """
        kwargs = {"user": self.request.user, "initial": self.get_initial()}
        if self.request.method in ["POST", "PUT"]:
            kwargs.update({
                "data": self.request.POST,
                "files": self.request.FILES,
            })
        return kwargs

    def change_password(self, form):
        user = self.get_user()
        user.set_password(form.cleaned_data[self.form_password_field])
        user.save()
        auth.update_session_auth_hash(self.request, user)

    def after_change_password(self):
        if self.messages.get("password_changed"):
            messages.add_message(
                self.request,
                self.messages["password_changed"]["level"],
                self.messages["password_changed"]["text"]
            )

    def get_success_url(self, fallback_url=None, **kwargs):
        next_url = self.request.GET.get('next', '/')
        return next_url


class RefreshTokenView(LoginRequiredMixin, TemplateView):
    def get(self, request, user_id, *args, **kwargs):
        user = User.objects.get(id=user_id)
        for token in OutstandingToken.objects.filter(blacklistedtoken__isnull=True, user=user):
            BlacklistedToken.objects.get_or_create(token=token)
        SlidingToken.for_user(user)
        # messages.add_message(
        #     request,
        #     messages.SUCCESS,
        #     "Your access Token: {}".format(str(refresh.access_token))
        # )
        return redirect(request.META.get('HTTP_REFERER', '/'))