import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Add Navigate here
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from "./pages/Explore";
import FoodDetailPage from './pages/FoodDetailPage';
import Survey from './pages/Survey';

import UserProfile from './pages/UserProfile';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default Route: "/" points to Home */}
        <Route path="/" element={<Home />} /> 
        {/* Default Route: "/" points to Explore */}
        <Route path="/explore" element={<Explore />} />
        {/* Dynamic Route for Food Details */}
        <Route path="/food/:id" element={<FoodDetailPage />} /> 

        {/* Fallback Route: Redirect to Home if no match */}
        <Route path="*" element={<Navigate to="/" />} /> 

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Add other routes here */}

        <Route path="/profile/:USER_NAME" element={<UserProfile />} />
        <Route path="/survey" element={<Survey 
            />} />

      </Routes>
    </Router>
  );
};

export default App;
