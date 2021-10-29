import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { Tabs, Tab, AppBar } from "@material-ui/core";
import GridFormControl from '../../components/GridFormControl/GridFormControl.js';
import './Users.css';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import { API } from "Api";
const Users = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  const getUsers = async () => {
    try{
      let response = await API.app_users.list();
      if(response.status)
        setUsersData(response.data.results);
    }catch(error){
      handleError(error);
    }
  }
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
  // Give me an Object of API calls to feed to the GridFormControl
  const [selectionModel, setSelectionModel] = useState([]);
  const [model, setModel] = useState({id:''});
  const appsOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    gridOptions: {
      label: 'Apps',
      columns: [
        {field: 'name', headerName: 'Name', flex: 1},
        {field: 'api_alias', headerName: 'Api Alias', flex: 1},
      ],
    },
    formOptions: {
      label: 'App',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text',required:true, label:'Name', value: ''},
        {field: 'api_alias', type: 'text',required:true, label:'Api Alias', value: ''},
      ],
    },
    ApiCalls: {
      list: (params) => API.apps.list(params),
      add: (data) => API.apps.add(data),
      edit: (id, data) => API.apps.edit(id, data),
      delete: (id) => API.apps.delete(id),
    }
  }
  const appUsersOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    gridOptions: {
      label: 'App Users',
      columns: [
        {field: 'username', headerName: 'Username', flex: 1},
        {field: 'email', headerName: 'Email', flex: 1},
        {field: 'appName', headerName: 'App', flex: 1}
      ],
    },
    formOptions: {
      label: 'App User',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'username', type: 'text', label:'Username', value: '', required: true},
        {field: 'email', type: 'text', label:'Email', value: ''},
        {field: 'app', type: 'array',label:'App', value: '',required: true, arrayGet: API.apps.list({depth: 2})},
      ],
    },
    ApiCalls: {
      list: (params) => API.app_users.list(params),
      add: (data) => API.app_users.add(data),
      edit: (id, data) => API.app_users.edit(id, data),
      delete: (id) => API.app_users.delete(id),
    }
  }
  const appGroupsOptions = {
    gridOptions: {
      label: 'App Groups',
      columns: [
        {field: 'name', headerName: 'Name', flex: 1},
        {field: 'appName', headerName: 'App', flex: 1}
      ],
    },
    formOptions: {
      label: 'App Group',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text', label:'Name', value: ''},
        {field: 'app', type: 'array', label: 'App', value: '', arrayGet: API.apps.list({depth: 2})},
        {field: 'users', type: 'multiSelect', label:'Users', value: [], arrayList:usersData},
      ],
    },
    ApiCalls: {
      list: (params) => API.app_groups.list(params),
      add: (data) => API.app_groups.add(data),
      edit: (id, data) => API.app_groups.edit(id, data),
      delete: (id) => API.app_groups.delete(id),
    }
  }
  useEffect(()=>{
    getUsers();
  },[])
  return (
    <>
      {loading === true ? 
        <LoadingOverlay/>
      :null}
      <div className="usersContainer">
        <AppBar position="static" style={{marginTop:4+'rem'}}>
          <Tabs value={selectedTab} onChange={handleChange}>
            <Tab label="Apps" />
            <Tab label="App Users" />
            <Tab label="App Groups" />
          </Tabs>
        </AppBar>
        {selectedTab === 0 && <GridFormControl options={appsOptions} />}
        {selectedTab === 1 && <GridFormControl options={appUsersOptions} />}
        {selectedTab === 2 && <GridFormControl options={appGroupsOptions} /> }
      </div>
    </>
  );
}

Users.propTypes = {
  t: PropTypes.any
}

export default Users;
