const Runner_status = {
    Default: "Status Not Found",
    In_Queue: "In Queue",
    In_Progress: "In Progress",
    Done: "Done",
    Failed: "Failed",
    getType: (type) => {
        switch(type){
            case -1:
                return Runner_status.Default;
            case 0:
                return Runner_status.In_Queue;
            case 1:
                return Runner_status.In_Progress;
            case 2:
                return Runner_status.Done;
            case 3:
                return Runner_status.Failed;
        }
    }
}

export default Runner_status;