from django.contrib import admin, messages
from django.utils.safestring import mark_safe

from app.forms import GroupForm, FunctionForm, MapItemForm, RunnerForm, VariableForm, PlaybookMappingForm, \
    ConditionVariableForm, ConditionForm, PlaybookItemForm, RedisSettingForm, MapForm, PlaybookForm
from app.utils import parse_module_file
from saltmaster.tasks import execute_runner_task, execute_playbook_task
from .models import *
from .utils import generate_key


@admin.register(App)
class AppAdmin(admin.ModelAdmin):
    list_display = ('name', 'api_alias')
    list_filter = ('users',)
    search_fields = ('name', 'users__email', 'users__first_name', 'users__last_name', 'api_alias')
    readonly_fields = ('api_url', 'refresh_token')

    def has_module_permission(self, request):
        if request.user.is_superuser:
            return super().has_module_permission(request)
        return False

    def save_model(self, request, obj, form, change):
        is_new = False
        if not obj.id:
            is_new = True
        super().save_model(request, obj, form, change)
        if is_new:
            generate_key(request, obj, None)

    def get_form(self, request, *args, **kwargs):
        form = super().get_form(request, *args, **kwargs)
        self.request = request
        return form

    def api_url(self, obj):
        if not obj.id:
            return '-'
        return '{}{}'.format(
            self.request.build_absolute_uri('/'),
            reverse('api-app-create-user', args=(obj.api_alias,))
        ).replace('//', '/').replace('http:/', 'http://').replace('https:/', 'https://')

    def refresh_token(self, obj):
        if not obj.id:
            return '-'
        url = reverse('refresh-app-token', args=(obj.id,))
        return mark_safe('<a href="{}">refresh token</a>'.format(url))


@admin.register(AppUser)
class AppUserAdmin(admin.ModelAdmin):
    search_fields = ('username', 'email', 'app__name', 'app__api_alias')
    list_display = ('username', 'email', 'app')
    list_filter = ('app',)
    readonly_fields = ('refresh_token', )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('app')

    def refresh_token(self, obj):
        if not obj.id:
            return '-'
        url = reverse('refresh-user-token', args=(obj.id,))
        return mark_safe('<a href="{}">refresh token</a>'.format(url))


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    search_fields = ('name', 'app__name', 'app__api_alias')
    list_display = ('name', 'app', 'users_list')
    list_filter = ('app',)
    form = GroupForm

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('app').prefetch_related('users')

    def users_list(self, obj):
        return ', '.join([str(x) for x in obj.users.all()])

    def get_fields(self, request, obj=None):
        if obj:
            return ['name', 'app', 'users']
        else:
            return ['name', 'app']


class ExpectedVariableInline(admin.TabularInline):
    model = ExpectedVariable
    extra = 0


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Function)
class FunctionAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'module_name', 'name', 'from_master', 'private_function')
    search_fields = ('name', 'variables__name', 'doc_string')
    list_filter = ('from_master', 'module', 'private_function')
    form = FunctionForm
    inlines = [ExpectedVariableInline]

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.id and obj.from_master:
            return 'from_master', 'doc_string', 'name', 'convert_to_variable_set', 'module'
        else:
            return 'from_master',

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        file_obj = form.cleaned_data.get('import_module')
        if file_obj:
            parse_module_file(obj, file_obj)

    def module_name(self, obj):
        return obj.module.name if obj.module else ''

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('module')

    def changelist_view(self, request, extra_context=None):
        if 'private_function' not in request.META.get('HTTP_REFERER', '') and not request.GET.keys() and not any(
                [x.startswith('private_function') for x in request.GET.keys()]):
            changelist_url = reverse("admin:%s_%s_changelist" % (self.model._meta.app_label, self.model._meta.model_name))
            return redirect(
                '{0}?{1}=0'.format(
                    changelist_url,
                    'private_function__exact'
                )
            )
        return super().changelist_view(request, extra_context)

    def convert_to_variable_set(self, obj):
        url = reverse('convert-function-to-set', kwargs={'function': obj.id})
        return mark_safe('<a href="{}">Convert</a>'.format(url))


class VariableInline(admin.TabularInline):
    prepopulated_fields = {"hvac_path": ("name",)}
    readonly_fields = ('has_value', )
    form = VariableForm
    model = Variable
    extra = 0


@admin.register(VariableSet)
class VariableSetAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name', 'variables_set')
    prepopulated_fields = {"hvac_path": ("name",)}
    inlines = (VariableInline,)

    def request_secrets(self, obj):
        return mark_safe('<a href="{}">Request secrets</a>'.format(reverse('request-secrets', args=(obj.id, ))))

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('request_secrets',)
        return ()


class MapItemInline(admin.TabularInline):
    model = MapItem
    form = MapItemForm
    extra = 0
    readonly_fields = ('function_variable', )
    fields = ('function_variable', 'variable', 'remote', 'validation')

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Map)
class MappingAdmin(admin.ModelAdmin):
    list_display = ('name', 'function')
    search_fields = ('name', 'function__name')
    form = MapForm
    inlines = (MapItemInline,)

    def get_inline_instances(self, request, obj=None):
        if obj and obj.id:
            return super().get_inline_instances(request, obj)
        return []

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.id:
            return self.readonly_fields + ('function', 'variable_set',)
        return super().get_readonly_fields(request, obj)


