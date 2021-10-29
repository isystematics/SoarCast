import React, {useState, useEffect} from 'react'
import Button from '@material-ui/core/Button';
import './styles.css'
import { API } from 'Api'

const Redis = (props) => {
  const [id, setId] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(true);
  const [verifyCertificate, setVerifyCertificate] = useState(true);
  const sendEvent = () => {
    let data = {
      host,
      port,
      password,
      ssl_connection: ssl,
      verify_certificate: verifyCertificate
    }
    props.sendEvent(data);
  }
  useEffect(()=>{
    setId(props.data.id);
    setHost(props.data.host);
    setPort(props.data.port);
    setSsl(props.data.ssl_connection);
    setVerifyCertificate(props.data.verify_certificate);
  }, [])
  return (
    <>
      <h1>Redis Settings</h1>
        <form method="POST">
          <div className='inputRow'>
          <label className='label' for='name'>Host:*</label>
          <input type='text' value={host} required='required' id="name" onChange={e => setHost(name => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='url'>Port:*</label>
          <input type='number' value={port} placeholder="6379" required='required' id='url' onChange={e => setPort(port => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>Password:*</label>
          <input type='text' value={password} required='required' id='password' type='password' onChange={e => setPassword(password => e.target.value)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>SSL Connection:*</label>
          <input type='checkbox' required='required' id='' checked={ssl} onChange={e => setSsl(e.target.checked)}></input>
          </div>
          <div className='inputRow'>
          <label className='label' for='password'>Verify Certificate:*</label>
          <input type='checkbox' required='required' id=''  checked={verifyCertificate} onChange={e => setVerifyCertificate(e.target.checked)}></input>
          </div>
          <div className='inputRow'>
          <div></div>
          <Button className="saveButton" variant="contained" color="secondary" onClick={()=>sendEvent()}>Save</Button>
          </div>
          </form>
    </>
  );
};

export default Redis;