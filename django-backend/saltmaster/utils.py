import uuid
from os import listdir
from os.path import isfile, join
import logging
from json import JSONDecodeError

import json
import requests
from django.conf import settings
from django.utils import timezone

from app.models import Runner, Variable, RunStatus, Function, ExpectedVariable, Execution, Module
from app.utils import read_secret, parse_line, create_or_update_periodic_task
from notifications.models import Notification
from notifications.utils import create_notification

log = logging.getLogger(__name__)


def create_salt_error_notification(message):
    create_notification(
        'Salt error',
        Notification.SALT_ERROR,
        message
    )


def get_salt_session(salt):
    session = requests.Session()
    session.post('{}/login'.format(salt.api_url), verify=False, json={
        "username": salt.username,
        "password": salt.password,
        'eauth': 'pam',
    })
    return session


def call_salt(url: str, data):
    """
    :param url: url to call
    :param data: data to post
    :return: request response
    """
    headers = {
        'Accept': 'application/x-yaml',
        'Content-type': 'application/json',
    }
    response = requests.post(url, headers=headers, data=json.dumps(data), verify=False)
    return response


def execute_function(function, minion, variables, run_status, need_result=True):
    """
    :param function: Function which will run
    :param minion: Minion where function will be called
    :param variables: dict of variables
    :param run_status: status object
    :param need_result: boole if you wan't to get salt response and minion name
    :return: salt response and minion name if need_result True else just True, True
    """
    salt = minion.salt
    if function.state_apply:
        data = {
            'client': 'local',
            'tgt': minion.name,
            'arg': function.full_name,
            'fun': 'state.apply',
            'kwarg': {
                'pillar': variables
            },
        }
    else:
        data = {
            'client': 'local',
            'tgt': minion.name,
            'fun': function.full_name,
            'kwarg': variables,
        }

    session = get_salt_session(salt)
    response = session.post('{}'.format(salt.api_url), json=[data])
    run_status.variables = json.dumps(list(variables.keys()))
    run_status.status_code = response.status_code
    try:
        run_status.body = response.json()
    except JSONDecodeError:
        run_status.body = response.text
    if response.status_code == 200:
        if 'error' in response.text:
            create_salt_error_notification('Error in salt api {} response'.format(salt.api_url))
        run_status.status = RunStatus.DONE
        run_status.finished = timezone.now()
        run_status.save()
        if need_result:
            return response, minion.name
        return True, True

    create_salt_error_notification('Salt api {} response not 200'.format(salt.api_url))
    run_status.status = RunStatus.FAILED
    run_status.failed = timezone.now()
    run_status.save()
    logging.error("Error on salt call. {}".format(response.status_code))
    if need_result:
        return response, minion.name
    return False, False


def execute_runner(runner: Runner, run_status: RunStatus, api_data=None, need_result=False) -> str:
    """
    make call to salt with data from mapping
    :param runner: salt action object where we could get
    :param run_status: status tracker
    :param api_data: data from api for remote execution
    :param need_result: bool if required return
    :return:
    """
    if not api_data:
        api_data = {}

    variables = {}
    for item in runner.mapping.items.all().select_related('function_variable', 'variable'):
        salt_variable_name = item.function_variable.name
        variable = item.variable
        value = ''
        if item.remote:
            value = api_data.get(salt_variable_name, '')
        elif variable and variable.encrypted:
            value = read_secret(
                variable.variable_set.hvac_path,
                variable.hvac_path
            )
        elif variable:
            value = variable.value
        if variable and variable.variable_type == Variable.JSON:
            value = json.loads(value)
        elif variable and variable.variable_type == Variable.INT:
            value = int(value)
        variables[salt_variable_name] = value

    response, minion = execute_function(runner.mapping.function, runner.minion, variables, run_status, need_result)
    if (need_result and response.status_code == 200) or response:
        logging.info("Runner end successfully {}".format(runner))
    return response, minion


def get_minions(salt_master):
    """
    :param saltmaster: SaltMasterConfig
    :return:
    """
    session = get_salt_session(salt_master)
    data = {
        'client': 'wheel',
        'fun': 'key.list_all'
    }
    response = session.post('{}'.format(salt_master.api_url), json=[data])
    if response.status_code != 200:
        create_salt_error_notification('Salt api {} response not 200'.format(salt_master.api_url))
        logging.error("Error getting minions. {}".format(response.status_code))
    if 'error' in response.text:
        create_salt_error_notification('Error in salt api {} response'.format(salt_master.api_url))
    result = response.json()
    return result['return'][0]['data']['return']


