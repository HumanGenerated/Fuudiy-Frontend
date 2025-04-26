// src/pages/Login.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  TextField,
  Typography,
  Link as MuiLink,
  useTheme
} from '@mui/material';
import {
  FaUser as UserIcon,
  FaLock as LockIcon
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Frame from '../components/Frame';
const API_BASE_URL = "http://localhost:8000";
const Login = () => {
  const { t, i18n } = useTranslation("global");
  const navigate = useNavigate();
  const theme = useTheme();
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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.detail?.message || 'Login failed'); // Ensure it's a string
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
    <Box>
      <Frame title={t('login')} onSubmit={handleLoginSubmit}>
        <Box sx={{ position: 'absolute', top: '35px', right: '35px' }}>
          <LanguageSwitcher
            changeLanguage={changeLanguage}
            size="large"
            height="35px"
            width="35px"
            fontSize="0.8rem"
            color="white"
          />
        </Box>

        {errorMsg && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Typography>
        )}

        <TextField
          required
          fullWidth
          variant="outlined"
          placeholder={t('email')}
          type="email"
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

        <TextField
          required
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

        <Button
          fullWidth
          variant="contained"
          type="submit"
          sx={{
            height: '50px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            mb: 3
          }}
        >
          {t('login')}
        </Button>

        <Box sx={{ textAlign: 'center' }}>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" sx={{ textTransform: 'uppercase', color: 'gray', fontWeight: 500 }}>
          {t('or')}
          </Typography>
        </Divider>


          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <script src="https://accounts.google.com/gsi/client" async defer></script>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const credential = credentialResponse.credential;
                  const decoded = jwtDecode(credential);
                  console.log("Google user:", decoded);

                  const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      token: credential // Use the credential directly here
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 404) {
                      // Kayıtlı değilse kayıt sayfasına yönlendir
                      setErrorMsg(t('errors.google_not_registered'));
                      setTimeout(() => navigate('/register'), 2000);
                    } else {
                      setErrorMsg(errorData.detail || 'Google login failed');
                    }
                    return;
                  }
                  const data = await response.json();
                  localStorage.setItem('accessToken', data.access_token);
                  navigate('/');
                } catch (err) {
                  console.error(err);
                  setErrorMsg("Google login failed.");
                }
              }}
              onError={() => {
                setErrorMsg("Google login failed.");
              }}
              useOneTap
              width="300"
            />
          </Box>
          <Typography variant="body2" color="text.primary">
            {t('no_account')}{' '}
            <MuiLink component={Link} to="/register" color="primary" fontWeight="bold">
              {t('register')}
            </MuiLink>
          </Typography>
          <Typography
            variant="body2"
            sx={{ mb: 2 }}
          >
            <MuiLink component={Link} to="/forgot-password" color="primary" fontWeight="bold">
              {t('forgot_password') || 'Forgot Password?'}
            </MuiLink>
          </Typography>

        </Box>


      </Frame>
      <Footer
        sx={{ backgroundColor: theme.palette.background.main }}
        bottomSx={{ backgroundColor: "primary.main" }} />
    </Box>
  );
};

export default Login;