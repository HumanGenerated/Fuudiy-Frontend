import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, TextField, Typography, useTheme } from '@mui/material';
import Frame from '../components/Frame';
import Footer from '../components/Footer';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const API_BASE_URL = "http://localhost:8000";

const ResetPassword = () => {
    const { t, i18n } = useTranslation("global");
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const theme = useTheme();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError(t('errors.passwords_do_not_match'));
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || t('errors.default_error'));
                return;
            }

            setMessage(t('password_reset_success'));
        } catch (err) {
            console.error(err);
            setError(t('errors.reset_password_failed'));
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
                title={t('reset_password')}
                onSubmit={handleReset}
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
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {message && (
                    <Typography color="success.main" sx={{ mb: 2 }}>
                        {message}
                    </Typography>
                )}

                {/* New Password Input Field */}

                <TextField
                    type="password"
                    label={t('new_password')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{

                        marginBottom: 2,
                        '& .MuiInputLabel-root': {
                            color: 'primary.main', // Change the label color (e.g., primary theme color)
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main', // Change the label color when the field is focused
                        },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '256px', // Adjust border-radius
                        },
                    }}
                />

                <TextField
                    type="password"
                    label={t('confirm_password')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{
                        marginBottom: 2,
                        '& .MuiInputLabel-root': {
                            color: 'primary.main', // Change the label color (e.g., primary theme color)
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: 'primary.main', // Change the label color when the field is focused
                        },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '25px', // Adjust border-radius
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
                    {t('reset_password')}
                </Button>
            </Frame>
            <Footer
                sx={{ backgroundColor: theme.palette.background.main }}
                bottomSx={{ backgroundColor: "primary.main" }} />
        </Box>
    );
};

export default ResetPassword;
