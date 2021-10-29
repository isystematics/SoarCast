const minionStatus_types = {
    ACCEPTED: "Accepted",
    DENIED: "Denied",
    REJECTED: "Rejected",
    UNACCEPTED: "Unaccepted",
    DISCONNECTED: "Disconnected",
    getType: (type) => {
        switch(type){
            case 0:
                return minionStatus_types.ACCEPTED;
            case 1:
                return minionStatus_types.DENIED;
            case 2:
                return minionStatus_types.REJECTED;
            case 3:
                return minionStatus_types.UNACCEPTED;
            case 4:
                return minionStatus_types.DISCONNECTED;
        }
    }
}

export default minionStatus_types