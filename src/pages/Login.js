// src/pages/Login.js
import React, { useEffect, useState } from 'react';
import { 
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Link as MuiLink
} from '@mui/material';
import { 
  FaUser as UserIcon,
  FaLock as LockIcon 
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Frame from '../components/Frame';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
  const { t, i18n } = useTranslation("global");
  const navigate = useNavigate();

  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.body.classList.add('frame-body');
    return () => {
      document.body.classList.remove('frame-body');
    };
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
      .then(() => console.log(`Language changed to: ${lng}`))
      .catch((err) => console.error("Language switch failed:", err));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    console.log("Login form submitted");

    // Build the payload
    const payload = { email, password };

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "your@email.com",
          password: "yourPassword",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.detail || 'Login failed');
        return;
      }

      const data = await response.json();
      console.log("Login successful", data);
      // Store the token in localStorage (or use another storage method)
      localStorage.setItem('accessToken', data.access_token);
      // Redirect to the homepage or desired page after login
      navigate('/');
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMsg("An error occurred during login.");
    }    
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.detail || 'Login failed');
        return;
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.access_token);
      navigate('/');
    } catch (error) {
      console.error("Error during login:", error);
      setErrorMsg("An error occurred during login.");
    }
  };

  return (
    <Frame title={t('login')} onSubmit={handleLoginSubmit} >
      
      <Box sx={{ position: 'absolute', top: '35px', right: '35px' }}>
        <LanguageSwitcher 
        changeLanguage={changeLanguage} 
          size="large" 
          height="35px" 
          width="35px" 
          fontSize="0.8rem" 
          color="white" />
      </Box>

      {errorMsg && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Typography>
      )}

      <TextField required
        fullWidth
        variant="outlined"
        placeholder={t('email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <UserIcon color="primary" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '40px',
            height: '50px',
            backgroundColor: 'transparent',
            border: '2px solid',
            borderColor: theme => theme.palette.primary.main,
            '& input': {
              color: theme => theme.palette.primary.main,
              '&::placeholder': {
                color: theme => theme.palette.primary.light,
              },
            },
          },
        }}
      />

      <TextField required
        fullWidth
        type="password"
        variant="outlined"
        placeholder={t('password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="primary" />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '40px',
            height: '50px',
            backgroundColor: 'transparent',
            border: '2px solid',
            borderColor: theme => theme.palette.primary.main,
            '& input': {
              color: theme => theme.palette.primary.main,
              '&::placeholder': {
                color: theme => theme.palette.primary.main,
              },
            },
          },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.primary">
          {t('no_account') }{' '}
          <MuiLink 
            component={Link} 
            to="/register" 
            color="primary"
            fontWeight="bold"
          >
            {t('register')}
          </MuiLink>
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        type="submit"
        sx={{
          height: '50px',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        {t('login')}
      </Button>
    </Frame>
  );
};

export default Login;