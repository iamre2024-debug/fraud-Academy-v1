import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AcademyProgress from './AcademyProgress.jsx';
import ScenarioEnginePanel from './ScenarioEnginePanel.jsx';
import './styles.css';
import './records.css';
import './case-summary.css';
import './lunaDebrief.css';
import './academyProgress.css';
import './scenarioEngine.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ScenarioEnginePanel />
    <AcademyProgress />
  </React.StrictMode>
);
