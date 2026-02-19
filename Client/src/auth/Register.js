import React, { useState } from 'react'
import logo from '../gallery/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import Validations from './Validations';
import { registerAPI } from '../apis/auth/registerAPI';
import LoaderAnimation from '../components/LoaderAnimation';
import { toast } from 'react-toastify';

function Register() {
  const [isFetching, setIsFetching] = useState(false);
  const [isServerError, setIsServerError] = useState(false);
  const [serverStatus, setServerStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState({
    type: '',
    message: ''
  })

  const [isSuccess, setSuccess] = useState(0);
  const [data, setData] = useState({
    email: "",
    phone: "",
    password: "",
    isChecked: false
  });

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setIsError(false);
    setIsFetching(false);
    setData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buttonClick = async (e) => {
    e.preventDefault();

    setIsServerError(false);
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
    } else if(!validations.PhoneValidation(data.phone)){
      setIsError(true);
      setError({
        type:'phone',
        message: 'Please enter valid Phone Number!'
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
      try{
        const res = await registerAPI(data);
        if(res.status === 201) {
          setSuccess(1);
          localStorage.setItem('userId',res.userId);
          localStorage.setItem('token',res.token);

          toast.success('Registered successfully!');
          setTimeout(()=>{
            navigate('/app/dashboard');
          }, 1000)
        } else {
          setIsFetching(false);
          setIsServerError(true);
          setServerStatus(res.message);
        }
      } catch (err) {
        //console.error(err);
        if(err?.status === 403) {
          navigate('/403');
        }
        if(err?.status === 401) {
          navigate('/401');
        }
        toast.error(err.message);
        navigate('/500');
      }
    }
  }

  {/*else if(!data.isChecked){
      setIsError(true);
      setError({
        type:'check',
        message: 'Please accept our terms before procceding'
      })
      setIsFetching(false);
      return;
  }*/}

  return (
    <div className='registration-outer'>
        <div className='logo'>
          <img src={logo} alt='logo'/>
        </div>
        {
          isSuccess
          ? <div className='registration-success'>
            <h1>Success!</h1>
            <h3>You have successfully registered!</h3>
            <ul className='guidelines'>
              <li>Your regitration only valid once you verified your account.</li>
              <li>We have sent a 6-digit OTP to your email. Please enter in next step to verify.</li>
            </ul>
            <LoaderAnimation customMessage="Redirecting"/>
          </div>
          : <> 
          <h1>Register</h1>
          <div className='registration-inner'>
            {
              isServerError && <div className='error-container'>
                <span className='error-msg'>{serverStatus}</span>
              </div>
            }
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
              (isError && error.type=='phone') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='phone' 
                placeholder='Mobile number' 
                className= {`'inp-phone' ${(isError&&error.type==='phone')&&'error-box'}`}
                name='phone'
                value={data.phone} 
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
            {/*
            <div className='input-box checkbox'>
              <input 
                type='checkbox' 
                name='isChecked'
                checked={data.isChecked} 
                onChange={handleChange}
              />
              <label>I accept to terms and conditions.</label>
            </div>
            {
              (isError && error.type=='check') && <span className='error-msg red'>{error.message}</span>
            }
            */}
            <div className='button-box'>
              {
                isFetching
                ? <button disabled={true} className='disabled'>Registering...</button>
                : <button onClick={buttonClick}>Register</button>
              }
            </div>
            <div className='add-links'>
              <Link to='/auth/login'>Already registered? Login here</Link>
            </div>
          </div>
          </>
        }
    </div>
  )
}

export default Register