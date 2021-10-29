import React from 'react'
import UseGlobalState from './useGlobalState'
import Context from './context'

const GlobalStateProvider = ({children}) => {
    return (
        <Context.Provider value={UseGlobalState()}>{children}</Context.Provider>
    )
}

export default GlobalStateProvider;