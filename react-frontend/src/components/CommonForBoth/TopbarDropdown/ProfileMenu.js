import React, { Component } from "react"
import PropTypes from 'prop-types'
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
} from "reactstrap"
import { withRouter, Link } from "react-router-dom"

class ProfileMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      menu: false,
      name: "User Options",
    }
    this.toggle = this.toggle.bind(this)
  }

  toggle() {
    this.setState(prevState => ({
      menu: !prevState.menu,
    }))
  }

  render() {
    return (
      <React.Fragment>
        <Dropdown
          isOpen={this.state.menu}
          toggle={this.toggle}
          className="d-inline-block"
        >
          <DropdownToggle
            className="btn header-item waves-effect"
            id="page-header-user-dropdown"
            tag="button"
          >
            <span className="d-none d-xl-inline-block ms-1">
              {this.state.name}
            </span>
            <i className="mdi mdi-chevron-down d-none d-xl-inline-block"/>
          </DropdownToggle>
          <DropdownMenu>
            <div className="dropdown-divider"/>
            <Link to="/logout" className="dropdown-item">
              <i className="bx bx-power-off font-size-16 align-middle me-1 text-danger"/>
              <span>Logout</span>
            </Link>
          </DropdownMenu>
        </Dropdown>
      </React.Fragment>
    )
  }
}

ProfileMenu.propTypes = {
  t: PropTypes.any
}

export default withRouter(ProfileMenu)
