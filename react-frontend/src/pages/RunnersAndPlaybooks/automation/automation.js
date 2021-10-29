import React, { useState, useEffect, useMemo } from "react";
import '../styles.css';
import './automation.css'
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress'
import RunnerForm from './RunnerForm.js'
import MappingForm from './MappingForm.js'
import VariableSetTabBar from './VariableSetTabBar.js'
import { useHistory } from "react-router-dom"
import { DataGrid } from '@material-ui/data-grid';
import { API } from "Api";
import { Tabs, Tab, AppBar, TextField } from "@material-ui/core";
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import GridFormControl from "components/GridFormControl/GridFormControl";
const automation_types = {
  RUNNER: 'Runner',
  MAPPING: 'Mapping',
  VARIABLE_SET: 'Variable Set',
}
const Automation = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [refresh, setRefresh] = useState(false);
  const [functionData, setFunctionData] = useState([]);
  const [minionData, setMinionData] = useState([]);
  const [modulesData, setModulesData] = useState([]);
  const [variableSetData, setVariableSetData] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, togglePage] = useState(automation_types.RUNNER);
  const history = useHistory();
  const [logoutCounter, setLogoutCounter] = useState(0);
  const [model, setModel] = useState({id:''});
  useEffect(() => {
      if (logoutCounter === 1) {
          alert("Your session has expired. Please login again.")
          sessionStorage.removeItem('token')
          history.push('/logout')
      }
  }, [logoutCounter]);
  const getFunctionData = async () => {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages)
      {
        let params = {
          page: pageIndex
        }
        let response = await API.modules.list(params);
        if (response.status === 200)
        {
            let results = response.data.results;
            data = data.concat(results)
            if (response.data.next === null)
            {
              morePages = false
            }
            else
            {
              pageIndex++
            }
        }
      }
      let results = [];
      data.forEach(item=>{
        item.functions.forEach(funct=>{
          results.push({id:funct.id, name: item.name + '.' + funct.name});
        })
      })
      setModulesData(results)
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
        }
        else {
            enqueueSnackbar("There was a problem connecting with the server.")
        }
    }
  }

  const getVariableSetData = async () => {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages)
      {
        let params = {
          page: pageIndex
        }
        let response = await API.variableSets.listAll(params);
        if (response.status === 200)
        {
          let results = response.data.results;
          data = data.concat(results)
          if (response.data.next === null)
          {
            morePages = false
          }
          else
          {
            pageIndex++
          }
        }
      }
      data.sort((a, b)=>
        (a.id > b.id) ? 1 : -1
      );
      let tempRows = [];
      for(let i = 0; i < data.length; i++){
        let result = data[i];
        tempRows.push({ id: result.id, name: result.name})
      }
      setVariableSetData(data);
      setRefresh(!refresh);
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
        }
        else {
            enqueueSnackbar("There was a problem connecting with the server.")
        }
    }
  }
  const executeRunner = async () =>
  {
    if (model != null){
      try {
        const response = await API.runners.execute(model.id);
        if (response.status === 202)
          enqueueSnackbar("Started execution.", {variant:"success"});
      } 
      catch(error){
        handleError(error);
      }
    }
  }
  const selectTab = (automationType) => {
    let tab = 0;
    let page = automationType;
    switch(automationType){
      case automation_types.MAPPING:
        tab = 1;
        break;
      case automation_types.VARIABLE_SET:
        tab = 2;
        break;
      case automation_types.RUNNER:
      default:
        break;
    }
    setSelectionModel([]);
    setSelectedTab(tab);
    togglePage(page);
  }
  const requestSecrets = async (email) => {
    if(email == null || email === '')
      return;
    try
    {
        let resultVariables = model.variables.map(y=>y.id);
        let data = {
          variables:resultVariables,
          email: email
        }
        let response = await API.requestSecrets.post(data);
        if (response.status === 201){
          enqueueSnackbar('Created', {variant:"success"}); 
          return false;
        }
    }
    catch(error) {
      handleError(error);
      return false;
    }
  }
  const handleError = (error) => {
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
    getMinions();
    getVariableSetData();
    getFunctionData();
  },[])
  const getMinions = async () => {
    try{
      let response = await API.minions.list();
      if(response.status == 200){
        setMinionData(response.data.results);
      }
    }catch(error){
      handleError(error);
    }
  }
  const convertName = (array, value) => {
    let tempName = '';
    array.forEach(item=>{
      if(item.id == value){
        tempName = item.name;
      }
    })
    return tempName;
  }
  const runnerOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    refreshData:refresh,
    gridOptions: {
      label: 'Runner',
      columns: [
        { field: 'mappingName', headerName: 'Mapping', flex: 1 },
        { field: 'minion', headerName: 'Minion', flex: 1, renderCell:(params)=>convertName(minionData, params.value) },
        { field: 'schedule', headerName: 'Schedule', flex: 1},
      ],
    },
    formOptions: {
      label: 'Runner Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'schedule', type: 'text', label:'Schedule', value: '', required: true},
        {field: 'minion', type: 'array',label:'Minion', value: '', arrayGet: API.minions.list({depth: 2})},
        {field: 'mapping', type: 'array',label:'Mapping', value: '', arrayGet: API.mappings.list({depth: 2})},
        {field: 'api_alias', type: 'text', label:'Api Alias', value: '', required: true},
        {field: 'permissions', type: 'array',label:'Permissions', value: '', convertValue:(obj)=>{return {id:obj.id, name:obj.name}}, arrayGet: API.appGroups.list({depth: 2})},
      ],
      buttonOptions: [
        {label: 'Execute Runner', type: 'button', color: 'primary', buttonAction:executeRunner},
      ],
    },
    ApiCalls: {
      list: (params) => API.runners.list(params),
      add: (data) => API.runners.add(data),
      edit: (id, data) => API.runners.edit(id, data),
      delete: (id) => API.runners.delete(id),
    }
  }
  const SecretsDropdown = () => {
    const [toggle, setToggle] = useState(false);
    const [secretsEmail, setSecretsEmail] = useState('');
    const [secretsError, setSecretsError] = useState(false);
    const [innerLoading, setInnerLoading] = useState(false);
    const secrets = useMemo(()=>{
      return (innerLoading ? <CircularProgress/> :
        <>
        <Button onClick={() =>{setToggle(!toggle)}} variant="contained" color={toggle == true ? 'secondary' : "primary"}>{toggle == true ? 'Close' : 'Request Secrets'}</Button> 
        {toggle && <div className={'popup '}>
            <div>Enter Email to send Request</div>
            <TextField value={secretsEmail} onChange={e => {setSecretsEmail(e.target.value);setSecretsError(false)}} error={secretsError} variant="filled" placeholder="Enter Email Address..." label={'Email'} />
            <Button className={'popupButton'} onClick={async ()=>{
              setInnerLoading(true);
              let response = await requestSecrets(secretsEmail);
              setToggle(response);
              setInnerLoading(false);
              }} variant="contained" color='primary'>Send Request</Button> 
          </div>}
          </>
      )
    },[toggle, secretsEmail, secretsError, innerLoading])
    return secrets;
  }

  const variableOptions = {
    embedded: true,
    param: 'variable_set',
    gridOptions: {
      label: 'Variables',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'hvac_path', headerName: 'HVAC Path', flex: 1 },
        { field: 'encrypted', headerName: 'Encrypted', flex: 1 },
        { field: 'has_value', label:'Has Value', flex: 1},
      ]
    },
    formOptions: {
      label: 'Variables',
      formFields: [
        {field: 'name', type: 'text', label:'Name', value: '', required: true},
        {field: 'encrypted', type: 'bool', label:'Encrypted', value: false},
        {field: 'value', type: 'text', label:'Value', value: ''},
        //{field: 'Variable Type', type: 'select', label:'Variable Type', value: '', required: true, arrayList: [{value: 1, label: 'Integer'}, {value: 2, label: 'String'}, {value: 3, label: 'JSON'}]},
      ]
    },
    ApiCalls: {
      list: (params) => API.variables.list(params),
      add: (data) => API.variables.add(data),
      edit: (id, data) => API.variables.edit(id, data),
      delete:  (id) => API.variables.delete(id)
    }
  }

  const variableSetOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    refreshData:refresh,
    gridOptions: {
      label: 'Variable Set',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'appName', headerName: 'App', flex: 1 },
      ],
    },
    formOptions: {
      label: 'Variable Sets',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text', label:'Name', value: '', required: true},
        {field: 'app', type: 'array', label:'Apps', value: '', arrayGet: API.apps.list({depth: 2})},
      ],
      buttonOptions: [
        {element: (<SecretsDropdown />)}
      ]
    },
    tabs: [
      {label: 'Variables', content: variableOptions},
    ],
    ApiCalls: {
      list: (params) => API.variableSets.listAll(params),
      add: (data) => API.variableSets.add(data),
      edit: (id, data) => API.variableSets.edit(id, data),
      delete: (id) => API.variableSets.delete(id),
    }
  }

  return (
    <>
      <AppBar position="static" >
        <Tabs value={selectedTab}>
          <Tab label="Runner" onClick={()=>selectTab(automation_types.RUNNER)} />
          <Tab label="Mapping" onClick={()=>selectTab(automation_types.MAPPING)} />
          <Tab label="Variable Set" onClick={()=>selectTab(automation_types.VARIABLE_SET)} />
        </Tabs>
      </AppBar>
      {selectedTab == 0 && minionData && <GridFormControl options={runnerOptions}/>}
      {selectedTab == 1 && functionData && variableSetData && 
        <MappingForm modulesData={modulesData}/>
      }
      {selectedTab == 2 && <GridFormControl options={variableSetOptions}/>}
    </>
  )
}
export default Automation;