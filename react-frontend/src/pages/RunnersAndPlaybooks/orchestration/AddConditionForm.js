import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const AddConditionsForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [name, setName] = useState(localStorage.getItem('conditionName') ? JSON.parse(localStorage.getItem('conditionName')) : '')
    const [condition, setCondition] = useState(localStorage.getItem('conditionCondition') ? JSON.parse(localStorage.getItem('conditionCondition')) : '')
    

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
    localStorage.setItem('conditionName', JSON.stringify(name))
}, [name]);
useEffect(() => {
      localStorage.setItem('conditionCondition', JSON.stringify(condition))
}, [condition]);

function handleSubmit(e) {
  e.preventDefault()

    const params = {
      name: name,
      condition: condition
    }
    postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = await API.conditions.add(params);;
      const data = response.data
      if (response.status === 201)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getData()
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
            <h1>Add Playbook Condition</h1>
            <div className='inputRow'>
            <label className='label' for='Schedule'>Name*:</label>
            <input name="schedule" value={name} type='text' id='Schedule' required='required' onChange={e => setName(name => e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Schedule'>Condition*:</label>
            <input name="schedule" value={condition} type='text' id='Schedule' required='required' onChange={e => setCondition(condition => e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <p></p>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Save</Button>
            </div>
            </form>
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
  );
          };

export default AddConditionsForm;