def test_ping(salt_master):
    session = get_salt_session(salt_master)
    data = {
        'client': 'local',
        'tgt': '*',
        'fun': 'test.ping'
    }
    response = session.post('{}'.format(salt_master.api_url), json=[data])
    if response.status_code != 200:
        create_salt_error_notification('Salt api {} response not 200'.format(salt_master.api_url))
        logging.error("Error pinging minions. {}".format(response.status_code))
    if 'error' in response.text:
        create_salt_error_notification('Error in salt api {} response'.format(salt_master.api_url))
    result = response.json()
    return result['return'][0]


def salt_sync_module(salt_master, minion_id=None):
    session = get_salt_session(salt_master)
    if minion_id:
        minions = salt_master.minions.filter(id=minion_id)
    else:
        minions = salt_master.minions.filter(mission_control_minion=True)
    for minion in minions:
        data = {
            'client': 'local',
            'tgt': minion.name,
            'fun': 'saltutil.sync_modules'
        }
        response = session.post('{}'.format(salt_master.api_url), json=[data])
        if response.status_code != 200:
            logging.error("Error pinging minions. {}".format(response.status_code))
            create_salt_error_notification('Salt api {} response not 200'.format(salt_master.api_url))
        if 'error' in response.text:
            create_salt_error_notification('Error in salt api {} response'.format(salt_master.api_url))


def salt_update_module_permissions(salt_master, minion_id=None):
    logging.info("Start updating modules folder permissions")
    session = get_salt_session(salt_master)
    if minion_id:
        minions = salt_master.minions.filter(id=minion_id)
    else:
        minions = salt_master.minions.filter(mission_control_minion=True)
    for minion in minions:
        data = {
            'client': 'local',
            'tgt': minion.name,
            'fun': 'state.apply',
            'arg': 'mission_control.manage_mod_dir'
        }
        response = session.post('{}'.format(salt_master.api_url), json=[data])
        if response.status_code != 200:
            logging.error("Error update module permissions. {}".format(response.status_code))
            return
        logging.info("Permissions for {} was changed successfully".format(minion.name))


def parse_functions_in_module(module_path):
    result = []
    with open(module_path, 'r') as f:
        function_name = ''
        doc_string = ''
        doc_lines = []
        variables = []
        for line in f.readlines():
            if 'def' in line and line.index('def') == 0:
                # if we find next function storing data for previous
                if function_name:
                    result.append((function_name, doc_string, variables))
                    doc_lines = []
                    doc_string = ""
                    variables = []
                function_name = line[4:line.index('(')]

            if '"""' in line and function_name and not doc_lines:
                doc_lines.append(line)
            elif '"""' in line and function_name and doc_lines:
                doc_lines.append(line)
                doc_string = '\n'.join(doc_lines)
                doc_lines = []

            if '"""' not in line and doc_lines:
                doc_lines.append(line)

            if 'pillar' in line:
                names = parse_line(line)
                variables.extend(names)
        if function_name:
            result.append((function_name, doc_string, variables))
    # function_name, doc_string, variables
    return result


def read_modules_from_disk(path=settings.MODULES_PATH):
    modules = [f for f in listdir(path) if isfile(join(path, f))]
    new_modules = []
    for file_name in modules:
        module_path = join(path, file_name)
        module_name = file_name.split('.')[0]
        functions = parse_functions_in_module(module_path)
        for function_name, doc_string, variables in functions:
            module, created = Module.objects.update_or_create(name=module_name)
            function, created = Function.objects.update_or_create(
                module=module,
                name=function_name,
                private_function=function_name.startswith('_'),
                from_master=True,
                defaults={
                    'doc_string': doc_string
                }
            )
            if created:
                new_modules.append(function.full_name)
            for variable_name in variables:
                if variable_name:
                    ExpectedVariable.objects.get_or_create(
                        function=function,
                        name=variable_name
                    )
    if new_modules:
        create_notification(
            'New modules was founded',
            Notification.NEW_MODULE,
            ''.join(['<p>{}</p>'.format(x) for x in new_modules])
        )


