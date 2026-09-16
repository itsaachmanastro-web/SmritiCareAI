import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { EconomyProvider } from './context/EconomyContext';
import { SpeechProvider } from './context/SpeechContext';
import { ThemeProvider } from './context/ThemeContext';
import { AssistantProvider } from './context/AssistantContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <EconomyProvider>
              <LanguageProvider>
                <SpeechProvider>
                  <AssistantProvider>
                    <App />
                  </AssistantProvider>
                </SpeechProvider>
              </LanguageProvider>
            </EconomyProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
