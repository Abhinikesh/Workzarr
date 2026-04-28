import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'sonner';
import { store, persistor } from './store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            theme="system"
            toastOptions={{
              style: { borderRadius: '12px' },
            }}
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
