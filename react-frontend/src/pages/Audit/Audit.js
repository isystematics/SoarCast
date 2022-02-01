import React, { useState } from "react"
import MetaTags from 'react-meta-tags';
import {
  Container,
} from "reactstrap"
import { API } from "Api";
import Breadcrumbs from "../../components/Common/Breadcrumb"
import GridFormControl from '../../components/GridFormControl/GridFormControl.js';
import '../../styles.css'
const Audit = () => {
    const [selectionModel, setSelectionModel] = useState([]);
    const [model, setModel] = useState({id:''});
    const formatDate = (value) => {
        let newDate = new Date(value);
        return newDate;
    }
    const pageOptions = {
        setParentSelectionModel: setSelectionModel,
        setParentModel: setModel,
        gridOptions: {
          label: 'Audit History',
          columns: [
            { field: 'action', headerName: 'Action', flex: 1 },
            { field: 'ip', headerName: 'IP', flex: 1 },
            { field: 'username', headerName: 'Username', flex: 1},
            { field: 'user', headerName: 'User', flex: 1 },
            { field: 'date', headerName: 'Date', flex: 1, valueFormatter:(params)=>formatDate(params.value)},
          ],
        },
        ApiCalls: {
          list: (params) => API.auditEntries.list(params),
        }
      }
    return (
        <React.Fragment>
            <div className="page-content">
                <MetaTags>
                <title>Soarcast | Audit History</title>
                </MetaTags>
                <Container fluid>
                <Breadcrumbs
                    title="Soarcast"
                    breadcrumbItem="Audit History"
                />
                <GridFormControl options={pageOptions} />
                
                </Container>
            </div>
        </React.Fragment>
    )
}

export default Audit
