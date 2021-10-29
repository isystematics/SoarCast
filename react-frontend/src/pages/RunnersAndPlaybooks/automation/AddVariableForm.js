import React, { useState, useEffect } from "react";
import '../styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const AddVariableForm = (props) => {

  // Used to store the form values. The values are stored in local storage so that the user can pick up where they left off should they refresh
  // or leave the page.
  
  const [name, setName] = useState(localStorage.getItem('variableName') ? JSON.parse(localStorage.getItem('variableName')) : '')
  const [encrypted, setEncrypted] = useState(localStorage.getItem('variableEncrypted') ? JSON.parse(localStorage.getItem('variableEncrypted')) : true)
  const [value, setValue] = useState('')
  const [type, setType] = useState(localStorage.getItem('variableType') ? JSON.parse(localStorage.getItem('variableType')) : 0)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  useEffect(() => {
    localStorage.setItem('variableName', JSON.stringify(name))
  }, [name]);
  useEffect(() => {
    localStorage.setItem('variableEncrypted', JSON.stringify(encrypted))
    }, [encrypted]);
  useEffect(() => {
  localStorage.setItem('variableValue', JSON.stringify(value))
  }, [value]);
  useEffect(() => {
    localStorage.setItem('variableType', JSON.stringify(type))
  }, [type]);

   // General error messages

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

  function handleSubmit(e) {
    e.preventDefault()

      let hvac_path = string_to_slug(name)

      let has_value = true

      if (value === "")
      {
        has_value = false
      }
      
      const params = {
        name: name,
        hvac_path: hvac_path,
        encrypted: encrypted,
        value: value,
        has_value: has_value,
        variable_type: type,
        variable_set: props.variableSet.id
      }
      postData(params)
    }
  
    // Basic Outline for function to add a runner. This is a work in progress.
  
    async function postData(params) {
      try 
      {
        const response = await API.variables.add(params);
        const data = response.data;
        if (response.status === 201)
        {
          setValue('')
          enqueueSnackbar("Successfully Submitted.", {variant:"success"});
          props.getVariableData();
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
              if (errorMessage.includes('non_field_errors'))
            {
              enqueueSnackbar('There is already a variable in the variable set with that name.')
            }
            }
            else {
              enqueueSnackbar("There was a problem connecting with the server.")
            }
          }
          /* else {
              setError("There was a problem connecting with the server.")
          } */
    }
  }

  return (
    <>
            <h1>Add Variable</h1>
            <form onSubmit={handleSubmit}>
            <div className='inputRow'>
            <label className='label'>Name*:</label>
            <input name="name" value={name} type='text' placeholder='name' required='required' id="name" onChange={e => setName(name => e.target.value)} ></input>
            </div>
            {nameError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{nameError}</Alert>}
            <div className='inputRow'>
            <label className='label'>Encrypted*:</label>
            <input type="checkbox" checked={encrypted} onChange={(e) => setEncrypted(e.target.checked)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Value:</label>
            <input name="minion" value={value} type={encrypted ? ('password') : 'text'} placeholder='value' id='Minion' onChange={e => setValue(value => e.target.value)}></input>
            </div>
            <div className='inputRow'>
            <label className='label'>Variable Type:</label>
            <select name="minion" value={type} type='text' placeholder='variableType' required='required' id='Minion' onChange={e => setType(type => e.target.value)}>
            <option value={0}>Integer</option>
            <option value={1}>String</option>
            <option value={2}>JSON</option>
            </select>
            </div>
            <div className="inputRow">
            <p></p>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Add Variable</Button>
            </div>
            </form>
            {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

    </>
  );
          };

export default AddVariableForm;