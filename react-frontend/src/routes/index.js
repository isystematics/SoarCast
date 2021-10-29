import React from "react"
import { Redirect } from "react-router-dom"


// Notifications Page
import Notifications from "../pages/Notifications/index"

// Users Page
import Users from "../pages/Users/index"

// Salt Masters Page
import Masters from "../pages/Masters/index"

// Runners Page
import Runners from "../pages/RunnersAndPlaybooks/index"

// Configuration
import Configuration from "../pages/Configuration/index"

// Dashboard
import Dashboard from "../pages/Dashboard/index"

// Login
import Login from '../pages/Login/index'

// Logout
import Logout from '../pages/logout/index'
import Audit from "pages/Audit/Audit"
import SecretVariables from "pages/SecretPages/SecretVariables"

const authProtectedRoutes = [
  { path: "/dashboard", component: Dashboard },

  // Pages
  { path: "/notifications", component: Notifications },
  { path: "/users", component: Users },
  { path: "/saltstack", component: Masters },
  { path: "/runners-and-playbooks", component: Runners },
  { path: "/configuration", component: Configuration },
  { path: "/variables/:hash", component: SecretVariables },
  { path: "/audit", component: Audit},
  { path: "/logout", component: Logout },
  // this route should be at the end of all other routes
  { path: "/", exact: true, component: () => <Redirect to="/dashboard" /> },
]

const publicRoutes = [
  { path: "/login", component: Login }
]

export { authProtectedRoutes, publicRoutes }
