import json
import logging
import os
import re
import shutil
import uuid
from datetime import timedelta

import git
from django.conf import settings
from django.utils import timezone
from git import GitCommandError

from app.models import Runner, RunStatus, Playbook, Execution, PlaybookItem
from app.utils import get_redis_connection
from mission.celery import app
from notifications.models import Notification
from notifications.utils import create_notification
from saltmaster.models import SaltMasterConfig, Minion, ModulesRepo
from saltmaster.utils import test_ping, execute_function, get_playbook_variables, get_condition_variables, \
    setup_next_function
from .utils import execute_runner, get_minions, salt_sync_module, read_modules_from_disk, salt_update_module_permissions

log = logging.getLogger(__name__)


@app.task
def execute_runner_task(runner_id, api_data, status_id=None, from_view=False):
    logging.info('Start runner {} with api data'.format(runner_id, api_data))
    runner = Runner.objects.get(id=runner_id)
    if status_id:
        run_status = RunStatus.objects.get(user_id=runner_id)
        run_status.status = RunStatus.IN_PROGRESS
        run_status.variables = json.dumps(list(api_data.keys()))
        run_status.started = timezone.now()
        run_status.save()
    else:
        run_status = RunStatus.objects.create(
            runner=runner,
            status=RunStatus.IN_PROGRESS,
            started=timezone.now(),
            variables=json.dumps(api_data)
        )
    try:
        return execute_runner(runner, run_status, api_data, from_view)
    except Exception as e:
        run_status.body = e
        run_status.failed = timezone.now()
        run_status.status = RunStatus.FAILED
        run_status.save()
        return str(e), ''


@app.task
def update_minion_and_status(salt_master_id: int):
    """

    :param salt_master_id: id of salt master that will be updated
    :return:
    """
    salt_master = SaltMasterConfig.objects.get(id=salt_master_id)
    if not salt_master.valid_credentials:
        logging.error('Salt master config not valid {}'.format(salt_master.name))

    exist_minions = set(salt_master.minions.all().values_list('name', flat=True))
    minions = get_minions(salt_master)
    # expected data in minions
    # {'minions': ['D1-APP-1', 'D1-IP-1', 'D1-MC-1', 'D1-SP-1'],
    #  'minions_pre': [],
    #  'minions_rejected': [],
    #  'minions_denied': [],
    #  'local': ['master.pem', 'master.pub']}
    ping_data = test_ping(salt_master)

    KEYS_STATUSES = {
        'minions': Minion.ACCEPTED,
        'minions_pre': Minion.UNACCEPTED,
        'minions_rejected': Minion.REJECTED,
        'minions_denied': Minion.DENIED,
    }
    new_minions = []
    new_minions_list = set()
    for key, status in KEYS_STATUSES.items():
        data = minions.get(key)
        new_minions_list.update(data)
        for i in data:
            minion, created = Minion.objects.update_or_create(
                name=i,
                salt=salt_master,
                defaults={
                    'status': status,
                    'last_ping': ping_data.get(i, False),
                    'last_ping_date': timezone.now()
                }
            )
            if created:
                new_minions.append(i)
    if new_minions:
        create_notification(
            'New Minions was founded',
            Notification.NEW_MINION,
            ''.join(['<p>{}</p>'.format(x) for x in new_minions])
        )
    disconnected = list(exist_minions-new_minions_list)
    Minion.objects.filter(salt=salt_master, name__in=disconnected).update(status=Minion.DISCONNECTED, last_ping=False)


@app.task
def update_salt_masters_minions():
    for i in SaltMasterConfig.objects.all().values_list('id', flat=True):
        update_minion_and_status.delay(i)


@app.task
def sync_module(salt_master_id, minion_id=None):
    salt_master = SaltMasterConfig.objects.get(id=salt_master_id)
    salt_sync_module(salt_master, minion_id)
    salt_update_module_permissions(salt_master, minion_id)
    read_modules_from_disk()


@app.task
def sync_modules():
    for i in SaltMasterConfig.objects.all().values_list('id', flat=True):
        sync_module.delay(i)


@app.task
def sync_git_module(repo_id):
    repo = ModulesRepo.objects.get(id=repo_id)
    if os.path.exists('/tmp/modules'):
        shutil.rmtree('/tmp/modules/')
    os.mkdir("/tmp/modules")
    try:
        git.Git("/tmp").clone(repo.repo_url, 'modules')
        path = "/tmp/modules/_modules/"
        if not os.path.exists(path):
            logging.error("Repository doesn't have _modules folder.")
            shutil.rmtree('/tmp/modules/')
            return
        read_modules_from_disk(path)
    except GitCommandError as e:
        logging.error("Repository access error {}".format(e))
    shutil.rmtree('/tmp/modules/')


@app.task
def sync_git_modules():
    for repo in ModulesRepo.objects.values_list('id', flat=True):
        sync_git_module.delay(repo)


