from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver

from .models import ExpectedVariable, MapItem, Runner, Playbook, PlaybookItem, PlaybookMapping, Map, AuditEntry


@receiver(post_save, sender=ExpectedVariable)
def model_save(sender, created, instance, **kwargs):
    if created:
        for mapping in instance.function.mappings.all():
            MapItem.objects.get_or_create(mapping=mapping, function_variable=instance)


@receiver(post_save, sender=Map)
def model_save(sender, created, instance, **kwargs):
    if created:
        for function_variable in instance.function.variables.all():
            MapItem.objects.get_or_create(mapping=instance, function_variable=function_variable, remote=False)


@receiver(post_delete, sender=Runner)
@receiver(post_delete, sender=Playbook)
def remove_periodic_task(sender, instance, **kwargs):
    if instance.celery_periodic_runner:
        instance.celery_periodic_runner.delete()


@receiver(m2m_changed, sender=Playbook.functions.through)
def toppings_changed(sender, instance, action, **kwargs):
    pk_set = kwargs.get('pk_set')
    if action == 'post_add':
        for pk in pk_set:
            PlaybookItem.objects.create(
                playbook=instance,
                function_id=pk
            )
            variables = ExpectedVariable.objects.filter(function_id=pk).values_list('id', flat=True)
            for v in variables:
                PlaybookMapping.objects.get_or_create(
                    playbook=instance,
                    function_variable_id=v
                )

    elif action == 'post_remove':
        for pk in pk_set:
            PlaybookItem.objects.filter(
                playbook=instance,
                function_id=pk
            ).delete()
            PlaybookMapping.objects.filter(
                function_variable__function_id=pk,
                playbook=instance,
            ).delete()


@receiver(user_logged_in)
def user_logged_in_callback(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    AuditEntry.objects.create(action='user_logged_in', ip=ip, username=user.username, user=user)


@receiver(user_logged_out)
def user_logged_out_callback(sender, request, user, **kwargs):
    ip = request.META.get('REMOTE_ADDR')
    AuditEntry.objects.create(action='user_logged_out', ip=ip, username=user.username, user=user)


@receiver(user_login_failed)
def user_login_failed_callback(sender, credentials, **kwargs):
    AuditEntry.objects.create(action='user_login_failed', username=credentials.get('username', None))