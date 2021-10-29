import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { DataGrid, getDataGridUtilityClass } from '@material-ui/data-grid';
import { API } from "Api";
import EditPlaybookMappingForm from './EditPlaybookMappingForm.js'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
const PlaybookMappings = (props) => {
  // Determine whether the data has loaded
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
const [error, setError] = useState('');

// Playbook table and data
const [columns, setColumns] = useState([
  { field: 'functionVariable', headerName: 'Function Variable', flex: 1 },
  { field: 'variable', headerName: 'Variable', flex: 1 },
])
const [rows, setRows] = useState([]);
const [selectedRows, setSelectedRows] = useState([]);

const [mappingData, setMappingData] = useState([]);
const [loadingMappings, setLoadingMappings] = useState(false);

const [variableSetData, setVariableSetData] = useState([]);
const [loadingVariableSets, setLoadingVariableSets] = useState(false);

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
  
  useEffect(() => {
    let playbook = filterData()
    getMappingData(3)
    getVariableSetData(playbook)
  }, [props.selectedPlaybook]);

  function filterData() {
    let playbook = []
    playbook = props.playbookData.filter(function(row)
    {
      let id = props.selectedPlaybook[0]
      return row.id === id
    });
    return playbook
  }


  // This function takes in the API endpoint and the data type it is getting to determine which type of data (runner, mapping, etc.) to get.

  // If the call to the API returns a 403 request, this means that the user's JWT token has expired. It will then display an alert
  // and redirect the user to the logout page. Because the API calls are made asynchronously, a logout counter is used to make sure
  // the logout action only occurs once instead of occuring multiple times on simultaneous failed API calls.

  async function getMappingData(depthParam) {

        try
        {
          let params = {
            playbook: props.selectedPlaybook[0],
            depth: depthParam
          }
          let response = await API.playbookMappings.listAll(params);
          if (response.status === 200)
          {
              let data = response.data.results;
              data.sort((a, b)=>
                (a.id > b.id) ? 1 : -1
              );
              let tempRows = [];
              for(let i = 0; i < data.length; i++){
                let result = data[i];
                tempRows.push({ id: result.id, functionVariable: `${result.function_variable.function.module.name}.${result.function_variable.function.name}: ${result.function_variable.name}`, variable: result.variable != null ? (`${result.variable.variable_set.name} / ${result.variable.name}`) : 'No Variable Set', redis: result.redis_variable_value})
              }
              setRows(tempRows);
              setMappingData(data)
              setLoadingMappings(true)
          }
        }
      catch(error) {
        if (error.request)
          if (error.request.status === 403)
            setLogoutCounter(logoutCounter => logoutCounter + 1)
        else
          enqueueSnackbar("There was a problem connecting with the server.");
    }
  }

  async function getVariableSetData(playbook) {

    try
    {
      if(playbook.length > 0){
        playbook[0].variable_sets.map(async (variableSet) => 
        {
            let response = await API.variableSets.list(variableSet)
            if (response.status === 200)
            {
              let data = response.data;
              data.variables.sort((a, b)=>
                (a.id > b.id) ? 1 : -1
              );
              let tempRows = [];
              for(let i = 0; i < data.variables.length; i++){
                let variable = data.variables[i];
                tempRows.push({ id: variable.id, name: `${data.name} / ${variable.name}`})
              }
              setVariableSetData(tempRows)
              setLoadingVariableSets(true)
            }
          });
      }
    }
    catch(error) {
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1)
      else
        enqueueSnackbar("There was a problem connecting with the server.");
    }
  }
  
  return (
    <>
    {loadingMappings ? (
      <>
      <h1>Playbook Mappings</h1>
      <DataGrid 
        rows={rows} 
        columns={columns} 
        pageSize={10}  
        autoHeight={true} 
        paginationMode='client'
        onSelectionModelChange={(newSelection) =>{
          setSelectedRows(newSelection);
        }}
      />
      {selectedRows.length > 0 && 
        <div className='buttonContainer'>
          <Button onClick={() =>{setSelectedRows([])}} variant="contained" color="primary">Deselect</Button>
        </div>
      }
        {selectedRows.length > 0 && (
          <EditPlaybookMappingForm selectedMapping={selectedRows} getData={getMappingData} variableSetData={variableSetData}></EditPlaybookMappingForm>
        )}
        </>
        ) : <LoadingOverlay />
        }
      </>
  )
}
export default PlaybookMappings;