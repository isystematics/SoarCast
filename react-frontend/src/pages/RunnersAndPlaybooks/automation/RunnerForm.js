import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const RunnerForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const [schedule, setSchedule] = useState(props.selectedRunner.schedule ? props.selectedRunner.schedule : '');
    const [minion, setMinion] = useState(props.selectedRunner.minion ? props.selectedRunner.minion.id : props.minionData[0].id);
    const [mapping, setMapping] = useState(props.selectedRunner.mapping ? props.selectedRunner.mapping.id : props.mappingData[0].id);
    const [apiAlias, setApiAlias] = useState(props.selectedRunner.api_alias ? props.selectedRunner.api_alias : '');
    const [permissions, setPermissions] = useState(props.selectedRunner.permissions ? props.selectedRunner.permissions.id : 0)

    useEffect(() => 
    {
        setSchedule(props.selectedRunner.schedule ? props.selectedRunner.schedule : '');
        setMinion(props.selectedRunner.minion ? props.selectedRunner.minion.id : props.minionData[0].id);
        setMapping(props.selectedRunner.mapping ? props.selectedRunner.mapping.id : props.mappingData[0].id);
        setApiAlias(props.selectedRunner.api_alias ? props.selectedRunner.api_alias : '');
        setPermissions(props.selectedRunner.permissions ? props.selectedRunner.permissions.id : 0);
    }, [props.selectedRunner]);
  // General error messages

  const [error, setError] = useState('');

  const [scheduleError, setScheduleError] = useState('')

  const [apiAliasError, setApiAliasError] = useState('')

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

// On submit, perform the add/edit actions. This has yet to be implemented.
function handleSubmit(e) {
  e.preventDefault()

    let permissionsParam = permissions
    permissions === 0 ? (permissionsParam = null) : null

    const params = {
      schedule: schedule,
      minion: minion,
      mapping: mapping,
      api_alias: apiAlias,
      permissions: permissionsParam
    }
      postData(params)
  }

  // Basic Outline for function to add a runner. This is a work in progress.

  async function postData(params) {
    try 
    {
      const response = props.selectedRunner.id != '' ? await API.runners.edit(props.selectedRunner.id, params) : await API.runners.add(params);
      if (response.status === 201 || response.status === 200)
      {
        enqueueSnackbar("Successfully Submitted.", {variant:"success"});
        props.getRunnerData(1)
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
            if (errorMessage.includes('api_alias'))
            {
              enqueueSnackbar('The API alias is invalid.')
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
            <h1>{props.selectedRunner.id != '' ? 'Edit' : 'Add'} Runner </h1>
            <div className='inputRow'>
            <label className='label' for='Schedule'>Schedule:</label>
            <input name="schedule" value={schedule} type='text' id='Schedule' onChange={e => setSchedule(schedule => e.target.value)}></input>
            </div>
            {scheduleError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{scheduleError}</Alert>}
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
            <label className='label' for='Mapping'>Mapping:*</label>
            <select name="mapping" type='text' required='required' id='Mapping' value={mapping} onChange={e => setMapping(mapping => parseInt(e.target.value))}>
            {props.mappingData.map((result, index) =>
            {
            return(
            <>
            <option key={`mapping ${index}`} value={result.id}>{result.name}</option>
            </>
            )
            })
          } 
          </select>
            </div>
            <div className='inputRow'>
            <label className='label' for='name'>API Alias:</label>
            <input name="name" value={apiAlias} type='text' id="name" onChange={e => setApiAlias(apiAlias => e.target.value)}></input>
            </div>
            {apiAliasError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{apiAliasError}</Alert>}
            <div className='inputRow'>
            <label className='label' for='Permissions'>Permissions:*</label>
            <select name="permissions" value={permissions} type='text' required='required' id='Permissions' onChange={e => setPermissions(permissions => parseInt(e.target.value))}>
            <option key='nopermissions' value={0}>No permissions</option>
            {props.permissionsData.map((result, index) =>
            {
            return(
            <>
            <option key={`permissions ${index}`} value={result.id}>{result.name}</option>
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

export default RunnerForm;