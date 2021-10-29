import React, {useState, useEffect } from "react"
import '../styles.css'
import Button from '@material-ui/core/Button';
import { useHistory } from "react-router-dom"
import { DataGrid } from '@material-ui/data-grid';
import { API } from "Api";
import EditPlaybookItemForm from './EditPlaybookItemForm.js'
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import { useSnackbar } from 'notistack';
function PlaybookItems(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [loadingItems, setLoadingItems] = useState(false)

    const [loadingConditions, setLoadingConditions] = useState(false)

    const [error, setError] = useState('');

    // Playbook table and data
    const [columns, setColumns] = useState([
    { field: 'function', headerName: 'Function', flex: 1 },
    { field: 'order', headerName: 'Order in Playbook', flex: 1 },
    ])
    const [rows, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [itemData, setItemData] = useState([]);
    const [totalItems, setTotalItems] = useState([]);

    const [conditionData, setConditionData] = useState([]);

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

    // The API calls are made every time the component rerenders.
    
    useEffect(() => {
        getItemData(2)
        getConditionData(3)
    }, [props.selectedPlaybook]);


    // This function takes in the API endpoint and the data type it is getting to determine which type of data (runner, mapping, etc.) to get.

    // If the call to the API returns a 403 request, this means that the user's JWT token has expired. It will then display an alert
    // and redirect the user to the logout page. Because the API calls are made asynchronously, a logout counter is used to make sure
    // the logout action only occurs once instead of occuring multiple times on simultaneous failed API calls.

    async function getItemData(depthParam) {

        try
        {
          let params = {
            playbook: props.selectedPlaybook[0],
            depth: depthParam
          }
          let response = await API.playbookItems.listAll(params);
          if (response.status === 200)
          {
              setTotalItems(response.data.count)
              let data = response.data.results;
              data.sort((a, b)=>
                (a.group > b.group) ? 1 : -1
              );
              let tempRows = [];
              for(let i = 0; i < data.length; i++){
                let result = data[i];
                tempRows.push({ id: result.id, function: `${result.function.module.name}.${result.function.name}`, order: result.group + 1})
              }
              setRows(tempRows);
              setItemData(data)
              setLoadingItems(true)
          }
        }
      catch(error) {
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

  async function getConditionData(depthParam) {
    let morePages = true

    let pageIndex = 1

    let data = []
    
    try
    {
      while (morePages)
      {
        let params = {
            depth: depthParam,
            page: pageIndex
        }
        let response = await API.conditions.listAll(params);
        if (response.status === 200)
        {
            let results = response.data.results;
            data = data.concat(results)
            if (response.data.next === null)
            {
              morePages = false
            }
            else
            {
              pageIndex++
            }
        }
      }
      data.sort((a, b)=>
        (a.id > b.id) ? 1 : -1
      );
      let tempRows = [];
      for(let i = 0; i < data.length; i++){
        let result = data[i];
        tempRows.push({ id: result.id, name: result.name, condition: result.condition})
      }
      setConditionData(data)
      setLoadingConditions(true)
    }
      catch(error) {
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
    
    return (
        <>
        {loadingItems && loadingConditions ? (
      <>
      <h1>Playbook Items</h1>
      <DataGrid 
        rows={rows} 
        columns={columns} 
        pageSize={10}  
        autoHeight={true} 
        paginationMode='client'
        onSelectionModelChange={(newSelection) =>{
          setSelectedRows(newSelection);
        }}
      />
      <div className='buttonContainer'>
        {selectedRows.length > 0 ? <Button onClick={() =>{setSelectedRows([])}} variant="contained" color="primary">Deselect</Button> : null}
      </div>
        {selectedRows.length > 0 && (
          <EditPlaybookItemForm selectedItem={selectedRows} playbookData itemData={itemData} conditionData={conditionData} getData={getItemData} totalItems={totalItems}></EditPlaybookItemForm>
        )}
        </>
        ) : <LoadingOverlay />
        }
        </>
    )
  }

export default PlaybookItems
