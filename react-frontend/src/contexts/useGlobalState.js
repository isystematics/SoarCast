import {useReducer} from 'react'

const reducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            sessionStorage.setItem('loggedIn', 'true')
            return {
                isLoggedIn: true
            }
        case "LOGOUT":
            sessionStorage.removeItem('loggedIn')
            sessionStorage.removeItem('token')
            return {
                isLoggedIn: false
            }
        default:
            return {
                state
            }
    }
}

const UseGlobalState = () => {
    const [globalState, globalDispatch] = useReducer(reducer, {
        isLoggedIn: false
    })

    return {globalState, globalDispatch};

}

export default UseGlobalState;