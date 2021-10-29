import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import AddVariableSet from './AddVariableSet.js'
import EditVariableSet from './EditVariableSet.js'
import Variables from './variables.js'

const EditTabBar = (props) => {
  const [selectedTab, setSelectedTab] = React.useState(0);
  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  return (
    <>
      <h1>{props.selectedVariableSet.id != '' ? 'Edit' : 'Add'} Variable Set</h1>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="General" />
          {props.selectedVariableSet.id != '' ? (<Tab label="Variables" />): null}
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <>{props.selectedVariableSet.id != '' ? 
      (<EditVariableSet page={props.page} togglePage={props.togglePage} variableSetData={props.variableSetData} getVariableSetData={props.getVariableSetData} appData={props.appData} selectedVariableSet={props.selectedVariableSet} />) : 
      <AddVariableSet getVariableSetData = {props.getVariableSetData} appData={props.appData} />}</>}
      {selectedTab === 1 && <Variables selectedVariableSet={props.selectedVariableSet} variableSetData={props.variableSetData}/>}
    </>
  );
};

export default EditTabBar;