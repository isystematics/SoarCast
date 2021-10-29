import React, { useState, useEffect } from "react"
import { DataGrid } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import { API } from "Api";
import error_types from "models/error_types";
import { useSnackbar } from 'notistack';
import { useHistory } from "react-router-dom"
// Loops through the results data and displays it in a table. If the edit button is clicked it sets the id and index value to the 
// corresponding values for that item.
const AppsPage = (props) => {
  const basicModel = {
    name: '',
    api_alias: '',
  };
    const [editMode, setEditMode] = useState(null)
    const [formFields, setFormFields] = useState(basicModel);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [error, setError] = useState(null);
    const [Columns, setColumns] = useState([
        { field: 'name', headerName: 'Name', flex: 1},
        { field: 'api_alias', headerName: 'Alias', flex: 1}
    ])
    const [GridData, setGridData] = useState([]);
    const [GridRows, setGridRows] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(basicModel);
    const [rowCount, setRowCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

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
    const getAppsPages = async (pageIndex, displayPage) => {
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
        let result = data[i];
        tempRows.push({ 
            id: result.id, 
            name: result.name != null ? result.name : 'N/A',
            api_alias: result.api_alias != null ? result.api_alias : 'N/A'
        });
      }
      return tempRows;
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
          let tempData = GridData[i];
          if(tempData.id == selectionModel[0]){
            let selectedAppsPage = {
              id: tempData.id ? tempData.id : "Null",
              name: tempData.name ? tempData.name : "Null",
              api_alias: tempData.api_alias ? tempData.api_alias : "Null",
            }
            setEditMode(true);
            setSelectedItem(selectedAppsPage);
            setFormFields(selectedAppsPage);
          }
        }
      }
    const deleteItem = async () => {
        var result = confirm("Are you sure you want to delete this app?");
        if(result){
            try{
              props.setLoading(true);
              const response = await API.apps.delete(selectedId);
              if(response.status == 204){
                enqueueSnackbar("Deleted app.", {variant:"success"});
                setSelectedId(null);
                setSelectedItem(basicModel);
                setFormFields(basicModel);
                getAppsPages(currentPage, 1);
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
    }
    const handlePageChange = (event) => {
      let pageIndex = Math.floor(event.page / 2);
      if(currentPage < pageIndex){
        setCurrentPage(pageIndex);
        getAppsPages(pageIndex, 1);
      }else if(currentPage > pageIndex){
        setCurrentPage(pageIndex);
        getAppsPages(pageIndex, 2);
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
    const setupAddPage = () => {
      setEditMode(false);
      setSelectionModel([]);
      setSelectedId(null);
      setSelectedItem(basicModel);
      setFormFields(basicModel)
    }
    const handleChange = (fieldName, value) => {
      let tempFields = {
        name: formFields.name,
        api_alias: formFields.api_alias,
      }
      switch(fieldName){
        case 'name':
          tempFields.name = value;
          break;
        case 'api_alias':
          tempFields.api_alias = value;
          break;
      }
      setFormFields(tempFields);
    }
    const handleSubmit = async (e) => {
      //just send formFields
      e.preventDefault();
      try{
        props.setLoading(true);
        let response;
        if(editMode == true){
          response = await API.apps.edit(selectedItem.id, formFields);
        } else {
          response = await API.apps.add(formFields);
        }
        if(response.status == 201 || response.status == 200){
          setSelectedItem(response.data);
          setFormFields(response.data);
          setSelectionModel([response.data.id]);
          setSelectedId(response.data.id);
          setEditMode(true);
          getAppsPages(currentPage, 1);
          props.setLoading(false);
        }
      }catch(error){
        props.setLoading(false);
        if(JSON.parse(error.request.response).name == 'App with this name already exists.'){
          enqueueSnackbar(error_types.SAME_NAME);
        }
        if (error.response.request.response.includes('api_alias'))
        {
            enqueueSnackbar('The API alias must be a valid slug consisting of letters, numbers, underscores, and hyphens.')
        }
        else if (error.request.status === 403)
        {
          setLogoutCounter(logoutCounter => logoutCounter + 1)
        }
        else {
          enqueueSnackbar(error_types.BAD_CONNECTION);
          setSelectedItem(basicModel);
        }
      }
    }
    //This fires things on startup
    useEffect(() => {
        getAppsPages(currentPage, 1);
        return () => {}
    }, [])
    return (
        <>
            <h1>Apps</h1>
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
                  <h1>{selectedItem.name !== '' ? 'Edit' : 'Add'} App Details</h1>
                  <div className='inputRow'>
                    <label className='label' for='Name'>Name:</label>
                    <input name="name" value={formFields.name} type='text' id='Name' required='required' onChange={e => handleChange('name', e.target.value)}></input>
                  </div>
                  <div className='inputRow'>
                    <label className='label' for='api_alias'>api_alias:</label>
                    <input name="api_alias" value={formFields.api_alias} type='text' id='api_alias' required='required' onChange={e => handleChange('api_alias', e.target.value)}></input>
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

export default AppsPage