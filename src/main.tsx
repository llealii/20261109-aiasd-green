import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createIndexedDbTaskStore } from './taskStore';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App store={createIndexedDbTaskStore()} />
  </StrictMode>,
);
