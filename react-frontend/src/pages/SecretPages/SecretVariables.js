import React, { useState, useEffect, useMemo } from "react";
import Button from '@material-ui/core/Button';
import './SecretVariables.css';
import { useHistory } from "react-router-dom"
import { API } from "Api";
import { useSnackbar } from 'notistack';
import error_types from "models/error_types";
const SecretVariables = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [refresh, setRefresh] = useState(false);
  const history = useHistory()
  // Stores arrays of runner and mapping data retrieved from the API. 
  const [logoutCounter, setLogoutCounter] = useState(0)
  const [data, setData] = useState([]);
  const [updatedData, setUpdatedData] = useState({});
  const [hash, setHash] = useState('');
  const [success, setSuccess] = useState(false);
  // Log the user out
  useEffect(() => {
    getData();
    if (logoutCounter === 1)
      {
        alert("Your session has expired. Please login again.");
        sessionStorage.removeItem('token');
        history.push('/logout');
      }
  }, [logoutCounter]);
  const getData = async () => {
    try{
      let params = {
        depth: 1,
      }
      let Hash = props.location.pathname.split('/')[2];
      setHash(Hash);
      let response = await API.requestSecrets.hashUrlList(Hash, params);
      if(response.status === 200){
        let tempData = {};
        response.data.variables.forEach(variable=>{
            tempData[variable.id] = variable.name;
        });
        setUpdatedData(tempData);
        setData(response.data.variables);
      }
    }catch(error){
      enqueueSnackbar(error_types.BAD_CONNECTION);
      setSuccess(true);
    }
  }
  const changeValue = (id, value) => {
    let tempData = updatedData;
    tempData[id] = value;
    setUpdatedData(tempData);
    setRefresh(!refresh);
  }
  const handleSubmit = async () => {
    let sendData = {};
    data.forEach(variable=>{
      sendData[variable.id] = variable.name;
    })
    try{
      let response = await API.requestSecrets.storeSecrets(hash, sendData);
      if(response.status == 202){
        enqueueSnackbar(response.statusText, {variant: 'success'});
        setSuccess(true);
      }
    }catch(error){
      enqueueSnackbar(error.error_types.BAD_CONNECTION);
      setSuccess(true);
    }
  }
  const children = useMemo(()=> {
    if(success==true){
      return (
        <div className='successContainer'>
          <div className='success title'>Success</div>
          <div className='success'>You may now close the page!</div>
        </div>
      )
    }else {
      if(data.length > 0){
        return data.map((y) => 
            <div className='inputRow'>
              <label className='label' for='name'>{y.name} Name:</label>
              <input name="name" value={updatedData[y.id]} type='text' required='required' id="name" onChange={e => changeValue(y.id, e.target.value)} ></input>
            </div>
        )
      } 
    }
    return <></>
  }, [refresh, data, success]);
  return (
    <div className='secretsContainer'>
      <h1>Variable Set</h1>
      {children}
      {data.length > 0 && success == false ? 
        <div className='buttonContainer'>
          <Button onClick={() =>{handleSubmit()}} variant="contained" color="primary">Save</Button>
        </div>
      : null}
    </div>
  )
}
export default SecretVariables;