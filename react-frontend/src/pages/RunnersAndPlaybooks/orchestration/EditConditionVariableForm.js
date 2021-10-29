import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const EditConditionVariableForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [functionVariable, setFunctionVariable] = useState(0);
  const [variable, setVariable] = useState(0);
  const [redisVariable, setRedisVariable] = useState(false);
  const [logoutCounter, setLogoutCounter] = useState(0);
  const history = useHistory();
  useEffect(() => {
    if (logoutCounter === 1) {
      alert("Your session has expired. Please login again.")
      sessionStorage.removeItem('token')
      history.push('/logout')
    }
  }, [logoutCounter]);

  const getConditionVariable = async () => {
    if(props.selectedVariable.length > 0){
      try
      {
        let response = await API.conditionVariables.detail(props.selectedVariable[0]);
        if (response.status === 200) {
          let data = response.data;
          setFunctionVariable(data.function_variable);
          setVariable(data.variable != null ? (data.variable) : 0);
          setRedisVariable(data.redis_variable_value);
        }
      }
      catch(error) {
        if (error.request)
            if (error.request.status === 403)
              setLogoutCounter(logoutCounter => logoutCounter + 1)
      }
    }
  }

  useEffect(() => {
      getConditionVariable(props.selectedVariable[0])
  }, [props.selectedVariable]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let variableParam = variable
    variable === 0 ? (variableParam = null) : null
  
    const params = {
      function_variable: functionVariable,
      variable: variableParam,
      redis_variable_value: redisVariable,
      condition: props.condition
    }
    props.postData(params);
  }
  return (
    <>
      <form onSubmit={handleSubmit}>
        <h1>{props.selectedVariable.length > 0 ? 'Edit' : 'Add'} Condition Variable</h1>
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
          <option key='noConditionVariable' value={0}>No Variable</option>
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
          <Button type='submit' className="saveButton" variant="contained" color="secondary">{props.selectedVariable.length > 0 ? 'Edit' : 'Add'} Variable</Button>
        </div>
      </form>
    </>
  );
          };

export default EditConditionVariableForm;