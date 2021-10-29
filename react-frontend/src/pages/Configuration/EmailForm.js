import React, {useState, useEffect} from 'react'
import Button from '@material-ui/core/Button';
import './styles.css'
import { API } from "Api";
import { Alert } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { useSnackbar } from 'notistack';
const Email = (props) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  // If an email setting exist, set the fields initial values to the email settings values,
  // Otherwise, set them to empty strings or default values.
  const [host, setHost] = useState(props.data ? (props.data.email_host) : '');
  const [port, setPort] = useState(props.data ? (props.data.email_port) : '');
  const [username, setUsername] = useState(props.data ? (props.data.email_username) : '');
  const [password, setPassword] = useState()
  const [tls, setTls] = useState(props.data ? (props.data.use_tls) : 0)
  const [ssl, setSsl] = useState(props.data ? (props.data.use_ssl) : 0)
  const [from, setFrom] = useState(props.data ? (props.data.from_email) : '')

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
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
        email_host: host,
        email_port: port,
        email_username: username,
        email_password: password,
        use_tls: tls,
        use_ssl: ssl,
        from_email : from,
      }
      postData(params)
    }

    async function postData(params) {
      try 
      {
        if (props.data !== null)
        {
          const response = await API.emailSettings.edit(props.data.id, params);
          const data = response.data
          if (response.status === 200)
          {
            enqueueSnackbar("Successfully Submitted.", {variant:"success"});
            props.getData()
          }
        }
        else
        {
          const response = await API.emailSettings.add(params);
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
              if (errorMessage.includes('from_email'))
              {
                enqueueSnackbar('This must be a valid email address.');
              }
            }
            else {
              enqueueSnackbar("There was a problem connecting with the server.");
            }
          }
    }
  }
  return (
    <>
      <h1>Email Settings</h1>
        <form onSubmit={handleSubmit}>
          <div className='inputRow'>
          <label className='label' for='name'>Email Host:*</label>
          <input type='text' value={host} required='required' id="name" onChange={e => setHost(host => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='url'>Email Port:*</label>
          <input type='number' value={port} placeholder="22" required='required' id='url' min='1' onChange={e => setPort(port => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='username'>Email Username:*</label>
          <input type='text' value={username} required='required' id='username' onChange={e => setUsername(username => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>Email Password:*</label>
          <input type='text' value={password} required='required' id='password' type='password' onChange={e => setPassword(password => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='tls'>Use TLS:*</label>
          <select id='tls' value={tls} onChange={e => setTls(tls => parseInt(e.target.value))}>
            <option value={0}>Disabled</option>
            <option value={1}>Enabled</option>
          </select>
          </div>
          <div className='inputRow'>
          <label className='label' for='ssl'>Use SSL:*</label>
          <select id='ssl' value={ssl} onChange={e => setSsl(ssl => parseInt(e.target.value))}>
            <option value={0}>Disabled</option>
            <option value={1}>Enabled</option>
          </select>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>From Email*:</label>
          <input type='text' value={from} required='required' id='password' onChange={e => setFrom(from => e.target.value)}></input>
          </div>
          {emailError && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{emailError}</Alert>}
          <div className='inputRow'>
          <div></div>
          <Button type="submit" className="saveButton" variant="contained" color="secondary">Save</Button>
          </div>
          </form>
          {error && <Alert className="grow" variant="danger" style={{height:'40px', marginTop:'16px'}}>{error}</Alert>}
    </>
  );
};

export default Email;