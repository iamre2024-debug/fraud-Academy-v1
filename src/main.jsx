import React from 'react';
import { createRoot } from 'react-dom/client';
import VisualWorkspace from './VisualWorkspace.jsx';
import VisualNavigation from './VisualNavigation.jsx';
import './visualWorkspace.css';
import './visualPolish.css';
import './mobileViewportFix.css';
import './visualFunctional.css';
import './visualReviewFlow.css';
import './visualDesktopCommand.css';
import './visualNavPatch.css';
import './visualTextCollapse.css';
import './visualInvestigationRepair.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VisualWorkspace />
    <VisualNavigation />
  </React.StrictMode>,
);
