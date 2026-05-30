import React from 'react';
console.log("User main.jsx executing...");
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store, persistor } from './store';
import App from './App.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <SplashScreen>
            <App />
          </SplashScreen>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
