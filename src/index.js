import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import global_en from "./translations/en/global.json"
import global_tr from "./translations/tr/global.json"
import iI18Next from "i18next";
import './i18n';
import { ThemeProvider } from '@mui/material';
import theme from "./styles/theme.js"



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
     <React.StrictMode>
    <App />
  </React.StrictMode>
  </ThemeProvider>
 
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();