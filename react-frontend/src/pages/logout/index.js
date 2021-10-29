import React, {useEffect, useContext} from 'react';
import { useHistory } from 'react-router-dom'
import Context from '../../contexts/context.js';

export default function Logout() {
    const history = useHistory()
    const {globalState, globalDispatch} = useContext(Context);
    useEffect(() => {
        globalDispatch({type: "LOGOUT"})
            history.push('/login')
    }, []);
    return(<></>)
}