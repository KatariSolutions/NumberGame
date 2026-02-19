import React, { useState } from 'react'
import logo from '../gallery/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import Validations from './Validations';
import { toast } from 'react-toastify';
import { requestPwdResetAPI } from '../apis/auth/requestPwdResetAPI';

function ForgotPassword() {
  const [isFetching, setIsFetching] = useState(false);
  const [isServerError, setIsServerError] = useState(false);
  const [serverStatus, setServerStatus] = useState('');
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

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setIsError(false);
    setData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buttonClick = async (e) => {
    e.preventDefault();

    setIsFetching(true);
    setIsServerError(false);
    const validations = new Validations();
    if(!validations.EmailValidation(data.email)){
      setIsError(true);
      setError({
        type:'email',
        message: 'Please enter valid Email Address!'
      })
      setIsFetching(false);
      return;
    } else {
      try{
        const payload = { email : data.email};
        const res = await requestPwdResetAPI(payload);
        //console.log(res);
        if(res.status === 201) {
          toast.success('Request sent to admin!')
          setTimeout(()=>{
            navigate('/auth/login');
          },2000)
        } else {
          toast.error(res.message);
          setIsFetching(false);
          setIsServerError(true);
          setServerStatus(res.message);
        }
      } catch (err) {
        //console.log(err);
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

  return (
    <div className='registration-outer'>
        <div className='logo'>
            <img src={logo} alt='logo'/>
        </div>
        <h1>Reset Password</h1>
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
            <div className='button-box'>
              {
                isFetching
                  ? <button disabled={true} className='disabled'>Sending request...</button>
                  : <button onClick={buttonClick}>Request password reset</button>
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