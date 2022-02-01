import React, { useState, useEffect, useMemo } from "react"
import Button from '@material-ui/core/Button';
import './styles.css'
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import {
  Container,
} from "reactstrap"

import { DataGrid } from '@material-ui/data-grid';
import Breadcrumbs from "../../components/Common/Breadcrumb"
import boolGridElement from "../../components/Common/boolGridElement"
import { API } from "Api";
import Notification_types from "models/notification_types";
import GridFormControl from "components/GridFormControl/GridFormControl";
import { useSnackbar } from "notistack";

const Notifications = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const markAsRead = async () => {
    try {
      let params = {
          ids: selectionModel
      }
      const response = await API.notification.markAsRead(params);
      if (response.status === 202){
        setRefreshData(!refreshData);
        enqueueSnackbar("Marked notification as read.", {variant:"success"});
      }
    } 
    catch(error){
      if (error.request)
        if (error.request.status === 403)
          setLogoutCounter(logoutCounter => logoutCounter + 1);
      else 
        enqueueSnackbar("There was a problem connecting with the server.");
    }
  }
  const [selectionModel, setSelectionModel] = useState([]);
  const [model, setModel] = useState({id:''});
  const [refreshData, setRefreshData] = useState(false);
  const formatDate = (value) => {
      let newDate = new Date(value);
      return newDate;
  }
  const pageOptions = {
    setParentSelectionModel: setSelectionModel,
    setParentModel: setModel,
    refreshData: refreshData,
    gridOptions: {
      label: 'Notifications',
      checkboxSelection: true,
      columns: [
        { field: 'subject', headerName: 'Subject', flex: 1 },
        { field: 'notification_type', headerName: 'Notification Type', flex: 1, renderCell: (params) => Notification_types.getType(params.value) },
        { field: 'date', headerName: 'Date', flex: 1},
        { field: 'message', headerName: 'Message HTML', flex: 2, renderCell: (params)=> displayHTML(params.value)  },
        { field: 'read', headerName: 'Read', flex: 1, renderCell: (params)=> boolGridElement(params.value)},
      ],
      buttonOptions: [
        {label: 'Mark as Read', type: 'button', color: 'primary', buttonAction:markAsRead},
      ],
    },
    ApiCalls: {
      list: (params) => API.notification.list(params),
    }
  }
  return (
    <React.Fragment>
      <div className="page-content">
          <title>Soarcast | Notifications</title>
        <Container fluid>
          <Breadcrumbs
            title="Soarcast"
            breadcrumbItem='Notifications'
          />
          <GridFormControl options={pageOptions}/>
        </Container>
      </div>
      
    </React.Fragment>
  )
}
//Checks if there is HTML, and if there is, places it inside of a div to be displayed on the grid. 
const displayHTML = (html) => {
  let regex = new RegExp('<.+?>', 'g');
  if(regex.test(html)){
    let div = <div className="gridElementContainer" dangerouslySetInnerHTML={createMarkup(html)}></div>;
    return (div);
  }
  return html;
}
//The React way of shoving innerHTML within an Element
function createMarkup(html) {
  return {__html: html};
}
export default Notifications
      

