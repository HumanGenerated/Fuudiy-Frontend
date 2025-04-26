import React, { useState, useEffect } from 'react';
import CheckboxQuestion from '../components/ui/CheckboxQuestion';
import RadioMatrix from '../components/ui/RadioMatrix';
import TextQuestion from '../components/ui/TextQuestion';
import ScoreQuestion from '../components/ui/ScoreQuestion';
import { Box, Button, Typography } from '@mui/material';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import loginBackground from '../assets/login_background.jpg';

const Survey = () => {
    const { t, i18n } = useTranslation("global");
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(""); // Store error message
    const navigate = useNavigate();

    useEffect(() => {

        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.get("/auth/users/me");
                if (response.data.data[0].has_completed_survey) {
                    navigate("/"); // redirect away if already completed
                }
            } catch (err) {
                console.error("Could not verify user survey status", err);
            }
        };

        fetchUserData();
        const fetchQuestions = async () => {
            try {
                const response = await fetch('/questions.json');
                const data = await response.json();
                setQuestions(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching questions:', error);
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const handleResponseChange = (id, value) => {
        setResponses((prev) => ({
            ...prev,
            [id]: value,
        }));
        setErrorMessage(""); // Clear error when answered
    };

    const currentQuestion = questions[currentQuestionIndex];
    const language = i18n.language;

    const resolveMediaPath = (path) => {
        if (!path) return null;
        try {
            return path.startsWith('/') ? `${process.env.PUBLIC_URL}${path}` : require(`../assets/${path}`);
        } catch (error) {
            console.error(`Error resolving media path: ${path}`, error);
            return null;
        }
    };

    const isCurrentQuestionAnswered = () => {
        if (!currentQuestion) return false;

        if (currentQuestion.type === 'radio' && currentQuestion.rows && currentQuestion.columns) {
            const userResponses = responses[currentQuestion.id] || {};
            return currentQuestion.rows.every(row => {
                const rowKey = row.en.toLowerCase().replace(/\s+/g, '_');
                return userResponses[rowKey] !== undefined && userResponses[rowKey] !== "";
            });
        }

        if (currentQuestion.type === 'score') {
            return responses[currentQuestion.id] !== undefined && responses[currentQuestion.id] !== "";
        }

        return true; // Other types are optional
    };


    const goToNextQuestion = () => {
        if (!isCurrentQuestionAnswered()) {
            window.alert(t('please_answer'));
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
            setErrorMessage(""); // Clear error when going back
        }
    };

    const handleSubmit = async () => {
        if (!isCurrentQuestionAnswered()) {
            window.alert(t('please_answer'));
            return;
        }

        console.log('Survey Responses:', responses);
        try {
            const token = localStorage.getItem('accessToken');
            const payload = { responses };

            const response = await fetch('http://localhost:8000/survey/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to submit survey:', errorData);
                alert('Failed to submit survey. ' + (errorData.detail || ''));
                return;
            }

            const data = await response.json();
            console.log('Survey submitted successfully:', data);
            alert('Thank you for completing the survey!');
            navigate('/login');

        } catch (error) {
            console.error('Error submitting survey:', error);
            alert('An error occurred while submitting the survey.');
        }
    };

    if (loading) {
        return <Typography>Loading survey questions...</Typography>;
    }

    if (questions.length === 0) {
        return <Typography>No questions available.</Typography>;
    }

    return (
        <>
<Box sx={{backgroundImage: `url(${loginBackground})`,  backgroundSize: 'cover', minHeight: '100vh',backgroundPosition: 'center',}} >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh', // This makes sure the container takes at least the full viewport height
                    width: '100%',
                }}
            >
                <Box
                    sx={{
                        width: 600,
                        bgcolor: 'background.main',
                        textAlign: 'center',
                        padding: 5,
                        borderRadius: '50px'
                    }}
                ><Box position='relative' sx={{mb:5}}>
                        <LanguageSwitcher color='grey' changeLanguage={(lng) => i18n.changeLanguage(lng)} />
                    </Box>
                    <Typography variant="h6" color='grey' sx={{ marginBottom: 3 }}>
                        {t('user_pref')}
                    </Typography>

                    {/* Error Message */}
                    {errorMessage && (
                        <Typography color="error" sx={{ marginBottom: 2 }}>
                            {errorMessage}
                        </Typography>
                    )}


                    {/* Render the current question dynamically */}
                    {currentQuestion.type === 'checkbox' && (
                        <CheckboxQuestion
                            question={currentQuestion.question}
                            options={currentQuestion.options}
                            selected={responses[currentQuestion.id] || []}
                            onChange={(option, isChecked) => {
                                const canonicalValue = option.value;
                                const currentSelections = responses[currentQuestion.id] || [];
                                const newSelections = isChecked
                                    ? [...currentSelections, canonicalValue]
                                    : currentSelections.filter((item) => item !== canonicalValue);
                                handleResponseChange(currentQuestion.id, newSelections);
                            }}
                            twoColumns={currentQuestion.twoColumns || false}
                            language={language}
                        />
                    )}

                    {currentQuestion.type === 'radio' && currentQuestion.rows && currentQuestion.columns && (
                        <RadioMatrix
                            question={currentQuestion.question}
                            rows={currentQuestion.rows}
                            columns={currentQuestion.columns}
                            onChange={(row, value) => {
                                const newResponses = {
                                    ...(responses[currentQuestion.id] || {}),
                                    [row]: value
                                };
                                handleResponseChange(currentQuestion.id, newResponses);
                            }}
                            language={language}
                            values={responses[currentQuestion.id] || {}}
                        />
                    )}

                    {currentQuestion.type === 'score' && (
                        <ScoreQuestion
                            question={currentQuestion.question}
                            value={responses[currentQuestion.id] || 0}
                            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
                            media={resolveMediaPath(currentQuestion.media)}
                            language={language}
                        />
                    )}

                    {currentQuestion.type === 'text' && (
                        <TextQuestion
                            question={currentQuestion.question}
                            value={responses[currentQuestion.id] || ''}
                            onChange={(value) => handleResponseChange(currentQuestion.id, value)}
                            language={language}
                        />
                    )}

                    {/* Navigation Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4, gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={goToPreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                        >
                            {t('previous')}
                        </Button>

                        {currentQuestionIndex < questions.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={goToNextQuestion}
                            >
                                {t('next')}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                            >
                                {t('submit')}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
            </Box>
        </>
    );
};

export default Survey;
