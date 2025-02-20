import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';
import { Provider } from 'react-redux'; // Import Redux Provider
import { store } from './Store/store.js'; // Import the Redux store
import App from './App.jsx';
import { FileProvider } from './Components/Context/FileProvider.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <FileProvider>
        <App />
      </FileProvider>
    </Provider>
  </StrictMode>
);
