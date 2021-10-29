import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const AddVariableSet = (props) => {

  const [name, setName] = useState(localStorage.getItem('variableSetName') ? JSON.parse(localStorage.getItem('variableSetName')) : '')
  const [app, setApp] = useState(localStorage.getItem('variableSetApp') ? JSON.parse(localStorage.getItem('variableSetApp')) : '')
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  useEffect(() => 
{
    localStorage.setItem('variableSetName', JSON.stringify(name))
}, [name]);
useEffect(() => {
      localStorage.setItem('variableSetApp', JSON.stringify(app))
}, [app]);

    const [error, setError] = useState('');
    const [nameError, setNameError] = useState('');

    const [logoutCounter, setLogoutCounter] = useState(0)

    const history = useHistory()
  
    // Log the user out
    useEffect(() => {
      if (logoutCounter === 1)
        {
          alert("Your session has expired. Please login again.")
          sessionStorage.removeItem('token')
          history.push('/logout')
        }
    }, [logoutCounter]);

    function string_to_slug (str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();
      
        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to   = "aaaaeeeeiiiioooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
    
        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // collapse whitespace and replace by -
            .replace(/-+/g, '-'); // collapse dashes
    
        return str;
       }





    // On submit, perform the add/edit actions. This has yet to be implemented.
function handleSubmit(e) {
  e.preventDefault()

    let hvac_path = string_to_slug(name)
    
    let params = {
        name: name,
        hvac_path: hvac_path,
        app: app,
    }
    if (app === 0)
    {
      params.app = null
    }
      postData(params)
  }

  async function postData(params) {
    try 
    {
      const response = await API.variableSets.add(params);
      const data = response.data
      if (response.status === 201)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getVariableSetData()
      }
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }

          if (error.request.status === 400)
            {
              const errorMessage = error.response.request.response
              if (errorMessage.includes('variable set with this name already exists.'))
                {
                    enqueueSnackbar('There is already a variable set with this name.')
                }
            }

          else {
            enqueueSnackbar("There was a problem connecting with the server.")
          }
        }
  }
}
  
  return (
    <>
            <h1>Variable Set</h1>
            <form onSubmit={handleSubmit}>
            <div className='inputRow'>
            <label className='label' for='name'>Name:*</label>
            <input name="name" value={name} type='text' required='required' id="name" onChange={e => setName(name => e.target.value)} ></input>
            </div>
            {nameError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{nameError}</Alert>}
            <div className='inputRow'>
            <label className='label' for='Minion'>App:*</label>
            <select name="mapping" type='text' required='required' id='Minion' value={app} onChange={e => setApp(app => parseInt(e.target.value))}>
            <option key='noapp' value={0}>No App</option>
            {props.appData.map((result, index) =>
            {
            return(
            <>
            <option key={`app ${index}`} value={result.id}>{result.name}</option>
            </>
            )
            })
          } 
          </select>
            </div>
            <div className='inputRow'>
            <div></div>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Save</Button>
            </div>
            </form>
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
  );
};

export default AddVariableSet;