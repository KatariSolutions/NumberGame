import React, { useState, useEffect } from 'react'
import logo from '../gallery/logo.svg'
import { Link, useNavigate } from 'react-router-dom'
import Validations from './Validations';
import { registerAPI } from '../apis/auth/registerAPI';
import LoaderAnimation from '../components/LoaderAnimation';
import { updateProfileDetailsAPI } from '../apis/user/updateProfileDetailsAPI';
import { toast } from 'react-toastify';

function ProfileDetails() {
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
    name: "",
    dob: "",
    avatar: "",
    address: "",
    pincode: ""
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
    if(!validations.NameValidation(data.name)){
      setIsError(true);
      setError({
        type:'name',
        message: 'Please enter atleast 3 characters!'
      })
      setIsFetching(false);
      return;
    } else if(!validations.DOBValidation(data.dob)){
      setIsError(true);
      setError({
        type:'dob',
        message: 'Must be 18 years old atleast!'
      })
      setIsFetching(false);
      return;
    } else if(!validations.AddressValidation(data.address)){
      setIsError(true);
      setError({
        type:'address',
        message: 'Should be between 6 to 50 characters only.'
      })
      setIsFetching(false);
      return;
    } else if(!validations.PincodeValidation(data.pincode)){
      setIsError(true);
      setError({
        type:'pincode',
        message: 'Only 6 digits are allowed.'
      })
      setIsFetching(false);
      return;
    } else {
      try{
        const res = await updateProfileDetailsAPI(data);
        if(res.status === 201) {
          setSuccess(1);

          navigate('/app');
        } else {
          setIsFetching(false);
          setIsServerError(true);
          setServerStatus(res.error);
        }
      } catch (err) {
        console.error(err);
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

  useEffect(() => {
    // Try getting from sessionStorage first
    let userId = sessionStorage.getItem('userId');
    // If not found in session, check localStorage
    if (!userId) {
      userId = localStorage.getItem('userId');
    }
  
    if (!userId) {
      navigate('../login');
      return;
    }
  
    setData((prevData) => ({
      ...prevData,
      user_id: userId
    }));
  }, []);

  return (
    <div className='registration-outer'>
        <div className='logo'>
          <img src={logo} alt='logo'/>
        </div>
        {
          isSuccess
          ? <div className='registration-success'>
            <LoaderAnimation customMessage="Redirecting"/>
          </div>
          : <> 
          <h1>Profile Details</h1>
          <div className='registration-inner'>
            {
              isServerError && <div className='error-container'>
                <span className='error-msg'>{serverStatus}</span>
              </div>
            }
            {
              (isError && error.type=='name') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='text' 
                placeholder='Full Name' 
                className={`inp-mail ${(isError&&error.type==='name')&&'error-box'}`}
                name='name'
                value={data.name} 
                onChange={handleChange}
              />
            </div>
            {
              (isError && error.type=='dob') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='date' 
                placeholder='DD/MM/YYYY' 
                className= {`'inp-phone' ${(isError&&error.type==='dob')&&'error-box'}`}
                name='dob'
                value={data.dob} 
                onChange={handleChange}
              />
            </div>
            {
              (isError && error.type=='address') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='text' 
                placeholder='Address' 
                className={`'inp-password' ${(isError&&error.type==='address')&&'error-box'}`}
                name='address'
                value={data.address} 
                onChange={handleChange}
              />
            </div>
            {
              (isError && error.type=='pincode') && <span className='error-msg'>{error.message}</span>
            }
            <div className='input-box'>
              <input 
                type='text' 
                placeholder='Pincode' 
                className={`'inp-password' ${(isError&&error.type==='pincode')&&'error-box'}`}
                name='pincode'
                value={data.pincode} 
                onChange={handleChange}
              />
            </div>
            <div className='button-box'>
              {
                isFetching
                ? <button disabled={true} className='disabled'>Submitting...</button>
                : <button onClick={buttonClick}>Submit</button>
              }
            </div>
          </div>
          </>
        }
    </div>
  )
}

export default ProfileDetails