import React from 'react'

function Loader() {
  return (
    <div className='box-100 flex-center'>
        <div className='flex-center'>
            <img src='./logo.svg' alt='logo' className='logo' width={200} height={100}></img>

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