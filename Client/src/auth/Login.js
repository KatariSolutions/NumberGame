import React, { useState } from 'react'
import logo from '../gallery/logo.svg'
import { Link } from 'react-router-dom'
import Validations from './Validations';

function Login() {
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState({
    type: '',
    message: ''
  })

  const [data, setData] = useState({
    email: "",
    password: "",
    isChecked: false
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
    if(!validations.EmailValidation(data.email)){
      setIsError(true);
      setError({
        type:'email',
        message: 'Please enter valid Email Address!'
      })
      setIsFetching(false);
      return;
    } else if(!validations.PasswordValidation(data.password)){
      setIsError(true);
      setError({
        type:'password',
        message: 'min 8 chars, at least 1 letter & 1 number'
      })
      setIsFetching(false);
      return;
    } else {
      // will call api
    }
  }

  return (
    <div className='registration-outer'>
        <div className='logo'>
            <img src={logo} alt='logo'/>
        </div>
        <h1>Login</h1>
        <div className='registration-inner'>
            {
              (isError && error.type=='email') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='email' 
                placeholder='Email address' 
                className={`inp-mail ${(isError&&error.type==='email')&&'error-box'}`}
                name='email'
                value={data.email} 
                onChange={handleChange}
              />
            </div>
            {
              (isError && error.type=='password') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='password' 
                placeholder='Password' 
                className={`'inp-password' ${(isError&&error.type==='password')&&'error-box'}`}
                name='password'
                value={data.password} 
                onChange={handleChange}
              />
            </div>
            <div className='input-box checkbox'>
              <input 
                type='checkbox' 
                name='isChecked'
                checked={data.isChecked} 
                onChange={handleChange}
              />
              <label>remember me</label>
            </div>
            <div className='button-box'>
              {
                isFetching
                ? <button disabled={true} className='disabled'>Login...</button>
                : <button onClick={buttonClick}>Login</button>
              }
            </div>
            <div className='add-links'>
              <Link to='/auth/register'>Not registered? register here</Link>
              <Link to='/auth/forgot-password'>Forgot Password? Reset here</Link>
            </div>
        </div>
    </div>
  )
}

export default Login