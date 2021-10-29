import shutil

import git
from django import forms
from git import GitCommandError

from .models import *


class SaltMasterConfigForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(render_value=False), required=False, max_length=255)

    class Meta:
        model = SaltMasterConfig
        fields = '__all__'

    def clean_password(self):
        value = self.cleaned_data['password']
        if self.instance and self.instance.password and not value:
            return self.instance.password
        raise ValueError('This field is required')


class ModulesRepoForm(forms.ModelForm):
    access_token = forms.CharField(widget=forms.PasswordInput(), required=False, max_length=255)

    class Meta:
        model = ModulesRepo
        fields = '__all__'

    def clean(self):
        data = self.cleaned_data.copy()
        repo = data.get('repo')
        repo = repo.replace('@', ":{}@".format(data.get('access_token')))
        try:
            git.Git("/tmp").clone(repo, 'modules')
            shutil.rmtree('/tmp/modules/')
        except GitCommandError as e:
            raise ValueError('Credentials not valid {}'.format(e))
        return self.cleaned_data
