import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const AddConditionVariableForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [functionVariable, setFunctionVariable] = useState(localStorage.getItem('conditionVariablefunctionVariable') ? JSON.parse(localStorage.getItem('functionVariable')) : 0)
    const [variable, setVariable] = useState(localStorage.getItem('conditionVariableVariable') ? JSON.parse(localStorage.getItem('conditionVariableVariable')) : 0)
    const [redisVariable, setRedisVariable] = useState(localStorage.getItem('conditionVariableRedisVariable') ? JSON.parse(localStorage.getItem('conditionVariableRedisVariable')) : false)

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
  

useEffect(() => 
{
    localStorage.setItem('conditionVariableFunctionVariable', JSON.stringify(functionVariable))
}, [functionVariable]);
useEffect(() => {
      localStorage.setItem('conditionVariableVariable', JSON.stringify(variable))
}, [variable]);
useEffect(() => {
  localStorage.setItem('conditionVariableRedisVariable', JSON.stringify(redisVariable))
}, [redisVariable]);


function handleSubmit(e) {
  e.preventDefault()
  let variableParam = variable
  variable === 0 ? (variableParam = null) : null

    const params = {
      function_variable: functionVariable,
      variable: variableParam,
      redis_variable_value: redisVariable,
      condition: props.condition
    }
    postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = await API.conditionVariables.add(params);;
      const data = response.data
      if (response.status === 201)
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
          if (error.request.status === 400)
          {
            enqueueSnackbar(error.response.request.response);
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
              <h1>Add Condition Variable</h1>
              <div className='inputRow'>
              <label className='label'>Function Variable:</label>
              <select name="mapping" type='text' required='required' id='Minion' value={functionVariable} onChange={e => setFunctionVariable(functionVariable => parseInt(e.target.value))}>
              {props.functionVariableData.map((functionVariable, index) =>
              {
                return(
                  <option key={`variable ${functionVariable.id}`} value={functionVariable.id}>{functionVariable.name}</option>
                  )
              })
              }
              </select>
              </div>
              <div className='inputRow'>
              <label className='label'>Variable:</label>
              <select name="mapping" type='text' required='required' id='Minion' value={variable} onChange={e => setVariable(variable => parseInt(e.target.value))}>
              <option key='noVariable' value={0}>No Variable</option>
              {props.variableSetData.map((variableSet, outerIndex) =>
              {
                return(
                  <>
                {variableSet.variables.map((variable, innerIndex) =>
                  {
                    return(
                      <option key={`variable ${innerIndex} ${outerIndex}`} value={variable.id}>{`${variableSet.name} / ${variable.name}`}</option>
                      )
                  })
                }
                </>
                )
              })
              }
              </select>
              </div>
              <div className='inputRow'>
              <label className='label'>Redis Variable Value*:</label>
              <input type="checkbox" checked={redisVariable} onChange={(e) => setRedisVariable(e.target.checked)}></input>
              </div>
              <div className="inputRow">
              <p></p>
              <Button type='submit' className="saveButton" variant="contained" color="secondary">Add Variable</Button>
              </div>
              </form>
              {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}
    </>
  )
}

export default AddConditionVariableForm;