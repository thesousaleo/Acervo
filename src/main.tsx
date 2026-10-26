import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LibraryProvider } from './store/useLibrary';
import { initNative } from './services/platform';
import './index.css';
import './styles/liquid.css';

initNative();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LibraryProvider><App /></LibraryProvider>
  </React.StrictMode>
);
