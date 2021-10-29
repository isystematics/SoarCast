import { useEffect, useState, useMemo } from "react";
import { useSnackbar } from 'notistack';
import { useHistory } from "react-router-dom";
import { Select, MenuItem, InputLabel, CircularProgress } from '@material-ui/core';
const DropdownControl = ({model, formField, updateModel, refresh, readOnly}) => {
    const [arrayData, setArrayData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    const history = useHistory();
    const [logoutCounter, setLogoutCounter] = useState(0);
    useEffect(() => {
        if (logoutCounter === 1) {
            alert("Your session has expired. Please login again.")
            sessionStorage.removeItem('token')
            history.push('/logout')
        }
    }, [logoutCounter]);
    const getData = async () => {
        try{
            let data = [];
            if(formField.arrayList){
                data = formField.arrayList;
            } else {
                setLoading(true);
                let response = await formField.arrayGet;
                if(response.status){
                    if(formField.convertValue){
                        let results = [];
                        response.data.results.forEach(y=>{
                            results.push(formField.convertValue(y));
                        })
                        data = results;
                    } else {
                        data = response.data.results;
                    }
                    setLoading(false);
                }
            }
            if(data.length > 0){
                setArrayData(data);
            }
        }
        catch(error){
            handleError(error);
        }
    }
    const handleError = (error) => {
        setLoading(false);
        if (error.request)
        {
            switch(error.request.status){
                case 504:
                    enqueueSnackbar(error.request.statusText);
                    break;
                case 403:
                    setLogoutCounter(logoutCounter => logoutCounter + 1)
                    break;
                case 400:
                    const errorMessage = error.response.request.response
                    if (errorMessage.includes('non_field_errors'))
                    {
                        enqueueSnackbar('There is already a user with this name assigned to this app.')
                    }
                    else if (errorMessage.includes('email'))
                    {
                        enqueueSnackbar('Enter a valid email address.')
                    } else {
                        enqueueSnackbar(errorMessage);
                    }
                    break;
                default:
                    enqueueSnackbar("There was a problem connecting with the server.");
            }
        }
            
    }
    const handleInput = (newValue) => {
        let tempModel = model;
        tempModel[formField.field] = parseInt(newValue);
        updateModel(tempModel, false);
    }
    useEffect(()=>{
        getData();
    },[]);
    return (
        <>
        <InputLabel>{formField.label}</InputLabel>
        {loading ? <CircularProgress/> : 
            <Select disabled={readOnly} error={formField.error} required={formField.required} label={formField.label} className='dropdownInput' value={(model[formField.field] ? (model[formField.field].isObject != undefined ? model[formField.field].id : model[formField.field]) : '')} onChange={e => handleInput(e.target.value)}>
                {arrayData ? 
                    arrayData.map((result) => {
                        return(<MenuItem value={result.id}>{result.name}</MenuItem>)
                    })
                :
                    <MenuItem value={null}>None</MenuItem>
                }
            </Select>
        }
        </>
    )
}
export default DropdownControl;