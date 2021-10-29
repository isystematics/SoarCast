import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import AddConditionForm from './AddConditionForm.js'
import EditConditionTabBar from './EditConditionTabBar.js'
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { DataGrid } from '@material-ui/data-grid';
import { API } from "Api";
import CircularProgress from '@material-ui/core/CircularProgress'
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import GridFormControl from "components/GridFormControl/GridFormControl";
import boolGridElement from "components/Common/boolGridElement";
const Conditions = () => {
  // Determine whether the data has loaded
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
const [loading, setLoading] = useState(false)

const [error, setError] = useState('');

// Playbook table and data
const [columns, setColumns] = useState([
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'condition', headerName: 'Condition', flex: 1 },
])
const [rows, setRows] = useState([]);
const [selectedRows, setSelectedRows] = useState([]);
const [data, setData] = useState([]);
const [variableSetData, setVariableSetData] = useState([]);
const [functionVariableData, setFunctionVariableData] = useState([]);
  const history = useHistory()

  const [logoutCounter, setLogoutCounter] = useState(0)

  // Log the user out
  useEffect(() => {
    if (logoutCounter === 1)
      {
        alert("Your session has expired. Please login again.")
        sessionStorage.removeItem('token')
        history.push('/logout')
      }
  }, [logoutCounter]);

  // The API calls are made every time the component rerenders.
  
  useEffect(async () => {
    await getVariableSetData();
    await getFunctionVariableData(2);
    getData(3);
  }, []);


  // This function takes in the API endpoint and the data type it is getting to determine which type of data (runner, mapping, etc.) to get.

  // If the call to the API returns a 403 request, this means that the user's JWT token has expired. It will then display an alert
  // and redirect the user to the logout page. Because the API calls are made asynchronously, a logout counter is used to make sure
  // the logout action only occurs once instead of occuring multiple times on simultaneous failed API calls.

  async function getData(depthParam) {
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
      setRows(tempRows);
      setData(data)
      setLoading(true)
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
      while (morePages) {
        let params = {
          page: pageIndex
        };
        let response = await API.variables.list(params);
        if (response.status === 200) {
          let results = response.data.results
          data = data.concat(results)
          if (response.data.next === null)
            morePages = false
          else
            pageIndex++
        }
      }
      data.sort((a, b)=>(a.id > b.id) ? 1 : -1);
      setVariableSetData(data);
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else
        enqueueSnackbar("There was a problem connecting with the server.");
    }
  }
  const getFunctionVariableData = async (depthParam) => {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages) {
        let params = {
          depth: depthParam,
          page: pageIndex
        }
        let response = await API.functionVariables.list(params);
        if (response.status === 200) {
            let results = response.data.results;
            data = data.concat(results);
            if (response.data.next === null)
              morePages = false;
            else
              pageIndex++;
        }
      }
      data.sort((a, b)=>(a.id > b.id) ? 1 : -1);
      let dataArray = [];
      for(let i = 0; i < data.length; i++){
        let result = data[i];
        dataArray.push({ id: result.id, name: `${result.function.module.name}.${result.function.name}: ${result.name}`})
      }
      setFunctionVariableData(dataArray);
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else
        enqueueSnackbar("There was a problem connecting with the server.");
    }
  }
async function deleteCondition(selectedRows)
{
  if (selectedRows.length > 0)
  {
    let id = selectedRows[0]

    var result = confirm("Are you sure you want to delete this playbook condition?");
    if (result)
    {
      try {
        const response = await API.conditions.delete(id);
        if (response.status === 204)
        {
          enqueueSnackbar("Deleted Playbook Condition.", {variant:"success"});
          getData(3)
          setSelectedRows([])
        }
      } 
      catch(error){
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
  }
}
const convertName = (array, incomingValue) => {
  let tempName = '';
  array.forEach(item=>{
    if(item.id == incomingValue){
      tempName = item.name;
    }
  })
  return tempName;
}
const playbookVariablesOptions = {
  embedded: true,
  param: 'condition',
  gridOptions: {
    label: ' Condition Variables',
    columns: [
      { field: 'function_variable', headerName: 'Function Variable', flex: 1, renderCell:(params)=>convertName(functionVariableData, params.value)  },
      { field: 'variable', headerName: 'Variable', flex: 1, renderCell:(params)=>convertName(variableSetData, params.value)  },
      { field: 'redis_variable_value', headerName: 'Redis Variable Value', flex: 1, renderCell:(params)=>boolGridElement(params.value)},
    ]
  },
  formOptions: {
    label: 'Variable Details',
    formFields: [
      {field: 'id', type: 'number', value: ''},
      {field: 'redis_variable_value', type: 'bool', label:'Redis Variable Value', value: ''},
      {field: 'function_variable', type: 'array', label:'Function Variable', value: '', arrayList: functionVariableData},
      {field: 'variable', type: 'array', label:'Variable', value: '', arrayList: variableSetData},
    ]
  },
  ApiCalls: {
    list: (params) => API.conditionVariables.list(params),
    add: (data) => API.conditionVariables.add(data),
    edit: (id, data) => API.conditionVariables.edit(id, data),
    delete: (id) => API.conditionVariables.delete(id)
  }
}
const playbookConditionsOptions = {
  gridOptions: {
    label: 'Playbook Conditions',
    columns: [
      { field: 'name', headerName: 'Mapping', flex: 1 },
      { field: 'condition', headerName: 'Condition', flex: 1},
    ],
  },
  formOptions: {
    label: 'Condition Details',
    formFields: [
      {field: 'id', type: 'number', value: ''},
      {field: 'name', type: 'text', label:'Name', value: ''},
      {field: 'condition', type: 'text', label:'Condition', value: ''},
    ]
  },
  tabs: [
    {label: 'Variables', content:playbookVariablesOptions},
  ],
  ApiCalls: {
    list: (params) => API.conditions.listAll(params),
    add: (data) => API.conditions.add(data),
    edit: (id, data) => API.conditions.edit(id, data),
    delete: (id) => API.conditions.delete(id),
  }
}
  return (
    <>
    {loading ? (
      <GridFormControl options={playbookConditionsOptions}/>
      ) : <LoadingOverlay />
      }
      </>
  )
}
export default Conditions;