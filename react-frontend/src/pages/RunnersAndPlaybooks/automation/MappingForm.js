import React, { useState, useEffect, useMemo } from "react";
import '../styles.css'
import { API } from "Api";
import { useSnackbar } from 'notistack';
import GridFormControl from "components/GridFormControl/GridFormControl";
import boolGridElement from "components/Common/boolGridElement";
const MappingForm = ({modulesData}) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [variableSetData, setVariableSetData] = useState([]);
  const [variablesData, setVariablesData] = useState([]);
  const getVariableSetData = async () => {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages)
      {
        let params = {
          page: pageIndex
        }
        let response = await API.variableSets.listAll(params);
        if (response.status === 200)
        {
          let results = response.data.results;
          data = data.concat(results)
          if (response.data.next === null)
          {
            morePages = false
          }
          else
          {
            pageIndex++
          }
        }
      }
      data.sort((a, b)=>
        (a.id > b.id) ? 1 : -1
      );
      let tempRows = [];
      for(let i = 0; i < data.length; i++){
        let result = data[i];
        tempRows.push({ id: result.id, name: result.name})
      }
      setVariableSetData(data);
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
        }
        else {
            enqueueSnackbar("There was a problem connecting with the server.")
        }
    }
  }
  const getVariablesData = async () => {
    let morePages = true;
    let pageIndex = 1;
    let data = [];
    try
    {
      while (morePages)
      {
        let params = {
          page: pageIndex
        }
        let response = await API.variables.list(params);
        if (response.status === 200)
        {
          let results = response.data.results;
          data = data.concat(results)
          if (response.data.next === null)
          {
            morePages = false
          }
          else
          {
            pageIndex++
          }
        }
      }
      data.sort((a, b)=>
        (a.id > b.id) ? 1 : -1
      );
      let tempRows = [];
      for(let i = 0; i < data.length; i++){
        let result = data[i];
        tempRows.push({ id: result.id, name: result.name})
      }
      setVariablesData(data);
    }
    catch(error) {
      if (error.request)
        {
          if (error.request.status === 403)
          {
            setLogoutCounter(logoutCounter => logoutCounter + 1)
          }
        }
        else {
            enqueueSnackbar("There was a problem connecting with the server.")
        }
    }
  }
  const convertName = (array, value) => {
    let tempName = '';
    array.forEach(item=>{
      if(item.id == value){
        tempName = item.name;
      }
    })
    return tempName;
  }
  const mapItemsOptions = {
    embedded: true,
    param: 'mapping',
    gridOptions: {
      label: 'Map Items',
      readOnly: true,
      columns: [
        { field: 'function_variableName', headerName: 'Function Variable Name', flex: 1 },
        { field: 'variableName', headerName: 'Variable Name', flex: 1 },
        { field: 'remote', headerName: 'Remote', flex: 1, renderCell:(params)=> boolGridElement(params.value) },
        { field: 'validation', headerName: 'Validation', flex: 1 },
      ]
    },
    formOptions: {
      label: 'Map Item Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'variable', type: 'array',label:'Variable', value: '', arrayList:variablesData },
        {field: 'remote', type: 'bool', label:'Remote', value: '', checked:false},
        {field: 'validation', type: 'text', label:'Validation', value: ''},
      ]
    },
    ApiCalls: {
      list: (params) => API.mapItems.list(params),
      edit: (id, data) => API.mapItems.edit(id, data),
    }
  }
  const mappingGridOptions = {
    gridOptions: {
      label: 'Mapping',
      columns: [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'function', headerName: 'Function', flex: 1, renderCell:(params)=>convertName(modulesData, params.value) },
      ],
    },
    formOptions: {
      label: 'Mapping Details',
      formFields: [
        {field: 'id', type: 'number', value: ''},
        {field: 'name', type: 'text',label:'Mapping', value: '', required: true},
        {field: 'function', type: 'array',label:'Function', value: '', arrayList: modulesData, required: true},
        {field: 'variable_set', type: 'array', label:'Variable Set', value: '', arrayList: variableSetData, required: true},
      ]
    },
    tabs: [
      {label: 'Map Items', content:mapItemsOptions},
      
    ],
    ApiCalls: {
      list: (params) => API.mappings.list(params),
      add: (data) => API.mappings.add(data),
      edit: (id, data) => API.mappings.edit(id, data),
      delete: (id) => API.mappings.delete(id),
    }
  }
  useEffect(()=>{
    getVariableSetData();
    getVariablesData();
  },[])
  return (
    <>
      <GridFormControl options={mappingGridOptions} />
      </>
  );
};

export default MappingForm;