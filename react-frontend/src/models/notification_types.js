const Notification_types = {
    NEW_FUNCTION: "New Function in module",
    NEW_MINION: "New Minion",
    SALT_ERROR: "Salt Error",
    NOT_COVERED_FILE_IN_CONDITION: "Not Covered File in Condition",
    getType: (type) => {
        switch(type){
            case 0:
                return Notification_types.NEW_FUNCTION;
            case 1:
                return Notification_types.NEW_MINION;
            case 2:
                return Notification_types.SALT_ERROR;
            case 3:
                return Notification_types.NOT_COVERED_FILE_IN_CONDITION;
        }
    }
}

export default Notification_types
