import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import Automation from "./automation/automation.js";
import Orchestration from "./orchestration/orchestration.js";
import Executions from './executions/executions.js';

// A tab bar that toggles between 3 sections, automation, orchestration, and executions.

const TabBar = () => {

  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Tabs value={selectedTab} onChange={handleChange}>
          <Tab label="Automation" />
          <Tab label="Orchestration" />
          <Tab label="Executions" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <Automation />}
      {selectedTab === 1 && <Orchestration />}
      {selectedTab === 2 && <Executions />}
    </>
  );
};

export default TabBar;