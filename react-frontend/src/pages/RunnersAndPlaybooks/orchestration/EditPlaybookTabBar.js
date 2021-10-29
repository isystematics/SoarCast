import React from "react";
import { Tabs, Tab, AppBar } from "@material-ui/core";
import EditPlaybookForm from './EditPlaybookForm.js'
import PlaybookItems from './PlaybookItems.js'
import PlaybookMappings from './PlaybookMappings.js'

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
          <Tab label="Playbook Items" />
          <Tab label="Playbook Mappings" />
        </Tabs>
      </AppBar>
      {selectedTab === 0 && <EditPlaybookForm getPlaybookData={props.getPlaybookData} playbookData={props.playbookData} minionData={props.minionData} functionData={props.functionData} variableSetData={props.variableSetData} selectedPlaybook={props.selectedPlaybook}  />}
      {selectedTab === 1 && <PlaybookItems selectedPlaybook={props.selectedPlaybook} playbookData={props.playbookData}></PlaybookItems>}
      {selectedTab === 2 && <PlaybookMappings selectedPlaybook={props.selectedPlaybook} playbookData={props.playbookData}></PlaybookMappings>}
    </>
  );
};

export default EditTabBar;