import React from 'react';
import { useNavigate } from 'react-router-dom';
import bg from '../gallery/main-banner-img.jpg';
import logo from '../gallery/logo.svg';

function LandingPage() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/auth/login');
    }

    const handleRegister = () => {
        navigate('/auth/register');
    }

    return (
        <div className='landing-page' style={{ backgroundImage: `url(${bg})` }}>
            <div className='landing-page-inner'>
                <div className='logo'>
                    <img src={logo} alt='logo'/>
                </div>

                <div className='lower-section'>
                    <div className='action-buttons'>
                        <button className='action-btn login' onClick={handleLogin}>Login</button>
                        <button className='action-btn register' onClick={handleRegister}>Register</button>
                    </div>
                    <p>Play. Win. Withdraw Instantly.</p>
                </div>
            </div>
        </div>
    )
}

export default LandingPage