import React, { Component } from "react"
import PropTypes from 'prop-types'
import MetaTags from 'react-meta-tags';
import {
  Container,
} from "reactstrap"
import { Link } from "react-router-dom"
import { API } from "Api";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb"

// Dashboard Specific Custom Imports
import './styles.css'
import MaterialButton from '@material-ui/core/Button';
import error_types from "models/error_types";
import { CircularProgress } from "@material-ui/core";

class Dashboard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      logoutCounter: '',
      masters: '0',
      minions: '0',
      modules: '0',
      runners: '0',
      playbooks: '0',
      exec_runners: '0',
      exec_playbooks: '0',
      user_data: [],
  }
}
  getMasters = async () => {
    try 
    {
      const response = await API.masters.list();
      if (response.status === 200)
      {
        this.setState({
            masters: response.data.count,
        });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
    }
  }
  getMinions = async () => {
    try 
    {
      const response = await API.minions.list();
      if (response.status === 200)
      {
        this.setState({
            minions: response.data.count,
        });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
    }
  }
  getModules = async () => {
    try 
    {
      const response = await API.modules.list();
      if (response.status === 200)
      {
        this.setState({
            modules: response.data.count,
        });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
    }
  }
  getRunners = async () => {
    try 
    {
      const response = await API.runners.list();
      if (response.status === 200)
      {
        this.setState({
            runners: response.data.count,
        });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
    }
  }
  getPlaybooks = async () => {
    try 
    {
      const response = await API.playbooks.list();
      if (response.status === 200)
      {
        this.setState({
            playbooks: response.data.count,
        });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
    }
  }
  getExecutions = async () => {
    try 
    {
      const playbookExecutions = await API.playbookExecutions.list();
      if (playbookExecutions.status === 200)
      {
        this.setState({
            exec_playbooks: playbookExecutions.data.count,
        });
      }
      const runStatuses = await API.runStatuses.list();
      if (runStatuses.status === 200)
      {
        const runnerExecutions = runStatuses.data.count - playbookExecutions.data.count
        this.setState({
          exec_runners: runnerExecutions,
      });
      }
    }
    catch(error){
      if (error.request)
          {
            if (error.request.status === 403)
            {
              this.setState({
                logoutCounter: logoutCounter => logoutCounter + 1
              })
            }
          }
          else {
              //setError("There was a problem connecting with the server.")
          }
    }
  }
  getUsers = async () => {
    try {
      let response = await API.auditEntries.list();
      if(response.status){
        let tempData = response.data.results;
        let count = response.data.count;
        if(tempData.length < count){
          let NextPage = 1;
          while(tempData.length < count - 1){
            NextPage++;
            let params = {
              page: NextPage,
            }
            let whileResponse = await API.auditEntries.list(params);
            if(whileResponse.status){
              whileResponse.data.results.forEach(result=>tempData.push(result));
            }
          }
          let resultData = [];
          tempData.forEach(data=>{
            let isNew = true;
            if(resultData.length > 0){
              resultData.forEach(result=>{
                if(data.username == result.username){
                  isNew = false;
                  result.count++;
                }
              })
            }
            if(isNew == true){
              resultData.push({username: data.username, count: 1});
            }
          });
          resultData.sort((a,b)=>{
            return b.count - a.count;
          });
          this.setState({
            user_data: resultData,
          });
        }
      }
    }catch(error){
      //setErr(error_types.BAD_CONNECTION);
    }
  }
  componentDidMount(){
    this.getMasters();
    this.getMinions();
    this.getModules();
    this.getRunners();
    this.getPlaybooks();
    this.getExecutions();
    this.getUsers();
  }
  render() {
    return (
      <React.Fragment>
        <div className="page-content">
          <MetaTags>
            <title>Soarcast | Dashboard</title>
          </MetaTags>
          <Container fluid>
            {/* Render Breadcrumb */}
            <Breadcrumbs
              title="Soarcast"
              breadcrumbItem="Dashboard"
            />

            {/* System Status Section */}
          

            <h1>System Status</h1>
            <div className="systemStatusWrapper">
              <div className='systemStatusContainer'>{typeof this.state.masters == 'string' ? <CircularProgress/> : this.state.masters}</div>
              <div className='systemStatusContainer'>{typeof this.state.minions == 'string' ? <CircularProgress/> : this.state.minions}</div>
              <div className='systemStatusContainer'>{typeof this.state.modules == 'string' ? <CircularProgress/> : this.state.modules}</div>
              <div className='systemStatusContainer'>{typeof this.state.runners == 'string' ? <CircularProgress/> : this.state.runners}</div>
              <div className='systemStatusContainer'>{typeof this.state.playbooks == 'string' ? <CircularProgress/> : this.state.playbooks}</div>
              <p className='statusCaption'>Masters</p>
              <p className='statusCaption'>Minions</p>
              <p className='statusCaption'>Modules</p>
              <p className='statusCaption'>Runners</p>
              <p className='statusCaption'>Playbooks</p>
            </div>

            <br />
            <br />
            <br />
            <br />

            <div className="executionAuthenticationWrapper">
              <h1 className="statusHeading">Execution Status</h1>
              <h1 className="statusHeading">Authentication Activity</h1>
            <div className='executionStatusWrapper'>
              <p className='statusSubheading'>Runners</p>
              <p className='statusSubheading'>Playbooks</p>
              <div className='systemStatusContainer'>{typeof this.state.exec_runners == 'string' ? <CircularProgress/> : this.state.exec_runners}</div>
              <div className='systemStatusContainer'>{typeof this.state.exec_playbooks == 'string' ? <CircularProgress/> : this.state.exec_playbooks}</div>
            </div>
            <div className='authenticationStatusWrapper'>
              <p className='statusSubheading'>Users</p>
              <div className="authenticationRow">
                {this.state.user_data.length > 0 ? 
                  this.state.user_data.map(userModel=>
                    <>
                      <p className='authenticationText'>{userModel.username}</p>
                      <p className='authenticationText'>{userModel.count}</p>
                    </>
                    )
                : <CircularProgress/>}
              </div>
            </div>
            </div>
          </Container>
        </div>
      </React.Fragment>
    )
  }
}

Dashboard.propTypes = {
  t: PropTypes.any
}

export default Dashboard
