from datetime import timedelta

from django.conf import settings
from django.contrib.postgres.fields import JSONField, ArrayField
from django.db import models
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from mptt.fields import TreeManyToManyField
from mptt.models import MPTTModel

from app.utils import write_secret, create_or_update_periodic_task


class App(models.Model):
    name = models.CharField(max_length=255, unique=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True)
    api_alias = models.SlugField(max_length=255)

    class Meta:
        verbose_name = 'App'
        verbose_name_plural = 'Apps'

    def __str__(self):
        return self.name

    @property
    def is_authenticated(self):
        return True


class AppUser(models.Model):
    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name='api_users')
    username = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)

    class Meta:
        unique_together = ('app', 'username')

    def __str__(self):
        return '{}: {}'.format(self.username, self.email)

    @property
    def is_authenticated(self):
        return True


class HashedToken(models.Model):
    key = models.CharField(max_length=64)
    app = models.OneToOneField(App, blank=True, null=True, on_delete=models.CASCADE, related_name='app_token')
    user = models.OneToOneField(AppUser, blank=True, null=True, on_delete=models.CASCADE, related_name='user_token')
    created = models.DateTimeField(auto_now=True, null=True)

    def expired(self):
        return True if not self.created or self.created < timezone.now() - timedelta(days=settings.TOKEN_LIFE_TIME) else False


class Group(models.Model):
    name = models.CharField(max_length=256)
    app = models.ForeignKey(App, blank=True, null=True, on_delete=models.CASCADE, related_name='app_groups')
    users = models.ManyToManyField(AppUser, blank=True, related_name='groups')
    # parent_group = TreeManyToManyField('self', blank=True, related_name='children', default=0)
    #
    # class MPTTMeta:
    #     order_insertion_by = ['name']

    def __str__(self):
        return self.name


class Module(models.Model):
    name = models.CharField(max_length=256, unique=True)

    def __str__(self):
        return self.name


class Function(models.Model):
    module = models.ForeignKey(Module, null=True, related_name='functions', on_delete=models.CASCADE)
    name = models.CharField(max_length=256)
    state_apply = models.BooleanField(default=False, help_text="will add 'fun': 'state.apply' to salt call")

    private_function = models.BooleanField(default=False)
    doc_string = models.TextField(blank=True, null=True)
    from_master = models.BooleanField(default=False)

    def __str__(self):
        if self.module:
            return '{}.{}'.format(self.module.name, self.name)
        return self.name

    @property
    def full_name(self):
        if self.module:
            return '{}.{}'.format(self.module.name, self.name)
        return self.name


class ExpectedVariable(models.Model):
    function = models.ForeignKey(Function, on_delete=models.CASCADE, related_name='variables')
    name = models.CharField(max_length=256)

    class Meta:
        unique_together = ('function', 'name')

    def __str__(self):
        return '{} / {}'.format(self.function.name, self.name)


class VariableSet(models.Model):
    app = models.ForeignKey(App, on_delete=models.CASCADE, related_name='configs', blank=True, null=True)
    name = models.CharField(max_length=255, unique=True)
    hvac_path = models.SlugField(max_length=255)

    def __str__(self):
        return self.name


class Variable(models.Model):
    INT, STRING, JSON = range(0, 3)
    VARIABLES = (
        (INT, 'Integer'),
        (STRING, 'String'),
        (JSON, 'JSON'),
    )
    variable_set = models.ForeignKey(VariableSet, on_delete=models.CASCADE, related_name='variables')
    name = models.CharField(max_length=255)
    hvac_path = models.SlugField(max_length=255, blank=True, null=True)
    encrypted = models.BooleanField(default=True)
    value = models.TextField(blank=True, null=True)
    variable_type = models.SmallIntegerField(choices=VARIABLES, default=STRING)
    has_value = models.BooleanField(default=False)

    class Meta:
        unique_together = ('variable_set', 'name')

    def __str__(self):
        return '{} / {}'.format(self.variable_set.name, self.name)

    def save(self, **kwargs):
        if self.value:
            self.has_value = True
        else:
            self.value = False
        if self.encrypted and self.value and self.hvac_path:
            write_secret(self.variable_set.hvac_path if self.variable_set else 'public', self.hvac_path, self.value)
            self.value = ''
        return super().save(**kwargs)


class Map(models.Model):
    name = models.CharField(max_length=255, unique=True)
    function = models.ForeignKey(Function, related_name='mappings', on_delete=models.CASCADE)
    variable_set = models.ForeignKey(VariableSet, related_name='mappings', on_delete=models.CASCADE)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Mapping'
        verbose_name_plural = 'Mappings'


