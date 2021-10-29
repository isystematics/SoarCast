import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import Playbooks from './Playbooks.js'
import Conditions from './Conditions.js'

const EditTabBar = (props) => {

  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="Playbooks" />
          <Tab label="Conditions" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <Playbooks />}
      {selectedTab === 1 && <Conditions />}
    </>
  );
};

export default EditTabBar;