def manage_key(minion, operation):
    salt_master = minion.salt
    session = get_salt_session(salt_master)
    data = {
        'client': 'wheel',
        'fun': 'key.{}'.format(operation),
        'match': minion.name
    }
    response = session.post('{}'.format(salt_master.api_url), json=[data])
    if response.status_code != 200:
        logging.error("Error pinging minions. {}".format(response.status_code))

    from .tasks import update_minion_and_status
    update_minion_and_status(salt_master.id)
    return response.json()


def get_playbook_variables(playbook, function):
    variables = {}
    for item in playbook.playbook_mappings.filter(function_variable__function=function).select_related(
            'function_variable', 'variable'):
        salt_variable_name = item.function_variable.name
        variable = item.variable
        value = ''
        if variable and variable.encrypted:
            value = read_secret(
                variable.variable_set.hvac_path,
                variable.hvac_path
            )
        elif variable:
            value = variable.value
        if variable and variable.variable_type == Variable.JSON:
            value = json.loads(value)
        elif variable and variable.variable_type == Variable.INT:
            value = int(value)
        variables[salt_variable_name] = value
    return variables


def get_condition_variables(condition, redis_variable=None):
    """
    :param condition: condition object for which we creating permissions
    :param redis_variable: if required variable from redis -> set it
    :return: dict
    """
    variables = {}
    for item in condition.conditionvariable_set.select_related('function_variable', 'variable'):
        salt_variable_name = item.function_variable.name
        variable = item.variable
        if item.redis_variable_value:
            variables[salt_variable_name] = redis_variable
            continue
        value = ''
        if variable and variable.encrypted:
            value = read_secret(
                variable.variable_set.hvac_path,
                variable.hvac_path
            )
        elif variable:
            value = variable.value
        if variable and variable.variable_type == Variable.JSON:
            value = json.loads(value)
        elif variable and variable.variable_type == Variable.INT:
            value = int(value)
        variables[salt_variable_name] = value
    return variables


def setup_next_function(playbook, execution, function_item, next_item, next_random_variable, condition_id=None,
                        redis_item=None):
    """
    add next function to queue or create
    :param playbook: playbook instance
    :param execution: current execution instance
    :param function_item: current function item
    :param next_item: next function item
    :param next_random_variable: next random variable
    :param condition_id: condition id if exists
    :param redis_item: redis item name in case if condition depend on redis variable
    :return:
    """
    write_variable = "{}-{}".format(playbook.name, next_random_variable)
    if next_item.schedule:
        data = dict(
            playbook=playbook,
            function=next_item.function,
            run=execution.run,
            read_variable_name=execution.write_variable_name
        )
        next_execution, created = Execution.objects.get_or_create(
            **data, defaults={'write_variable_name': write_variable}
        )
        if created:
            # if task should run periodically we creating periodical task for this function
            next_item.name = '{} execution {} condition {} execution {}'.format(
                playbook.name, next_item.function.name, condition_id, next_execution.id
            )
            if condition_id and redis_item:
                arguments = '["{}", "{}", "{}", "{}", "{}"]'.format(
                    playbook.id,
                    next_item.id,
                    next_execution.id,
                    condition_id,
                    redis_item
                )
            elif condition_id:
                arguments = '["{}", "{}", "{}", "{}"]'.format(
                    playbook.id,
                    next_item.id,
                    next_execution.id,
                    condition_id,
                )
            else:
                arguments = '["{}", "{}", "{}"]'.format(
                    playbook.id,
                    next_item.id,
                    next_execution.id
                )
            create_or_update_periodic_task(
                next_item,
                'saltmaster.tasks.execute_playbook_function',
                arguments
            )
            next_execution.celery_periodic_runner = next_item.celery_periodic_runner
            next_execution.save()
    else:
        next_execution = Execution.objects.create(
            playbook=playbook,
            function=next_item.function,
            read_variable_name=execution.write_variable_name,
            write_variable_name=write_variable,
            run=execution.run
        )
        # if function should be executed right after current one, we just add id to queue
        from saltmaster.tasks import execute_playbook_function
        execute_playbook_function.delay(playbook.id, next_item.id, next_execution.id, condition_id, redis_item)