import React from 'react';
import { IoIosClose } from "react-icons/io";

function CustomBanner({message, closeBanner}) {
  return (
    <div className='custom-banner'>
        <div></div>
        <p>{message}</p>
        <IoIosClose className='icon icon-close' onClick={closeBanner}/>
    </div>
  )
}

export default CustomBanner