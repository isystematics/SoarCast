import React, { useState, useEffect } from "react"
import CircularProgress from '@material-ui/core/CircularProgress'
const LoadingOverlay = () => {
    return(
        <div className='fullContainer'>
          <div className='loadingPositioner'>
            <CircularProgress />
          </div>
        </div>
    )
}
export default LoadingOverlay;