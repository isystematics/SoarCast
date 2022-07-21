from django.contrib import admin, messages
from django.urls import reverse
from django.utils.safestring import mark_safe

from saltmaster.tasks import update_minion_and_status
from .models import *
from .forms import *


class MinionsInline(admin.TabularInline):
    model = Minion
    readonly_fields = ('name', 'status', 'last_ping', 'last_ping_date', 'sync_module', 'auth_key', 'reject_key')
    extra = 0

    def sync_module(self, obj):
        if obj.id and obj.status != Minion.DISCONNECTED:
            url = reverse('sync-module', args=(obj.id,))
            return mark_safe('<a href="{}">Sync Module</a>'.format(url))
        else:
            return ''

    def auth_key(self, obj):
        if obj.id and obj.status != Minion.DISCONNECTED:
            url = reverse('manage-key', args=(obj.id, 'accept',))
            return mark_safe('<a href="{}">Auth key</a>'.format(url))
        else:
            return ''

    def reject_key(self, obj):
        if obj.id and obj.status != Minion.DISCONNECTED:
            url = reverse('manage-key', args=(obj.id, 'delete',))
            return mark_safe('<a href="{}">Reject key</a>'.format(url))
        else:
            return ''

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


def update_minions(modeladmin, request, queryset):
    for o in queryset:
        update_minion_and_status.delay(o.id)
    messages.success(request, 'Task for updating saltmasters was added to queue')


@admin.register(SaltMasterConfig)
class SaltMasterConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'api_url')
    form = SaltMasterConfigForm
    inlines = [MinionsInline]
    actions = [update_minions]


@admin.register(ModulesRepo)
class ModulesRepoAdmin(admin.ModelAdmin):
    form = ModulesRepoForm