from celery.result import AsyncResult
from django.shortcuts import get_object_or_404
from django.views.generic import RedirectView, TemplateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework import filters, status

from app.utils import get_redis_connection
from mission.celery import app
from saltmaster.models import Minion, SaltMasterConfig, ModulesRepo
from saltmaster.serializers import SaltMasterSerializer, MinionSerializer, ModulesRepoSerializer
from saltmaster.tasks import update_minion_and_status, sync_git_modules, sync_git_module, sync_module
from saltmaster.utils import manage_key


class ManageKeyView(RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        minion = get_object_or_404(Minion, pk=kwargs.get('minion_id'))
        manage_key(minion, kwargs.get('operation'))
        return self.request.META.get('HTTP_REFERER', '/')


class SyncModuleView(RedirectView):
    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        minion = get_object_or_404(Minion, pk=kwargs.get('minion_id'))
        sync_module.apply_async(args=[minion.salt.id, minion.id])
        return self.request.META.get('HTTP_REFERER', '/')


class KeyValue(TemplateView):
    template_name = 'admin/redis_value.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['key'] = key = kwargs.get('key')
        redis_connection = get_redis_connection()
        context['value'] = redis_connection.smembers(key)
        return context


class KeValueView(APIView):
    """
    Return value for redis key
    """
    def get(self, request, key):
        redis_connection = get_redis_connection()

        return Response({"value": redis_connection.smembers(key)}, status=status.HTTP_200_OK)


class SaltMasterViewSet(ModelViewSet):
    """
    Return list of all salt masters
    """

    serializer_class = SaltMasterSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'minions__name']

    def get_queryset(self):
        return SaltMasterConfig.objects.all().prefetch_related('minions')


class SyncModulesView(APIView):
    """
    Sync Modules to salt minions from masters
    """
    serializer_class = SaltMasterSerializer

    def post(self, request, pk=None):
        if pk:
            task_id = sync_git_module.apply_async(args=[pk])
        else:
            task_id = sync_git_modules.apply_async()
        return Response({
            'result': 'Task for syncing modules was added to queue',
            'task_id': str(task_id)
        }, status=status.HTTP_200_OK)


class UpdateMinionsView(APIView):
    """
    Update minions and statuses
    """
    serializer_class = SaltMasterSerializer

    def post(self, request, pk):
        salt_master = get_object_or_404(SaltMasterConfig, pk=pk)
        update_minion_and_status(pk)
        serializer = self.serializer_class(salt_master)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateKEYView(APIView):
    """
    Update minions and statuses
    """
    serializer_class = MinionSerializer

    def post(self, request):
        minions = request.data.get('minions', [])
        operation = request.data.get('operation')
        minions = Minion.objects.filter(id__in=minions)
        for minion in minions:
            manage_key(minion, operation)
        # udpate qs to get new data
        minions = Minion.objects.filter(id__in=minions).order_by('id')
        serializer = self.serializer_class(instance=minions, many=True)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


class MinionView(ModelViewSet):
    """
    Return list of all minions and update is mc minion
    """
    serializer_class = MinionSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['salt', 'status', 'last_ping', 'mission_control_minion']
    queryset = Minion.objects.all()


class ModulesRepoViewSet(ModelViewSet):
    """
    Return list of modules repos
    """

    serializer_class = ModulesRepoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['repo']

    def get_queryset(self):
        return ModulesRepo.objects.all().order_by('id')


class CeleryDetailView(APIView):
    def get(self, request, task_id):
        res = AsyncResult(str(task_id), app=app)
        return Response({
            'state': res.state,
            'traceback': res.traceback,
        })
