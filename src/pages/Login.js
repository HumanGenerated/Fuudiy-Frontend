// src/pages/Login.js
import React, { useEffect } from 'react';
import Frame from '../components/Frame';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { FaUser, FaLock } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { alignProperty } from '@mui/material/styles/cssUtils';
import { colors } from '@mui/material';
import { Box} from '@mui/material';

const Login = () => {
  const { t, i18n } = useTranslation("global");

  // Dynamically add/remove the `body` class
  useEffect(() => {
    document.body.classList.add('frame-body'); // Add class to body
    return () => {
      document.body.classList.remove('frame-body'); // Remove class on cleanup
    };
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
      .then(() => console.log(`Language changed to: ${lng}`))
      .catch((err) => console.error("Language switch failed:", err));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Login form submitted");
  };

  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/');
  };

  return (
    <Frame title={t('login')} onSubmit={handleLoginSubmit} >
      {/* Language Switcher */}
      
      <>
  <Box 
    sx={{ 
      position: 'absolute', // Positions it relative to the page
      top: '10px',          // Adjusts vertical placement
      right: '15px',         // Positions it to the left
    }}
  >
      <LanguageSwitcher changeLanguage={changeLanguage} size="large" height="35px" width="35px" fontSize="0.8rem" />
    </Box>
</>

      
      <h1>{t('login')}</h1>
      {/* Login Form Fields */}
      <div className="input-box">
        <input type="text" placeholder={t('username')} required />
        <FaUser className="icon" />
      </div>
      <div className="input-box">
        <input type="password" placeholder={t('password')} required />
        <FaLock className="icon" />
      </div>
      <div className="register-link">
        <p>
          {t('no_account')}{" "}
          <Link to="/register" className="toggle-link">{t('register')}</Link>
        </p>
      </div>
      <button type="submit" onClick={handleLogin}>{t('login')}</button>
    </Frame>
  );
};

export default Login;
