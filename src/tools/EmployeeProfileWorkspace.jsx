import { useEffect, useMemo, useState } from 'react';
import { getEmployeeProfiles } from '../data/businessPayrollWorkspace.js';

export default function EmployeeProfileWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const records = useMemo(() => getEmployeeProfiles(activeCase), [activeCase]);
  const [selectedId, setSelectedId] = useState('');
  const activeRecord = records.find((record) => record.id === selectedId) ?? records[0];
  useEffect(() => setSelectedId(''), [activeCase.id]);

  return (
    <>
      <section className="employee-profile-summary" aria-label="Employee Profile summary">{[['Employee records', records.length], ['Employers', new Set(records.map((record) => record.employer)).size], ['Payroll links', records.reduce((count, record) => count + record.linkedPayroll.length, 0)], ['Active case', activeCase.id]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
      {activeRecord ? <div className="employee-profile-workspace">
        <section className="employee-profile-list" aria-label="Employee Profile records"><header><p>Employee records</p><h3>Choose an employee or contact</h3></header>{records.map((record) => <button key={record.id} type="button" className={record.id === activeRecord.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-employee-profile-record={record.id}><span>{record.id} | {record.status}</span><strong>{record.name}</strong><small>{record.role} | {record.employer}</small></button>)}</section>
        <section className="employee-profile-detail" aria-label="Employee Profile detail"><header><div><p>Employee profile</p><h3>{activeRecord.legalName ?? activeRecord.name}</h3><span>{activeRecord.position ?? activeRecord.role} | {activeRecord.employer}</span></div><button type="button" onClick={() => pin(`${activeRecord.id} | ${activeRecord.name}`)}>Pin employee</button></header><dl>{[
          ['Legal name', activeRecord.legalName ?? activeRecord.name],
          ['Date of birth', activeRecord.dateOfBirth],
          ['Training ID', activeRecord.trainingId],
          ['Current residential address', activeRecord.currentResidentialAddress],
          ['Previous residential address', activeRecord.previousResidentialAddress],
          ['Employee ID', activeRecord.id],
          ['Employer', activeRecord.employer],
          ['Department', activeRecord.department],
          ['Position', activeRecord.position ?? activeRecord.role],
          ['Manager', activeRecord.manager],
          ['Employment status', activeRecord.status],
          ['Work location', activeRecord.workLocation],
          ['Hire date', activeRecord.hireDate],
          ['Termination date', activeRecord.terminationDate],
          ['Pay schedule', activeRecord.paySchedule],
          ['Compensation type', activeRecord.compensationType ?? activeRecord.payType],
          ['Current rate or salary', activeRecord.currentRate],
          ['Rate history', activeRecord.rateHistory?.map((item) => `${item.effectiveDate}: ${item.value}`).join(' · ')],
          ['W-4 filing status', activeRecord.w4FilingStatus],
          ['W-4 multiple-jobs selection', activeRecord.w4MultipleJobsSelection],
          ['W-4 dependents', activeRecord.w4Dependents],
          ['W-4 other income', activeRecord.w4OtherIncome],
          ['W-4 deductions', activeRecord.w4Deductions],
          ['W-4 extra withholding', activeRecord.w4ExtraWithholding],
          ['Federal election', activeRecord.federalElection],
          ['State election', activeRecord.stateElection],
          ['Local election', activeRecord.localElection],
          ['Tax jurisdiction', activeRecord.taxJurisdiction],
          ['Tax exemption status', activeRecord.taxExemptionStatus],
          ['Tax effective date', activeRecord.taxEffectiveDate],
          ['Official contact / callback', activeRecord.officialContact],
          ['Payment-method context', activeRecord.directDeposit],
          ['Linked payroll records', activeRecord.linkedPayroll.join(' | ') || 'None recorded'],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Not supplied'}</dd></div>)}</dl><button type="button" onClick={() => saveNote(`Employee Profile: ${activeRecord.id} reviewed.`, 'Employee Profile')}>Save employee note</button></section>
        <aside className="employee-profile-evidence" aria-label="Employee payroll evidence"><header><p>Payroll connection</p><h3>Historical paychecks</h3></header><p>Open Payroll History to review the employee’s paycheck snapshots. Payment ownership and account standing remain available only after an exact Payment Verification search.</p><button type="button" onClick={() => openTool('Payroll History', 'investigate', { query: activeRecord.id })}>Open Payroll History</button><button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button></aside>
      </div> : <div className="investigation-tool-empty" role="status">No employee records are available for this case.</div>}
      <nav className="investigation-tool-next-routes" aria-label="Employee Profile next routes"><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Employee Profile review</strong><span>Review employee and employer facts, official contact details, and linked payroll context before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Employee Profile')}>{reviewed ? '✓ Employee Profile reviewed' : 'Mark Employee Profile reviewed'}</button></footer>
    </>
  );
}

