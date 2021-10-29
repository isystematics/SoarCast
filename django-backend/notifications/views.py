from django.http import JsonResponse
from django.views.generic import UpdateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.generics import ListAPIView
from rest_framework import filters, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import *


class UpdateNotificationsView(UpdateView):

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(read=False).update(read=True)
        return JsonResponse({"status": "Ok"})


class NotificationView(ListAPIView):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.order_by('-date')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['subject', 'message']

    filterset_fields = ['notification_type', 'read']


class UpdateNotificationReadView(APIView):
    def post(self, request):
        ids = request.data.get('ids', [])
        Notification.objects.filter(id__in=ids).update(read=True)
        return Response({}, status=status.HTTP_202_ACCEPTED)