import React, {useState, useEffect } from "react";
import './styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { useHistory } from "react-router-dom"
import { DataGrid } from '@material-ui/data-grid';
import SaltMasterForm from './SaltMasterForm.js'
import { useSnackbar } from 'notistack';
import LoadingOverlay from 'components/LoadingOverlay/LoadingOverlay';
const SaltMaster = () => {
      // Determine whether the data has loaded

// boolean that is set to true once data has loaded.
const [loading, setLoading] = useState(false)
const { enqueueSnackbar, closeSnackbar } = useSnackbar();
const [error, setError] = useState('');

// Playbook table and data
const [columns, setColumns] = useState([
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'api_url', headerName: 'API Url', flex: 1 },
])
const [rows, setRows] = useState([]);
const [selectedRows, setSelectedRows] = useState([]);
const [data, setData] = useState(null);

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
    getData()
  }, []);


  // This function takes in the API endpoint and the data type it is getting to determine which type of data (runner, mapping, etc.) to get.

  // If the call to the API returns a 403 request, this means that the user's JWT token has expired. It will then display an alert
  // and redirect the user to the logout page. Because the API calls are made asynchronously, a logout counter is used to make sure
  // the logout action only occurs once instead of occuring multiple times on simultaneous failed API calls.

  async function getData() {

    try
    {
        let response = await API.saltmasterSettings.list();
        if (response.status === 200)
        {
          // Check if there is an existing setting.
          if (response.data.results.length === 1)
          {
            // Since there is only one setting that can be configured at once,
            // just get the first item in the array (index 0).
            let results = response.data.results[0];
            let tempRows = [];
            tempRows.push({ id: results.id, name: results.name, api_url: results.api_url})
            setRows(tempRows);
            setData(results)
          }
          else
          {
            // If there is no setting available, set the table rows to an empty array.
            setRows([])
          }
          setLoading(true)
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

async function deleteSetting(id)
{
    var result = confirm("Are you sure you want to delete the saltmaster? This will delete all minions, runners, and playbooks!");
    if (result)
    {
      try {
        const response = await API.saltmasterSettings.delete(id);
        if (response.status === 204)
        {
          enqueueSnackbar("Deleted saltmaster setting.", {variant:"success"});
          // Set data back to null because the data has been deleted.
          setData(null)
          getData()
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
  
  return (
    <>
    {// If the data has finished loading, display content, otherwise display a spinning loading bar.
    }
    {loading ? (
      <>
      <h1>Saltmaster Setting</h1>
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
      <div className='buttonContainer'>
        <Button onClick={() => {deleteSetting(data.id)}} variant="contained" color="primary">Delete Saltmaster Setting</Button>
      </div>
        <SaltMasterForm getData={getData} data={data}></SaltMasterForm>
        </>
        ) : <LoadingOverlay />}
      </>
  )
}

export default SaltMaster;