import React, { useRef, useState, useContext } from "react"
import { Form, Button, Card, Alert } from "react-bootstrap"
import { Link, useHistory } from "react-router-dom"
import Context from '../../contexts/context.js';
import './styles.css'
import { API } from "Api.js";

export default function Login() {

  // Gets the username and password from the login form.
  const usernameRef = useRef()
  const passwordRef = useRef()

  // Used to display an error message indicating an invalid username/password combination or a network connection issue.
  const [error, setError] = useState("")

  // setLoading is set to true when a the login request is processing. It is set to false when it finishes processing. This is used to prevent multiple
  // Calls from being made if the user clicks the login button repeatedly in quick succession. As of now, I'm not sure this functionality in implemented yet.
  const [loading, setLoading] = useState(false)

  // This is used to redirect the user. The history.push('/dashboard') later on is simply used to redirect the user to the dashboard page.
  const history = useHistory()

  // This causes a specific action to occur in the contexts/useGlobalState reducer. When the globalDispatch(type: Login) function is called,
  // it will perform the action specified in the reducer.

  const {globalState, globalDispatch} = useContext(Context);
  // This makes a POST request whenver the submit button is clicked. 
  
  //If the response status is 200 (successful login), it sets an isLoggedIn value in
  // local storage to true. This is used to keep track of whether or not a user is logged in and determine which routes they are allowed to access.
  // Afterwards, it stores the JWT token that it received from the request in local storage. This might not be the most secure way to store it
  // but was an easy way to store for development purposes. Finally, it redirects the user to the dashboard page.

  // If the response status is 401 it displays an invalid username/password message. Otherwise, it displays a generic message saying there was a problem
  // connecting to the server.

  function handleSubmit(e) {
    e.preventDefault()

      setError("")
      setLoading(true)
      const params = {
        username: usernameRef.current.value,
        password: passwordRef.current.value
      };
      (async () => {
        try 
        {
          const response = await API.login.tokenCreate(params);
          if (response.status === 200)
          {
            globalDispatch({type: "LOGIN"})
            API.token = response.data.token;
            history.push('/dashboard')
          }
        }
        catch(error) {
          if (error.request)
          {
            if (error.request.status === 401)
            {
              setError("Invalid username/password.")
            }
          }
          else {
              setError("There was a problem connecting with the server.")
          }
        }
      })();

    setLoading(false)
  }

  return (
    <>
      <Card className='loginCard'>
        <Card.Body>
          <h2 className="text-center mb-4">Log In</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="username">
              <Form.Label>Username</Form.Label>
              <Form.Control type="username" ref={usernameRef} required />
            </Form.Group>
            <Form.Group id="password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" ref={passwordRef} required />
            </Form.Group>
            <Button disabled={loading} className="w-100" type="submit">
              Log In
            </Button>
          </Form>
          <div className="w-100 text-center mt-3">
            <Link to="/login">Forgot Password?</Link>
          </div>
        </Card.Body>
      </Card>
    </>
  )
}