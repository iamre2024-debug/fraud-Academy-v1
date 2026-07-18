import { useEffect, useMemo, useState } from 'react';
import DirectCollapsibleText from './DirectCollapsibleText.jsx';
import DocumentViewerWorkspace from './DocumentViewerWorkspace.jsx';
import MerchantIntelligenceWorkspace from './MerchantIntelligenceWorkspace.jsx';
import { accessReportExportText, generateAccessHistoryReport, generatedAccessReportTypes } from './data/accessHistoryReports.js';
import { buildCoreToolRecords } from './data/coreToolRecords.js';
import { getBusiness360Workspace, getEmployeeProfiles, getPayrollHistory, getTransactionHistory } from './data/businessPayrollWorkspace.js';
import { getDeviceProfiles } from './data/deviceRecords.js';
import { getFinancialRecords } from './data/caseToolData.js';
import { getCaseDocuments } from './data/documentRecords.js';
import { financialInvestigationTabs, financialRecordSearchText, getFinancialInvestigation } from './data/financialInvestigationRecords.js';
import { getIdentityIntelReport, matchesIdentityIntelSearch } from './data/identityIntelReport.js';
import { getLoginRecords } from './data/loginRecords.js';
import { getIpRecords } from './data/ipRecords.js';
import { getKybReview, kybRecordSearchText, kybReviewTabs, matchesKybReviewLookup } from './data/kybReviewRecords.js';
import { generateKybReviewReport, hasGeneratedKybReport, kybReportExportText } from './data/kybReviewReport.js';
import { getSessionRecords } from './data/sessionRecords.js';
import { workflows } from './visualWorkspaceModel.js';