@app.task()
def execute_playbook_function(playbook_id, function_item_id, execution_id, condition_id=None, redis_item=None):
    """
    task that run function from playbook
    :param playbook_id: playbook id
    :param function_item_id: function item id
    :param execution_id: execution id
    :param condition_id: condition id which was assigned for this function
    :param redis_item: redis item for condition variables
    :return: None
    """
    print(playbook_id, function_item_id, execution_id, condition_id, redis_item)
    playbook = Playbook.objects.get(id=playbook_id)
    function_item = PlaybookItem.objects.get(id=function_item_id)
    redis_connection = get_redis_connection()
    if not redis_connection:
        logging.error('No redis credentials')
        return
    # execution has random variables for this execution of function
    execution = Execution.objects.get(id=execution_id)
    execution.status = Execution.STARTED
    execution.save()

    # get required variable names for this function
    variables = get_playbook_variables(playbook, function_item.function)

    # update variables with specific conditions
    if condition_id:
        current_condition = function_item.conditions.filter(id=condition_id).first()
        if current_condition:
            variables.update(get_condition_variables(current_condition, redis_item))

    if function_item.expect_read_variable:
        variables['redis_read_key'] = execution.read_variable_name
    if function_item.expect_write_variable:
        variables['redis_write_key'] = execution.write_variable_name

    run_status = RunStatus.objects.create(
        playbook=playbook,
        status=RunStatus.IN_PROGRESS,
        started=timezone.now(),
        variables=json.dumps(list(variables.keys()))
    )
    try:
        # do not execute function if not variable and function expect for read variable
        if function_item.expect_read_variable and not redis_connection.smembers(execution.read_variable_name):
            logging.info('Function {} expect to get variable but no value in redis {}'.format(
                function_item.function.name,
                execution.read_variable_name)
            )
            return
        # run function on specific minion with variables
        execute_function(function_item.function, playbook.minion, variables, run_status, False)
        result = redis_connection.smembers(execution.write_variable_name)
        result = [x.decode() for x in result]
        next_random_variable = uuid.uuid4()
        if result:
            for next_item in playbook.playbook_items.filter(group=function_item.group+1):
                conditions = next_item.conditions.all()
                if conditions:
                    covered_files = set()
                    for condition in conditions:
                        regexp = re.compile(condition.condition)
                        matched_redis_items = list(filter(lambda x: regexp.search(x), result))
                        covered_files.update(matched_redis_items)
                        if condition.conditionvariable_set.filter(redis_variable_value=True).exists():
                            for redis_item in matched_redis_items:
                                setup_next_function(playbook, execution, function_item, next_item, next_random_variable,
                                                    condition.id, redis_item)
                                if hasattr(next_item, 'celery_periodic_runner'):
                                    delattr(next_item, 'celery_periodic_runner')
                        else:
                            setup_next_function(playbook, execution, function_item, next_item, next_random_variable,
                                                condition.id)
                    not_covered_files = set(result) - covered_files
                    if not_covered_files:
                        create_notification(
                            'Not covered files in playbook {}'.format(playbook.name),
                            Notification.NOT_COVERED_FILE_IN_CONDITION,
                            ''.join(['<p>{}</p>'.format(x) for x in not_covered_files])
                        )
                else:
                    setup_next_function(playbook, execution, function_item, next_item, next_random_variable)
            execution.refresh_from_db()
            if execution.status != Execution.STOPPED:
                execution.status = Execution.FINISHED
                execution.save()
            execution.status = Execution.QUEUED_NEXT
            execution.save()
        elif playbook.playbook_items.filter(group=function_item.group+1, run_without_result=True).exists():
            for next_item in playbook.playbook_items.filter(group=function_item.group + 1, run_without_result=True):
                setup_next_function(playbook, execution, function_item, next_item, next_random_variable)
        elif function_item.schedule:
            execution.status = Execution.HAS_PERIODIC_TASK
            execution.save()
        else:
            execution.refresh_from_db()
            if execution.status != Execution.STOPPED:
                execution.status = Execution.FINISHED
                execution.save()

    except Exception as e:
        execution.status = Execution.FAILED
        execution.message = e
        execution.save()
        return str(e), ''


@app.task
def execute_playbook_task(playbook_id):
    playbook = Playbook.objects.get(id=playbook_id)
    for function_item in playbook.playbook_items.filter(group=0):
        execution = Execution.objects.create(
            playbook=playbook,
            function=function_item.function,
            read_variable_name="{}-{}".format(playbook.name, uuid.uuid4()),
            write_variable_name="{}-{}".format(playbook.name, uuid.uuid4()),
            run=uuid.uuid4()
        )
        execute_playbook_function(playbook_id, function_item.id, execution.id, None, None)


@app.task
def find_and_close_time_outed_runners():
    executions = Execution.objects.filter(celery_periodic_runner__isnull=False)
    for execution in executions:
        timeout = execution.playbook.playbook_items.get(function_id=execution.function).timeout
        if execution.created + timedelta(minutes=timeout) < timezone.now():
            execution.celery_periodic_runner.crontab.delete()
            execution.celery_periodic_runner.delete()
            execution.celery_periodic_runner = None
            execution.status = Execution.STOPPED
            execution.save()
