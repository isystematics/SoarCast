import React, { useState, useEffect } from "react"
import { DataGrid } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import { API } from "Api";
import error_colors from "models/error_colors";
import error_types from "models/error_types";
import { useSnackbar } from 'notistack';
import { useHistory } from "react-router-dom"
// Loops through the results data and displays it in a table. If the edit button is clicked it sets the id and index value to the 
// corresponding values for that item.
const AppGroupsPage = (props) => {
  const basicModel = {
    name: '',
    app: 0
  };
  const [editMode, setEditMode] = useState(null);
    const [formFields, setFormFields] = useState(basicModel);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [error, setError] = useState('');
    const [Columns, setColumns] = useState([
        { field: 'name', headerName: 'Name', flex: 2},
        { field: 'app', headerName: 'App Name', flex: 2 }
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

    //page should be 1 or 2
    const getAppGroups = async (pageIndex, displayPage) => {
        try 
        {
            let params = {
                depth : 2,
                page: pageIndex + 1,
            }
            props.setLoading(true);
            const response = await API.app_groups.list(params);
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
            name: rowData.name != null ? rowData.name : 'N/A',
            app: rowData.app != null ? rowData.app.name : 'N/A',
        };
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
            setEditMode(true);
            setSelectedItem(createRow(rowData));
            setFormFields({name: rowData.name, app: rowData.app ? (rowData.app.id) : 0})
          }
        }
      }
      const deleteItem = async () => {
        var result = confirm("Are you sure you want to delete this app group?");
        if(result){
            try{
              props.setLoading(true);
                const response = await API.app_groups.delete(selectedId);
                if(response.status == 204){
                  enqueueSnackbar("Deleted app.", {variant:"success"});
                  setSelectedId(null);
                  setSelectedItem(basicModel);
                  setFormFields(basicModel);
                  getAppGroups(currentPage, 1);
                }
            }
            catch(error){
                if (error.request){
                  props.setLoading(false);
                  enqueueSnackbar("There was a problem connecting with the server.")
                } 
            }
        }
    }
    const setupAddPage = () => {
      setEditMode(false);
      setSelectionModel([]);
      setSelectedId(null);
      setSelectedItem(basicModel);
      setFormFields(basicModel)
    }
    const handlePageChange = (event) => {
      let pageIndex = Math.floor(event.page / 2);
      if(currentPage < pageIndex){
        setCurrentPage(pageIndex);
        getAppGroups(pageIndex, 1);
      }else if(currentPage > pageIndex){
        setCurrentPage(pageIndex);
        getAppGroups(pageIndex, 2);
      } else {
        if(event.page % 2 == 0){
          setGridRows(createRows(GridData, 1));
        } else {
          setGridRows(createRows(GridData, 2));
        }
      }
    }
    const getAppNames = async (pageIndex) => {
      try 
        {
            let params = {
                depth : 2,
                page: pageIndex + 1,
            }
            props.setLoading(true);
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
    const handleChange = (fieldName, value) => {
      let tempFields = {
        name: formFields.name,
        app: formFields.app,
      }
      switch(fieldName){
        case 'name':
          tempFields.name = value;
          break;
        case 'app':
          tempFields.app = parseInt(value);
          break;
      }
      setFormFields(tempFields);
    }
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      let appParam = formFields.app
      formFields.app === 0 ? (appParam = null) : null
      const params = {
        name: formFields.name,
        app: appParam
      }

      try{
        props.setLoading(true);
        let response;
        if(editMode == true){
          response = await API.app_groups.edit(selectedItem.id, params);
        } else {
          response = await API.app_groups.add(params);
        }
        if(response.status == 201 || response.status == 200){
          setSelectedItem(response.data);
          setFormFields(response.data);
          setSelectionModel([response.data.id]);
          setEditMode(true);
          getAppGroups(currentPage, 1);
        }
      }catch(error){
        setSelectedItem(basicModel);
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
    const convertDateTime = (date) => {
      return new Date(date).toDateString() + ' : ' + new Date(date).toLocaleTimeString();
    }
    //This fires things on startup
    useEffect(() => {
        getAppGroups(currentPage, 1);
        getAppNames(0);
        return () => {
        }
    }, [])
    return (
        <>
            <h1>App Groups</h1>
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
            {selectedItem.name !== '' && <Button variant="contained" color="primary" onClick={()=>{setupAddPage()}}>Deselect</Button>}
              {selectedId != null && <Button variant="contained" color="secondary" onClick={()=>{deleteItem()}}>Delete Selected</Button>}
            </div>
            {selectedItem != null && 
                <>
                  <form onSubmit={handleSubmit}>
                    <h1>App Details</h1>
                    <div className='inputRow'>
                      <label className='label' for='Name'>Name:</label>
                      <input name="Name" value={formFields.name} type='text' id='Name' required='required' onChange={e => handleChange('name', e.target.value)}></input>
                    </div>
                    <div className='inputRow'>
                      <label className='label' for='App Name'>App Name:</label>
                      <select name="mapping" type='text' required='required' id='App Names' value={formFields.app} onChange={e => handleChange('app', e.target.value)}>
                      <option key='noapp' value={0}>No app</option>
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
          </>
    )
    
}

export default AppGroupsPage