import React from 'react';
import { createRoot } from 'react-dom/client';
import VisualWorkspace from './VisualWorkspace.jsx';
import './visualWorkspace.css';
import './visualPolish.css';
import './mobileViewportFix.css';
import './visualFunctional.css';
import './visualDesktopCommand.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VisualWorkspace />
  </React.StrictMode>
);
