import React from 'react';
import { createRoot } from 'react-dom/client';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import VisualTextCollapse from './VisualTextCollapse.jsx';
import './visualWorkspace.css';
import './visualPolish.css';
import './mobileViewportFix.css';
import './visualFunctional.css';
import './visualReviewFlow.css';
import './visualDesktopCommand.css';
import './visualNavPatch.css';
import './visualTextCollapse.css';
import './visualQaPatch.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VisualWorkspace />
    <VisualNavigation />
    <VisualTextCollapse />
  </React.StrictMode>,
);
