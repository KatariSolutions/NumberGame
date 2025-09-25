import React, { useState } from 'react'
import logo from '../gallery/logo.svg'
import { Link } from 'react-router-dom'
import Validations from './Validations';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState({
    type: '',
    message: ''
  })

  const [data, setData] = useState({
    email: "",
    otp : "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setIsError(false);
    setData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buttonClick = (e) => {
    e.preventDefault();

    setIsFetching(true);
    const validations = new Validations();
    if(step === 1) {
      if(!validations.EmailValidation(data.email)){
        setIsError(true);
        setError({
          type:'email',
          message: 'Please enter valid Email Address!'
        })
        setIsFetching(false);
        return;
      } else {
        setStep(2);
        setIsFetching(false);
      }
    } else if (step === 2) {
      if(!validations.OTPValidation(data.otp)){
        setIsError(true);
        setError({
          type:'otp',
          message: 'Please enter 6 digit otp'
        })
        setIsFetching(false);
        return;
      } else {
        setStep(3);
        setIsFetching(false);
      }
    } else {
      if(!validations.PasswordValidation(data.password)){
        setIsError(true);
        setError({
          type:'password',
          message: 'min 8 chars, at least 1 letter & 1 number'
        })
        setIsFetching(false);
        return;
      } else {
        // api call
      }
    }
  }

  return (
    <div className='registration-outer'>
        <div className='logo'>
            <img src={logo} alt='logo'/>
        </div>
        <h1>Reset Password</h1>
        <div className='registration-inner'>
            {
              (isError && error.type=='email') && <span className='error-msg'>{error.message}</span>
            }
            {
              (isError && error.type=='otp') && <span className='error-msg'>{error.message}</span>
            }
            {
              (isError && error.type=='password') && <span className='error-msg'>{error.message}</span>
            }
            {
              step === 1 
              ? <div className='input-box'>
                  <input 
                    type='email' 
                    placeholder='Email address' 
                    className={`inp-mail ${(isError&&error.type==='email')&&'error-box'}`}
                    name='email'
                    value={data.email} 
                    onChange={handleChange}
                  />
                </div>
              : step === 2
                ? <div className='input-box'>
                    <input 
                      type='number' 
                      placeholder='Enter OTP' 
                      className={`inp-motp ${(isError&&error.type==='otp')&&'error-box'}`}
                      name='otp'
                      value={data.otp} 
                      onChange={handleChange}
                    />
                  </div>
                : <div className='input-box'>
                    <input 
                      type='password' 
                      placeholder='Password' 
                      className={`'inp-password' ${(isError&&error.type==='password')&&'error-box'}`}
                      name='password'
                      value={data.password} 
                      onChange={handleChange}
                    />
                  </div>
            }
            <div className='button-box'>
              {
                step === 1 
                ? isFetching
                  ? <button disabled={true} className='disabled'>Sending OTP...</button>
                  : <button onClick={buttonClick}>Get OTP</button>
                : step === 2
                  ? isFetching
                    ? <button disabled={true} className='disabled'>Validating OTP...</button>
                    : <button onClick={buttonClick}>Validate OTP</button>
                  : isFetching
                    ? <button disabled={true} className='disabled'>Updating Password...</button>
                    : <button onClick={buttonClick}>Update Password</button>
              }
            </div>
            <div className='add-links'>
              <Link to='/auth/login'>Login here</Link>
            </div>
        </div>
    </div>
  )
}

export default ForgotPassword