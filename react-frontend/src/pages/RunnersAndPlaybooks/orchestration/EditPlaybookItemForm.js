import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import Select from 'react-select';
import { useSnackbar } from 'notistack';
const EditPlaybookItemForm = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  let playbookItem = []

  let conditionArray = []

  let conditionDefaults = []

const [order, setOrder] = useState(0)

const [expectWrite, setExpectWrite] = useState(false)
const [expectRead, setExpectRead] = useState(false)
const [runWithoutResult, setRunWithoutResult] = useState(false)
const [conditions, setConditions] = useState([])
const [schedule, setSchedule] = useState('')
const [timeout, setTimeoutValue] = useState(0)
const [closeConditionCheck, setCloseConditionCheck] = useState(0)
const [playbookItemData, setPlaybookItemData] = useState([])

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

  function populateConditionArray () {
    props.conditionData.map((condition, index) =>
    {
        conditionArray.push({value: condition.id, label: condition.name})
    });
  }

  populateConditionArray()

  async function getPlaybookItem(depthParam) {

    let params = {
      depth: depthParam,
    }

    try
    {
      conditionDefaults.length = 0
      let response = await API.playbookItems.list(props.selectedItem[0], params);
      if (response.status === 200)
      {
        let data = response.data
        setOrder(data.group + 1)
        setExpectWrite(data.expect_write_variable)
        setExpectRead(data.expect_read_variable)
        setRunWithoutResult(data.run_without_result)
        setSchedule(data.schedule)
        setTimeoutValue(data.timeout)
        setCloseConditionCheck(data.close_condition_check)
        setPlaybookItemData(data)
        data.conditions.map((condition) =>
        {
          conditionDefaults.push({value: condition.id, label: condition.name})
        });
        setConditions(conditionDefaults)
        
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

useEffect(() => 
  {
    getPlaybookItem(1)
  }, [props.selectedItem]);

function handleSubmit(e) {
  e.preventDefault()
    const orderParam = order - 1

    let conditionValues = []
    conditions.map((condition, index) => {
        conditionValues.push(condition.value)
    }
    )
    const params = {
      group: orderParam,
      expect_write_variable: expectWrite,
      expect_read_variable: expectRead,
      run_without_result: runWithoutResult,
      conditions: conditionValues,
      schedule: schedule,
      timeout: timeout,
      close_condition_check: closeConditionCheck,
      playbook: playbookItemData.playbook.id,
      function: playbookItemData.function.id
    }
    
    postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = await API.playbookItems.edit(props.selectedItem[0], params)
      const data = response.data
      if (response.status === 200)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getData(2)
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
            if (errorMessage.includes('close_condition_check'))
            {
              enqueueSnackbar('The value of the close condition check must be less than or equal to 32,767.');
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
            <div className='inputRow'>
            <label className='label'>Order:</label>
            <input type="number" value={order} id="quantity" name="quantity" min="1" max={props.totalItems} onChange={e => setOrder(e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Expect Write Variable*:</label>
            <input type="checkbox" checked={expectWrite} onChange={(e) => setExpectWrite(e.target.checked)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Expect Read Variable*:</label>
            <input type="checkbox" checked={expectRead} onChange={(e) => setExpectRead(e.target.checked)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Run Without Result*:</label>
            <input type="checkbox" checked={runWithoutResult} onChange={(e) => setRunWithoutResult(e.target.checked)}></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Conditions:</label>
                <Select options={conditionArray} value={conditions} placeholder="Select Condition" isMulti autoFocus isSearchable onChange={setConditions}/>
            </div>
            <div className='inputRow'>
            <label className='label'>Schedule*:</label>
            <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Timeout:</label>
            <input type="number" value={timeout} id="quantity" name="quantity" min="0" onChange={e => setTimeoutValue(e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Close Condition Check:</label>
            <input type="number" value={closeConditionCheck} id="quantity" name="quantity" min="0" onChange={e => setCloseConditionCheck(e.target.value)}></input>
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

export default EditPlaybookItemForm;