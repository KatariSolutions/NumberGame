import React, { useState } from 'react'
import logo from '../gallery/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import Validations from './Validations';
import { requestOTP } from '../apis/auth/requestOTP';
import { verifyAPI } from '../apis/auth/verifyAPI';
import { updatePwd } from '../apis/auth/updatePwdAPI';
import { toast } from 'react-toastify';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [isServerError, setIsServerError] = useState(false);
  const [serverStatus, setServerStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState({
    type: '',
    message: ''
  })

  const [successStage, setSuccessStage] = useState(0);
  const [data, setData] = useState({
    email: "",
    otp : "",
    password: ""
  });

  const [user_id, setUserId] = useState('');

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
        try{
          const res = await requestOTP(data);
          // console.log(res);
          if(res.status === 201) {
            toast.success('OTP Sent to registered email.')
            setUserId(res.userId);
            setSuccessStage(1);
            setStep(2);
            setIsFetching(false);
          } else {
            toast.error(res.message);
            setIsFetching(false);
            setIsServerError(true);
            setServerStatus(res.message);
          }
        } catch (err) {
          console.log(err);
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
        try{
          const payload = {user_id:user_id, email_otp:data.otp, type:'forgot-password'};
          const res = await verifyAPI(payload);
          console.log('Verify API : ', res);
          if(res.status === 201) {
            toast.success('Verified Successfully!');

            setSuccessStage(2);
            setStep(3);
            setIsFetching(false);
          } else {
            toast.error(res.message);

            setIsFetching(false);
            setIsServerError(true);
            setServerStatus(res.message);
          }
        } catch (err) {
          console.log(err);
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
        try{
          const payload = {user_id, password:data.password};
          const res = await updatePwd(payload);
          if(res.status === 201) {
            setSuccessStage(3);
            toast.success('Password Updated! Redirecting...')

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
          console.log(err);
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
  }

  return (
    <div className='registration-outer'>
        <div className='logo'>
            <img src={logo} alt='logo'/>
        </div>
        <h1>Reset Password</h1>
        <div className='registration-inner'>
            {
              successStage == 1 && <div className='success-container'>
                <span className='success-msg'>6 digit OTP sent to your registered email.Valid for next 10 minutes only.</span>
              </div>
            }
            {
              successStage == 2 && <div className='success-container'>
                <span className='success-msg'>OTP Verified. Please enter new password.</span>
              </div>
            }
            {
              successStage == 3 && <div className='success-container'>
                <span className='success-msg'>Password updated. <Link to='/auth/login'>Login here</Link></span>
              </div>
            }
            {
              isServerError && <div className='error-container'>
                <span className='error-msg'>{serverStatus}</span>
              </div>
            }
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