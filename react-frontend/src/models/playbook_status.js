const Playbook_status = {
    Waiting: 'Waiting',
    Started: 'Started',
    Done_no_variable: 'Done with no value in variable',
    Failed: 'Failed',
    Added_next_module_to_queue: 'Added next module to queue',
    Stopped: 'Stopped',
    Periodic_task: 'Has periodic task',
    getType: (type) => {
        switch(type){
            case 0:
                return Playbook_status.Waiting;
            case 1:
                return Playbook_status.Started;
            case 2:
                return Playbook_status.Done_no_variable;
            case 3:
                return Playbook_status.Failed;
            case 4:
                return Playbook_status.Added_next_module_to_queue;
            case 5:
                return Playbook_status.Stopped;
            case 6:
                return Playbook_status.Periodic_task;

        }
    }
}

export default Playbook_status;