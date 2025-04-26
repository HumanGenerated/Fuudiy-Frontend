// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme';
import ScrollToTop from './components/ScrollToTop'; // 🆕 Import ScrollToTop

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from "./pages/Explore";
import FoodDetailPage from './pages/FoodDetailPage';
import Survey from './pages/Survey';
import UserProfile from './pages/UserProfile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
const App = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider theme={theme}>
        <Router>
          <ScrollToTop /> {/* 🆕 Add this line to reset scroll on route change */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/food/:id" element={<FoodDetailPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:USERNAME" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/survey" element={<Survey />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
