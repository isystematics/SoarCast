import React, { useState, useEffect } from "react"
import { DataGrid } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import { API } from "Api";
import error_types from "models/error_types";
import AppsPage_status from "models/runner_status.js";
import { useSnackbar } from 'notistack';
import { useHistory } from "react-router-dom"
// Loops through the results data and displays it in a table. If the edit button is clicked it sets the id and index value to the 
// corresponding values for that item.
const AppUsersPage = (props) => {
  const basicModel = {
    username: '',
    email: '',
    app: 0
  };
  const [editMode, setEditMode] = useState(null);
    const [formFields, setFormFields] = useState(basicModel)
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [error, setError] = useState('');
    const [Columns, setColumns] = useState([
        { field: 'username', headerName: 'Username', flex: 1},
        { field: 'email', headerName: 'Email', flex: 1 },
        { field: 'appname', headerName: 'App', flex: 1 }
    ])
    const [GridData, setGridData] = useState([]);
    const [GridRows, setGridRows] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(basicModel);
    const [rowCount, setRowCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [appNames, setAppNames] = useState([]);

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

    const getAppNames = async (pageIndex) => {
      try 
        {
          props.setLoading(true);
            let params = {
                depth : 2,
                page: pageIndex + 1,
            }
            const response = await API.apps.list(params);
            if (response.status === 200)
            {
                let data = response.data.results;
                setRowCount(response.data.count);
                data.sort((a, b)=>
                    (a.id > b.id) ? 1 : -1
                );
                setAppNames(data);
                props.setLoading(false);
            }
        }
        catch(error){
          props.setLoading(false);
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
    const findApp = (id) => {
      for(let i = 0; i < appNames.length; i++){
        if(id == appNames[i].id){
          return appNames[i];
        }
      }
      return null;
    }
    //page should be 1 or 2
    const getAppsUsers = async (pageIndex, displayPage) => {
        try 
        {
          props.setLoading(true);
            let params = {
                depth : 2,
                page: pageIndex + 1,
            }
            const response = await API.app_users.list(params);
            if (response.status === 200)
            {
                let data = response.data.results;
                setRowCount(response.data.count);
                data.sort((a, b)=>
                    (a.id > b.id) ? 1 : -1
                );
                setGridData(data);
                setGridRows(createRows(data, displayPage));
                props.setLoading(false);
            }
        }
        catch(error){
          props.setLoading(false);
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
    const createRows = (data, page) => {
      let tempRows = [];
      let i = (page == 1 ? 0 : 10);
      for(i; i < data.length; i++){
        let rowData = data[i];
        tempRows.push(createRow(rowData));
      }
      return tempRows;
    }
    const createRow = (rowData) => {
        return {
            id: rowData.id ? rowData.id : 'N/A', 
            username: rowData.username != null ? rowData.username : 'N/A',
            email: rowData.email != '' ? rowData.email : 'N/A',
            app: rowData.app != '' ? rowData.app : 'N/A',
            appname: rowData.app.name != '' ? rowData.app.name : 'N/A',
        };
    }
    const setupAddPage = () => {
      setEditMode(false);
      setSelectionModel([]);
      setSelectedId(null);
      setSelectedItem({
        username: '',
        email: '',
        app: appNames[0].id,
      });
      setFormFields({
        username: '',
        email: '',
        app: appNames[0].id,
      })
    }
    const selectItem = async (selectionModel) => {
        if(selectionModel.length > 1){
          if(selectedId == selectionModel[0]){
            selectionModel.unshift();
          } else {
            selectionModel.pop();
          }
        } else {
          if(selectedId == selectionModel[0]){
            return;
          }
        }
        setSelectionModel(selectionModel);
        setSelectedId(selectionModel[0]);
        for(let i = 0; i < GridData.length; i++){
          let rowData = GridData[i];
          if(rowData.id == selectionModel[0]){
            setSelectedItem(createRow(rowData));
            setFormFields({username: rowData.username, email: rowData.email, app: rowData.app.id});
          }
        }
        setEditMode(true);
      }
    const handlePageChange = (event) => {
      let pageIndex = Math.floor(event.page / 2);
      if(currentPage < pageIndex){
        setCurrentPage(pageIndex);
        getAppsUsers(pageIndex, 1);
      }else if(currentPage > pageIndex){
        setCurrentPage(pageIndex);
        getAppsUsers(pageIndex, 2);
      } else {
        if(event.page % 2 == 0){
          setGridRows(createRows(GridData, 1));
        } else {
          setGridRows(createRows(GridData, 2));
        }
      }
    }
    const convertDateTime = (date) => {
      return new Date(date).toDateString() + ' : ' + new Date(date).toLocaleTimeString();
    }
    const handleChange = (fieldName, value) => {
      let tempFields = {
        username: formFields.username,
        email: formFields.email,
        app: formFields.app,
      }
      switch(fieldName){
        case 'username':
          tempFields.username = value;
          break;
        case 'email':
          tempFields.email = value;
          break;
        case 'app':
          tempFields.app = parseInt(value);
          break;
      }
      setFormFields(tempFields);
    }
    const refreshToken = async () => {
      try{
        props.setLoading(true);
        const response = await API.app_users.refreshToken(selectedId);
        if(response.status == 202){
          props.setLoading(false);
          alert(response.data.token)
        }
      }catch(error){
        props.setLoading(false);
        enqueueSnackbar(error_types.BAD_CONNECTION);
      }
    }
    const deleteItem = async () => {
      var result = confirm("Are you sure you want to delete this app user?");
      if(result){
          try{
            props.setLoading(true);
              const response = await API.app_users.delete(selectedId);
              if(response.status == 204){
                enqueueSnackbar("Deleted app user.", {variant:"success"});
                setSelectedId(null);
                setSelectedItem(basicModel);
                setFormFields(null);
                getAppsUsers(currentPage, 1);
                
              }
          }
          catch(error){
              if (error.request)
              props.setLoading(false);
                  enqueueSnackbar("There was a problem connecting with the server.")
          }
      }
  }
    const handleSubmit = async (e) => {
      e.preventDefault();
      try{
        let response;
        let sendObj = {
          id: selectedId ? selectedId : '',
          username: formFields.username,
          email: formFields.email,
          app: formFields.app
        }
        props.setLoading(true);
        if(editMode == true){
          response = await API.app_users.edit(selectedItem.id, sendObj);
        } else {
          response = await API.app_users.add(sendObj);
        }
        if(response.status == 201 || response.status == 200){
          setSelectedItem(response.data);
          setFormFields(response.data);
          setSelectionModel([response.data.id])
          setSelectedId(response.data.id)
          setEditMode(true);
          getAppsUsers(currentPage, 1);
        }
      }catch(error){
        props.setLoading(false);
        if (error.request)
          {
            if (error.request.status === 403)
            {
              setLogoutCounter(logoutCounter => logoutCounter + 1)
            }
            if (error.request.status === 400)
          {
            const errorMessage = error.response.request.response
            if (errorMessage.includes('non_field_errors'))
            {
              enqueueSnackbar('There is already a user with this name assigned to this app.')
            }
            if (errorMessage.includes('email'))
            {
              enqueueSnackbar('Enter a valid email address.')
            }
          }
          }
          else {
              enqueueSnackbar("There was a problem connecting with the server.")
          }
      }
    }
    //This fires things on startup
    useEffect(async () => {
        getAppsUsers(currentPage, 1);
        getAppNames(0);
        return () => {
        }
    }, [])
    return (
      <>
          <h1>App Users</h1>
            <DataGrid 
                rows={GridRows} 
                columns={Columns} 
                pageSize={10} 
                autoHeight={true} 
                pagination
                rowCount={rowCount}
                paginationMode="server"
                onPageChange={handlePageChange}
                onSelectionModelChange={(newSelection) =>{
                    selectItem(newSelection);
                }}
                selectionModel={selectionModel}
            />
            <div className='buttonContainer'>
              {selectedItem.username !== '' && <Button variant="contained" color="primary" onClick={()=>{setupAddPage()}}>Deselect</Button>}
              {selectedId != null && <Button variant="contained" color="secondary" onClick={()=>{deleteItem()}}>Delete Selected</Button>}
              {selectedId != null && <Button variant="contained" color="primary" onClick={()=>{refreshToken()}}>Refresh Token</Button>}
            </div>
            {selectedItem != null && 
              <>
                <form onSubmit={handleSubmit}>
                  <h1>App Details</h1>
                  <div className='inputRow'>
                    <label className='label' for='Username'>Username:</label>
                    <input name="Username" value={formFields.username} type='text' id='Username' required='required' onChange={e => handleChange('username', e.target.value)}></input>
                  </div>
                  <div className='inputRow'>
                    <label className='label' for='Email'>Email:</label>
                    <input name="Email" value={formFields.email} type='text' id='Email' onChange={e => handleChange('email', e.target.value)}></input>
                  </div>
                  <div className='inputRow'>
                      <label className='label' for='App Name'>App:</label>
                      <select name="mapping" type='text' required='required' id='App Names' value={formFields.app} onChange={e => handleChange('app', e.target.value)}>
                        {appNames.map((result, index) =>
                          {
                            return(
                            <>
                            <option value={result.id}>{result.name}</option>
                            </>
                            )
                          })
                        }
                      </select>
                    </div>
                  <div className='inputRow'>
                      <Button type='submit' className="saveButton" variant="contained" color="secondary">Save</Button>
                  </div>
                </form>
              </>
            }
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px', backgroundColor:error.backgroundColor, color:error.textColor}}>{error.message}</Alert>}
        </>
    ) 
}

export default AppUsersPage