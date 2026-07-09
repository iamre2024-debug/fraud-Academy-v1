import React from 'react';
import { createRoot } from 'react-dom/client';
import VisualWorkspace from './VisualWorkspace.jsx';
import './visualWorkspace.css';
import './visualPolish.css';
import './mobileViewportFix.css';
import './visualFunctional.css';
import './visualReviewFlow.css';
import './visualDesktopCommand.css';
import './visualNavPatch.css';
import './visualTextCollapse.css';
import './visualNavPatch.js';
import './visualQaPatch.js';
import './visualTextCollapse.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VisualWorkspace />
  </React.StrictMode>
);
