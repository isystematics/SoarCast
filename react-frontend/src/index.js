import React from "react"
import ReactDOM from "react-dom"
import App from "./App"
import { HashRouter } from "react-router-dom"
import { Provider } from "react-redux"
import { SnackbarProvider } from 'notistack';

import store from "./store"
import axios from 'axios'
axios.defaults.baseURL = 'https://api.test.soarcast.io'

const app = (
  <Provider store={store}>
    <HashRouter>
      <SnackbarProvider maxSnack={3}>
        <App />
      </SnackbarProvider>
    </HashRouter>
  </Provider>
)

ReactDOM.render(app, document.getElementById("root"))
