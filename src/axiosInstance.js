import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://fuudiy.com:8000", // Update with your API URL
});

// Request Interceptor: Attach Token to Headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Expired Token
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired. Logging out...");
      localStorage.removeItem("accessToken"); // Remove token
      window.location.href = "/login"; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
