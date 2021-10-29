import React, { useState, useEffect } from "react";
import './styles.css'
import Button from '@material-ui/core/Button';
import VariableRow from './variableRow.js'
import { NavItem } from "reactstrap";

const Variables = (props) => {

    const [rows, setRows] = useState(localStorage.getItem('variableRows') ? JSON.parse(localStorage.getItem('variableRows')) : [])

    function addRow() {
        setRows([...rows, {
            id: new Date().getTime()
        }])
    }

    function deleteRow(id, localStorageName, localStorageHvac, localStorageValue, localStorageValueType) {
        const updatedRows = [...rows].filter((row) => row.id !== id)
        setRows(updatedRows)
        localStorage.removeItem(localStorageName)
        localStorage.removeItem(localStorageHvac)
        localStorage.removeItem(localStorageValue)
        localStorage.removeItem(localStorageValueType)
    }

    useEffect(() => {
        localStorage.setItem('variableRows', JSON.stringify(rows))
      }, [rows]);



  return (
    <>
            
            <form className="variableForm">
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p>Has Value</p>
            {rows.map((row) => {
                return (<VariableRow key={row.id} id={row.id} rows={rows} deleteRow={deleteRow}></VariableRow>            
                    )
            })
            }
           <Button variant='contained' color='primary' onClick={addRow}>Add Variable</Button>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <p></p>
            <Button type='submit' className="saveButton" variant="contained" color="secondary">Save</Button>
            </form>


            {/* <form method="POST">
            <h1>Add Runner</h1>
            <div className='inputRow'>
            <label className='label' for='name'>Name:*</label>
            <input type='text' required='required' id="name"></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Schedule'>Schedule:*</label>
            <input type='text' required='required' id='Schedule'></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Minion:*</label>
            <input type='text' required='required' id='Minion'></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Mapping:*</label>
            <input type='text' required='required' id='Minion'></input>
            </div>
            <div className='inputRow'>
            <label className='label' for='Minion'>Permissions:*</label>
            <input type='text' required='required' id='Minion'></input>
            </div>
            <div className='inputRow'>
            <div></div>
            <Button className="saveButton" variant="contained" color="secondary">Save</Button>
            </div>
            </form> */}
          
      

    </>
  );
};

export default Variables;