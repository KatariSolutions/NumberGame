import React from 'react'

function LoaderAnimation(props) {
    const {customMessage} = props;
    return (
      <div className='loader flex-center'>
        <div className='loader-outer'>
          <div className='loader-inner'></div>
        </div>
        <p>{customMessage} ...</p>
      </div>
    )
}   

export default LoaderAnimation