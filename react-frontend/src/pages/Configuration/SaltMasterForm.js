import React, {useState, useEffect } from "react";
import './styles.css'
import Button from '@material-ui/core/Button';
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';

const SaltMaster = (props) => {

  const [name, setName] = useState(props.data ? (props.data.name) : '');
  const [url, setUrl] = useState(props.data ? (props.data.api_url) : '');
  const [username, setUsername] = useState(props.data ? (props.data.username) : '');
  const [password, setPassword] = useState('');
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [error, setError] = useState('');

  const [urlError, setUrlError] = useState('');

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
        api_url: url,
        username: username,
        password: password,
      }
      postData(params)
    }

    async function postData(params) {
      try 
      {
        if (props.data !== null)
        {
          const response = await API.saltmasterSettings.edit(props.data.id, params);
          const data = response.data
          if (response.status === 200)
          {
            enqueueSnackbar("Successfully Submitted.", {variant:"success"});
            props.getData()
          }
        }
        else
        {
          const response = await API.saltmasterSettings.add(params);
          const data = response.data
          if (response.status === 201)
          {
            enqueueSnackbar("Successfully Submitted.", {variant:"success"});
            props.getData()
          }
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
              if (errorMessage.includes('api_url'))
              {
                enqueueSnackbar('Enter a valid URL.')
              }
              if (errorMessage.includes('non_field_errors'))
              {
                enqueueSnackbar("The credentials are not valid or the saltmaster doesn't exist on this host.")
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
      <h1>Saltmaster Connection Settings</h1>
        <form onSubmit={handleSubmit}>
          <div className='inputRow'>
          <label className='label' for='name'>Name:*</label>
          <input type='text' value={name} required='required' id="name" onChange={e => setName(name => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='url'>API URL:*</label>
          <input type='text' value={url} placeholder="https://example.com/search" required='required' id='url' onChange={e => setUrl(url => e.target.value)}></input>
          </div>
          {urlError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{urlError}</Alert>}
          <div className='inputRow'>
          <label className='label' for='username'>Username:*</label>
          <input type='text' value={username} required='required' id='username' onChange={e => setUsername(username => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>Password:*</label>
          <input type='text' value={password} required='required' id='password' type='password'  onChange={e => setPassword(password => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <div></div>
          <Button type="submit" className="saveButton" variant="contained" color="secondary">Save</Button>
          </div>
          </form>
          {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}

          

    </>
  );
};

export default SaltMaster;