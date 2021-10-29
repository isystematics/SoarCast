import React, { useState, useEffect } from "react";
import '../styles.css'
import AddVariableForm from './AddVariableForm.js'
import EditVariableForm from './EditVariableForm.js'
import { DataGrid } from '@material-ui/data-grid';
import Variable_type from 'models/variable_types.js'
import { API } from "Api";
import { useHistory } from "react-router-dom"
import Button from '@material-ui/core/Button';
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
const Variables = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    // Runner table and data
    const [columns, setColumns] = useState([
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'hvac', headerName: 'HVAC Path', flex: 1 },
    { field: 'encrypted', headerName: 'Encrypted', flex: 1},
    { field: 'value', headerName: 'Value', flex: 1},
    { field: 'type', headerName: 'Type', flex: 1},
    { field: 'hasValue', headerName: 'Has Value', flex: 1},
    
  ])
    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [data, setData] = useState([]);
    const [loadingData, setLoadingData] = useState([]);

    const [logoutCounter, setLogoutCounter] = useState(0)
 
    const history = useHistory()
 
   // Log the user out
   useEffect(() => {
     if (logoutCounter === 1)
       {
         alert("Your session has expired. Please login again.")
         sessionStorage.removeItem('token')
         history.push('/logout')
       }
   }, [logoutCounter]);

    let variableSet = []

    //populateTable()

    function populateTable()

    {
        variableSet = props.variableSetData.filter(function(row)
        {
        let id = props.selectedVariableSet.id
        return row.id === id
        });
        let data = variableSet[0].variables;
        data.sort((a, b)=>
              (a.id > b.id) ? 1 : -1
            );
        let tempRows = []
        for(let i = 0; i < data.length; i++){
          let result = data[i];
          tempRows.push({ id: result.id, name: result.name, hvac: result.hvac_path, encrypted: result.encrypted, value: result.value === "" ? ("Encrypted") : result.value, type: Variable_type.getType(result.variable_type), hasValue: result.has_value})
        }
        setRows(tempRows);
        setData(data)
        setLoadingData(true)
     }
    useEffect(() => {

    populateTable()

  }, [props.selectedVariableSet]);

  async function getVariableData() {

    try
    {
      let response = await API.variableSets.list(props.selectedVariableSet.id);
      if (response.status === 200)
      {
        let data = response.data.variables;
        data.sort((a, b)=>
              (a.id > b.id) ? 1 : -1
            );

        let tempRows = []
        for(let i = 0; i < data.length; i++){
          let result = data[i];
          tempRows.push({ id: result.id, name: result.name, hvac: result.hvac_path, encrypted: result.encrypted, value: result.value === "" ? ("Encrypted") : result.value, type: Variable_type.getType(result.variable_type), hasValue: result.has_value})
        }
        setRows(tempRows);
        setData(data)
      }
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

  async function deleteVariable(selectedRows)
{
  if (selectedRows != null)
  {
    let id = selectedRows[0]

    var result = confirm("Are you sure you want to delete this variable?");
    if (result)
    {
      try {
        const response = await API.variables.delete(id);
        if (response.status === 204)
        {
          enqueueSnackbar("Deleted Variable.", {variant:"success"});
          getVariableData()
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
  
    return (
      <>
      {loadingData ? (
        <>
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
          <Button onClick={() =>{deleteVariable(selectedRows)}} variant="contained" color="primary">Delete Variable</Button>
        </div>
      }
      {selectedRows.length === 0 ? (

      <AddVariableForm variableSet={props.selectedVariableSet} getVariableData={getVariableData}></AddVariableForm>
      ) : 
      <EditVariableForm variableSet={props.selectedVariableSet} selectedVariable={selectedRows} getVariableData={getVariableData}></EditVariableForm>
      }
      </>
      ) : <LoadingOverlay />
    }
    </>
    )
}

export default Variables;