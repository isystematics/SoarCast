import React, { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import {} from "../../store/actions"

import SidebarContent from "./SidebarContent"

class Sidebar extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <React.Fragment>
        <div className="vertical-menu" >
          <div data-simplebar >
            {this.props.type !== "condensed" ? (
              <SidebarContent />
            ) : (
              <SidebarContent />
            )}
          </div>
        </div>
      </React.Fragment>
    )
  }
}

Sidebar.propTypes = {
  type: PropTypes.string,
}

const mapStateToProps = state => {
  return {
    layout: state.Layout,
  }
}
export default connect(
  mapStateToProps,
  {}
)(withRouter(Sidebar))