def execute(modeladmin, request, queryset):
    for o in queryset:
        execute_runner_task.delay(o.id, {})
    messages.success(request, 'Task for executing runner was added to queue')


@admin.register(Runner)
class RunnerAdmin(admin.ModelAdmin):
    list_display = ('mapping', 'minion', 'schedule')
    list_filter = ('mapping', 'minion')
    readonly_fields = ('api_url', )
    form = RunnerForm
    actions = [execute, ]
    exclude = ('celery_periodic_runner',)

    def get_form(self, request, *args, **kwargs):
        form = super().get_form(request, *args, **kwargs)
        self.request = request
        return form

    def api_url(self, obj):
        if not obj.api_alias:
            return ''
        return '{}{}'.format(
            self.request.build_absolute_uri('/'),
            obj.url,
        ).replace('//', '/').replace('http:/', 'http://').replace('https:/', 'https://')


@admin.register(RunStatus)
class RunStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'runner', 'playbook', 'status', 'started', 'finished')
    list_filter = ('runner', 'status', 'playbook')

    def has_change_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return super(RunStatusAdmin, self).get_queryset(request).select_related('runner', 'playbook')


@admin.register(EmailSetting)
class EmailSettingAdmin(admin.ModelAdmin):
    list_display = ('from_email', 'email_host',)

    def test(self, obj):
        return mark_safe('<a href="{}">Test Connection</a>'.format(reverse('check-email')))

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ('test',)
        return ()

    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)


@admin.register(RedisSetting)
class RedisSettingAdmin(admin.ModelAdmin):
    list_display = ('host', 'port', 'ssl_connection')
    form = RedisSettingForm

    def has_add_permission(self, request):
        if self.model.objects.count() >= 1:
            return False
        return super().has_add_permission(request)


class PlaybookItemInline(admin.TabularInline):
    model = PlaybookItem
    readonly_fields = ('function',)
    fields = ('function', 'group', 'expect_write_variable', 'expect_read_variable', 'run_without_result', 'conditions',
              'schedule', 'timeout', 'close_condition_check')
    extra = 0
    form = PlaybookItemForm
    ordering = ('group', )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PlaybookMappingInline(admin.TabularInline):
    model = PlaybookMapping
    readonly_fields = ('function_variable',)
    fields = ('function_variable', 'variable',)
    form = PlaybookMappingForm
    extra = 0

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


def execute_playbook(modeladmin, request, queryset):
    for o in queryset:
        execute_playbook_task.delay(o.id)
    messages.success(request, 'Task for executing playbook was added to queue')


@admin.register(Playbook)
class PlaybookAdmin(admin.ModelAdmin):
    list_display = ('name', 'schedule')
    exclude = ('celery_periodic_runner',)
    inlines = [PlaybookItemInline, PlaybookMappingInline]
    actions = (execute_playbook,)
    form = PlaybookForm

    def get_inline_instances(self, request, obj=None):
        if obj and obj.id:
            return super().get_inline_instances(request, obj)
        return []


def stop_tasks(modeladmin, request, queryset):
    for o in queryset:
        if o.celery_periodic_runner:
            o.celery_periodic_runner.crontab.delete()
            o.celery_periodic_runner.delete()
            o.celery_periodic_runner = None
            o.status = Execution.STOPPED
            o.save()


@admin.register(Execution)
class ExecutionAdmin(admin.ModelAdmin):
    list_display = ('playbook', 'run', 'read_variable_name_value', 'write_variable_name_value', 'function', 'status',
                    'last_changes', 'created')
    fields = ('playbook', 'function', 'status', 'run', 'message', 'last_changes', 'created', 'read_variable_name',
              'write_variable_name')
    list_filter = ('playbook', )
    exclude = ('celery_periodic_runner',)
    actions = (stop_tasks,)
    readonly_fields = ('read_variable_name_value', 'write_variable_name_value',)

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def read_variable_name_value(self, obj):
        if obj.read_variable_name:
            url = reverse('redis-key-value', args=(obj.read_variable_name,))
            return mark_safe('<a href="{}" target="_blank">{}</a>'.format(url, obj.read_variable_name))
        return ''

    def write_variable_name_value(self, obj):
        if obj.read_variable_name:
            url = reverse('redis-key-value', args=(obj.write_variable_name,))
            return mark_safe('<a href="{}" target="_blank">{}</a>'.format(url, obj.write_variable_name))
        return ''


class ConditionVariableInline(admin.TabularInline):
    model = ConditionVariable
    form = ConditionVariableForm
    fields = ('function_variable', 'variable', 'redis_variable_value',)
    extra = 1

    def get_formset(self, request, obj=None, **kwargs):
        referer = request.META.get('HTTP_REFERER', '')
        if 'playbook' in referer:
            playbook_id = referer.split('playbook/')[1].split('/')[0]
            if not hasattr(self.form, 'playbook'):
                self.form.playbook = Playbook.objects.get(id=playbook_id)
        return super().get_formset(request, obj, **kwargs)


@admin.register(Condition)
class ConditionAdmin(admin.ModelAdmin):
    list_display = ('name', 'condition')
    inlines = (ConditionVariableInline, )
    form = ConditionForm
    exclude = ('variables',)


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    list_display = ('action', 'ip', 'username', 'user', 'date',)
    list_filter = ('action', )
    search_fields = ('username', 'ip')
    ordering = ('-date',)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False
