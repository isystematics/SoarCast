import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const EditPlaybookMappingForm = (props) => {

const [variable, setVariable] = useState(0)
const [playbookMappingData, setPlaybookMappingData] = useState()
const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  // Used to store error messages

  // General error messages

  const [error, setError] = useState('');

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

  async function getPlaybookMapping(depthParam) {

    let params = {
      depth: depthParam,
    }

    try
    {
      let response = await API.playbookMappings.list(props.selectedMapping[0], params);
      if (response.status === 200)
      {
        let data = response.data
        setVariable(data.variable != null ? (data.variable.id) : 0)
        setPlaybookMappingData(data)

      }
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
        }
  }
  }

  useEffect(() => {
      getPlaybookMapping(1)
  }, [props.selectedMapping]);

function handleSubmit(e) {
  e.preventDefault()

    let variableParam = variable
    variable === 0 ? (variableParam = null) : null

    const params = {
      variable: variableParam,
      playbook: playbookMappingData.playbook.id,
      function_variable: playbookMappingData.function_variable.id
    }
    postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = await API.playbookMappings.edit(props.selectedMapping[0], params)
      const data = response.data
      if (response.status === 200)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getData(3)
      }
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
          else {
            enqueueSnackbar("There was a problem connecting with the server.")
          }
        }
  }
}
  
  return (
    <>
            <form onSubmit={handleSubmit}>
            <div className='inputRow'>
            <label className='label'>Variable:</label>
            <select name="mapping" type='text' required='required' id='Minion' value={variable} onChange={e => setVariable(variable => parseInt(e.target.value))}>
            <option key='noMappingVariable' value={0}>No Variable</option>
            {props.variableSetData.map((variable, index) =>
            {
                return(
                  <option key={`variable ${index}`} value={variable.id}>{`${variable.name}`}</option>
                  )
            })
            }
            </select>
            </div>
            <div className="inputRow">
            <p></p>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Submit</Button>
            </div>
            </form>
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
  );
          };

export default EditPlaybookMappingForm;