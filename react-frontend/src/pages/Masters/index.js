import React, { useState, useEffect, useMemo } from "react"
import MetaTags from 'react-meta-tags';
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import boolGridElement from "../../components/Common/boolGridElement"
import GridFormControl from '../../components/GridFormControl/GridFormControl.js';
import {
  Container
} from "reactstrap"

import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataGrid } from '@material-ui/data-grid';
import { API } from "Api";
import minionStatus_types from "models/minionStatus_types.js";
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
const MastersMinions = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const handleError = (error) => {
    setLoading(false);
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
  const minionButtonAction = async (acceptMinions) => {
    let data = {
      minions: minionSelectionModel,
      operation: (acceptMinions ? "accept" : "deny"),
    }
    try{
      setLoading(true);
      const response = await API.minions.keys(data);
      if(response.status == 202){
        setLoading(false);
        enqueueSnackbar('Minion ' + (acceptMinions ? 'Accepted' : 'Denied') + ' Successfully', {variant:'success'});
        setMinionRefresh(!minionRefresh);
        return response;
      }
    }
    catch(error){
      handleError(error);
    }
  }
  const pingMaster = async () => {
    try {
      setLoading(true);
      let response = await API.masters.updateMinions(model);
      if(response.status == 200){
        setLoading(false);
        enqueueSnackbar('Ping Successful', {variant:'success'});
        setMasterRefresh(!masterRefresh);
      }
    }
    catch(error){
      handleError(error);
    }
  }
  const syncMaster = async () => {
    try {
      setLoading(true);
      let response = await API.masters.syncModules(selectionModel[0]);
      if(response.status == 200){
        setLoading(false);
        enqueueSnackbar('Sync Successful', {variant:'success'});
        setMasterRefresh(!masterRefresh);
      }
    }
    catch(error){
      handleError(error);
    }
  }
  const syncMinion = async () => {
    try {
      setLoading(true);
      let response = await API.masters.syncMinion(minionSelectionModel[0]);
      if(response.status == 200){
        setLoading(false);
        enqueueSnackbar('Sync Successful', {variant:'success'});
        setMinionRefresh(!minionRefresh);
      }
    }
    catch(error){
      handleError(error);
    }
  }
  
  //gets the Masters from the API
  const [selectionModel, setSelectionModel] = useState([]);
  const [model, setModel] = useState({id:''});
  const [masterRefresh, setMasterRefresh] = useState(false);
  const masterOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    gridOptions: {
      label: 'Masters',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'minions', headerName: 'Number of Minions', flex: 1},
      ],
      buttonOptions: [
        {label: 'Ping', type: 'button', color: 'primary', buttonAction:pingMaster},
        {label: 'Synchronize', type: 'button', color: 'primary', buttonAction:syncMaster},
      ],
    },
    ApiCalls: {
      list: (params) => API.masters.list(params),
    }
  }
  const [minionSelectionModel, setMinionSelectionModel] = useState([]);
  const [minionModel, setMinionModel] = useState({id:''});
  const [minionRefresh, setMinionRefresh] = useState(false);
  useMemo(()=>{
    let value = minionModel;
  },[minionModel.id])
  const minionsOptions = {
    setParentSelectionModel: setMinionSelectionModel,
    setParentModel: setMinionModel,
    gridOptions: {
      label: 'Minions',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'status', headerName: 'Status', flex: 1, renderCell:(params)=>minionStatus_types.getType(params.value) },
        { field: 'last_ping', headerName: 'Last Ping', flex: 1, renderCell: (params)=> boolGridElement(params.value)},
        { field: 'last_ping_date', headerName: 'Last Ping Date', flex: 1 },
        { field: 'mission_control_minion', headerName: 'Is Soarcast Minion', flex: 1, renderCell: (params)=> boolGridElement(params.value) },
      ],
      buttonOptions: [
        {label: 'Sync Minion', type: 'button', color: 'primary', buttonAction:syncMinion},
        {label: 'Accept', type: 'button', value:true, color: 'primary', buttonAction:()=>minionButtonAction(true)},
        {label: 'Deny', type: 'button',value:false, color: 'secondary', buttonAction:()=>minionButtonAction(false)},
      ],
    },
    ApiCalls: {
      list: (params) => API.minions.list(params),
    }
  }
  const mastersGrid = useMemo(()=>{
    return <GridFormControl options={masterOptions} refresh={masterRefresh}/>
  },[selectionModel, masterRefresh]);
  const minionsGrid = useMemo(()=>{
    return <GridFormControl options={minionsOptions} refresh={minionRefresh}/>
  },[minionSelectionModel, minionRefresh]);
  return (
    <React.Fragment>
      {loading ? 
      <LoadingOverlay/>
      :
      null
      }
      <div className="page-content">
        {mastersGrid}
        {model.id != '' && minionsGrid}
      </div>
    </React.Fragment>
  )
}
export default MastersMinions