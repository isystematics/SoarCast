import React, {useState, useEffect} from 'react'
import Button from '@material-ui/core/Button';
import './styles.css'
import RedisForm from './RedisForm.js'
import { API } from "Api";
import CircularProgress from '@material-ui/core/CircularProgress'
import { DataGrid } from '@material-ui/data-grid';
import boolGridElement from "../../components/Common/boolGridElement"
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
import LoadingOverlay from 'components/LoadingOverlay/LoadingOverlay';
const Redis = () => {
    const [data, setData] = useState({
        host: '',
        port: 0,
        ssl_connection: true,
        verify_certificate: true,
    })
    const [columns, setColumns] = useState([
        { field: 'host', headerName: 'Host', flex: 1 },
        { field: 'port', headerName: 'Port', flex: 1 },
        { field: 'ssl_connection', headerName: 'SSL', flex: 1, renderCell: (params)=> boolGridElement(params.value) },
        { field: 'verify_certificate', headerName: 'Verify Certificate', flex: 1, renderCell: (params)=> boolGridElement(params.value) },
      ])
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [error, setError] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const sendEvent = async (data) => {
        try
        {
            let response;
            if(selectedId == null){
              response = await API.redisSettings.add(data);
            } else {
              response = await API.redisSettings.edit(selectedId, data);
            }
            if (response.status === 200 || response.status === 201)
            {
              // Check if there is an existing setting.
              if (response.data.non_field_errors)
              {
                enqueueSnackbar(response.data.non_field_errors);
              } else if(response.data) {
                // Since there is only one setting that can be configured at once,
                // just get the first item in the array (index 0).
                let tempRows = [];
                tempRows.push({ id: response.data.id, host: response.data.host, port: response.data.port, ssl_connection: response.data.ssl_connection, verify_certificate: response.data.verify_certificate})
                setRows(tempRows);
                setData(response.data);
                setSelectedId(response.data.id);
                displayErrorMessage("Successfully Submitted!")
              } else {
                // If there is no setting available, set the table rows to an empty array.
                setRows([])
              }
              setLoading(true)
            }
        }
          catch(error) {
            let parsedResponse = JSON.parse(error.request.response);
              if (error.request.status === 403)
              {
                setLogoutCounter(logoutCounter => logoutCounter + 1)
              }else if(parsedResponse.non_field_errors){
                enqueueSnackbar(parsedResponse.non_field_errors);
              }
              else {
                  enqueueSnackbar("There was a problem connecting with the server.");
              }
            }
        }
    
    const deleteRedis = async () =>
    {
        var result = confirm("Are you sure you want to delete the Redis configuration?");
        if (result)
        {
          try {
            const response = await API.redisSettings.delete(selectedId);
            if (response.status === 204)
            {
              enqueueSnackbar("Deleted Redis Configuration.", {variant:"success"});
              // Set data back to null because the data has been deleted.
              setData({
                host: '',
                port: '',
                ssl_connection: '',
                verify_certificate: '',
              });
              getData();
              setSelectedId(null);
            }
          } 
          catch(error){
            if (error.request)
                {
                  if (error.request.status === 403)
                  {
                    setLogoutCounter(logoutCounter => logoutCounter + 1);
                  }
                }
                else {
                    enqueueSnackbar("There was a problem connecting with the server.");
                }
          }
        }
    }
    const getData = async () => {
        try
        {
            let response = await API.redisSettings.list();
            if (response.status === 200)
            {
              // Check if there is an existing setting.
              if (response.data.results.length === 1)
              {
                // Since there is only one setting that can be configured at once,
                // just get the first item in the array (index 0).
                let results = response.data.results[0];
                let tempRows = [];
                tempRows.push({ id: results.id, host: results.host, port: results.port, ssl_connection:results.ssl_connection, verify_certificate:results.verify_certificate})
                setRows(tempRows);
                setData(results);
                setSelectedId(results.id);
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
      useEffect(()=>{
        getData();
      },[])
    return (
        <>
        {// If the data has finished loading, display content, otherwise display a spinning loading bar.
        }
        {loading ? (
        <>
        <h1>Redis Configuration</h1>
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
          {selectedId ? <Button onClick={() => {deleteRedis()}} variant="contained" color="primary">Delete Redis Configuration</Button> : null}
        </div>
            <RedisForm data={data} sendEvent={sendEvent}></RedisForm>
            </>
            ) : <LoadingOverlay />}
        </>
    )
}

export default Redis;