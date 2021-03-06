import React from "react"
import MetaTags from 'react-meta-tags';
import TabBar from './tabBar.js'

import {
  Container
} from "reactstrap"

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb"

// The index page contains the tab bar that allows the user to select between the automation, orchestration, and executions sections.

function Runners() {

    return (
      <React.Fragment>
        <div className="page-content">
          <MetaTags>
            <title>Soarcast | Runners and Playbooks</title>
          </MetaTags>
          <Container fluid>
            {/* Render Breadcrumb */}
            <Breadcrumbs
              title="Soarcast"
              breadcrumbItem='Runners and Playbooks'
            />
            <TabBar></TabBar>
            
          </Container>
        </div>
          </React.Fragment>
    )
}

export default Runners
      
