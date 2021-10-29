import shutil

import git
from git import GitCommandError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from .models import *


class MinionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(read_only=True, source='get_status_display')

    class Meta:
        model = Minion
        fields = '__all__'
        extra_kwargs = {
            'name': {'read_only': True},
            'status': {'read_only': True},
            'last_ping': {'read_only': True},
            'last_ping_date': {'read_only': True},
        }


class SaltMasterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    minions = MinionSerializer(many=True, required=False, read_only=True)

    class Meta:
        model = SaltMasterConfig
        fields = ('id', 'name', 'api_url', 'username', 'minions', 'password')

    def validate(self, attrs):
        if not self.instance:
            self.instance = SaltMasterConfig()
        for attr, value in attrs.items():
            setattr(self.instance, attr, value)
        if not self.instance.valid_credentials:
            raise ValidationError('Credentials not Valid. Or saltmasater doesn\'t exists on this host')
        return attrs


class ModulesRepoSerializer(serializers.ModelSerializer):
    access_token = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = ModulesRepo
        fields = '__all__'

    def validated(self, data):
        repo = data.get('repo')
        repo = repo.replace('@', ":{}@".format(data.get('access_token')))
        try:
            git.Git("/tmp").clone(repo, 'modules')
            shutil.rmtree('/tmp/modules/')
        except GitCommandError as e:
            raise ValueError('Credentials not valid {}'.format(e))
        return data
