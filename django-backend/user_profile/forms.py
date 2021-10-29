
from django import forms
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import MinimumLengthValidator
from django.utils.translation import gettext_lazy as _
from django_otp.plugins.otp_totp.models import TOTPDevice

from notifications.models import EmailNotificationProfile, Notification
from user_profile.models import PasswordHistory


class MFAVerifyShortForm(forms.ModelForm):
    token = forms.CharField(max_length=6, required=True)

    def clean_token(self):
        token = self.cleaned_data.get("token")
        if not self.instance.verify_token(token):
            raise forms.ValidationError(_("Token not valid."))
        return token

    class Meta:
        model = TOTPDevice
        fields = ()


class MFAVerifyForm(forms.ModelForm):
    token = forms.CharField(max_length=6, required=True)

    def clean_token(self):
        token = self.cleaned_data.get("token")
        if not self.instance.verify_token(token):
            raise forms.ValidationError(_("Token not valid."))
        return token

    class Meta:
        model = TOTPDevice
        fields = ('name', )


class ChangePasswordForm(forms.Form):

    password_new = forms.CharField(
        label=_("New Password"),
        widget=forms.PasswordInput(render_value=False),
        validators=[MinimumLengthValidator]
    )
    password_new_confirm = forms.CharField(
        label=_("New Password (again)"),
        widget=forms.PasswordInput(render_value=False),
        validators=[MinimumLengthValidator]
    )

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop("user")
        super(ChangePasswordForm, self).__init__(*args, **kwargs)

    def clean_password_new_confirm(self):
        if "password_new" in self.cleaned_data and "password_new_confirm" in self.cleaned_data:
            if self.cleaned_data["password_new"] != self.cleaned_data["password_new_confirm"]:
                raise forms.ValidationError(_("You must type the same password each time."))
            password = self.cleaned_data["password_new"]
            rules = [lambda s: any(x.isupper() for x in s),  # must have at least one uppercase
                     lambda s: any(x.islower() for x in s),  # must have at least one lowercase
                     lambda s: any(x.isdigit() for x in s),  # must have at least one digit
                     lambda s: any(not x.isalnum() for x in s),  # must have at least one special
                     lambda s: len(s) >= 8  # must be at least 7 characters
                     ]

            if not all(rule(password) for rule in rules):
                raise forms.ValidationError(
                    _("Password should contain 1 upper capital letter, one number and one special symbol.")
                )
            if any([check_password(password, x) for x in PasswordHistory.objects.filter(user=self.user).values_list('password', flat=True)]):
                raise forms.ValidationError(
                    _("Password was already used please try another one")
                )
        return self.cleaned_data["password_new_confirm"]


class EmailNotificationProfileForm(forms.ModelForm):
    notification_types = forms.MultipleChoiceField(choices=Notification.TYPE_CHOICES)

    class Meta:
        model = EmailNotificationProfile
        fields = '__all__'

    def clean_notification_types(self):
        return [int(x) for x in self.cleaned_data['notification_types']]
