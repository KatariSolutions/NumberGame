import React, { useState, useEffect } from 'react'
import logo from '../gallery/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import Validations from './Validations';
import { loginAPI } from '../apis/auth/loginAPI';
import Loader from '../components/CustomLoader';
import { verifyToken } from '../apis/auth/verifyToken';

function Login() {
  const [isLoading, setIsLoading] = useState(true);
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

  const navigate = useNavigate();

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
        const res = await loginAPI(data);
        //console.log(res);
        if(res.status === 201) {
          setSuccess(1);
          if(data.isChecked){
            localStorage.setItem('token',res.token);
            localStorage.setItem('userId', res.userId);
          } else {
            sessionStorage.setItem('token',res.token);
            sessionStorage.setItem('userId', res.userId);
          }

          setIsLoading(true);
          setTimeout(()=>{
            setIsLoading(false);
            navigate('/app/dashboard');
          }, 1000)
        } else {
          setIsFetching(false);
          setIsServerError(true);
          setServerStatus(res.error);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  const checkToken = async () => {
    const token = localStorage.getItem("token") 
                  ? localStorage.getItem("token") 
                  : sessionStorage.getItem("token");

    if (!token) {
      console.log('Token not available!');
      setIsLoading(false);
    } else {
      try {
        const res = await verifyToken({}, token);
        console.log(res);
        if (res.status === 201) {
          console.log('Token verified!');
          setIsLoading(false);
          navigate("/app/dashboard");
        } else {
          console.log('Token not verified!');
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    checkToken();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer); // cleanup on unmount
  }, []);

  return (
    <>
      <div className='registration-outer'>  
            <div className='logo'>
                <img src={logo} alt='logo'/>
            </div>
            <h1>Login</h1>
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
    </>
  )
}

export default Login