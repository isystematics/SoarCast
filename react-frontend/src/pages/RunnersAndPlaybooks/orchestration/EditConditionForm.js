import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const EditConditionForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.

  const [id, setId] = useState(0)
  const [name, setName] = useState('')
  const [condition, setCondition] = useState('')
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  function filterCondition () {
    let conditionObject= props.data.filter(function(row)
    {
      let id = props.selectedCondition[0]
      return row.id === id
    })
    setId(conditionObject[0].id)
    setName(conditionObject[0].name)
    setCondition(conditionObject[0].condition)
  }

  useEffect(() => 
    {
        filterCondition()
    }, [props.selectedCondition]);
    

  // Used to store error messages

  // General error messages

  const [error, setError] = useState('');

  const [scheduleError, setScheduleError] = useState('')

  const [variableSetsError, setVariableSetsError] = useState('')

  const [functionsError, setFunctionsError] = useState('')

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

function handleSubmit(e) {
  e.preventDefault()

    const params = {
      name: name,
      condition: condition
    }
    postData(params)
  }

  async function postData(params) {
    try 
    {
      const response = await API.conditions.edit(id, params);;
      const data = response.data
      if (response.status === 200)
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
          else {
            enqueueSnackbar("There was a problem connecting with the server.")
          }
        }
  }
}
  
  return (
    <>
            <form onSubmit={handleSubmit}>
            <h1>Edit Playbook Condition</h1>
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

export default EditConditionForm;