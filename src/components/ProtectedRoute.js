// components/ProtectedRoute.js
import { Navigate, useLocation } from 'react-router-dom';

const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate 
        to="/" 
        replace 
        state={{ from: location.pathname, reason: "loginRequired" }} 
      />
    );
  }
  return children;
};

export default ProtectedRoute;
