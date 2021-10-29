const Variable_types = {
    INTEGER: "Integer",
    STRING: "String",
    JSON: "JSON",
    getType: (type) => {
        switch(type){
            case 0:
                return Variable_types.INTEGER;
            case 1:
                return Variable_types.STRING;
            case 2:
                return Variable_types.JSON;
        }
    }
}

export default Variable_types