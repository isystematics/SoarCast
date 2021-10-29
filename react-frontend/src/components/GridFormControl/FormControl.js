import React, { useState, useEffect, useMemo } from "react";
import Button from '@material-ui/core/Button';
import LoadingOverlay from "components/LoadingOverlay/LoadingOverlay";
import DropdownControl from "./DropdownControl";
import { TextField } from '@material-ui/core';
import { Hidden } from '@material-ui/core';
import Select from 'react-select';
import './GridFormControl.css';
const FormControl = ({model, updateModel, options, deleteData, postData, setDisplayForm, refresh, isTabs}) => {
    const [loading, setLoading] = useState(false);
    const [hasSubActions, setHasSubActions] = useState(false);
    const [formRefresh, setFormRefresh] = useState(false);
    const [formFields, setFormFields] = useState(options.formFields);
    const handleInput = (e, formField) => {
        let tempModel = model;
        if(formField.type == 'bool')
            tempModel[formField.field] = e.target.checked;
        else if(formField.type == 'multiSelect')
        {
            tempModel[formField.field] = e;
        }
        else if(formField.type == 'select')
        {
            let array = []
            array.push(e)
            tempModel[formField.field] = array;
        }
        else
            tempModel[formField.field] = e.target.value;
        updateModel(tempModel, false);
        updateLocal();
    }
    const ConvertType = (value)=>{
        switch(typeof value){
            case 'object':
                if(value == null)
                    return '';
                if(value.length > 0)
                    return value;
                return {isObject:true, id:value.id, name:value.name};
            case 'array':
            case 'number':
            case 'string':
            default:
                return value;
        }
    }
    useEffect(()=>{
        updateLocal();
    },[model, model?.id, refresh])
    const selectConvert = (data) => {
        let results = [];
        if (data)
        {
            if (Array.isArray(data))
            {
                data.forEach(item=>{
                    if (item !== undefined)
                    {
                        if(item.value){
                            results.push(item);
                            return;
                        }
                        results.push({value:item.id, label:(item.username ?? (item.name ?? item.api_alias))});
                    }
                });
            }
        }
        return results;
    }
    const getInputType = (formField) => {
        switch(formField.type){
            case 'bool':
                return <div className='flex'><input readOnly={(options.readOnly || formField.readOnly)} type="checkbox" className='checkBox' checked={formField.value} onChange={(e)=>handleInput(e, formField)}></input><div className='inputLabel'>{formField.label}</div></div>
            case 'array':
                return <DropdownControl readOnly={(options.readOnly || formField.readOnly)} refresh={refresh} formField={formField} updateModel={updateModel} model={model}/>
            case 'textarea':
                return <TextField disabled={(options.readOnly || formField.readOnly)} rows={3} className='input' type="number" multiline={true} error={formField.error} required={formField.required} label={formField.label} value={formField.value} onChange={(e)=>handleInput(e, formField)}></TextField>
            case 'number':
                return <TextField disabled={(options.readOnly || formField.readOnly)} className='input' type="number" error={formField.error} required={formField.required} label={formField.label} value={formField.value} onChange={(e)=>handleInput(e, formField)}></TextField>
            case 'multiSelect':
                return (<><div className='inputLabel'>{formField.label}</div><Select className='input' name={formField.label} options={selectConvert(formField.arrayList)} value={selectConvert(formField.value)} isMulti autoFocus isSearchable onChange={(e)=>handleInput(e, formField)} placeholder={formField.label} label={formField.label}/></>)
            case 'object':
            case 'text':
            default:
                return <TextField disabled={(options.readOnly || formField.readOnly)}  className='input' error={formField.error} type={formField.type ==='password' ? 'password' : 'text'} required={formField.required} label={formField.label} value={formField.value.isObject ? formField.value.name : formField.value} onChange={(e)=>handleInput(e, formField)}></TextField>
        }
    }
    const submit = () => {
        let isValid = true;
        isValid = checkRequired();
        if(isValid===true)
            isValid = validation();
        
        if(isValid==true)
        {
            postData();
        }
        else
            setFormRefresh(!formRefresh);
    }
    const validation = () => {
        return true;
    }
    const checkRequired = () => {
        let isValid = true;
        formFields.forEach(formField=>{
            if(formField.required == true && !formField.value){
                formField.error = true;
                isValid = false;
            }
        });
        return isValid;
    }
    const updateLocal = () =>{
        Object.keys(model).forEach(key=>{
            model[key] = ConvertType(model[key]);
            if(formFields){
                formFields.forEach(formField=>{
                    if(formField.field === key){
                        formField.value = ConvertType(model[key]);
                        formField.error = false;
                    }
                });
            }
        });
        setFormFields(formFields);
        setFormRefresh(!formRefresh);
    }
    useEffect(()=>{
        if(options.buttonOptions){
            setHasSubActions(true);
        }
    },[]);
    const setupForm = useMemo(()=>{
        return (formFields.map(formField=>{
            if(formField.field == 'id')
                return;
            return(
                <div className='formItem'>
                    {getInputType(formField)}
                </div>
            )
        }))
    },[formFields, formRefresh])
    return (
        loading == true ? 
            <LoadingOverlay/> 
        :
        <div id='formPositioner' className={(isTabs ? '' : 'tabPositioner overlayed')}>
            <div className={(isTabs ? 'flex flexColumn' : 'wholeFormContainer grow')}>
                {isTabs ? null : <div className={'jtabClosePositioner'}>
                    <div className="jclose" onClick={()=>{setDisplayForm(false)}}>
                        <div style={{width:'100%',height:'100%'}}>
                            X
                        </div>
                    </div>
                </div>}
                <div style={{display:'grid',gridTemplateColumns:'50% 50%'}}>
                    <div className={'flex flexColumn ' + (options.onlyForm ? 'tabs' : '')}>
                        <div className='formTitle'>{options.label}</div>
                        {setupForm}
                        {!options.readOnly && 
                        <div className='flex' style={{marginTop:'auto'}}>
                            <div className='buttonContainer'>
                                <Button variant="contained" color="primary" onClick={()=>{submit()}}>Save</Button>
                                {model.id && deleteData && <Button variant="contained" color="secondary" onClick={()=>{deleteData()}}>Delete</Button>}
                            </div>
                        </div>}
                    </div>
                    {hasSubActions == true && model.id != '' && <div className='actionsContainer'>
                        <div className='formTitle'>{options.buttonLabel ? options.buttonLabel : 'Actions'}</div>
                        <div className={'flex flexColumn '} style={{marginTop:'16px'}}>
                            {options.buttonOptions.map(button=>{
                                return(button.element ?? <Button variant="contained" color={button.color} onClick={()=>{button.buttonAction()}}>{button.label}</Button>)
                            })}
                        </div>
                    </div>}
                </div>
            </div>
        </div>
    )
}
export default FormControl;