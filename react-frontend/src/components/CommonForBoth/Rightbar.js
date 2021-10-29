import PropTypes from 'prop-types'
import React, { Component } from "react"

import { connect } from "react-redux"
import {
  hideRightSidebar,
  changeLayout,
  changeLayoutWidth,
  changeSidebarTheme,
  changeSidebarType,
  changePreloader,
  changeTopbarTheme,
} from "../../store/actions"

//SimpleBar
import SimpleBar from "simplebar-react"

import { Link } from "react-router-dom"

import "./rightbar.scss"

class RightSidebar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      layoutType: this.props.layoutType,
      sidebarType: this.props.leftSideBarType,
      layoutWidth: this.props.layoutWidth,
      sidebarTheme: this.props.leftSideBarTheme,
      topbarTheme: this.props.topbarTheme,
    }
    this.hideRightbar = this.hideRightbar.bind(this)
    this.changeLayout = this.changeLayout.bind(this)
    this.changeLayoutWidth = this.changeLayoutWidth.bind(this)
    this.changeLeftSidebarTheme = this.changeLeftSidebarTheme.bind(this)
    this.changeLeftSidebarType = this.changeLeftSidebarType.bind(this)
    this.changeTopbarTheme = this.changeTopbarTheme.bind(this)
    this.changeThemePreloader = this.changeThemePreloader.bind(this)
  }

  /**
   * Hides the right sidebar
   */
  hideRightbar(e) {
    e.preventDefault()
    this.props.hideRightSidebar()
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.setState({
        layoutType: this.props.layoutType,
        sidebarType: this.props.leftSideBarType,
        layoutWidth: this.props.layoutWidth,
        sidebarTheme: this.props.leftSideBarTheme,
        topbarTheme: this.props.topbarTheme,
      })
    }
  }

  changeThemePreloader = () => {
    this.props.changePreloader(!this.props.isPreloader)
  }
  /**
   * Change the layout
   * @param {*} e
   */
  changeLayout(e) {
    if (e.target.checked) {
      this.props.changeLayout(e.target.value)
    }
  }

  /**
   * Changes layout width
   * @param {*} e
   */
  changeLayoutWidth(e) {
    if (e.target.checked) {
      this.props.changeLayoutWidth(e.target.value)
    }
  }

  // change left sidebar design
  changeLeftSidebarType(e) {
    if (e.target.checked) {
      this.props.changeSidebarType(e.target.value)
    }
  }

  // change left sidebar theme
  changeLeftSidebarTheme(e) {
    if (e.target.checked) {
      this.props.changeSidebarTheme(e.target.value)
    }
  }

  // change topbar theme
  changeTopbarTheme(e) {
    if (e.target.checked) {
      this.props.changeTopbarTheme(e.target.value)
    }
  }

  render() {
    return (
      <React.Fragment>
        <div className="right-bar">
          <SimpleBar style={{ height: "900px" }}>
            <div data-simplebar className="h-100">
              <div className="rightbar-title px-3 py-4">
                <Link
                  to="#"
                  onClick={this.hideRightbar}
                  className="right-bar-toggle float-end"
                >
                  <i className="mdi mdi-close noti-icon"/>
                </Link>
                <h5 className="m-0">Settings</h5>
              </div>

              <hr className="my-0" />

              <div className="p-4">
                <div className="radio-toolbar">
                  <span className="mb-2 d-block">Layouts</span>
                  <input
                    type="radio"
                    id="radioVertical"
                    name="radioFruit"
                    value="vertical"
                    checked={this.state.layoutType === "vertical"}
                    onChange={this.changeLayout}
                  />
                  <label htmlFor="radioVertical">Vertical</label>
                  {"   "}
                  <input
                    type="radio"
                    id="radioHorizontal"
                    name="radioFruit"
                    value="horizontal"
                    checked={this.state.layoutType === "horizontal"}
                    onChange={this.changeLayout}
                  />
                  <label htmlFor="radioHorizontal">Horizontal</label>
                </div>

                <hr className="mt-1" />

                <div className="radio-toolbar">
                  <span className="mb-2 d-block" id="radio-title">
                    Layout Width
                  </span>
                  <input
                    type="radio"
                    id="radioFluid"
                    name="radioWidth"
                    value="fluid"
                    checked={this.state.layoutWidth === "fluid"}
                    onChange={this.changeLayoutWidth}
                  />
                  <label htmlFor="radioFluid">Fluid</label>
                  {"   "}
                  <input
                    type="radio"
                    id="radioBoxed"
                    name="radioWidth"
                    value="boxed"
                    checked={this.state.layoutWidth === "boxed"}
                    onChange={this.changeLayoutWidth}
                  />
                  <label htmlFor="radioBoxed">Boxed</label>
                  <input
                    type="radio"
                    id="radioscrollable"
                    name="radioscrollable"
                    value="scrollable"
                    checked={this.state.layoutWidth === "scrollable"}
                    onChange={this.changeLayoutWidth}
                  />
                  <label htmlFor="radioscrollable">Scrollable</label>
                </div>
                <hr className="mt-1" />

                <div className="radio-toolbar">
                  <span className="mb-2 d-block" id="radio-title">
                    Topbar Theme
                  </span>
                  <input
                    type="radio"
                    id="radioThemeLight"
                    name="radioTheme"
                    value="light"
                    checked={this.state.topbarTheme === "light"}
                    onChange={this.changeTopbarTheme}
                  />

                  <label htmlFor="radioThemeLight">Light</label>
                  {"   "}
                  <input
                    type="radio"
                    id="radioThemeDark"
                    name="radioTheme"
                    value="dark"
                    checked={this.state.topbarTheme === "dark"}
                    onChange={this.changeTopbarTheme}
                  />
                  <label htmlFor="radioThemeDark">Dark</label>
                  {"   "}
                  {this.state.layoutType === "vertical" ? null : (
                    <>
                      {" "}
                      <input
                        type="radio"
                        id="radioThemeColored"
                        name="radioTheme"
                        value="colored"
                        checked={this.state.topbarTheme === "colored"}
                        onChange={this.changeTopbarTheme}
                      />
                      <label htmlFor="radioThemeColored">Colored</label>{" "}
                    </>
                  )}
                </div>

                {this.state.layoutType === "vertical" ? (
                  <React.Fragment>
                    <hr className="mt-1" />
                    <div className="radio-toolbar">
                      <span className="mb-2 d-block" id="radio-title">
                        Left Sidebar Type
                      </span>
                      <input
                        type="radio"
                        id="sidebarDefault"
                        name="sidebarType"
                        value="light"
                        checked={
                          this.state.sidebarType === "default" ||
                          this.state.sidebarType === "light"
                        }
                        onChange={this.changeLeftSidebarType}
                      />

                      <label htmlFor="sidebarDefault">Default</label>
                      {"   "}
                      <input
                        type="radio"
                        id="sidebarCompact"
                        name="sidebarType"
                        value="compact"
                        checked={this.state.sidebarType === "compact"}
                        onChange={this.changeLeftSidebarType}
                      />
                      <label htmlFor="sidebarCompact">Compact</label>
                      {"   "}
                      <input
                        type="radio"
                        id="sidebarIcon"
                        name="sidebarType"
                        value="icon"
                        checked={this.state.sidebarType === "icon"}
                        onChange={this.changeLeftSidebarType}
                      />
                      <label htmlFor="sidebarIcon">Icon</label>
                    </div>

                    <hr className="mt-1" />

                    <div className="radio-toolbar">
                      <span className="mb-2 d-block" id="radio-title">
                        Left Sidebar Type
                      </span>
                      <input
                        type="radio"
                        id="leftsidebarThemelight"
                        name="leftsidebarTheme"
                        value="light"
                        checked={this.state.sidebarTheme === "light"}
                        onChange={this.changeLeftSidebarTheme}
                      />

                      <label htmlFor="leftsidebarThemelight">Light</label>
                      {"   "}
                      <input
                        type="radio"
                        id="leftsidebarThemedark"
                        name="leftsidebarTheme"
                        value="dark"
                        checked={this.state.sidebarTheme === "dark"}
                        onChange={this.changeLeftSidebarTheme}
                      />
                      <label htmlFor="leftsidebarThemedark">Dark</label>
                      {"   "}
                      <input
                        type="radio"
                        id="leftsidebarThemecolored"
                        name="leftsidebarTheme"
                        value="colored"
                        checked={this.state.sidebarTheme === "colored"}
                        onChange={this.changeLeftSidebarTheme}
                      />
                      <label htmlFor="leftsidebarThemecolored">Colored</label>
                    </div>
                    <hr className="mt-1" />
                  </React.Fragment>
                ) : null}

             </div>
            </div>
          </SimpleBar>
        </div>
        <div className="rightbar-overlay"/>
      </React.Fragment>
    )
  }
}

RightSidebar.propTypes = {
  changeLayout: PropTypes.func,
  changeLayoutWidth: PropTypes.func,
  changePreloader: PropTypes.func,
  changeSidebarTheme: PropTypes.func,
  changeSidebarType: PropTypes.func,
  changeTopbarTheme: PropTypes.func,
  hideRightSidebar: PropTypes.func,
  isPreloader: PropTypes.bool,
  layoutType: PropTypes.any,
  layoutWidth: PropTypes.any,
  leftSideBarTheme: PropTypes.any,
  leftSideBarType: PropTypes.any,
  topbarTheme: PropTypes.any
}

const mapStatetoProps = state => {
  return { ...state.Layout }
}

export default connect(mapStatetoProps, {
  hideRightSidebar,
  changeLayout,
  changeSidebarTheme,
  changeSidebarType,
  changeLayoutWidth,
  changeTopbarTheme,
  changePreloader,
})(RightSidebar)
