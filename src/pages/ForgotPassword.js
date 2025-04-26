import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import Frame from '../components/Frame';
import Footer from '../components/Footer';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE_URL = "http://localhost:8000";

const ForgotPassword = () => {
    const { t, i18n } = useTranslation("global");
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const theme = useTheme();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMsg('');

        // Ensure email input is not empty
        if (!email) {
            setErrorMsg(t('errors.empty_email'));
            return;
        }

        try {
            // Send POST request to backend API
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),  // Send email in the request body
            });

            // Check if response is successful
            if (!response.ok) {
                const data = await response.json();
                // Check if the response contains a message or error detail
                setErrorMsg(data.detail || t('errors.default_error'));
                return;
            }

            // If email sent successfully
            setMessage(t('reset_link_sent'));
        } catch (error) {
            console.error(error);
            // Ensure error message is a string before setting it
            setErrorMsg(t('errors.reset_email_failed'));
        }
    };


    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng)
            .then(() => console.log(`Language changed to: ${lng}`))
            .catch((err) => console.error("Language switch failed:", err));
    };

    return (
        <Box>
            <Frame
                title={t('forgot_password')}
                onSubmit={handleSubmit}
                sx={{
                    minHeight: '300px',
                    padding: '40px',
                }}
            >
                {/* Language Switcher */}
                <Box sx={{ position: 'absolute', top: '25px', right: '25px' }}>
                    <LanguageSwitcher
                        changeLanguage={changeLanguage}
                        size="large"
                        height="35px"
                        width="35px"
                        fontSize="0.8rem"
                        color="white"
                    />
                </Box>

                {/* Error or Success Message */}
                {errorMsg && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}
                    </Typography>
                )}

                {message && (
                    <Typography color="success.main" sx={{ mb: 2 }}>
                        {message}
                    </Typography>
                )}


                {/* Email Input Field */}
                <TextField
                    required
                    fullWidth
                    variant="outlined"
                    label={t('email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                        marginBottom: 2,
                        '& .MuiInputLabel-root': {
                            color: 'primary.main', // Change the label color
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main', // Change the label color when the field is focused
                        },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '25px', // Adjust the border radius here
                        },
                    }}
                />

                {/* Submit Button */}
                <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    sx={{
                        height: '50px',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none', // Disable all caps
                    }}
                >
                    {t('send_reset_link')}
                </Button>
            </Frame>
            <Footer
                sx={{ backgroundColor: theme.palette.background.main }}
                bottomSx={{ backgroundColor: "primary.main" }} />
        </Box>
    );
};

export default ForgotPassword;
