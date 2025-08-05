import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('Main.jsx is executing');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

try {
  console.log('Attempting to render App component');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering the App:', error);
}
