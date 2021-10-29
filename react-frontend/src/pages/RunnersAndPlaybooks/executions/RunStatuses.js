import React, { useState, useEffect } from "react"
import { DataGrid } from '@material-ui/data-grid';
import '../styles.css';
import './runner.css';
import Button from '@material-ui/core/Button';
import { Alert } from "react-bootstrap"
import { API } from "Api";
import Runner_status from "models/runner_status.js";
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
// Loops through the results data and displays it in a table. If the edit button is clicked it sets the id and index value to the 
// corresponding values for that item.
const RunStatuses = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [error, setError] = useState('');
    const [Columns, setColumns] = useState([
        { field: 'runner', headerName: 'Runner', flex: 2 },
        { field: 'playbook', headerName: 'Playbook', flex: 1},
        { field: 'status', headerName: 'Status', flex: 1},
        { field: 'started', headerName: 'Started', flex: 1},
        { field: 'finished', headerName: 'Finished', flex: 1},
    ])
    const [GridData, setGridData] = useState([]);
    const [GridRows, setGridRows] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const [selectedId, setSelectedId] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);
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


    //page should be 1 or 2
    const getRunners = async (pageIndex, displayPage) => {
        try 
        {
            let params = {
                depth : 2,
                page: pageIndex + 1,
            }
            const response = await API.runStatuses.list(params);
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
        let rowData = data[i];
        tempRows.push(createRowObj(rowData));
      }
      return tempRows;
    }
    const createRowObj = (rowData) => {
      return { 
        id: rowData.id, 
        runner: rowData.runner != null ? rowData.runner.api_alias: 'N/A',
        playbook: rowData.playbook != null ? rowData.playbook.name : 'N/A',
        status: Runner_status.getType(rowData.status), 
        started: new Date(rowData.started),
        finished: new Date(rowData.finished),
      }
    }
    const selectRunner = async (selectionModel) => {
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
          let runnerStatus = GridData[i];
          if(runnerStatus.id == selectionModel[0]){
            let selectedRunner = {
              status: Runner_status.getType(runnerStatus.status != undefined ? runnerStatus.status : -1),
              started: runnerStatus.started ? convertDateTime(runnerStatus.started) : "Null",
              finished: runnerStatus.finished ? convertDateTime(runnerStatus.finished) : "Null",
              failed: runnerStatus.failed ? runnerStatus.failed : "Null",
              status_code: runnerStatus.status_code ? runnerStatus.status_code : "Null",
              body: runnerStatus.body ? runnerStatus.body : "Null",
              user: runnerStatus.user ? runnerStatus.user.name : "Null",
              runner: runnerStatus.runner ? runnerStatus.runner.api_alias : "Null",
              playbook: runnerStatus.playbook ? runnerStatus.playbook.name : "Null",
              variables: runnerStatus.variables ? runnerStatus.variables : "Null"
            }
            setSelectedItem(selectedRunner);
          }
        }
      }
    const deleteRunner = async () => {
        var result = confirm("Are you sure you want to delete this run status?");
        if(result){
            try{
                const response = await API.runStatuses.delete(selectedId);
                if(response.status == 204){
                  enqueueSnackbar("Deleted run status.", {variant:"success"});
                  getRunners(currentPage, 1);
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
    const handlePageChange = (event) => {
      let pageIndex = Math.floor(event.page / 2);
      if(currentPage < pageIndex){
        setCurrentPage(pageIndex);
        getRunners(pageIndex, 1);
      }else if(currentPage > pageIndex){
        setCurrentPage(pageIndex);
        getRunners(pageIndex, 2);
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
    //This fires things on startup
    useEffect(() => {
        getRunners(currentPage, 1);
        return () => {
        }
    }, [])
    return (
        <>
    <h1>Run Statuses</h1>
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
          selectRunner(newSelection);
        }}
      selectionModel={selectionModel}
    />
    <div className='buttonContainer'>
        {selectedItem != null ? <Button variant="contained" color="secondary" onClick={()=>{deleteRunner()}}>Delete Selected</Button> : null}
    </div>
    
    
    {selectedItem != null && 
    <div className="detailContainer">
      <h1>Run Status Details</h1>
      <div className="detail"><div className="detailTitle">Status: </div>{selectedItem.status}</div>
      <div className="detail"><div className="detailTitle">Started: </div>{selectedItem.started}</div>
      <div className="detail"><div className="detailTitle">Finished: </div>{selectedItem.finished}</div>
      <div className="detail"><div className="detailTitle">Failed: </div>{selectedItem.failed}</div>
      <div className="detail"><div className="detailTitle">Status Code: </div>{selectedItem.status_code}</div>
      <div className="detail"><div className="detailTitle">Body: </div>{selectedItem.body}</div>
      <div className="detail"><div className="detailTitle">User: </div>{selectedItem.user}</div>
      <div className="detail"><div className="detailTitle">Runner: </div>{selectedItem.runner}</div>
      <div className="detail"><div className="detailTitle">Playbook: </div>{selectedItem.playbook}</div>
      <div className="detail"><div className="detailTitle">Variables: </div>{selectedItem.variables}</div>
    </div>}
    {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}
    </>
    )
}

export default RunStatuses