class MapItem(models.Model):
    mapping = models.ForeignKey(Map, on_delete=models.CASCADE, related_name='items')
    function_variable = models.ForeignKey(ExpectedVariable, on_delete=models.CASCADE, related_name='items')
    variable = models.ForeignKey(Variable, on_delete=models.CASCADE, related_name='items', blank=True, null=True)
    remote = models.BooleanField(default=False)
    validation = models.CharField(max_length=128, blank=True, null=True)


class Runner(models.Model):
    minion = models.ForeignKey('saltmaster.Minion', on_delete=models.CASCADE, related_name='runners', null=True)
    mapping = models.ForeignKey(Map, on_delete=models.CASCADE, related_name='executions')
    schedule = models.CharField(max_length=64, help_text='cron formatting', blank=True, null=True)
    api_alias = models.SlugField(blank=True, null=True)
    permissions = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='executions', blank=True, null=True)
    celery_periodic_runner = models.ForeignKey('django_celery_beat.PeriodicTask', on_delete=models.SET_NULL, blank=True,
                                               null=True)

    def __str__(self):
        return 'Run {} on {}'.format(self.mapping, self.minion)

    def save(self, **kwargs):
        update = not self.id or (self.id and self.schedule != Runner.objects.get(id=self.id).schedule)
        super().save(**kwargs)
        if self.schedule and update:
            self.name = self.mapping.name
            create_or_update_periodic_task(self, 'saltmaster.tasks.execute_runner_task', '["{}",]'.format(self.id))
            self.save()
        elif not self.schedule and self.celery_periodic_runner and update:
            self.celery_periodic_runner.crontab.delete()
            self.celery_periodic_runner.delete()
            self.celery_periodic_runner = None
            self.save()

    @property
    def url(self):
        app = self.mapping.variable_set.app
        if app and self.api_alias:
            return reverse('api-execute', args=(
                    app.api_alias,
                    self.api_alias
                ))
        return 'No app in variable set'


class RunStatus(models.Model):
    IN_QUEUE, IN_PROGRESS, DONE, FAILED = range(0, 4)
    STATUSES = (
        (IN_QUEUE, 'Waiting for execution'),
        (IN_PROGRESS, 'Running'),
        (DONE, 'Done'),
        (FAILED, 'Failed'),
    )
    status = models.SmallIntegerField(choices=STATUSES)
    added_to_queue = models.DateTimeField(auto_now_add=True)
    started = models.DateTimeField(blank=True, null=True)
    finished = models.DateTimeField(blank=True, null=True)
    failed = models.DateTimeField(blank=True, null=True)
    status_code = models.IntegerField(null=True)
    body = models.TextField(blank=True, null=True)
    user = models.ForeignKey(AppUser, blank=True, null=True, on_delete=models.CASCADE)
    runner = models.ForeignKey(Runner, on_delete=models.CASCADE, blank=True, null=True)
    playbook = models.ForeignKey('app.Playbook', on_delete=models.CASCADE, blank=True, null=True)
    variables = JSONField(blank=True, null=True)


class EmailSetting(models.Model):
    email_host = models.CharField(max_length=128)
    email_port = models.PositiveIntegerField()
    email_username = models.CharField(max_length=128)
    email_password = models.CharField(max_length=128)
    use_tls = models.SmallIntegerField(choices=((0, 'Disabled'), (1, 'Enabled')), default=0)
    use_ssl = models.SmallIntegerField(choices=((0, 'Disabled'), (1, 'Enabled')), default=0)

    from_email = models.EmailField(max_length=128)

    class Meta:
        verbose_name = 'Email Setting'
        verbose_name_plural = 'Email Setting'

    def save(self, **kwargs):
        if self.email_password and self.email_password != 'Has value':
            write_secret('public', 'email-password', self.email_password)
            self.email_password = 'Has value'
        return super().save(**kwargs)


class RedisSetting(models.Model):
    host = models.CharField(max_length=128)
    port = models.PositiveIntegerField()
    password = models.CharField(max_length=128, blank=True, null=True)
    ssl_connection = models.BooleanField(default=False)
    verify_certificate = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Redis connection'
        verbose_name_plural = 'Redis connections'

    def save(self, **kwargs):
        if self.password and self.password != 'Has value':
            write_secret('public', 'redis-password', self.password)
            self.password = 'Has value'
        return super().save(**kwargs)


class SecretsRequest(models.Model):
    variables = models.ManyToManyField(Variable, blank=True)
    email = models.EmailField()
    date_sent = models.DateTimeField(auto_now_add=True)
    date_set = models.DateTimeField(blank=True, null=True)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)


