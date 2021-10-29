import json
import re
import uuid
from socket import gaierror

from cryptography.fernet import Fernet
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.safestring import mark_safe
from django.utils.text import slugify
from django.views.generic import RedirectView, TemplateView, FormView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, filters
from rest_framework.generics import CreateAPIView, get_object_or_404, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .serializers import *
from saltmaster.tasks import execute_runner_task, execute_playbook_task
from .authentication import create_key_from_secret
from .forms import EmailForm
from .models import *
from .permissions import AppTokenPermission, UserTokenPermission
from .utils import generate_key
from notifications.utils import send_email


class RefreshToken(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        app_id = kwargs.get('app_id')
        user_id = kwargs.get('user_id')
        app = None
        user = None
        if app_id:
            app = App.objects.get(id=app_id)
        if user_id:
            user = AppUser.objects.get(id=user_id)
        if app or user:
            generate_key(self.request, app, user)
        self.url = self.request.META.get('HTTP_REFERER', '/')
        return super().get_redirect_url(*args, **kwargs)


class CovertVariableToSet(LoginRequiredMixin, RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        function = Function.objects.get(id=kwargs.get('function'))
        v_set = VariableSet.objects.create(
            name='Secrets for {} {}'.format(function.name, uuid.uuid4()),
            hvac_path=slugify('{}-{}'.format(function.name, uuid.uuid4()))
        )
        for variable in function.variables.all():
            Variable.objects.create(
                variable_set=v_set,
                name=variable.name,
                hvac_path=slugify(variable.name)
            )
        self.url = reverse(
            "admin:%s_%s_change" % (
                VariableSet._meta.app_label,
                VariableSet._meta.model_name
            ), args=[v_set.id]
        )
        return super().get_redirect_url(*args, **kwargs)


class AppUserAPIView(CreateAPIView):
    """ Create user for app"""
    serializer_class = AppUserSerializer
    permission_classes = [IsAuthenticated, AppTokenPermission]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.validated_data['app'] = request.user
        try:
            user = serializer.save()
            token = generate_key(request, None, user)
            headers = self.get_success_headers(serializer.data)
            response_data = {'token': token}
            if request.user.app_token.expired:
                response_data['new_app_token'] = generate_key(request, request.user, None)
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
        except IntegrityError:
            return Response(
                {'message': 'username already in use'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ExecuteRunnerAPIView(CreateAPIView):
    permission_classes = [IsAuthenticated, UserTokenPermission]

    def post(self, request, *args, **kwargs):
        data = request.data
        runner = get_object_or_404(Runner, api_alias=kwargs.get('api_alias'))

        if runner.permissions and runner.permissions not in request.user.groups.all():
            return Response(
                {'detail': "you haven't permissions to execute this runner"},
                status=status.HTTP_403_FORBIDDEN,
            )
        remote_variables = runner.mapping.items.filter(remote=True).select_related('function_variable', 'variable')
        variables = {}
        missed_variables = []
        not_valid_fields = {}
        for item in remote_variables:
            function_variable_name = item.function_variable.name
            validation = item.validation
            value = data.get(function_variable_name)
            if value:
                if (validation and re.match(validation, value)) or not validation:
                    variables[function_variable_name] = value
                else:
                    not_valid_fields[function_variable_name] = validation
            else:
                missed_variables.append(function_variable_name)
        if missed_variables or not_valid_fields:
            response_data = {}
            if missed_variables:
                fields = ', '.join(missed_variables)
                response_data['missing fields'] = fields
            if not_valid_fields:
                response_data['fields not match to expected format'] = not_valid_fields
            return Response(
                response_data,
                status=status.HTTP_400_BAD_REQUEST,
            )

        response, minion = execute_runner_task(runner.id, variables, from_view=True)
        if type(response) == str:
            return Response(
                {'detail': response},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        else:
            try:
                data = response.json()
            except ValueError:
                data = {
                    'response': response.text
                }
            data['minion'] = minion
            if request.user.user_token.expired:
                data['new_user_token'] = generate_key(request, None, request.user)
            return Response(
                data,
                status=response.status_code,
            )


def generate_domain_url(request):
    return '{}://{}'.format(
        request.scheme,
        request.META['HTTP_HOST']
    )


def test(request):
    try:
        if not request.user.email:
            url = reverse(
                'admin:{}_{}_change'.format(request.user._meta.app_label, request.user._meta.model_name),
                args=(request.user.id,)
            )
            messages.error(request, mark_safe('Please set your <a href="{}">email</a>'.format(url)))
            return redirect(request.META['HTTP_REFERER'])
        send_email(
            'Test email',
            'Test body of email',
            [request.user.email],
            generate_domain_url(request)
        )
        messages.success(request, "Email sent successfully")
    except gaierror:
        messages.error(request, 'host not reachable')
    except Exception as e:
        messages.error(request, e)
    return redirect(request.META['HTTP_REFERER'])


class RequestSecretsView(LoginRequiredMixin, FormView):
    form_class = EmailForm
    template_name = 'admin/request_email.html'
    success_url = '/'

    def get_initial(self):
        initial = super().get_initial()
        initial.update({'variable_set_id': self.kwargs.get('set_id')})
        return initial

    def form_valid(self, form):
        r = SecretsRequest.objects.create(
            email=form.cleaned_data['email'],
            requested_by=self.request.user
        )
        r.variables.set(Variable.objects.filter(variable_set_id=form.cleaned_data['variable_set_id']))
        key = create_key_from_secret()
        f = Fernet(key)
        encrypted_token = f.encrypt('{}'.format(r.id).encode()).decode()
        url = reverse('submit-secrets', args=(encrypted_token,))
        send_email(
            'Request secrets',
            'Please update your credentials to allow us access your data. '
            '<a href="{}">Update</a>'.format(url),
            [form.cleaned_data['email']],
            settings.FRONTEND_URL
        )
        messages.success(self.request, 'Email was send successfully')
        return super().form_valid(form)


class SubmitSecretsView(TemplateView):
    template_name = 'admin/submit_secrets.html'

    def get_request_obj(self, encrypted_id):
        key = create_key_from_secret()
        f = Fernet(key)
        encrypted_id = f.decrypt(encrypted_id.encode())
        secret_request = get_object_or_404(SecretsRequest, id=encrypted_id, date_set__isnull=True)
        return secret_request

    def get_context_data(self, **kwargs):
        context = super().get_context_data()
        encrypted_id = kwargs.get('set_id')
        secret_request = self.get_request_obj(encrypted_id)
        context['secret_request'] = secret_request
        return context

    def post(self, request, **kwargs):
        data = request.POST.copy()
        encrypted_id = kwargs.get('set_id')
        secret_request = self.get_request_obj(encrypted_id)
        variables = secret_request.variables.all()
        if not all([data.get(x.name) for x in variables]):
            messages.error(request, 'please set all fields')
            return self.get(request, **kwargs)

        for variable in variables:
            variable.value = data.get(variable.name)
            variable.save()
        secret_request.date_set = timezone.now()
        secret_request.save()
        return redirect('thank-you')


class ThankYouView(TemplateView):
    template_name = 'admin/thank-you.html'


class ModuleListView(ListAPIView):
    """
    Allow you to get list of available modules and their functions and expected variables
    """
    serializer_class = ModuleSerializer

    def get_queryset(self):
        return Module.objects.all().prefetch_related('functions', 'functions__variables')


class FunctionDetailView(RetrieveAPIView):
    """
    Allow to CRUD information about module function
    """
    queryset = Function.objects.all()
    serializer_class = FunctionDetailSerializer
    lookup_field = 'pk'


class VariableSetViewSet(ModelViewSet):
    """
    Allow to CRUD all variable sets
    """
    serializer_class = VariableSetSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'variables__name']
    filterset_fields = ['app', ]

    def get_queryset(self):
        return VariableSet.objects.all().prefetch_related('variables').order_by('id')


class VariableViewSet(ModelViewSet):
    """
    Allow to CRUD all variables
    """
    serializer_class = VariableSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    queryset = Variable.objects.all().order_by('id')
    search_fields = ['name']
    filterset_fields = ['variable_set', 'encrypted', 'has_value']


class ConditionViewSet(ModelViewSet):
    """
    Allow to CRUD all conditions
    """
    serializer_class = ConditionSerializer
    serializer_class_write = ConditionSerializerWrite
    filterset_fields = ['playbookitem', ]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return self.serializer_class
        return self.serializer_class_write

    def get_queryset(self):
        return Condition.objects.all().prefetch_related('conditionvariable_set')


class ConditionVariableViewSet(ModelViewSet):
    """
    Allow to CRUD all condition Variables
    """
    serializer_class = ConditionVariableSerializer
    filterset_fields = ['condition', ]

    def get_queryset(self):
        condition_pk = self.kwargs.get('condition_pk')
        if condition_pk:
            return ConditionVariable.objects.filter(condition_id=condition_pk)
        return ConditionVariable.objects.all()


class PlaybookViewSet(ModelViewSet):
    """
    Allow to CRUD all Playbooks
    """

    serializer_class = PlaybookSerializer

    def get_queryset(self):
        return Playbook.objects.all()


class ExecutePlaybookView(APIView):
    """
    Execute playbook
    """

    def post(self, request, pk):
        task_id = execute_playbook_task.apply_async(args=[pk])
        return Response({'result': 'Task added to queue', 'task_id': str(task_id)}, status=status.HTTP_202_ACCEPTED)


class ExecuteRunnerView(APIView):
    """
    Execute runner
    """

    def post(self, request, pk):
        task_id = execute_runner_task.apply_async(args=[pk, {}])
        return Response({'result': 'Task added to queue', 'task_id': str(task_id)}, status=status.HTTP_202_ACCEPTED)


class PlaybookItemViewSet(ModelViewSet):
    """
    Allow to CRUD all playbook items
    """

    serializer_class = PlaybookItemSerializer
    filterset_fields = ['playbook', ]
    queryset = PlaybookItem.objects.all().order_by('id')


class PlaybookMappingViewSet(ModelViewSet):
    """
    Allow to CRUD all playbook mappings
    """

    serializer_class = PlaybookMappingSerializer
    filterset_fields = ['playbook', ]
    queryset = PlaybookMapping.objects.all().order_by('id')


class AppViewSet(ModelViewSet):
    """
    Allow to CRUD all apps
    """

    serializer_class = AppSerializer
    queryset = App.objects.all().order_by('id')


class GroupViewSet(ModelViewSet):
    """
    Allow to CRUD all groups
    """
    filterset_fields = ['app', ]
    serializer_class = GroupSerializer
    queryset = Group.objects.all().order_by('id')


class AppUserViewSet(ModelViewSet):
    serializer_class = AppUserSerializerFull
    queryset = AppUser.objects.all().order_by('id')
    filterset_fields = ['app', ]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        data = serializer.data
        data['token'] = generate_key(self.request, None, serializer.instance)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


class AppUserRefreshToken(APIView):

    def post(self, request, pk):
        user = get_object_or_404(AppUser, pk=pk)
        token = generate_key(self.request, None, user)
        return Response({'token': token}, status=status.HTTP_202_ACCEPTED)


class RunnerViewSet(ModelViewSet):
    """
    Allow to CRUD all Runner
    """

    serializer_class = RunnerSerializer
    queryset = Runner.objects.all().order_by('id')

    def get_object(self):
        return self.queryset.filter(
            pk=self.kwargs.get('pk')
        ).select_related('mapping', 'mapping__function', 'mapping__variable_set').first()


class MappingViewSet(ModelViewSet):
    """
    Allow to CRUD all Maps
    """

    serializer_class = MappingSerializer
    queryset = Map.objects.all().order_by('id')


class MapItemViewSet(ModelViewSet):
    """
    Allow to CRUD all Map items
    """

    serializer_class = MapItemSerializer
    queryset = MapItem.objects.all().order_by('id')
    filterset_fields = ['mapping', 'remote']


class RunStatusViewSet(ModelViewSet):
    """
    Allow to CRUD all run statuses of salt master calls
    """

    serializer_class = RunStatusSerializer
    queryset = RunStatus.objects.all().order_by('-added_to_queue')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['id', 'body', 'playbook__name', 'variables']
    filterset_fields = ['playbook', 'runner', 'user', 'status', 'status_code']


class ExecutionViewSet(ModelViewSet):
    """
    Allow to CRUD all executions calls
    """

    serializer_class = ExecutionSerializer
    queryset = Execution.objects.all().order_by('-created')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['read_variable_name', 'write_variable_name', 'playbook__name', 'function__name', 'message', 'run',
                     'created', 'last_changes']
    filterset_fields = ['playbook', 'function', 'status', 'read_variable_name', 'write_variable_name', 'run',
                        'created', 'last_changes']


class EmailSettingView(ModelViewSet):
    serializer_class = EmailSettingSerializer
    queryset = EmailSetting.objects.all().order_by('id')

    def create(self, request, *args, **kwargs):
        if EmailSetting.objects.exists():
            return Response(
                {
                    'non_field_errors': "Only one email setting allowed. Update previous one or delete it and create "
                                        "new one"
                }
            )
        return super().create(request, *args, **kwargs)


class RedisSettingView(ModelViewSet):
    serializer_class = RedisSettingSerializer
    queryset = RedisSetting.objects.all().order_by('id')

    def create(self, request, *args, **kwargs):
        if RedisSetting.objects.exists():
            return Response(
                {
                    'non_field_errors': "Only one email setting allowed. Update previous one or delete it and create "
                                        "new one"
                }
            )
        return super().create(request, *args, **kwargs)


class SecretsRequestView(ModelViewSet):
    serializer_class = SecretsRequestSerializer
    queryset = SecretsRequest.objects.all().order_by('id')

    def perform_create(self, serializer):
        serializer.save()
        secret_request = serializer.instance
        key = create_key_from_secret()
        f = Fernet(key)
        encrypted_token = f.encrypt('{}'.format(secret_request.id).encode()).decode()
        url = reverse('submit-secrets', args=(encrypted_token,))
        try:
            result = send_email(
                'Request secrets',
                'Please update your credentials to allow us access your data. '
                '<a href="{}">Update</a>'.format(url),
                [secret_request.email],
                settings.FRONTEND_URL
            )
            if not result:
                raise serializers.ValidationError({"email_settings": "Email settings missed"})
        except gaierror:
            raise serializers.ValidationError({"email_settings": "Email settings not valid"})

    def get_object(self):
        key = create_key_from_secret()
        f = Fernet(key)
        encrypted_id = f.decrypt(self.kwargs.get('pk', '').encode())
        secret_request = get_object_or_404(SecretsRequest, id=encrypted_id, date_set__isnull=True)
        return secret_request

    def update(self, request, *args, **kwargs):
        data = request.data
        secret_request = self.get_object()
        variables = secret_request.variables.all()
        if not all([data.get(str(x.id)) for x in variables]):
            return Response(["All values required"], status=status.HTTP_400_BAD_REQUEST)

        for variable in variables:
            variable.value = data.get(str(variable.id))
            variable.save()
        secret_request.date_set = timezone.now()
        secret_request.save()
        return Response({}, status=status.HTTP_202_ACCEPTED)


class AuditEntryView(ModelViewSet):
    serializer_class = AuditEntrySerializer
    queryset = AuditEntry.objects.all().order_by('-date')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['username', 'user__first_name', 'user__last_name', 'ip', 'action', 'date']
    filterset_fields = ['action', 'user']


class UserView(ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['user__first_name', 'user__last_name', 'email']
    filterset_fields = ['is_active', 'is_staff', 'is_superuser']


class ExpectedVariablelView(ListAPIView):
    serializer_class = ExpectedVariablesFull
    queryset = ExpectedVariable.objects.all().order_by('-id')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'function__name',]
    filterset_fields = ['function', ]
