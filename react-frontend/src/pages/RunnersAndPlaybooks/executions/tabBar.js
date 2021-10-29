import React, {useState} from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import Runner from './RunStatuses.js'
import Playbook from './PlaybookExecutions.js'
import GridFormControl from "components/GridFormControl/GridFormControl.js";
import { API } from "Api";
import Runner_status from "models/runner_status.js";
import Playbook_status from "models/playbook_status.js";
const TabBar = () => {
  const [model, setModel] = useState({id:''});
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectionModel, setSelectionModel] = useState([]);
  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  const runStatusOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    gridOptions: {
      label: 'Run Statuses',
      readOnly:true,
      columns: [
        { field: 'runnerName', headerName: 'Runner', flex: 1 },
        { field: 'playbookName', headerName: 'Playbook', flex: 1},
        { field: 'status', headerName: 'Status', flex: 1, renderCell:(params)=>Runner_status.getType(params.value)},
        { field: 'started', headerName: 'Started', flex: 1, renderCell: (params)=>new Date(params.value).toDateString()},
        { field: 'finished', headerName: 'Finished', flex: 1, renderCell: (params)=>new Date(params.value).toDateString()},
      ],
    },
    formOptions: {
      label: 'Run Status Details',
      readOnly:true,
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'status', type: 'text', label:'Status', value: ''},
        {field: 'started', type: 'text', label:'Started', value: ''},
        {field: 'finished', type: 'text', label:'Finished', value: ''},
        {field: 'failed', type: 'text', label:'Failed', value: ''},
        {field: 'body', type: 'textarea', label:'Body', value: ''},
        {field: 'user', type: 'text', label:'User', value: ''},
        {field: 'runner', type: 'text', label:'Runner', value: ''},
        {field: 'playbook', type: 'text', label:'Playbook', value: ''},
        {field: 'variables', type: 'text', label:'Variables', value: ''},
      ]
    },
    ApiCalls: {
      list: (params) => API.runStatuses.list(params),
    }
  }
  const playbookExecutionsOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    gridOptions: {
      label: 'Playbook Executions',
      readOnly:true,
      columns: [
        { field: 'playbookName', headerName: 'Playbook', flex: 1 },
        { field: 'run', headerName: 'Run', flex: 1},
        { field: 'functionName', headerName: 'Function', flex: 1},
        { field: 'status', headerName: 'Status', flex: 1, renderCell:(params)=>Playbook_status.getType(params.value)},
        { field: 'last_changes', headerName: 'Last Changed', flex: 1, renderCell: (params)=>new Date(params.value).toDateString()},
      ],
    },
    formOptions: {
      label: 'Execution Details',
      readOnly:true,
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'playbook', type: 'object', label:'Playbook', value: ''},
        {field: 'function', type: 'object', label:'Function', value: ''},
        {field: 'status', type: 'text', label:'Status', value: ''},
        {field: 'run', type: 'text', label:'Run', value: ''},
        {field: 'message', type: 'textarea', label:'Message', value: ''},
        {field: 'last_changes', type: 'text', label:'Last Changes', value: ''},
        {field: 'created', type: 'text', label:'Created', value: ''},
        {field: 'read_variable_name', type: 'textarea', label:'Read Variable Names', value: ''},
        {field: 'write_variable_name', type: 'textarea', label:'Write Variable Names', value: ''},
      ]
    },
    ApiCalls: {
      list: (params) => API.playbookExecutions.list(params),
    }
  }
  return (
    <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="Run Statuses" />
          <Tab label="Playbook Executions" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <GridFormControl options={runStatusOptions} />}
      {selectedTab === 1 && <GridFormControl options={playbookExecutionsOptions} />}

    </>
  );
};

export default TabBar;