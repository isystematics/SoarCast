import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import EditConditionForm from './EditConditionForm.js'
import ConditionVariables from './ConditionVariables.js'

const EditTabBar = (props) => {

  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="General" />
          <Tab label="Variables" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <EditConditionForm getData={props.getData} data={props.data} selectedCondition={props.selectedCondition}></EditConditionForm>}
      {selectedTab === 1 && <ConditionVariables selectedCondition={props.selectedCondition} data={props.data}></ConditionVariables>}
    </>
  );
};

export default EditTabBar;