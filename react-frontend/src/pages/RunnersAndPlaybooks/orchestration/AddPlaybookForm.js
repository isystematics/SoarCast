import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import Select from 'react-select';
import { useSnackbar } from 'notistack';
const AddPlaybookForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let variableSetData = []

  props.variableSetData.map((variableSet, index) =>
  {
      variableSetData.push({value: variableSet.id, label: variableSet.name})
  })

  let functionData = []

  props.functionData.map((module, index) =>
  {
      module.functions.map((functionName, index) =>
      {
        functionData.push({ value: functionName.id, label: `${module.name}.${functionName.name}` })
      })
  }
  );

    const [name, setName] = useState(localStorage.getItem('playbookName') ? JSON.parse(localStorage.getItem('playbookName')) : '')
    const [minion, setMinion] = useState(localStorage.getItem('playbookMinion') ? JSON.parse(localStorage.getItem('playbookMinion')) : props.minionData[0].id)
    const [schedule, setSchedule] = useState(localStorage.getItem('playbookSchedule') ? JSON.parse(localStorage.getItem('playbookSchedule')) : '')
    const [functions, setFunctions] = useState([])
    const [variableSets, setVariableSets] = useState([])

    

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
  

useEffect(() => 
{
    localStorage.setItem('playbookName', JSON.stringify(name))
}, [name]);
useEffect(() => {
      localStorage.setItem('playbookMinion', JSON.stringify(minion))
}, [minion]);
useEffect(() => {
      localStorage.setItem('playbookSchedule', JSON.stringify(schedule))
}, [schedule]);

function handleSubmit(e) {
  e.preventDefault()

    let variableSetValues = []
    variableSets.map((variableSets, index) => {
        variableSetValues.push(variableSets.value)
    }
    )

    let functionValues = []
    functions.map((functions, index) => {
        functionValues.push(functions.value)
    }
    )

    const params = {
      name: name,
      minion: minion,
      schedule: schedule,
      variable_sets: variableSetValues,
      functions: functionValues,
      playbook_items: [],
      playbook_mappings: []
    }
    postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = await API.playbooks.add(params);;
      const data = response.data
      if (response.status === 201)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getPlaybookData()
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
            if (errorMessage.includes('schedule'))
            {
              enqueueSnackbar('The schedule must be a valid crontab value.')
            }
            if (errorMessage.includes('variable_sets'))
            {
              enqueueSnackbar('No variable sets were selected.')
            }
            if (errorMessage.includes('functions'))
            {
              enqueueSnackbar('No functions were selected.')
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
            <form onSubmit={handleSubmit}>
            <h1>Add Playbook</h1>
            <div className='inputRow'>
            <label className='label' for='Schedule'>Name*:</label>
            <input name="schedule" value={name} type='text' id='Schedule' required='required' onChange={e => setName(name => e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Minion:*</label>
            <select name="mapping" type='text' required='required' id='Minion' value={minion} onChange={e => setMinion(minion => parseInt(e.target.value))}>
            {props.minionData.map((result, index) =>
            {
            return(
            <>
            <option key={`minion ${index}`} value={result.id}>{result.name}</option>
            </>
            )
            })
          }
          </select>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Variable Set:*</label>
                <Select options={variableSetData} placeholder="Select Variable Set" isMulti autoFocus isSearchable onChange={setVariableSets}/>
            </div>
            {variableSetsError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{variableSetsError}</Alert>}
            <div className='inputRow'>
            <label className='label' for='Minion'>Function:*</label>
                <Select options={functionData} placeholder="Select Function" isMulti autoFocus isSearchable onChange={setFunctions}/>
            </div>
            {functionsError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{functionsError}</Alert>}
            <div className='inputRow'>
            <label className='label' for='Schedule'>Schedule:</label>
            <input name="schedule" value={schedule} type='text' id='Schedule' onChange={e => setSchedule(schedule => e.target.value)}></input>
            </div>
            {scheduleError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{scheduleError}</Alert>}
            <div className='inputRow'>
            <p></p>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Save</Button>
            </div>
            </form>
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
  );
          };

export default AddPlaybookForm;