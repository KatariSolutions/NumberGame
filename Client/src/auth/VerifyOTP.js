import React, { useEffect, useState } from 'react'
import logo from '../gallery/logo.svg'
import { useNavigate, Link } from 'react-router-dom';
import Validations from './Validations';
import { verifyAPI } from '../apis/auth/verifyAPI';
import LoaderAnimation from '../components/LoaderAnimation';
import { toast } from 'react-toastify';

function VerifyOTP() {
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
        user_id: "",
        email_otp: ""
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setIsError(false);
        setIsFetching(false);
        setData((prevData) => ({
          ...prevData,
          [name]: type === 'checkbox' ? checked : value
        }));
    };

    useEffect(() => {
      // Try getting from sessionStorage first
      let userId = sessionStorage.getItem('userId');

      // If not found in session, check localStorage
      if (!userId) {
        userId = localStorage.getItem('userId');
      }
    
      // If still not found, redirect to profile setup page
      if (!userId) {
        navigate('../login');
        return;
      }
    
      // Update state with userId
      setData((prevData) => ({
        ...prevData,
        user_id: userId,
        type: 'register'
      }));
    }, []);


    const buttonClick = async (e) => {
      e.preventDefault();
      
      setIsFetching(true);
      const validations = new Validations();
      if(!validations.OTPValidation(data.email_otp)){
        setIsError(true);
        setError({
          type:'otp',
          message: 'Please enter 6 digit otp'
        })
        setIsFetching(false);
        return;
      }

      try{
          const res = await verifyAPI(data);
          //console.log(res);
          if(res.status === 201) {
            setSuccess(1);
            toast.success('Verification Successful!');
            localStorage.setItem('token',res.token);
            localStorage.setItem('userId', res.userId);

            /*
            if(data.isChecked){
              localStorage.setItem('token',res.token);
              localStorage.setItem('userId', res.userId);
            } else {
              sessionStorage.setItem('token',res.token);
              sessionStorage.setItem('userId', res.userId);
            }
            */
  
            setTimeout(()=>{
              navigate('/app/dashboard');
            }, 3000)
          } else {
            toast.error(res.message);
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
      } finally {
        setIsFetching(false);
      }
    }

    return (
        <div className='registration-outer'>
            <div className='logo'>
                <img src={logo} alt='logo'/>
            </div>
            {
                isSuccess
                ? <div className='registration-success'>
                  <h1>Success!</h1>
                  <h3>Your Account Verified!</h3>
                  <LoaderAnimation customMessage="Redirecting"/>
                </div>
                : <>    
                    <h1>Verify Account</h1>
                    <div className='registration-inner'>
                        {
                          isServerError && <div className='error-container'>
                            <span className='error-msg'>{serverStatus}</span>
                          </div>
                        }
                        {
                          (isError && error.type=='otp') && <span className='error-msg'>{error.message}</span>
                        }
                        <div className='input-box'>
                            <input 
                              type='number' 
                              placeholder='Enter OTP' 
                              className={`inp-motp ${(isError&&error.type==='otp')&&'error-box'}`}
                              name='email_otp'
                              value={data.email_otp} 
                              onChange={handleChange}
                            />
                        </div>
                        <span className='warn-msg'>Please check your spam folder also!</span>
                        <div className='button-box'>
                          {
                            isFetching
                            ? <button disabled={true} className='disabled'>Validating...</button>
                            : <button onClick={buttonClick}>Validate OTP</button>
                          }
                        </div>
                        <div className='add-links'>
                          <Link to='/auth/login'>Login here</Link>
                        </div>
                    </div>
                </>
            }
        </div>
    )
}

export default VerifyOTP