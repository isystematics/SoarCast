import React, { useState, useEffect, useMemo } from "react"
import { useSnackbar } from 'notistack';
import { useHistory } from "react-router-dom"
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import GridControl from './GridControl.js';
import FormControl from './FormControl.js';
import { Tabs, Tab, AppBar, Checkbox } from "@material-ui/core";
import './GridFormControl.css';
const GridFormControl = ({options, id}) => {
    const [model, setModel] = useState({id:''});
    const [modelData, setModelData] = useState([])
    const [loading, setLoading] = useState(false);
    const [displayForm, setDisplayForm] = useState(!options.gridOptions);
    const [refreshForm, setRefreshForm] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [serverPageIndex, setServerPageIndex] = useState(0);
    const [rowCount, setRowCount] = useState(0);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [GridData, setGridData] = useState([]);
    const [formFields, setFormFields] = useState(options.formOptions ? options.formOptions.formFields : []);
    const history = useHistory();
    const [logoutCounter, setLogoutCounter] = useState(0);
    useEffect(() => {
        if (logoutCounter === 1) {
            alert("Your session has expired. Please login again.")
            sessionStorage.removeItem('token')
            history.push('/logout')
        }
    }, [logoutCounter]);
    useEffect(()=>{
        getData(0);
    },[options.refreshData])
    const getData = async (newPageIndex) => {
        //Need to handle pagination
        try{
            setLoading(true);
            let params = {
                depth : 2,
                page: newPageIndex ? newPageIndex : 1,
            }
            if ('embedded' in options)
            {
                console.log(options.param)
                params[options.param] = id;
            }
            let response = await options.ApiCalls.list(params);
            if (response.status === 200) {
                if (options.param === 'condition')
                {
                    console.log(response.data.results)
                    console.log(id)
                    response.data.results = response.data.results.filter(result => result.condition == id)
                    console.log(response.data.results)
                }
                setGridData(response.data.results);
                setRowCount(response.data.count)
                setLoading(false);
                setModelData(response.data.results)
                return response.data;
            }
        }
        catch(error){
            handleError(error);
        }
    }
    function string_to_slug (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();
      
        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to   = "aaaaeeeeiiiioooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
    
        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes
    
        return str;
       }
    const convertObjects = (model) => {
        Object.keys(model).forEach(key=>{
            if(model[key].isObject)
            {
                if(model[key].id)
                    model[key] = model[key].id;
                else
                    model[key] = [];
            }
            else if(typeof(model[key]) == 'object'){
                let results = [];
                model[key].forEach(item=>{
                    if(item.value)
                        results.push(item.value);
                });
                model[key] = results;
            }
        })
        return model;
    }
    const postData = async () => {
        try{
            setLoading(true);
            let convertedModel = convertObjects(model);
            switch(options.formOptions.label){
                case 'Playbook Details':
                    if (convertedModel['variable_sets'][0] === undefined)
                    {
                        let array = []
                        formFields[3].value.map(object => 
                            {
                                array.push(object.id)
                            })
                        convertedModel['variable_sets'] = array
                    }
                    /* convertedModel['minion'] = convertedModel['minion'][0]
                    if (convertedModel['minion'] === undefined)
                    {
                        if (Array.isArray(formFields[4].value))
                        {
                            convertedModel['minion'] = formFields[4].value[0].id
                        }
                        else
                        {
                            convertedModel['minion'] = formFields[4].value.id
                        }
                    } */
                    if (convertedModel['functions'][0] === undefined)
                    {
                        let array = []
                        formFields[5].value.map(object => 
                            {
                                array.push(object.id)
                            })
                        convertedModel['functions'] = array
                    }
                    if (model.id === '')
                    {
                        convertedModel = {...convertedModel, playbook_items: [], playbook_mappings: []}
                    }
                    else
                    {
                        const filteredData = modelData.filter(object => object.id == model.id)
                        let playbookItemsArray = []
                        filteredData[0].playbook_items.map(playbookItem => 
                        {
                            playbookItemsArray.push(playbookItem.id)
                        });
                        let playbookMappingsArray = []
                        filteredData[0].playbook_mappings.map(playbookMapping => 
                        {
                            playbookMappingsArray.push(playbookMapping.id)
                        });
                        convertedModel = {...convertedModel, playbook_items: playbookItemsArray, playbook_mappings: playbookMappingsArray}
                    }
                    break;
                case 'Variable Sets':
                    var hvac_path = string_to_slug(convertedModel['name'])
                    convertedModel['hvac_path'] = hvac_path 
                    delete convertedModel.variables
                    if (Array.isArray(convertedModel['app']))
                    {
                        convertedModel['app'] = convertedModel['app'][0]
                    }
                    break;
                case 'Variables':
                    var hvac_path = string_to_slug(convertedModel['name'])
                    convertedModel['hvac_path'] = hvac_path; 
                    convertedModel['variable_set'] = id;
                    if (convertedModel['encrypted'] === '')
                        convertedModel['encrypted'] = false;
                    convertedModel['value'] === '' ? (convertedModel['has_value'] = false) : convertedModel['has_value'] = true;
                    convertedModel['variable_type'] = 1
                    break;
                case 'Email Setting':
                    convertedModel['use_tls'] === true ? (convertedModel['use_tls'] = 1) : convertedModel['use_tls'] = 0
                    convertedModel['use_ssl'] === true ? (convertedModel['use_ssl'] = 1) : convertedModel['use_ssl'] = 0    
                    break;
                case 'Redis Settings':
                    convertedModel['verify_certificate'] = false;
                    break;
                case 'Variable Details':
                    convertedModel['condition'] = id;
                    break;
            }
            let response = await (model.id != '' ? options.ApiCalls.edit(model.id, convertedModel) : options.ApiCalls.add(convertedModel));
            if(response.status){
                getData();
                enqueueSnackbar((model.id != '' ? "Saved." : "Added."), {variant:"success"});
                setDisplayForm(false);
            }
        }catch(error){
            console.log(error)
            handleError(error);
        }
    }
    const deleteData = async () => {
        var result = confirm("Are you sure you want to delete this?");
        if(result && model.id){
            try{
              setLoading(true);
              const response = await options.ApiCalls.delete(model.id);
              if(response.status){
                setPageIndex(0);
                setServerPageIndex(0);
                getData();
                enqueueSnackbar("Deleted.", {variant:"success"});
                setDisplayForm(false);
                setLoading(false);
              }
            }
            catch(error){
                handleError(error);
            }
        }
    }
    
    const handlePageChange = async (gridPage) => {
        setPageIndex(gridPage);
        let newServerPage = Math.floor(gridPage / 2)  + 1;
        if(newServerPage > serverPageIndex && gridPage % 2 == 0){
            try{
                setServerPageIndex(newServerPage);
                let response = await getData(newServerPage);
                if(response){
                    let newTemp = [];
                    response.results.forEach(y=>{
                        if(newServerPage === 1 && GridData.length < 1){
                            newTemp.push(y)
                        }else{
                            GridData.push(y)
                        };
                    })
                    if(newServerPage === 1 && GridData.length < 1){
                        setGridData(newTemp);
                    }else{
                        setGridData(GridData);
                    }
                    setRowCount(response.count);
                }
            }catch(error){
                handleError(error);
            }
        } 
    }
    
    const updateModel = (object, isNew) => {
        Object.keys(object).forEach(key=>{
            model[key] = (isNew === true ? '' : ConvertType(object[key]));
            if(formFields){
                formFields.forEach(formField=>{
                    if(formField.field === key){
                        formField.value = (isNew === true ? '' : ConvertType(object[key]));
                        formField.error = false;
                    }
                });
            }
        });
        setModel(model);
        
        if(formFields)
            setFormFields(formFields);

        if(options.setParentModel)
            options.setParentModel(model);

        if(options.setParentFormFields)
            options.setParentFormFields(formFields);

        setRefreshForm(!refreshForm);
    }
    const ConvertType = (value)=>{
        switch(typeof value){
            case 'object':
                if(value == null)
                    return '';
                if(value.length > 0)
                {
                    return value;
                }
                return {isObject:true, id:value.id, name:value.name};
            case 'array':
            case 'number':
            case 'string':
            default:
                return value;
        }
    }
    const handleError = (error) => {
        setLoading(false);
        setDisplayForm(false);
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
    useEffect(()=>{
        if(options.gridOptions)
            handlePageChange(serverPageIndex);
    },[])
    const [tab, setTab] = useState(0);
    useEffect(()=>{
        setTab(0);
    },[displayForm])
    return (
        loading == true ? 
            <LoadingOverlay/> 
        :
            (options.tabs ? 
                <>
                    {options.gridOptions && <GridControl setParentSelectionModel={options.setParentSelectionModel} hasForm={options.formOptions != undefined} data={GridData} pageIndex={pageIndex} setDisplayForm={setDisplayForm} model={model} updateModel={updateModel} rowCount={rowCount} gridOptions={options.gridOptions} handlePageChange={handlePageChange}/>}
                    {displayForm && 
                        <div id='formPositioner' className={'tabPositioner ' + (displayForm==false ? 'unselectable' : 'overlayed ')}>
                            <div className={'onlyFormContainer grow'}>
                                <AppBar position='static'>
                                    <Tabs value={tab} onChange={(e, v)=>setTab(v)}>
                                        <Tab value={0} label={'General'} />
                                        {options.tabs.map((tab, i)=>{
                                            if(model.id == ''){
                                                return <></>;
                                            }
                                            return <Tab value={i + 1} label={tab.label} />
                                            })}
                                    </Tabs>
                                </AppBar>
                                <div className={"jtabClosePositioner"}>
                                    <div className="jclose" onClick={()=>{setDisplayForm(false)}}>
                                        <div style={{width:'100%',height:'100%'}}>
                                            X
                                        </div>
                                    </div>
                                </div>
                                <div className='tabsContent'>
                                    {tab == 0 && 
                                        <FormControl isTabs={Boolean(options.tabs)} refresh={refreshForm} setDisplayForm={setDisplayForm} model={model} updateModel={updateModel} deleteData={deleteData} postData={postData} options={options.formOptions}/>
                                    }
                                    {options.tabs.map((obj, i)=>{
                                        return (<>{tab == (i + 1) && <GridFormControl options={obj.content} id={model.id} />}</>)
                                    })}
                                </div>
                            </div>
                        </div>
                    }
                </>
            :
            <>
                {options.formOptions && !options.gridOnly && displayForm && <FormControl refresh={refreshForm} setDisplayForm={setDisplayForm} model={model} updateModel={updateModel} deleteData={options.ApiCalls.delete ? deleteData : undefined} postData={postData} options={options.formOptions}/>}
                {options.gridOptions && <GridControl setParentSelectionModel={options.setParentSelectionModel} hasForm={options.formOptions != undefined} data={GridData} pageIndex={pageIndex} setDisplayForm={setDisplayForm} model={model} updateModel={updateModel} rowCount={rowCount} gridOptions={options.gridOptions} handlePageChange={handlePageChange}/>}
            </>
        )
    )
}
export default GridFormControl;