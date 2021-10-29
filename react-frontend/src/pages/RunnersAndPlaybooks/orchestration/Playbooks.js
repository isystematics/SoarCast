import React, { useState, useEffect } from "react";
import '../styles.css'
import { useHistory } from "react-router-dom"
import GridFormControl from '../../../components/GridFormControl/GridFormControl.js';
import { API } from "Api";
import { useSnackbar } from 'notistack';
const Playbooks = () => {
  // Determine whether the data has loaded
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

const [error, setError] = useState('');

// Playbook table and data
const [playbookColumns, setPlaybookColumns] = useState([
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'schedule', headerName: 'Schedule', flex: 1 },
])
const [playbookRows, setPlaybookRows] = useState([]);
const [selectedPlaybookRows, setSelectedPlaybookRows] = useState();
const [playbookData, setPlaybookData] = useState([]);

const [model, setModel] = useState({id:''});

const [minionData, setMinionData] = useState([]);

const [functionData, setFunctionData] = useState([]);

const [variableSetData, setVariableSetData] = useState([]);

const [variableData, setVariableData] = useState([]);

const [conditionData, setConditionData] = useState([]);

  const history = useHistory();
  const [logoutCounter, setLogoutCounter] = useState(0);
  // Log the user out
  useEffect(() => {
    if (logoutCounter === 1)
      {
        alert("Your session has expired. Please login again.")
        sessionStorage.removeItem('token')
        history.push('/logout')
      }
  }, [logoutCounter]);
  useEffect(() => {
    getPlaybookData()
    getMinionData()
    getFunctionData()
    getVariableSetData()
    getVariableData()
    getConditionData()
  }, []);
  async function getPlaybookData() {
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
        let response = await API.playbooks.list(params);
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
        tempRows.push({ id: result.id, name: result.name, schedule: result.schedule})
      }
      setPlaybookRows(tempRows);
      setPlaybookData(data)
    }
      catch(error) {
        handleError(error);
      }
  }

  async function getMinionData() {
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
        let response = await API.minions.list();
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
        setMinionData(data)
      }
    }
    catch(error) {
      handleError(error);
    }
  }

  async function getVariableData() {
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
        let response = await API.variables.list();
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
        setMinionData(data)
      }
    }
    catch(error) {
      handleError(error);
    }
  }

  async function getFunctionData() {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages)
      {
        let response = await API.modules.list();
        if (response.status === 200)
        {
            let modules = response.data.results;
            modules.map(module => {
              module.functions.map(functionObject =>
                {
                    const result = {id: functionObject.id, name: `${module.name}.${functionObject.name}`}
                    data = data.concat(result)
                }
                );
            })
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
      setFunctionData(data)
    }
    catch(error) {
      handleError(error);
    }
  }

  async function getConditionData(depthParam) {
    let morePages = true

    let pageIndex = 1

    let data = []
    
    try
    {
      while (morePages)
      {
        let params = {
            depth: depthParam,
            page: pageIndex
        }
        let response = await API.conditions.listAll(params);
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
        tempRows.push({ id: result.id, name: result.name, condition: result.condition})
      }
      setConditionData(data)
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

  async function getVariableSetData() {
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
      setVariableSetData(data);
    }
    catch(error) {
      handleError(error);
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
const executePlaybook = async () =>
{
  if (model != null){
    try {
      const response = await API.playbooks.execute(model.id);
      if (response.status === 202)
        enqueueSnackbar("Started execution.", {variant:"success"});
    } 
    catch(error){
      handleError(error);
    }
  }
}

  async function deletePlaybook(selectedPlaybookRows)
  {
    if (selectedPlaybookRows != null)
    {
      let id = selectedPlaybookRows[0]

      var result = confirm("Are you sure you want to delete this playbook?");
      if (result)
      {
        try {
          const response = await API.playbooks.delete(id);
          if (response.status === 204)
          {
            enqueueSnackbar("Deleted Playbook.", {variant:"success"});
            getPlaybookData()
            setSelectedPlaybookRows(null)
          }
        } 
        catch(error){
          handleError(error);
        }
      }
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
  const playbookMappingsOptions = {
    embedded: true,
    param: 'playbook',
    gridOptions: {
      label: 'Playbook Mappings',
      readOnly: true,
      columns: [
        { field: 'function_variableName', headerName: 'Function Variable', flex: 1 },
        { field: 'variableName', headerName: 'Variable', flex: 1 },
      ]
    },
    formOptions: {
      label: 'Item Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'variable', type: 'array', label:'Variable', value: '', arrayList: variableData},
      ]
    },
    ApiCalls: {
      list: (params) => API.playbookMappings.list(params),
      edit: (id, data) => API.playbookMappings.edit(id, data),
    }
  }
  const playbookItemOptions = {
    embedded: true,
    param: 'playbook',
    gridOptions: {
      label: 'Playbook Items',
      readOnly: true,
      columns: [
        { field: 'functionName', headerName: 'Function', flex: 1 },
        { field: 'group', headerName: 'Order in Playbook', flex: 1 },
      ]
    },
    formOptions: {
      label: 'Item Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'group', type: 'number', label:'Group', value: ''},
        {field: 'expect_write_variable', type: 'bool', label:'Expect Write Variable', value: ''},
        {field: 'expect_read_variable', type: 'bool', label:'Expect Read Variable', value: ''},
        {field: 'run_without_result', type: 'bool', label:'Run Without Result', value: ''},
        {field: 'conditions', type: 'multiSelect', label:'Conditions', value: [], arrayList: conditionData},
        {field: 'schedule', type: 'text', label:'Schedule', value: ''},
        {field: 'timeout', type: 'number', label:'Timeout', value: ''},
        {field: 'close_condition_check', type: 'number', label:'Close Condition Check', value: '', required: true},
      ]
    },
    ApiCalls: {
      list: (params) => API.playbookItems.list(params),
      edit: (id, data) => API.playbookItems.edit(id, data),
    }
  }
  const playbookOptions = {
    setParentModel: setModel,
    gridOptions: {
      label: 'Playbooks',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'schedule', headerName: 'Schedule', flex: 1},
        { field: 'minionName', headerName: 'Minion', flex: 1},
      ],
    },
    formOptions: {
      label: 'Playbook Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text', label:'Name', value: '', required: true},
        {field: 'schedule', type: 'text', label:'Schedule', value: ''},
        {field: 'variable_sets', type: 'multiSelect', label:'Variable Sets', value: [], required: true, arrayList:variableSetData},
        {field: 'minion', type: 'array', label:'Minions', value: [], required: true, arrayGet: API.minions.list({depth: 2})},
        {field: 'functions', type: 'multiSelect', label:'Functions', value: [], required: true, arrayList:functionData},
      ],
      buttonOptions: [
        {label: 'Execute Playbook', type: 'button', color: 'primary', buttonAction:executePlaybook},
      ],
    },
    tabs: [
      {label: 'Playbook Items', content:playbookItemOptions},
      {label: 'Playbook Mappings', content:playbookMappingsOptions},
    ],
    ApiCalls: {
      list: (params) => API.playbooks.list(params),
      add: (data) => API.playbooks.add(data),
      edit: (id, data) => API.playbooks.edit(id, data),
      delete: (id) => API.playbooks.delete(id),
    }
  }
  useEffect(()=>{
    getVariableSetData();
  },[])
  return (
    <>
      <GridFormControl options={playbookOptions} />
    </>
  );
  
}
export default Playbooks;