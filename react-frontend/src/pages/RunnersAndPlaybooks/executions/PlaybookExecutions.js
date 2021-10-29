import React, { useState, useEffect } from "react"
import { DataGrid } from '@material-ui/data-grid';
import '../styles.css'
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import { API } from "Api";
import Playbook_status from "models/playbook_status.js";
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
// Loops through the results data and displays it in a table. If the edit button is clicked it sets the id and index value to the 
// corresponding values for that item.
const PlaybookExecutions = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [error, setError] = useState('');
    const [playbookColumns, setPlaybookColumns] = useState([
        { field: 'playbook', headerName: 'Playbook', flex: 1 },
        { field: 'run', headerName: 'Run', flex: 1},
        { field: 'function', headerName: 'Function', flex: 1},
        { field: 'status', headerName: 'Status', flex: 1},
        { field: 'last_changes', headerName: 'Last Changed', flex: 1},
    ])
    const [GridData, setGridData] = useState([]);
    const [GridRows, setGridRows] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const [selectedId, setSelectedId] = useState(0);
    const [selectedItem, setSelectedItem] = useState();
    const [rowCount, setRowCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    const history = useHistory()

    const [logoutCounter, setLogoutCounter] = useState(0)

     // Logs the user out
     useEffect(() => {
      if (logoutCounter === 1)
        {
          alert("Your session has expired. Please login again.")
          sessionStorage.removeItem('token')
          history.push('/logout')
        }
    }, [logoutCounter]);


    //gets the Masters from the API
    const getPlaybooks = async (pageIndex, displayPage) => {
        try 
        {
            let params = {
                depth :1,
                page: pageIndex + 1
            }
            const response = await API.playbookExecutions.list(params);
            if (response.status === 200)
            {
                let data = response.data.results;
                setRowCount(response.data.count);
                data.sort((a, b)=>
                    (a.id > b.id) ? 1 : -1
                );
                setGridData(data);
                setGridRows(createRows(data, displayPage));
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
    const createRows = (data, page) => {
      let tempRows = [];
      let i = (page == 1 ? 0 : 10);
      for(i; i < data.length; i++){
          let result = data[i];
          tempRows.push({ 
              id: result.id, 
              playbook: result.playbook.name,
              run: result.run, 
              read_variable_name: result.read_variable_name ? result.read_variable_name : "N/A", 
              write_variable_name: result.write_variable_name ? result.write_variable_name : "N/A", 
              function: result.function.name, 
              status: Playbook_status.getType(result.status), 
              last_changes: new Date(result.last_changes),
          });
      }
      return tempRows;
    }
    const selectPlaybook = async (selectionModel) => {
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
          let playbook = GridData[i];
          if(playbook.id == selectionModel[0]){
            let read_name = []
            let write_name = []
            try
            {
              read_name = await API.masters.redisKey(encodeURI(playbook.read_variable_name));
              write_name = await API.masters.redisKey(encodeURI(playbook.write_variable_name));
            }
            catch(error)
            {
              enqueueSnackbar("There was a problem retrieving the Redis read and write keys. This may be because Redis is not configured.")
            }
              let selectedPlaybookTemp = {
              playbook: playbook.playbook ? playbook.playbook.name : "N/A",
              function: playbook.function ? playbook.function.name : "N/A",
              status: playbook.status ? Playbook_status.getType(playbook.status) : "N/A",
              run: playbook.run ? playbook.run : "N/A",
              message: playbook.message ? playbook.message : "N/A",
              last_changes: playbook.last_changes ? convertDateTime(playbook.last_changes): "N/A",
              created: playbook.created ? convertDateTime(playbook.created) : "N/A",
              read_variable_name: (read_name.length > 0 ? read_name.data.value.length > 0 ? read_name.data.value[0] : "N/A" : "N/A"),
              write_variable_name: (write_name.length > 0 ? write_name.data.value.length > 0 ? write_name.data.value[0] : "N/A" : "N/A"),
            }
            setSelectedItem(selectedPlaybookTemp);
          }
        }
      }
    const deletePlaybook = async () => {
        var result = confirm("Are you sure you want to delete this Playbook execution?");
        if(result){
            try{
                const response = await API.playbookExecutions.delete(selectedId);
                if(response.status == 204){
                  enqueueSnackbar("Deleted playbook Execution.", {variant:"success"});
                  getPlaybooks(currentPage, 1);
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
    const handlePageChange = async (event) => {
      let pageIndex = Math.floor(event.page / 2);
      if(currentPage < pageIndex){
        setCurrentPage(pageIndex);
        getPlaybooks(pageIndex, 1);
      }else if(currentPage > pageIndex){
        setCurrentPage(pageIndex);
        getPlaybooks(pageIndex, 2);
      } else {
        if(event.page % 2 == 0){
          setGridRows(await createRows(GridData, 1));
        } else {
          setGridRows(await createRows(GridData, 2));
        }
      }
    }
    const convertDateTime = (date) => {
      return new Date(date).toDateString() + ' : ' + new Date(date).toLocaleTimeString();
    }
    //This fires things on startup
    useEffect(() => {
        getPlaybooks(currentPage, 1);
        return () => {
        }
    }, [])
    return (
        <>
    <h1>Playbook Executions</h1>
    <DataGrid 
      rows={GridRows} 
      columns={playbookColumns} 
      pageSize={10} 
      autoHeight={true} 
      pagination
      rowCount={rowCount}
      paginationMode="server"
      onPageChange={handlePageChange}
      onSelectionModelChange={(newSelection) =>{
          selectPlaybook(newSelection);
        }}
      selectionModel={selectionModel}
    />
    <div className='buttonContainer'>
        {selectedItem != null ? <Button variant="contained" color="secondary" onClick={()=>{deletePlaybook()}}>Delete Selected</Button> : null}
    </div>
    {selectedItem != null && 
    <div className="detailContainer">
      <h1>Playbook Execution Details</h1>
      <div className="detail"><div className="detailTitle">Playbook: </div>{selectedItem.playbook}</div>
      <div className="detail"><div className="detailTitle">Function: </div>{selectedItem.function}</div>
      <div className="detail"><div className="detailTitle">Status: </div>{selectedItem.status}</div>
      <div className="detail"><div className="detailTitle">Run: </div>{selectedItem.run}</div>
      <div className="detail"><div className="detailTitle">Message: </div>{selectedItem.message}</div>
      <div className="detail"><div className="detailTitle">Last Changes: </div>{selectedItem.last_changes}</div>
      <div className="detail"><div className="detailTitle">Created: </div>{selectedItem.created}</div>
      <div className="detail"><div className="detailTitle">Read Variable Name: </div>{selectedItem.read_variable_name}</div>
      <div className="detail"><div className="detailTitle">Write Variable Name: </div>{selectedItem.write_variable_name}</div>
    </div>}
    {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
    )
}

export default PlaybookExecutions