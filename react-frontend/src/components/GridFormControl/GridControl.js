import React, { useState, useEffect, useMemo } from "react";
import { DataGrid } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import './GridFormControl.css';
const GridControl = ({gridOptions,data, handlePageChange, rowCount, pageIndex, model, updateModel, hasForm, setDisplayForm, setParentSelectionModel}) => {
    const [Columns, setColumns] = useState(gridOptions.columns);
    const [Rows, setRows] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const gridSelection = async (selectionModel) => {
        if(selectionModel.length > 1 && model.id !== '' && !gridOptions.checkboxSelection){
            if(model.id == selectionModel[0]){
                selectionModel.unshift();
            } else {
                selectionModel.pop();
            }
        }
        setSelectionModel(selectionModel);
        if(setParentSelectionModel)
            setParentSelectionModel(selectionModel);
        if(selectionModel.length > 0){
            data.forEach(gridRow=>{
                if(gridRow.id == selectionModel[0]){
                    updateModel(gridRow);
                    setDisplayForm(true);
                }
            });
        }else {
            updateModel(data[0], true)
        }
        
    }
    const parseData = (data) => {
        let tempData = [];
        data.forEach(item=>{
            let obj = {};
            Object.keys(item).forEach(key=>{
                let convertedValue = ConvertType(item[key]);
                if(convertedValue.isObject != undefined){
                    obj[key] = convertedValue.id;
                    obj[key+'Name'] = convertedValue.name;
                } else {
                    obj[key] = convertedValue;
                }
            });
            tempData.push(obj);
        })
        return tempData;
    }
    const ConvertType = (value)=>{
        switch(typeof value){
            case 'object':
                if(value == null)
                    return '';
                return {isObject:true, id:value.id, name:value.name ?? value.api_alias};
            case 'number':
            case 'string':
            default:
                return value;
        }
    }
    useEffect(()=>{
        if(data.length > 0){
            setRows(parseData(data));
        }
    },[data])
    
    return (
        <div id='SoarcastGrid'>
            <h1>{gridOptions.label}</h1>
            <DataGrid 
                id='SoarcastGrid'
                rows={Rows} 
                columns={Columns} 
                pageSize={10} 
                autoHeight={true} 
                checkboxSelection={gridOptions.checkboxSelection}
                pagination
                rowCount={rowCount}
                paginationMode="client"
                page={pageIndex}
                onPageChange={handlePageChange}
                onSelectionModelChange={(newSelection) =>{
                    gridSelection(newSelection);
                }}
                selectionModel={selectionModel}
            />
            <div className='buttonContainer'>
                {hasForm == true && !gridOptions.readOnly && <Button variant="contained" color="primary" onClick={()=>{setDisplayForm(true);updateModel(model, true);}}>New</Button>}
                {hasForm == false && model.id != '' && gridOptions.buttonOptions && gridOptions.buttonOptions.map(button=>{
                    return(<Button variant="contained" color={button.color} onClick={(e)=>button.buttonAction(button.value ? button.value : e)}>{button.label}</Button>)
                })}
            </div>
        </div>
    )
}
export default GridControl;