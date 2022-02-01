import React, { Component } from "react"
import TabBar from './tabBar.js'
import Check from './check.svg'
import {
  Container,
} from "reactstrap"

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb"

class Configuration extends Component {

  render() {
    return (
      <React.Fragment>
        <div className="page-content">
            <title>Soarcast | Configuration</title>
          <Container fluid>
            {/* Render Breadcrumb */}
            <Breadcrumbs
              title="Soarcast"
              breadcrumbItem="Configuration"
            />
            <TabBar></TabBar>
          </Container>
        </div>
      </React.Fragment>
    )
  }
}

export default Configuration
