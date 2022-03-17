import json
import redis
import re
from json import JSONDecodeError

from croniter import croniter, CroniterBadCronError
from django import forms
from django.core.exceptions import ValidationError
from django.forms.utils import ErrorList

from .models import *
from .utils import get_redis_connection, read_secret


class MapItemForm(forms.ModelForm):
    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        if self.instance and self.instance.id:
            self.fields['variable'] = forms.ModelChoiceField(
                queryset=Variable.objects.filter(variable_set_id=self.instance.mapping.variable_set_id),
                required=False
            )

    class Meta:
        fields = '__all__'
        model = MapItem


class MapForm(forms.ModelForm):
    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        self.fields['function'] = forms.ModelChoiceField(
            queryset=Function.objects.filter(private_function=False),
            required=True
        )

    class Meta:
        fields = '__all__'
        model = Map


class PlaybookForm(forms.ModelForm):
    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        self.fields['functions'] = forms.ModelMultipleChoiceField(
            queryset=Function.objects.filter(private_function=False),
            required=True
        )

    class Meta:
        fields = '__all__'
        model = Playbook


class GroupForm(forms.ModelForm):

    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        if self.instance:
            self.fields['users'] = forms.ModelMultipleChoiceField(
                queryset=AppUser.objects.filter(app=self.instance.app),
                required=False
            )

    class Meta:
        fields = '__all__'
        model = Group


class PlaybookMappingForm(forms.ModelForm):

    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        if self.instance.id:
            self.fields['variable'] = forms.ModelChoiceField(
                queryset=Variable.objects.filter(variable_set__in=self.instance.playbook.variable_sets.all()),
                required=False
            )

    class Meta:
        fields = '__all__'
        model = PlaybookMapping


class ConditionVariableForm(forms.ModelForm):

    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None, use_required_attribute=None,
                 renderer=None):
        super().__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                         initial=initial, error_class=error_class, label_suffix=label_suffix,
                         empty_permitted=empty_permitted, instance=instance,
                         use_required_attribute=use_required_attribute, renderer=renderer)
        if hasattr(self, 'playbook'):
            self.fields['variable'] = forms.ModelChoiceField(
                queryset=Variable.objects.filter(variable_set__in=self.playbook.variable_sets.all()),
                required=False
            )
            self.fields['function_variable'] = forms.ModelChoiceField(
                    queryset=ExpectedVariable.objects.filter(function__in=self.playbook.functions.all()),
                    required=False
                )

    class Meta:
        fields = '__all__'
        model = ConditionVariable


class ConditionForm(forms.ModelForm):
    condition = forms.CharField(max_length=254, required=True)

    def clean_condition(self):
        value = self.cleaned_data.get('condition')
        try:
            re.compile(value)
            return value
        except:
            ValidationError('Please enter valid regexp condition')

    class Meta:
        fields = '__all__'
        model = Condition


class FunctionForm(forms.ModelForm):
    import_module = forms.FileField(required=False)

    class Meta:
        fields = '__all__'
        model = Function


class RunnerForm(forms.ModelForm):
    schedule = forms.CharField(max_length=64, required=False)

    class Meta:
        fields = '__all__'
        model = Runner

    def clean_schedule(self):
        schedule = self.cleaned_data.get('schedule')
        if schedule:
            try:
                croniter(schedule)
                return re.sub(' +', ' ', schedule)
            except CroniterBadCronError:
                raise ValidationError("Please enter valid crontab value")
        else:
            return ''


class PlaybookItemForm(forms.ModelForm):
    schedule = forms.CharField(max_length=64, required=False)

    class Meta:
        fields = '__all__'
        model = PlaybookItem

    def clean_schedule(self):
        schedule = self.cleaned_data.get('schedule')
        if schedule:
            try:
                croniter(schedule)
                return re.sub(' +', ' ', schedule)
            except CroniterBadCronError:
                raise ValidationError("Please enter valid crontab value")
        else:
            return ''


class VariableForm(forms.ModelForm):
    value = forms.CharField(widget=forms.Textarea, required=False)

    class Meta:
        fields = '__all__'
        model = Variable

    def clean(self):
        value = self.cleaned_data.get('value')
        if value and self.cleaned_data.get('variable_type', 1) == Variable.INT:
            try:
                int(value)
            except ValueError:
                self._errors["value"] = self.error_class(['int variable accept only number values'])
        elif value and self.cleaned_data.get('variable_type', 1) == Variable.JSON:
            try:
                json.loads(value)
            except JSONDecodeError as e:
                self._errors["value"] = self.error_class([e])
        elif value and self.cleaned_data.get('variable_type', 1) == Variable.BOOL:
            try:
                bool(value)
            except ValueError:
                self._errors["value"] = self.error_class(['bool variable accept only'])
        # value = self.cleaned_data['value']
        return self.cleaned_data


class EmailForm(forms.Form):
    email = forms.EmailField(empty_value=False)
    variable_set_id = forms.IntegerField(widget=forms.HiddenInput())


class RedisSettingForm(forms.ModelForm):

    class Meta:
        fields = '__all__'
        model = RedisSetting

    def clean(self):
        connection_data = self.cleaned_data.copy()
        ssl = connection_data.pop('ssl_connection')
        if self.instance.id and connection_data.get('password') == 'Has value':
            connection_data['password'] = read_secret('public', 'redis-password')
        if ssl:
            connection_data['connection_class'] = redis.SSLConnection
            connection_data['ssl_cert_reqs'] = u'required' if connection_data.pop('verify_certificate', False) else u'none'
        connection = get_redis_connection(connection_data)
        try:
            connection.set('key', 'value')
        except:
            raise ValidationError('Credentials not valid')
        return self.cleaned_data
