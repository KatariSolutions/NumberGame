import React from 'react'
import logo from '../gallery/logo.svg'

function Loader() {
  return (
    <div className='box-100 flex-center'>
        <div className='loader-flex-box flex-center'>
            <img src={logo} alt='logo' className='logo' width={200} height={100}></img>

            <div className='loader flex-center'>
              <div className='loader-outer'>
                <div className='loader-inner'></div>
              </div>
              <p>Loading ...</p>
            </div>
        </div>
    </div>
  )
}

export default Loader