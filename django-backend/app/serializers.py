import re

import redis
from croniter import croniter, CroniterBadCronError
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import password_validation

from saltmaster.models import Minion
from .models import *
from .utils import read_secret, get_redis_connection


class BaseNestedModelSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        request = kwargs.get('context', {}).get('request', {})
        self.Meta.depth = 0
        if request and request.method == 'GET':
            depth = request.GET.get('depth')
            if depth:
                try:
                    new_depth = int(depth)
                    if not hasattr(self.Meta, 'max_depth') or new_depth <= self.Meta.max_depth:
                        self.Meta.depth = new_depth
                    else:
                        self.Meta.depth = self.Meta.max_depth
                except:
                    pass
        super().__init__(*args, **kwargs)


class AppUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ('username', 'email',)


class ExpectedVariables(BaseNestedModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = ExpectedVariable
        fields = ('id', 'name',)


class ExpectedVariablesFull(BaseNestedModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = ExpectedVariable
        fields = '__all__'


class FunctionDetailSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    variables = ExpectedVariables(many=True)

    class Meta:
        model = Function
        fields = '__all__'


class FunctionSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = Function
        fields = ['id', 'name', 'private_function', 'from_master']


class ModuleSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    functions = FunctionSerializer(many=True)

    class Meta:
        model = Module
        fields = ('id', 'name', 'functions')


class VariableSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = Variable
        fields = ('id', 'name', 'hvac_path', 'encrypted', 'variable_type', 'has_value', 'value', 'variable_set')


class VariableSetSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    variables = VariableSerializer(many=True, required=False)

    class Meta:
        model = VariableSet
        fields = '__all__'


class ConditionVariableSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = ConditionVariable
        fields = ('id', 'function_variable', 'variable', 'redis_variable_value', 'condition')


class ConditionSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    variables = serializers.SerializerMethodField()

    class Meta:
        model = Condition
        fields = '__all__'

    def get_variables(self, obj):
        return ConditionVariableSerializer(obj.conditionvariable_set.all(), many=True, context=self.context).data


class ConditionSerializerWrite(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = Condition
        fields = '__all__'


class PlaybookSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = Playbook
        fields = ('id', 'name', 'minion',  'variable_sets', 'functions', 'schedule', 'playbook_items',
                  'playbook_mappings')
        max_depth = 1

    def validate_schedule(self, schedule):
        if croniter.is_valid(schedule):
            value = re.sub(' +', ' ', schedule)
            if len(value.split(' ')) != 5:
                raise ValidationError("Please enter valid crontab value")
            return value
        raise ValidationError("Please enter valid crontab value")


class RunnerSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    minion = serializers.PrimaryKeyRelatedField(required=True, queryset=Minion.objects.all())

    class Meta:
        model = Runner
        fields = ('id', 'schedule', 'api_alias',  'permissions', 'mapping', 'minion', 'url')

    def validate_schedule(self, schedule):
        if croniter.is_valid(schedule):
            value = re.sub(' +', ' ', schedule)
            if len(value.split(' ')) != 5:
                raise ValidationError("Please enter valid crontab value")
            return value
        raise ValidationError("Please enter valid crontab value")


class PlaybookItemSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    class Meta:
        model = PlaybookItem
        fields = '__all__'


class AppSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = App
        fields = ('id', 'name', 'api_alias')


class GroupSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = '__all__'


class AppUserSerializerFull(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = AppUser
        fields = '__all__'


class MappingSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    items = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Map
        fields = ('id', 'name', 'function', 'variable_set', 'items')


class MapItemSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = MapItem
        fields = '__all__'


class PlaybookMappingSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = PlaybookMapping
        fields = '__all__'
        max_depth = 2


class RunStatusSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display')

    class Meta:
        model = RunStatus
        fields = '__all__'


class ExecutionSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display')

    class Meta:
        model = Execution
        fields = '__all__'


class EmailSettingSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = EmailSetting
        fields = '__all__'


class SecretsRequestSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    date_sent = serializers.DateTimeField(read_only=True)
    date_set = serializers.DateTimeField(read_only=True)
    requested_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = SecretsRequest
        fields = '__all__'

    def create(self, validated_data):
        if not EmailSetting.objects.exists():
            raise ValidationError('Email settings required')
        validated_data['requested_by'] = self.context['request'].user
        instance = super().create(validated_data)
        return instance


class RedisSettingSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = RedisSetting
        fields = '__all__'

    def validate(self, attrs):
        connection_data = attrs.copy()
        ssl = connection_data.pop('ssl_connection')
        verify_certificate = connection_data.pop('verify_certificate')
        if self.instance and self.instance.id and connection_data.get('password') == 'Has value':
            connection_data['password'] = read_secret('public', 'redis-password')
        if ssl:
            connection_data['connection_class'] = redis.SSLConnection
            connection_data['ssl_cert_reqs'] = u'required' if verify_certificate else u'none'
        connection_data['socket_timeout'] = 5
        connection = get_redis_connection(connection_data)
        try:
            connection.set('key', 'value')
        except:
            raise ValidationError('Credentials not valid')
        return attrs


class AuditEntrySerializer(BaseNestedModelSerializer, serializers.ModelSerializer):

    class Meta:
        model = AuditEntry
        fields = '__all__'


class UserSerializer(BaseNestedModelSerializer, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = '__all__'

    def validate_password(self, value):
        password_validation.validate_password(value, self.instance)
        return value
