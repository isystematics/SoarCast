import React, { Component } from "react"
import PropTypes from "prop-types"
import { Collapse } from "reactstrap"
import { Link, withRouter } from "react-router-dom"

class Navbar extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    let matchingMenuItem = null
    const ul = document.getElementById("navigation")
    const items = ul.getElementsByTagName("a")
    for (let i = 0; i < items.length; ++i) {
      if (this.props.location.pathname === items[i].pathname) {
        matchingMenuItem = items[i]
        break
      }
    }
    if (matchingMenuItem) {
      this.activateParentDropdown(matchingMenuItem)
    }
  }

  activateParentDropdown = item => {
    item.classList.add("active")
    const parent = item.parentElement
    if (parent) {
      parent.classList.add("active") // li
      const parent2 = parent.parentElement
      parent2.classList.add("active") // li
      const parent3 = parent2.parentElement
      if (parent3) {
        parent3.classList.add("active") // li
        const parent4 = parent3.parentElement
        if (parent4) {
          parent4.classList.add("active") // li
          const parent5 = parent4.parentElement
          if (parent5) {
            parent5.classList.add("active") // li
            const parent6 = parent5.parentElement
            if (parent6) {
              parent6.classList.add("active") // li
            }
          }
        }
      }
    }
    return false
  }

  render() {
    return (
      <React.Fragment>
        <div className="topnav">
          <div className="container-fluid">
            <nav
              className="navbar navbar-light navbar-expand-lg topnav-menu"
              id="navigation"
            >
              <Collapse
                isOpen={this.props.menuOpen}
                className="navbar-collapse"
                id="topnav-menu-content"
              >
                <ul className="navbar-nav">
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/dashboard"
                    >
                      <i className="bx bx-home-circle me-2" />
                      Dashboard {this.props.menuOpen}
                    </Link>
                  </li>

                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/configuration"
                    >
                      <i className="bx bx-home-circle me-2" />
                      Configuration {this.props.menuOpen}
                    </Link>
                  </li>

                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/runners-and-playbooks"
                    >
                      <i className="bx bx-home-circle me-2" />
                      Runners and Playbooks {this.props.menuOpen}
                    </Link>
                  </li>


                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/notifications"
                    >
                      <i className="bx bx-calendar me-2" />
                      Notifications {this.props.menuOpen}
                    </Link>
                  </li>

                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/users"
                    >
                      <i className="bx bx-calendar me-2" />
                      Users {this.props.menuOpen}
                    </Link>
                  </li> 

                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/saltstack"
                    >
                      <i className="bx bx-calendar me-2" />
                      Saltstack {this.props.menuOpen}
                    </Link>
                  </li>  
                  <li className="nav-item dropdown">
                    <Link
                      className="nav-link dropdown-toggle arrow-none"
                      to="/audit"
                    >
                      <i className="bx bx-calendar me-2" />
                      Audit History {this.props.menuOpen}
                    </Link>
                  </li> 
                </ul>
              </Collapse>
            </nav>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

Navbar.propTypes = {
  location: PropTypes.object,
  menuOpen: PropTypes.any,
}

export default withRouter((Navbar))