class Playbook(models.Model):
    name = models.CharField(max_length=255)
    minion = models.ForeignKey('saltmaster.Minion', on_delete=models.CASCADE)
    variable_sets = models.ManyToManyField(VariableSet)
    functions = models.ManyToManyField(Function)
    schedule = models.CharField(max_length=64, help_text='cron formatting', blank=True, null=True)
    celery_periodic_runner = models.ForeignKey('django_celery_beat.PeriodicTask', on_delete=models.SET_NULL, blank=True,
                                               null=True)

    def __str__(self):
        return self.name

    def save(self, **kwargs):
        update = not self.id or (self.id and self.schedule != Playbook.objects.get(id=self.id).schedule)
        super().save(**kwargs)
        if self.schedule and update:
            create_or_update_periodic_task(self, 'saltmaster.tasks.execute_playbook_task', '["{}",]'.format(self.id))
            self.save()
        elif not self.schedule and self.celery_periodic_runner and update:
            self.celery_periodic_runner.crontab.delete()
            self.celery_periodic_runner.delete()
            self.celery_periodic_runner = None
            self.save()


class Condition(models.Model):
    name = models.CharField(max_length=254)
    condition = models.CharField(max_length=254)

    def __str__(self):
        return self.name


class ConditionVariable(models.Model):
    function_variable = models.ForeignKey(ExpectedVariable, on_delete=models.CASCADE, related_name='condition_mappings')
    variable = models.ForeignKey(Variable, on_delete=models.CASCADE, related_name='condition_mappings', blank=True,
                                 null=True)
    redis_variable_value = models.BooleanField(default=False)
    condition = models.ForeignKey(Condition, on_delete=models.CASCADE)


class PlaybookItem(models.Model):
    playbook = models.ForeignKey(Playbook, on_delete=models.CASCADE, related_name='playbook_items')
    function = models.ForeignKey(Function, on_delete=models.CASCADE, related_name='playbook_items')
    group = models.PositiveIntegerField(default=0)
    schedule = models.CharField(max_length=64, help_text='cron formatting', blank=True, null=True)
    timeout = models.PositiveIntegerField(default=0)
    conditions = models.ManyToManyField(Condition, blank=True)
    expect_write_variable = models.BooleanField(default=False)
    expect_read_variable = models.BooleanField(default=False)
    run_without_result = models.BooleanField(default=False)
    close_condition_check = models.SmallIntegerField(blank=True, null=True)


class PlaybookMapping(models.Model):
    playbook = models.ForeignKey(Playbook, on_delete=models.CASCADE, related_name='playbook_mappings')
    function_variable = models.ForeignKey(ExpectedVariable, on_delete=models.CASCADE, related_name='playbook_mappings')
    variable = models.ForeignKey(Variable, on_delete=models.CASCADE, related_name='playbook_mappings', blank=True, null=True)


class Execution(models.Model):
    WAITING, STARTED, FINISHED, FAILED,  QUEUED_NEXT, STOPPED, HAS_PERIODIC_TASK = range(0, 7)
    STATUSES = (
        (WAITING, 'Waiting'),
        (STARTED, 'Started'),
        (FINISHED, 'Done with no value in variable'),
        (FAILED, 'Failed'),
        (QUEUED_NEXT, 'Add next modules to queue'),
        (STOPPED, 'Stopped'),
        (HAS_PERIODIC_TASK, 'Has periodic task'),
    )
    playbook = models.ForeignKey(Playbook, on_delete=models.CASCADE, related_name='playbook_executions')
    function = models.ForeignKey(Function, on_delete=models.CASCADE, related_name='playbook_executions')
    read_variable_name = models.CharField(max_length=128, editable=False)
    write_variable_name = models.CharField(max_length=128, editable=False)
    status = models.SmallIntegerField(choices=STATUSES, default=STARTED)
    message = models.TextField(blank=True, null=TreeManyToManyField)
    celery_periodic_runner = models.ForeignKey('django_celery_beat.PeriodicTask', on_delete=models.CASCADE, blank=True,
                                               null=True)
    created = models.DateTimeField(auto_now_add=True)
    last_changes = models.DateTimeField(auto_now=True)
    run = models.UUIDField(null=True)
    proceed_files = ArrayField(models.CharField(max_length=255), blank=True, null=True)
    expected_files = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Playbook Execution'
        verbose_name_plural = 'Playbook Executions'


class AuditEntry(models.Model):
    action = models.CharField(max_length=64)
    ip = models.GenericIPAddressField(null=True)
    username = models.CharField(max_length=256, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)

    def __unicode__(self):
        return '{0} - {1} - {2}'.format(self.action, self.username, self.ip)

    def __str__(self):
        return '{0} - {1} - {2}'.format(self.action, self.username, self.ip)
