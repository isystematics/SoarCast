import React, { useState, useEffect } from "react";
import '../styles.css'
import EditConditionVariableForm from './EditConditionVariableForm.js'
import { DataGrid } from '@material-ui/data-grid';
import { API } from "Api";
import { useHistory } from "react-router-dom"
import Button from '@material-ui/core/Button';
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
const ConditionVariables = (props) => {

  // Runner table and data
  const [columns, setColumns] = useState([
    { field: 'functionVariable', headerName: 'Function Variable', flex: 1 },
    { field: 'variable', headerName: 'Variable', flex: 1 },
    { field: 'redis', headerName: 'Redis Variable Value', flex: 1},
  ])
  const [rows, setRows] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [conditionVariableData, setConditionVariableData] = useState([]);
  const [functionVariableData, setFunctionVariableData] = useState([]);
  const [variableSetData, setVariableSetData] = useState([]);

  const [loadingConditionVariables, setLoadingConditionVariables] = useState(false)
  const [loadingFunctionVariables, setLoadingFunctionVariables] = useState(false)
  const [loadingVariableSets, setLoadingVariableSets] = useState(false)

  // Keep track if data has loaded
  const [loaded, setLoaded] = useState(false);
  const [logoutCounter, setLogoutCounter] = useState(0);
  const history = useHistory();
  // Log the user out
  useEffect(() => {
    if (logoutCounter === 1) {
        alert("Your session has expired. Please login again.")
        sessionStorage.removeItem('token')
        history.push('/logout')
      }
  }, [logoutCounter]);

  const populateTable = () =>
  {
    let conditionVariables = [];
    conditionVariables = props.data.filter(function(row) {
      return row.id === props.selectedCondition[0];
    });
    let data = conditionVariables[0].variables;
    data.sort((a, b)=>(a.id > b.id) ? 1 : -1);
    let tempRows = [];
    for(let i = 0; i < data.length; i++){
      let result = data[i];
      tempRows.push({ id: result.id, functionVariable: `${result.function_variable.function.module.name}.${result.function_variable.function.name}: ${result.function_variable.name}`, variable: result.variable != null ? (`${result.variable.variable_set.name} / ${result.variable.name}`) : 'No Variable Set', redis: result.redis_variable_value})
    }
    setRows(tempRows);
    setConditionVariableData(data);
    setLoadingConditionVariables(true);
}
  

  const getConditionVariableData = async (depthParam) => {
    try
    {
      let params = {
        depth: depthParam
      }
      let response = await API.conditions.list(props.selectedCondition[0], params);
      if (response.status === 200) {
        let data = response.data.variables
        data.sort((a, b)=> (a.id > b.id) ? 1 : -1);
        let tempRows = [];
        for(let i = 0; i < data.length; i++){
          let result = data[i];
          tempRows.push({ id: result.id, functionVariable: `${result.function_variable.function.module.name}.${result.function_variable.function.name}: ${result.function_variable.name}`, variable: result.variable != null ? (`${result.variable.variable_set.name} / ${result.variable.name}`) : 'No Variable Set', redis: result.redis_variable_value})
        }
        setRows(tempRows);
        setConditionVariableData(data)
      }
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
      setLoadingFunctionVariables(true)
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else
        enqueueSnackbar("There was a problem connecting with the server.");
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
        let response = await API.variableSets.listAll(params);
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
      setLoadingVariableSets(true)
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else
        enqueueSnackbar("There was a problem connecting with the server.");
    }
  }

  const deleteVariable = async (selectedRows) =>
  {
    if (selectedRows.length > 0) {
      let id = selectedRows[0];
      var result = confirm("Are you sure you want to delete this variable?");
      if (result) {
        try {
          const response = await API.conditionVariables.delete(id);
          if (response.status === 204){
            enqueueSnackbar("Deleted Variable.", {variant:"success"});
            getConditionVariableData(3);
            setSelectedRows([]);
          }
        } 
        catch(error){
          if (error.request)
            if (error.request.status === 403)
              setLogoutCounter(logoutCounter => logoutCounter + 1);
          else
            enqueueSnackbar("There was a problem connecting with the server.");
        }
      }
    }
  }
  const postConditionVariable = async (params) => {
    try 
    {
      const response = selectedRows.length > 0 ? await API.conditionVariables.edit(selectedRows[0], params) : await API.conditionVariables.add(params);
      if (response.status === 201 || response.status === 200)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        getConditionVariableData(3);
      }
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else 
        enqueueSnackbar("There was a problem connecting with the server.");
      
  }
}
  useEffect(() => {
    populateTable();
  }, [props.selectedCondition]);
  useEffect(() => {
    getConditionVariableData(3);
    getFunctionVariableData(2);
    getVariableSetData(2);
  }, []);
  const children = React.useMemo(()=>{
    return (
      <>
        <DataGrid 
          rows={rows} 
          columns={columns} 
          pageSize={10} 
          autoHeight={true} 
          paginationMode='client'
          selectionModel={selectedRows}
          onSelectionModelChange={(newSelection) =>{
            setSelectedRows(newSelection);
          }}
        />
        <div className='buttonContainer'>
          {selectedRows.length > 0 ?
          <>
            <Button onClick={() =>{setSelectedRows([])}} variant="contained" color="primary">Deselect</Button>
            <Button onClick={() =>{deleteVariable(selectedRows)}} variant="contained" color="secondary">Delete Variable</Button>
          </>
          : null}
        </div>
        <EditConditionVariableForm condition={props.selectedCondition[0]} selectedVariable={selectedRows} postData={postConditionVariable} functionVariableData={functionVariableData} variableSetData={variableSetData}></EditConditionVariableForm>
        
      </>
    )
  },[rows, columns, selectedRows, functionVariableData, variableSetData]);
  return (
    <>
    {loadingFunctionVariables && loadingConditionVariables && loadingVariableSets  ? (
      <>
        {children}
      </>
    ) : <LoadingOverlay />
  }
  </>
  )
}

  
export default ConditionVariables;