import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import Redis from "./redis.js";
import SaltMaster from './saltMaster.js';
import GridFormControl from "components/GridFormControl/GridFormControl.js";
import boolGridElement from "../../components/Common/boolGridElement";
import { API } from "Api";
const TabBar = () => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  const emailOptions = {
    gridOptions: {
      label: 'Email Settings',
      columns: [
        { field: 'from_email', headerName: 'Address', flex: 1 },
        { field: 'email_host', headerName: 'Host', flex: 1 },
      ],
    },
    formOptions: {
      label: 'Email Setting',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'email_host', type: 'text', label:'Email Host', value: '', required: true},
        {field: 'email_port', type: 'text', label: 'Email Port', value: '', required: true},
        {field: 'email_username', type: 'text', label:'Email Username', value: '', required: true},
        {field: 'email_password', type: 'password', label: 'Email Password', value: '', required: true},
        {field: 'use_tls', type: 'bool', label:'Use TLS', value: false},
        {field: 'use_ssl', type: 'bool', label: 'Use SSL', value: false},
        {field: 'from_email', type: 'text', label: 'From Email', value: '', required: true},
      ],
    },
    ApiCalls: {
      list: (params) => API.emailSettings.list(params),
      add: (data) => API.emailSettings.add(data),
      edit: (id, data) => API.emailSettings.edit(id, data),
      delete: (id) => API.emailSettings.delete(id),
    }
  }
  const redisOptions = {
    gridOptions: {
      label: 'Redis Configuration',
      columns: [
        { field: 'host', headerName: 'Host', flex: 1 },
        { field: 'port', headerName: 'Port', flex: 1 },
        { field: 'ssl_connection', headerName: 'SSL', flex: 1, renderCell: (params)=> boolGridElement(params.value) },
        { field: 'verify_certificate', headerName: 'Verify Certificate', flex: 1, renderCell: (params)=> boolGridElement(params.value) },
      ],
    },
    formOptions: {
      label: 'Redis Settings',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'host', type: 'text', label:'Host', value: '', required: true},
        {field: 'port', type: 'text', label: 'Port', value: '', required: true},
        {field: 'password', type: 'password', label: 'Password', value: '', required: true},
        {field: 'ssl_connection', type: 'bool', label:'SSL Connection', value: false},
        //{field: 'verify_certificate', type: 'bool', label: 'Verify Certificate', value: false},
      ],
    },
    ApiCalls: {
      list: (params) => API.redisSettings.list(params),
      add: (data) => API.redisSettings.add(data),
      edit: (id, data) => API.redisSettings.edit(id, data),
      delete: (id) => API.redisSettings.delete(id),
    }
  }
  const masterOptions = {
    gridOptions: {
      label: 'Saltmaster Setting',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'api_url', headerName: 'API Url', flex: 1 },
      ],
    },
    formOptions: {
      label: 'Saltmaster Connection Settings',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text', label:'Name', value: '', required: true},
        {field: 'api_url', type: 'text', label: 'API Url', value: '', required: true},
        {field: 'username', type: 'text', label: 'Username', value: '', required: true},
        {field: 'password', type: 'password', label: 'Password', value: '', required: true},
      ],
    },
    ApiCalls: {
      list: (params) => API.saltmasterSettings.list(params),
      add: (data) => API.saltmasterSettings.add(data),
      edit: (id, data) => API.saltmasterSettings.edit(id, data),
      delete: (id) => API.saltmasterSettings.delete(id),
    }
  }
  const gitRepoOptions = {
    gridOptions: {
      label: 'Git Repos',
      columns: [
        {field: 'repo', headerName: 'Repo', flex: 1},
      ],
    },
    formOptions: {
      label: 'Git Repo',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'repo', type: 'text', label:'Repo', value: '', required: true},
        {field: 'access_token', type: 'text', label: 'Access Token', value: '', required: true},
      ],
    },
    ApiCalls: {
      list: (params) => API.masters.reposList(params),
      add: (data) => API.masters.reposAdd(data),
      edit: (id, data) => API.masters.reposEdit(id, data),
      delete: (id) => API.masters.reposDelete(id),
    }
  }
  return (
    <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="Email" />
          <Tab label="Redis" />
          <Tab label="SaltMaster" />
          <Tab label="Git Repo" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <GridFormControl options={emailOptions} />}
      {selectedTab === 1 && <GridFormControl options={redisOptions} />}
      {selectedTab === 2 && <GridFormControl options={masterOptions} />}
      {selectedTab === 3 && <GridFormControl options={gitRepoOptions} />}
    </>
  );
};

export default TabBar;