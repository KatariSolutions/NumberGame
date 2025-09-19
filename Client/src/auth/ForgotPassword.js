import React from 'react'
import logo from '../gallery/logo.svg'
import { Link } from 'react-router-dom'

function ForgotPassword() {
  return (
    <div className='registration-outer'>
        <div className='logo'>
            <img src={logo} alt='logo'/>
        </div>
        <h1>Reset Password</h1>
        <div className='registration-inner'>
            <div className='input-box'>
              <input type='email' placeholder='Email address' className='inp-mail'/>
            </div>
            <div className='button-box'>
              <button>Get OTP</button>
            </div>
            <div className='add-links'>
              <Link to='/auth/login'>Login here</Link>
            </div>
        </div>
    </div>
  )
}

export default ForgotPassword