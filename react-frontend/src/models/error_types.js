const error_types = {
    BAD_CONNECTION: "There was a problem with the connection.",
    SAME_NAME: "This name already exists.",
    getType: (type) => {
        switch(type){
            case 0:
                return error_types.BAD_CONNECTION;
            case 1:
                return error_types.BAD_CONNECTION;
            case 2:
                return error_types.BAD_CONNECTION;
            case 3:
                return error_types.BAD_CONNECTION;
            case 4:
                return error_types.BAD_CONNECTION;
        }
    }
}

export default error_types;