const toolDetails = {
  'Identity Intel / People Search': {
    purpose: 'Search fictional identity records by Training ID or Name + DOB, review the match summary, then open the full profile report.',
    question: 'Does this identity history support who they claim to be?',
  },
  'Login History': {
    purpose: 'Review authentication attempts, results, methods, devices, locations, MFA, and session references without mixing in post-login activity or drawing an early conclusion.',
    question: 'Who logged in, when, and from where?',
  },
  'Session History': {
    purpose: 'Review recorded actions after authentication and connect each session to its login, profile activity, payment activity, and logout state without drawing an early conclusion.',
    question: 'After login, what did the user do?',
  },
  'Device Intelligence': {
    purpose: 'Compare fictional device identifiers, browsers, sessions, methods, locations, and network records.',
    question: 'Which devices appear in the case activity, and where do those devices repeat?',
  },
  'IP Intelligence': {
    purpose: 'Look up fictional network and location evidence, then compare it with recorded sessions and devices without drawing an early conclusion.',
    question: 'Where did the connection originate, and has it been seen elsewhere?',
  },
  'Transaction History': {
    purpose: 'Review the transaction records in scope before comparing them with other financial and customer evidence.',
    question: 'What transactions are in scope, and what details are recorded for each item?',
  },
  'Merchant Intelligence': {
    purpose: 'Review merchant identity, category, customer history, authorization, fulfillment, disputes, refunds, subscription or marketplace activity, and reason-code evidence in one claim-specific workspace.',
    question: 'Is this a customer issue, merchant issue, fraud issue, or dispute issue?',
  },
  'Financial Investigation': {
    purpose: 'Use a direct money command center to compare balances, deposits, spending, cash, digital payments, linked accounts, merchants, behavior, and funds flow.',
    question: 'Does the money make sense?',
  },
  'Payment Verification': {
    purpose: 'Search a fictional Bank Code, Destination ID, and owner name to return the recorded ownership and account-status response.',
    question: 'Do the submitted payment details match, and what account status did the source return?',
  },
  'Business 360': {
    purpose: 'Review the busin…94616 tokens truncated…800;
}

body[data-visual-tab="workspace"] .document-compare-grid dd {
  margin-top: 3px;
  color: #342a52;
  font-size: 0.68rem;
  font-weight: 680;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .document-compare-empty {
  margin: 0 12px;
  border: 1px dashed rgba(91, 62, 154, 0.2);
  border-radius: 12px;
  background: #faf8ff;
  padding: 16px;
  color: #6c6381;
  font-size: 0.72rem;
  line-height: 1.4;
  text-align: center;
}

@media (max-width: 1220px) {
  body[data-visual-tab="workspace"] .document-viewer-layout {
    grid-template-columns: minmax(210px, 0.56fr) minmax(0, 1.44fr);
  }

  body[data-visual-tab="workspace"] .document-inspector {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: none;
    gap: 8px;
  }

  body[data-visual-tab="workspace"] .document-inspector > section {
    border: 1px solid rgba(91, 62, 154, 0.1);
    border-radius: 12px;
    padding: 10px;
  }
}

@media (max-width: 820px) {
  body[data-visual-tab="workspace"] .document-account-lookup,
  body[data-visual-tab="workspace"] .document-viewer-findbar,
  body[data-visual-tab="workspace"] .document-viewer-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .document-viewer-findbar > span {
    white-space: normal;
  }

  body[data-visual-tab="workspace"] .document-record-browser {
    max-height: none;
  }

  body[data-visual-tab="workspace"] .document-record-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: none;
    overflow: visible;
  }

  body[data-visual-tab="workspace"] .document-inspector {
    grid-column: auto;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .document-page-stage {
    min-height: 560px;
    padding: 10px;
  }

  body[data-visual-tab="workspace"] .document-page {
    min-height: 700px;
    padding: 18px;
  }
}

@media (max-width: 560px) {
  body[data-visual-tab="workspace"] .document-record-list,
  body[data-visual-tab="workspace"] .document-inspector,
  body[data-visual-tab="workspace"] .document-compare-grid,
  body[data-visual-tab="workspace"] .document-compare-grid dl,
  body[data-visual-tab="workspace"] .document-page-section dl {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .document-preview-toolbar,
  body[data-visual-tab="workspace"] .document-page-controls {
    align-items: stretch;
    flex-direction: column;
  }

  body[data-visual-tab="workspace"] .document-toolbar-actions,
  body[data-visual-tab="workspace"] .document-page-controls > div {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .document-toolbar-actions button,
  body[data-visual-tab="workspace"] .document-page-controls button {
    width: 100%;
  }

  body[data-visual-tab="workspace"] .document-page {
    min-height: 620px;
    padding: 14px;
  }

  body[data-visual-tab="workspace"] .document-page-header,
  body[data-visual-tab="workspace"] .document-page-footer {
    display: grid;
  }

  body[data-visual-tab="workspace"] .document-identity-banner {
    grid-template-columns: 72px minmax(0, 1fr);
  }
}

@media (max-width: 350px) {
  body[data-visual-tab="workspace"] .investigation-tool-groups-theme-v1,
  body[data-visual-tab="workspace"] .investigation-tools-theme-v1 {
    padding: 11px;
  }

  body[data-visual-tab="workspace"] .investigation-tool-groups-theme-v1 .visual-category-row,
  body[data-visual-tab="workspace"] .investigation-tool-metrics {
    grid-template-columns: 1fr;
  }

  body[data-visual-tab="workspace"] .investigation-tool-flow span {
    width: 100%;
    text-align: center;
  }
}

body[data-visual-tab="workspace"] .document-request-findbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 0.8fr) auto;
  align-items: end;
  gap: 12px;
  border: 1px solid rgba(91, 62, 154, 0.12);
  border-radius: 16px;
  background: #faf8ff;
  padding: 13px;
}

body[data-visual-tab="workspace"] .document-request-findbar p,
body[data-visual-tab="workspace"] .document-request-list header p,
body[data-visual-tab="workspace"] .document-request-detail header p {
  color: #7551c8;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .document-request-findbar h3,
body[data-visual-tab="workspace"] .document-request-list h3,
body[data-visual-tab="workspace"] .document-request-detail h3 {
  margin-top: 4px;
  color: #21184a;
  font-size: 0.95rem;
  line-height: 1.3;
}

body[data-visual-tab="workspace"] .document-request-findbar label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .document-request-findbar label > span {
  color: #766d8e;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .document-request-findbar input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  color: #2b2350;
  font: 750 0.78rem/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .document-request-findbar > span {
  color: #756c8d;
  font-size: 0.7rem;
  font-weight: 750;
  white-space: nowrap;
}

body[data-visual-tab="workspace"] .document-request-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

body[data-visual-tab="workspace"] .document-request-statuses button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(91, 62, 154, 0.15);
  border-radius: 999px;
  background: #f8f5ff;
  padding: 7px 10px;
  color: #5b5274;
  font: 800 0.68rem/1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .document-request-statuses button strong {
  display: grid;
  min-width: 18px;
  min-height: 18px;
  place-items: center;
  border-radius: 999px;
  background: #eee6ff;
  color: #6540b2;
  font-size: 0.64rem;
}

body[data-visual-tab="workspace"] .document-request-statuses button.active,
body[data-visual-tab="workspace"] .document-request-statuses button:hover,
body[data-visual-tab="workspace"] .document-request-statuses button:focus-visible {
  border-color: #7551c8;
  background: #eee6ff;
  color: #4f2f9d;
  outline: none;
}

body[data-visual-tab="workspace"] .document-request-workspace {
  display: grid;
  grid-template-columns: minmax(230px, 0.72fr) minmax(0, 1.28fr);
  gap: 12px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .document-request-list,
body[data-visual-tab="workspace"] .document-request-detail,
body[data-visual-tab="workspace"] .document-request-summary article {
  min-width: 0;
  border: 1px solid rgba(91, 62, 154, 0.12);
  border-radius: 16px;
  background: #fff;
  padding: 13px;
}

body[data-visual-tab="workspace"] .document-request-list {
  display: grid;
  align-content: start;
  gap: 8px;
}

body[data-visual-tab="workspace"] .document-request-list > button {
  display: grid;
  gap: 4px;
  min-width: 0;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 12px;
  background: #faf8ff;
  padding: 10px;
  color: #342758;
  text-align: left;
}

body[data-visual-tab="workspace"] .document-request-list > button.active {
  border-color: rgba(117, 81, 200, 0.48);
  background: #f1ebff;
}

body[data-visual-tab="workspace"] .document-request-list > button span {
  color: #7551c8;
  font-size: 0.64rem;
  font-weight: 850;
}

body[data-visual-tab="workspace"] .document-request-list > button strong {
  color: #29204f;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .document-request-list > button small,
body[data-visual-tab="workspace"] .document-request-detail header span {
  color: #756c8d;
  font-size: 0.67rem;
  font-weight: 750;
}

body[data-visual-tab="workspace"] .document-request-detail {
  display: grid;
  gap: 12px;
}

body[data-visual-tab="workspace"] .document-request-detail header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

body[data-visual-tab="workspace"] .document-request-detail header > button,
body[data-visual-tab="workspace"] .document-request-actions button {
  min-height: 42px;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 12px;
  background: #f7f3ff;
  padding: 9px 12px;
  color: #51496d;
  font: 800 0.74rem/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .document-request-detail dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .document-request-detail dl > div {
  min-width: 0;
  border-radius: 11px;
  background: #faf8ff;
  padding: 9px;
}

body[data-visual-tab="workspace"] .document-request-detail dt,
body[data-visual-tab="workspace"] .document-request-notes > span {
  color: #7a7094;
  font-size: 0.64rem;
  font-weight: 850;
}

body[data-visual-tab="workspace"] .document-request-detail dd,
body[data-visual-tab="workspace"] .document-request-notes p,
body[data-visual-tab="workspace"] .document-request-notes small {
  margin-top: 4px;
  color: #30264f;
  font-size: 0.75rem;
  font-weight: 720;
  line-height: 1.42;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .document-request-notes {
  border-left: 3px solid #7551c8;
  border-radius: 10px;
  background: #f7f3ff;
  padding: 11px 12px;
}

body[data-visual-tab="workspace"] .document-request-notes small {
  display: block;
  color: #6d6486;
  font-weight: 650;
}

body[data-visual-tab="workspace"] .document-request-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

body[data-visual-tab="workspace"] .document-request-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .document-request-summary article {
  display: grid;
  gap: 4px;
}

body[data-visual-tab="workspace"] .document-request-summary span {
  color: #756c8d;
  font-size: 0.66rem;
  font-weight: 800;
}

body[data-visual-tab="workspace"] .document-request-summary strong {
  color: #4f2f9d;
  font-size: 1rem;
}

@media (max-width: 960px) {
  body[data-visual-tab="workspace"] .document-request-findbar,
  body[data-visual-tab="workspace"] .document-request-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  body[data-visual-tab="workspace"] .document-request-findbar > span {
    white-space: normal;
  }

  body[data-visual-tab="workspace"] .document-request-detail dl,
  body[data-visual-tab="workspace"] .document-request-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 430px) {
  body[data-visual-tab="workspace"] .document-request-detail header,
  body[data-visual-tab="workspace"] .document-request-detail dl,
  body[data-visual-tab="workspace"] .document-request-summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
}

body[data-visual-tab="workspace"] .identity-intel-search {
  display: grid;
  grid-template-columns: minmax(230px, 0.72fr) minmax(380px, 1.28fr) auto;
  align-items: end;
  gap: 12px;
  border: 1px solid rgba(91, 62, 154, 0.14);
  border-radius: 16px;
  background: #faf8ff;
  padding: 14px;
}

body[data-visual-tab="workspace"] .identity-intel-search p,
body[data-visual-tab="workspace"] .identity-intel-summary header p,
body[data-visual-tab="workspace"] .identity-intel-sections header p,
body[data-visual-tab="workspace"] .identity-intel-report header p,
body[data-visual-tab="workspace"] .identity-intel-evidence header p {
  color: #7551c8;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .identity-intel-search h3,
body[data-visual-tab="workspace"] .identity-intel-summary h3,
body[data-visual-tab="workspace"] .identity-intel-sections h3,
body[data-visual-tab="workspace"] .identity-intel-report h3,
body[data-visual-tab="workspace"] .identity-intel-evidence h3 {
  margin-top: 4px;
  color: #21184a;
  font-size: 0.96rem;
  line-height: 1.3;
}

body[data-visual-tab="workspace"] .identity-intel-search > div > span,
body[data-visual-tab="workspace"] .identity-intel-summary header span {
  display: block;
  margin-top: 5px;
  color: #756c8d;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.35;
}

body[data-visual-tab="workspace"] .identity-intel-search label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .identity-intel-search-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 8px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .identity-intel-search label > span {
  color: #766d8e;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .identity-intel-search input,
body[data-visual-tab="workspace"] .identity-intel-search select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  color: #2b2350;
  font: 750 0.78rem/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .identity-intel-summary-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

body[data-visual-tab="workspace"] .identity-intel-search > button,
body[data-visual-tab="workspace"] .identity-intel-summary header button,
body[data-visual-tab="workspace"] .identity-intel-report header button,
body[data-visual-tab="workspace"] .identity-intel-evidence > button,
body[data-visual-tab="workspace"] .identity-intel-evidence article button {
  min-height: 42px;
  border: 1px solid rgba(91, 62, 154, 0.2);
  border-radius: 12px;
  background: #f1ebff;
  padding: 9px 12px;
  color: #513196;
  font: 800 0.74rem/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .identity-intel-search > button:disabled {
  cursor: not-allowed;
  opacity: 0.54;
}

body[data-visual-tab="workspace"] .identity-intel-gate {
  display: grid;
  gap: 5px;
  border: 1px dashed rgba(117, 81, 200, 0.42);
  border-radius: 15px;
  background: #f8f5ff;
  padding: 14px;
}

body[data-visual-tab="workspace"] .identity-intel-gate strong {
  color: #39246e;
  font-size: 0.84rem;
}

body[data-visual-tab="workspace"] .identity-intel-gate span {
  color: #726887;
  font-size: 0.73rem;
  line-height: 1.4;
}

body[data-visual-tab="workspace"] .identity-intel-summary,
body[data-visual-tab="workspace"] .identity-intel-sections,
body[data-visual-tab="workspace"] .identity-intel-report,
body[data-visual-tab="workspace"] .identity-intel-evidence,
body[data-visual-tab="workspace"] .identity-intel-counts article {
  min-width: 0;
  border: 1px solid rgba(91, 62, 154, 0.12);
  border-radius: 16px;
  background: #fff;
  padding: 13px;
}

body[data-visual-tab="workspace"] .identity-intel-summary {
  display: grid;
  gap: 12px;
}

body[data-visual-tab="workspace"] .identity-intel-summary header,
body[data-visual-tab="workspace"] .identity-intel-report header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

body[data-visual-tab="workspace"] .identity-intel-summary dl {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .identity-intel-summary dl > div,
body[data-visual-tab="workspace"] .identity-intel-report dl > div {
  min-width: 0;
  border-radius: 11px;
  background: #faf8ff;
  padding: 9px;
}

body[data-visual-tab="workspace"] .identity-intel-summary dt,
body[data-visual-tab="workspace"] .identity-intel-report dt {
  color: #7a7094;
  font-size: 0.63rem;
  font-weight: 850;
}

body[data-visual-tab="workspace"] .identity-intel-summary dd,
body[data-visual-tab="workspace"] .identity-intel-report dd {
  margin-top: 4px;
  color: #30264f;
  font-size: 0.74rem;
  font-weight: 720;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .identity-intel-counts {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .identity-intel-counts article {
  display: grid;
  gap: 4px;
  padding: 10px;
}

body[data-visual-tab="workspace"] .identity-intel-counts strong {
  color: #55369d;
  font-size: 1.04rem;
}

body[data-visual-tab="workspace"] .identity-intel-counts span {
  color: #716783;
  font-size: 0.66rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .identity-intel-workspace {
  display: grid;
  grid-template-columns: minmax(175px, 0.62fr) minmax(0, 1.32fr) minmax(210px, 0.78fr);
  align-items: start;
  gap: 12px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .identity-intel-sections {
  display: grid;
  align-content: start;
  gap: 7px;
}

body[data-visual-tab="workspace"] .identity-intel-sections > button {
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 10px;
  background: #faf8ff;
  padding: 9px 10px;
  color: #443768;
  font: 780 0.71rem/1.25 Inter, ui-sans-serif, system-ui, sans-serif;
  text-align: left;
}

body[data-visual-tab="workspace"] .identity-intel-sections > button.active,
body[data-visual-tab="workspace"] .identity-intel-sections > button:hover,
body[data-visual-tab="workspace"] .identity-intel-sections > button:focus-visible {
  border-color: rgba(117, 81, 200, 0.5);
  background: #f0e9ff;
  color: #4f2f9d;
  outline: none;
}

body[data-visual-tab="workspace"] .identity-intel-report {
  display: grid;
  gap: 12px;
}

body[data-visual-tab="workspace"] .identity-intel-report dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .identity-intel-evidence {
  display: grid;
  align-content: start;
  gap: 9px;
}

body[data-visual-tab="workspace"] .identity-intel-evidence > div {
  display: grid;
  gap: 7px;
}

body[data-visual-tab="workspace"] .identity-intel-search-history,
body[data-visual-tab="workspace"] .identity-intel-source-records {
  display: grid;
  gap: 7px;
}

body[data-visual-tab="workspace"] .identity-intel-search-history > span {
  display: grid;
  gap: 3px;
  border-radius: 10px;
  background: #f1ebff;
  padding: 8px;
  color: #564a72;
  font-size: 0.66rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .identity-intel-search-history strong {
  color: #6847b4;
  font-size: 0.59rem;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .identity-intel-source-records article {
  display: grid;
  gap: 4px;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 11px;
  background: #faf8ff;
  padding: 9px;
}

body[data-visual-tab="workspace"] .identity-intel-source-records article span,
body[data-visual-tab="workspace"] .identity-intel-source-records article small {
  color: #756c8d;
  font-size: 0.62rem;
  line-height: 1.35;
}

body[data-visual-tab="workspace"] .identity-intel-source-records article strong {
  color: #342758;
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .identity-intel-source-records article button {
  min-height: 30px;
  justify-self: start;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 9px;
  background: #f1ebff;
  padding: 5px 8px;
  color: #513196;
  font: 800 0.65rem/1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .identity-intel-section-buttons button {
  min-height: 0;
  display: grid;
  gap: 3px;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 10px;
  background: #faf8ff;
  padding: 9px 10px;
  color: #443768;
  text-align: left;
}

body[data-visual-tab="workspace"] .identity-intel-section-buttons button strong {
  font: 780 0.7rem/1.25 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .identity-intel-section-buttons button span {
  color: #7a7094;
  font-size: 0.6rem;
  font-weight: 750;
}

body[data-visual-tab="workspace"] .identity-intel-section-buttons button.active,
body[data-visual-tab="workspace"] .identity-intel-section-buttons button:hover,
body[data-visual-tab="workspace"] .identity-intel-section-buttons button:focus-visible {
  border-color: rgba(117, 81, 200, 0.5);
  background: #f0e9ff;
  color: #4f2f9d;
  outline: none;
}

body[data-visual-tab="workspace"] .identity-intel-evidence article {
  display: grid;
  gap: 4px;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 11px;
  background: #faf8ff;
  padding: 9px;
}

body[data-visual-tab="workspace"] .identity-intel-evidence article span {
  color: #7551c8;
  font-size: 0.62rem;
  font-weight: 850;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .identity-intel-evidence article strong {
  color: #342758;
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .identity-intel-evidence article small {
  color: #756c8d;
  font-size: 0.65rem;
  line-height: 1.35;
}

body[data-visual-tab="workspace"] .identity-intel-evidence article button {
  min-height: 30px;
  justify-self: start;
  border-radius: 9px;
  padding: 5px 8px;
  font-size: 0.66rem;
}

@media (max-width: 1100px) {
  body[data-visual-tab="workspace"] .identity-intel-summary dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .identity-intel-workspace {
    grid-template-columns: minmax(180px, 0.66fr) minmax(0, 1.34fr);
  }

  body[data-visual-tab="workspace"] .identity-intel-evidence {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .identity-intel-evidence > div {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  body[data-visual-tab="workspace"] .identity-intel-search,
  body[data-visual-tab="workspace"] .identity-intel-search-fields,
  body[data-visual-tab="workspace"] .identity-intel-workspace,
  body[data-visual-tab="workspace"] .identity-intel-evidence {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .identity-intel-summary dl,
  body[data-visual-tab="workspace"] .identity-intel-counts,
  body[data-visual-tab="workspace"] .identity-intel-evidence > div {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .identity-intel-evidence {
    grid-column: auto;
  }
}

@media (max-width: 430px) {
  body[data-visual-tab="workspace"] .identity-intel-summary header,
  body[data-visual-tab="workspace"] .identity-intel-report header {
    display: grid;
  }

  body[data-visual-tab="workspace"] .identity-intel-summary dl,
  body[data-visual-tab="workspace"] .identity-intel-counts,
  body[data-visual-tab="workspace"] .identity-intel-report dl,
  body[data-visual-tab="workspace"] .identity-intel-evidence > div {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .identity-intel-summary-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
}

body[data-visual-tab="workspace"] .transaction-history-findbar,
body[data-visual-tab="workspace"] .payroll-history-findbar {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) repeat(3, minmax(150px, 0.6fr));
  align-items: end;
  gap: 10px;
  border: 1px solid rgba(91, 62, 154, 0.14);
  border-radius: 16px;
  background: #faf8ff;
  padding: 13px;
}

body[data-visual-tab="workspace"] .payroll-history-findbar {
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.54fr) auto;
}

body[data-visual-tab="workspace"] .transaction-history-findbar p,
body[data-visual-tab="workspace"] .payroll-history-findbar p,
body[data-visual-tab="workspace"] .transaction-history-list header p,
body[data-visual-tab="workspace"] .transaction-history-detail header p,
body[data-visual-tab="workspace"] .transaction-history-evidence header p,
body[data-visual-tab="workspace"] .business-360-profile header p,
body[data-visual-tab="workspace"] .business-360-relationships header p,
body[data-visual-tab="workspace"] .business-360-detail header p,
body[data-visual-tab="workspace"] .business-360-evidence header p,
body[data-visual-tab="workspace"] .employee-profile-list header p,
body[data-visual-tab="workspace"] .employee-profile-detail header p,
body[data-visual-tab="workspace"] .employee-profile-evidence header p,
body[data-visual-tab="workspace"] .payroll-history-list header p,
body[data-visual-tab="workspace"] .payroll-history-detail header p,
body[data-visual-tab="workspace"] .payroll-history-controls header p {
  color: #7551c8;
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .transaction-history-findbar h3,
body[data-visual-tab="workspace"] .payroll-history-findbar h3,
body[data-visual-tab="workspace"] .transaction-history-list h3,
body[data-visual-tab="workspace"] .transaction-history-detail h3,
body[data-visual-tab="workspace"] .transaction-history-evidence h3,
body[data-visual-tab="workspace"] .business-360-profile h3,
body[data-visual-tab="workspace"] .business-360-relationships h3,
body[data-visual-tab="workspace"] .business-360-detail h3,
body[data-visual-tab="workspace"] .business-360-evidence h3,
body[data-visual-tab="workspace"] .employee-profile-list h3,
body[data-visual-tab="workspace"] .employee-profile-detail h3,
body[data-visual-tab="workspace"] .employee-profile-evidence h3,
body[data-visual-tab="workspace"] .payroll-history-list h3,
body[data-visual-tab="workspace"] .payroll-history-detail h3,
body[data-visual-tab="workspace"] .payroll-history-controls h3 {
  margin-top: 4px;
  color: #21184a;
  font-size: 0.94rem;
  line-height: 1.3;
}

body[data-visual-tab="workspace"] .transaction-history-findbar label,
body[data-visual-tab="workspace"] .payroll-history-findbar label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .transaction-history-findbar label > span,
body[data-visual-tab="workspace"] .payroll-history-findbar label > span {
  color: #766d8e;
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

body[data-visual-tab="workspace"] .transaction-history-findbar input,
body[data-visual-tab="workspace"] .transaction-history-filter-row select,
body[data-visual-tab="workspace"] .payroll-history-findbar select {
  width: 100%;
  min-width: 0;
  min-height: 41px;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 11px;
  background: #fff;
  padding: 8px 10px;
  color: #2b2350;
  font: 750 0.74rem/1.2 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .payroll-history-findbar > span,
body[data-visual-tab="workspace"] .transaction-history-filter-row > span {
  color: #756c8d;
  font-size: 0.7rem;
  font-weight: 750;
}

body[data-visual-tab="workspace"] .transaction-history-filter-row,
body[data-visual-tab="workspace"] .transaction-history-account-rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

body[data-visual-tab="workspace"] .transaction-history-filter-row {
  border-bottom: 1px solid rgba(91, 62, 154, 0.1);
  padding: 2px 0 12px;
}

body[data-visual-tab="workspace"] .transaction-history-filter-row select {
  width: auto;
  min-width: 175px;
}

body[data-visual-tab="workspace"] .transaction-history-account-rail button {
  min-height: 36px;
  border: 1px solid rgba(91, 62, 154, 0.14);
  border-radius: 999px;
  background: #f8f5ff;
  padding: 7px 11px;
  color: #5c5276;
  font: 800 0.68rem/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .transaction-history-account-rail button.active,
body[data-visual-tab="workspace"] .transaction-history-account-rail button:hover,
body[data-visual-tab="workspace"] .transaction-history-account-rail button:focus-visible {
  border-color: #7551c8;
  background: #eee6ff;
  color: #4f2f9d;
  outline: none;
}

body[data-visual-tab="workspace"] .transaction-history-summary,
body[data-visual-tab="workspace"] .employee-profile-summary,
body[data-visual-tab="workspace"] .payroll-history-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .transaction-history-summary article,
body[data-visual-tab="workspace"] .employee-profile-summary article,
body[data-visual-tab="workspace"] .payroll-history-summary article,
body[data-visual-tab="workspace"] .transaction-history-list,
body[data-visual-tab="workspace"] .transaction-history-detail,
body[data-visual-tab="workspace"] .transaction-history-evidence,
body[data-visual-tab="workspace"] .business-360-profile,
body[data-visual-tab="workspace"] .business-360-relationships,
body[data-visual-tab="workspace"] .business-360-detail,
body[data-visual-tab="workspace"] .business-360-evidence,
body[data-visual-tab="workspace"] .employee-profile-list,
body[data-visual-tab="workspace"] .employee-profile-detail,
body[data-visual-tab="workspace"] .employee-profile-evidence,
body[data-visual-tab="workspace"] .payroll-history-list,
body[data-visual-tab="workspace"] .payroll-history-detail,
body[data-visual-tab="workspace"] .payroll-history-controls {
  min-width: 0;
  border: 1px solid rgba(91, 62, 154, 0.12);
  border-radius: 16px;
  background: #fff;
  padding: 13px;
}

body[data-visual-tab="workspace"] .transaction-history-summary article,
body[data-visual-tab="workspace"] .employee-profile-summary article,
body[data-visual-tab="workspace"] .payroll-history-summary article {
  display: grid;
  gap: 4px;
}

body[data-visual-tab="workspace"] .transaction-history-summary span,
body[data-visual-tab="workspace"] .employee-profile-summary span,
body[data-visual-tab="workspace"] .payroll-history-summary span {
  color: #756c8d;
  font-size: 0.65rem;
  font-weight: 800;
}

body[data-visual-tab="workspace"] .transaction-history-summary strong,
body[data-visual-tab="workspace"] .employee-profile-summary strong,
body[data-visual-tab="workspace"] .payroll-history-summary strong {
  color: #4f2f9d;
  font-size: 0.96rem;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .transaction-history-workspace,
body[data-visual-tab="workspace"] .business-360-workspace,
body[data-visual-tab="workspace"] .employee-profile-workspace,
body[data-visual-tab="workspace"] .payroll-history-workspace {
  display: grid;
  grid-template-columns: minmax(200px, 0.7fr) minmax(0, 1.25fr) minmax(200px, 0.75fr);
  align-items: start;
  gap: 12px;
  min-width: 0;
}

body[data-visual-tab="workspace"] .transaction-history-list,
body[data-visual-tab="workspace"] .business-360-relationships,
body[data-visual-tab="workspace"] .employee-profile-list,
body[data-visual-tab="workspace"] .payroll-history-list {
  display: grid;
  align-content: start;
  gap: 8px;
}

body[data-visual-tab="workspace"] .transaction-history-list > button,
body[data-visual-tab="workspace"] .business-360-relationships > button,
body[data-visual-tab="workspace"] .employee-profile-list > button,
body[data-visual-tab="workspace"] .payroll-history-list > button {
  display: grid;
  gap: 4px;
  min-width: 0;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 11px;
  background: #faf8ff;
  padding: 9px;
  color: #342758;
  text-align: left;
}

body[data-visual-tab="workspace"] .transaction-history-list > button.active,
body[data-visual-tab="workspace"] .business-360-relationships > button.active,
body[data-visual-tab="workspace"] .employee-profile-list > button.active,
body[data-visual-tab="workspace"] .payroll-history-list > button.active {
  border-color: rgba(117, 81, 200, 0.5);
  background: #f0e9ff;
}

body[data-visual-tab="workspace"] .transaction-history-list > button span,
body[data-visual-tab="workspace"] .business-360-relationships > button span,
body[data-visual-tab="workspace"] .employee-profile-list > button span,
body[data-visual-tab="workspace"] .payroll-history-list > button span {
  color: #7551c8;
  font-size: 0.62rem;
  font-weight: 850;
}

body[data-visual-tab="workspace"] .transaction-history-list > button strong,
body[data-visual-tab="workspace"] .business-360-relationships > button strong,
body[data-visual-tab="workspace"] .employee-profile-list > button strong,
body[data-visual-tab="workspace"] .payroll-history-list > button strong {
  color: #29204f;
  font-size: 0.77rem;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .transaction-history-list > button small,
body[data-visual-tab="workspace"] .business-360-relationships > button small,
body[data-visual-tab="workspace"] .employee-profile-list > button small,
body[data-visual-tab="workspace"] .payroll-history-list > button small,
body[data-visual-tab="workspace"] .transaction-history-detail header span,
body[data-visual-tab="workspace"] .business-360-detail header span,
body[data-visual-tab="workspace"] .employee-profile-detail header span,
body[data-visual-tab="workspace"] .payroll-history-detail header span {
  color: #756c8d;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.35;
}

body[data-visual-tab="workspace"] .transaction-history-detail,
body[data-visual-tab="workspace"] .business-360-detail,
body[data-visual-tab="workspace"] .employee-profile-detail,
body[data-visual-tab="workspace"] .payroll-history-detail,
body[data-visual-tab="workspace"] .business-360-evidence,
body[data-visual-tab="workspace"] .employee-profile-evidence,
body[data-visual-tab="workspace"] .payroll-history-controls,
body[data-visual-tab="workspace"] .transaction-history-evidence,
body[data-visual-tab="workspace"] .business-360-profile {
  display: grid;
  gap: 11px;
}

body[data-visual-tab="workspace"] .transaction-history-detail header,
body[data-visual-tab="workspace"] .business-360-profile header,
body[data-visual-tab="workspace"] .business-360-detail header,
body[data-visual-tab="workspace"] .employee-profile-detail header,
body[data-visual-tab="workspace"] .payroll-history-detail header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

body[data-visual-tab="workspace"] .transaction-history-detail header button,
body[data-visual-tab="workspace"] .business-360-profile header button,
body[data-visual-tab="workspace"] .business-360-detail header button,
body[data-visual-tab="workspace"] .employee-profile-detail header button,
body[data-visual-tab="workspace"] .payroll-history-detail header button,
body[data-visual-tab="workspace"] .transaction-history-actions button,
body[data-visual-tab="workspace"] .transaction-history-evidence > button,
body[data-visual-tab="workspace"] .business-360-detail > button,
body[data-visual-tab="workspace"] .business-360-evidence > button,
body[data-visual-tab="workspace"] .employee-profile-detail > button,
body[data-visual-tab="workspace"] .employee-profile-evidence > button,
body[data-visual-tab="workspace"] .payroll-history-detail > button,
body[data-visual-tab="workspace"] .payroll-history-controls > button {
  min-height: 38px;
  border: 1px solid rgba(91, 62, 154, 0.18);
  border-radius: 11px;
  background: #f7f3ff;
  padding: 8px 10px;
  color: #51496d;
  font: 800 0.71rem/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
}

body[data-visual-tab="workspace"] .transaction-history-detail dl,
body[data-visual-tab="workspace"] .business-360-profile dl,
body[data-visual-tab="workspace"] .business-360-detail dl,
body[data-visual-tab="workspace"] .employee-profile-detail dl,
body[data-visual-tab="workspace"] .payroll-history-detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

body[data-visual-tab="workspace"] .transaction-history-detail dl > div,
body[data-visual-tab="workspace"] .business-360-profile dl > div,
body[data-visual-tab="workspace"] .business-360-detail dl > div,
body[data-visual-tab="workspace"] .employee-profile-detail dl > div,
body[data-visual-tab="workspace"] .payroll-history-detail dl > div {
  min-width: 0;
  border-radius: 10px;
  background: #faf8ff;
  padding: 8px;
}

body[data-visual-tab="workspace"] .transaction-history-detail dt,
body[data-visual-tab="workspace"] .business-360-profile dt,
body[data-visual-tab="workspace"] .business-360-detail dt,
body[data-visual-tab="workspace"] .employee-profile-detail dt,
body[data-visual-tab="workspace"] .payroll-history-detail dt,
body[data-visual-tab="workspace"] .transaction-history-context span,
body[data-visual-tab="workspace"] .transaction-history-evidence article span,
body[data-visual-tab="workspace"] .business-360-evidence article span {
  color: #7a7094;
  font-size: 0.62rem;
  font-weight: 850;
}

body[data-visual-tab="workspace"] .transaction-history-detail dd,
body[data-visual-tab="workspace"] .business-360-profile dd,
body[data-visual-tab="workspace"] .business-360-detail dd,
body[data-visual-tab="workspace"] .employee-profile-detail dd,
body[data-visual-tab="workspace"] .payroll-history-detail dd,
body[data-visual-tab="workspace"] .transaction-history-context p,
body[data-visual-tab="workspace"] .employee-profile-evidence p,
body[data-visual-tab="workspace"] .payroll-history-controls p {
  margin-top: 4px;
  color: #30264f;
  font-size: 0.73rem;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .transaction-history-context {
  border-left: 3px solid #7551c8;
  border-radius: 10px;
  background: #f7f3ff;
  padding: 10px 11px;
}

body[data-visual-tab="workspace"] .transaction-history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

body[data-visual-tab="workspace"] .transaction-history-evidence article,
body[data-visual-tab="workspace"] .business-360-evidence article {
  display: grid;
  gap: 4px;
  border: 1px solid rgba(91, 62, 154, 0.1);
  border-radius: 10px;
  background: #faf8ff;
  padding: 9px;
}

body[data-visual-tab="workspace"] .transaction-history-evidence article strong,
body[data-visual-tab="workspace"] .business-360-evidence article strong {
  color: #342758;
  font-size: 0.73rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

body[data-visual-tab="workspace"] .business-360-profile dl {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

body[data-visual-tab="workspace"] .business-360-evidence article small {
  color: #756c8d;
  font-size: 0.64rem;
}

@media (max-width: 1100px) {
  body[data-visual-tab="workspace"] .transaction-history-workspace,
  body[data-visual-tab="workspace"] .business-360-workspace,
  body[data-visual-tab="workspace"] .employee-profile-workspace,
  body[data-visual-tab="workspace"] .payroll-history-workspace {
    grid-template-columns: minmax(200px, 0.72fr) minmax(0, 1.28fr);
  }

  body[data-visual-tab="workspace"] .transaction-history-evidence,
  body[data-visual-tab="workspace"] .business-360-evidence,
  body[data-visual-tab="workspace"] .employee-profile-evidence,
  body[data-visual-tab="workspace"] .payroll-history-controls {
    grid-column: 1 / -1;
  }

  body[data-visual-tab="workspace"] .business-360-profile dl {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  body[data-visual-tab="workspace"] .transaction-history-findbar,
  body[data-visual-tab="workspace"] .payroll-history-findbar,
  body[data-visual-tab="workspace"] .transaction-history-workspace,
  body[data-visual-tab="workspace"] .business-360-workspace,
  body[data-visual-tab="workspace"] .employee-profile-workspace,
  body[data-visual-tab="workspace"] .payroll-history-workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .transaction-history-summary,
  body[data-visual-tab="workspace"] .employee-profile-summary,
  body[data-visual-tab="workspace"] .payroll-history-summary,
  body[data-visual-tab="workspace"] .business-360-profile dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  body[data-visual-tab="workspace"] .transaction-history-evidence,
  body[data-visual-tab="workspace"] .business-360-evidence,
  body[data-visual-tab="workspace"] .employee-profile-evidence,
  body[data-visual-tab="workspace"] .payroll-history-controls {
    grid-column: auto;
  }
}

@media (max-width: 430px) {
  body[data-visual-tab="workspace"] .transaction-history-summary,
  body[data-visual-tab="workspace"] .employee-profile-summary,
  body[data-visual-tab="workspace"] .payroll-history-summary,
  body[data-visual-tab="workspace"] .business-360-profile dl,
  body[data-visual-tab="workspace"] .transaction-history-detail dl,
  body[data-visual-tab="workspace"] .business-360-detail dl,
  body[data-visual-tab="workspace"] .employee-profile-detail dl,
  body[data-visual-tab="workspace"] .payroll-history-detail dl {
    grid-template-columns: minmax(0, 1fr);
  }

  body[data-visual-tab="workspace"] .transaction-history-detail header,
  body[data-visual-tab="workspace"] .business-360-profile header,
  body[data-visual-tab="workspace"] .business-360-detail header,
  body[data-visual-tab="workspace"] .employee-profile-detail header,
  body[data-visual-tab="workspace"] .payroll-history-detail header {
    display: grid;
  }
}
