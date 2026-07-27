import { useEffect, useMemo, useState } from 'react';
import {
  employeePayrollHistory,
  findPayrollRecord,
  getPayrollHistory,
} from '../data/businessPayrollWorkspace.js';
import { buildPaymentLookupHint } from '../data/paymentVerification.js';
import {
  normalizePayrollInvestigationState,
  recordTrustedBusinessResponse,
  visiblePayrollEmailEvidence,
} from '../data/payrollInvestigation.js';

function payrollMoney(value) {
  return Number(value ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function PayrollTrustedContactWorkflow({
  activeCase,
  payrollInvestigation,
  setPayrollInvestigationsByCase,
  saveNote,
  recordAction,
}) {
  const {
    trustedContactStarted,
    requestMethod,
    businessStatement,
    emailEvidenceProvided,
    businessResponseSaved,
  } = normalizePayrollInvestigationState(payrollInvestigation);
  const businessResponse = trustedContactStarted ? recordTrustedBusinessResponse({
    requestMethod,
    businessStatement,
    emailEvidence: emailEvidenceProvided ? {
      headerFrom: 'employee-name@training-mail.example.test',
      headerReplyTo: 'alternate-contact@training-mail.example.test',
      received: activeCase.reportedDate ?? activeCase.opened,
      mailboxNote: 'Business supplied a fictional message record after trusted contact; compare the sender, reply-to, and timing.',
    } : null,
  }) : null;
  const visibleEmailEvidence = visiblePayrollEmailEvidence(businessResponse);

  function updatePayrollInvestigation(patch) {
    setPayrollInvestigationsByCase((current) => ({
      ...current,
      [activeCase.id]: {
        ...normalizePayrollInvestigationState(current[activeCase.id]),
        ...patch,
      },
    }));
  }

  function saveBusinessResponse() {
    if (requestMethod === 'Not yet recorded') return;
    updatePayrollInvestigation({ businessResponseSaved: true });
    saveNote(`Trusted business contact: the business says the payroll change was requested by ${requestMethod}. ${businessStatement}`.trim(), 'Payroll trusted contact');
    recordAction?.('Recorded trusted business response', `Request method recorded as ${requestMethod}.`, 'Payroll History');
  }

  if (activeCase.workflowType !== 'payroll-change-alert') return null;

  return (
    <section className="payroll-trusted-contact-flow" aria-label="Payroll change trusted contact workflow">
      <header><div><p>Request source at intake</p><h3>Unknown at intake</h3><span>The platform observed the employee, destination, amount, timing, or administrator change. It did not observe how a person requested it.</span></div></header>
      <ol>
        <li>Review the business, employee, payroll, destination, administrator, and timing records.</li>
        <li>If risk remains, contact the business using a trusted, previously known method.</li>
        <li>Record how the business says the change was requested.</li>
      </ol>
      {!trustedContactStarted ? (
        <button type="button" onClick={() => { updatePayrollInvestigation({ trustedContactStarted: true }); recordAction?.('Started trusted business contact', 'Opened the payroll-change trusted contact record.', 'Payroll History'); }}>Record trusted business contact</button>
      ) : (
        <div className="payroll-business-response">
          <label><span>Business-reported request method</span><select value={requestMethod} onChange={(event) => updatePayrollInvestigation({ requestMethod: event.target.value, emailEvidenceProvided: false, businessResponseSaved: false })}>
            <option>Not yet recorded</option>
            <option>Phone</option>
            <option>Payroll portal</option>
            <option>Email</option>
            <option>Other business channel</option>
          </select></label>
          <label><span>Business statement</span><textarea value={businessStatement} onChange={(event) => updatePayrollInvestigation({ businessStatement: event.target.value, businessResponseSaved: false })} placeholder="Record only what the trusted business contact states." /></label>
          <button type="button" disabled={requestMethod === 'Not yet recorded'} onClick={saveBusinessResponse}>{businessResponseSaved ? 'Business response saved' : 'Save business response'}</button>
          {requestMethod === 'Email' && (
            <section className="payroll-email-followup">
              <strong>Employee verification step</strong>
              <p>{businessResponse.employeeCallbackInstruction}</p>
              {!emailEvidenceProvided ? (
                <button type="button" onClick={() => { updatePayrollInvestigation({ emailEvidenceProvided: true }); recordAction?.('Recorded business-supplied email evidence', 'Email evidence became available after trusted business contact.', 'Payroll History'); }}>Business supplied email evidence</button>
              ) : null}
            </section>
          )}
          {visibleEmailEvidence && (
            <section className="payroll-email-evidence" aria-label="Business-supplied email evidence">
              <header><p>Email evidence supplied after trusted contact</p><h3>Fictional message record</h3></header>
              <dl>
                <div><dt>From</dt><dd>{visibleEmailEvidence.headerFrom}</dd></div>
                <div><dt>Reply-To</dt><dd>{visibleEmailEvidence.headerReplyTo}</dd></div>
                <div><dt>Received</dt><dd>{visibleEmailEvidence.received}</dd></div>
                <div><dt>Mailbox note</dt><dd>{visibleEmailEvidence.mailboxNote}</dd></div>
              </dl>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

export default function PayrollHistoryWorkspace({
  activeCase,
  query,
  pin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
  quickPin,
  recordAction,
  payrollInvestigation,
  setPayrollInvestigationsByCase,
}) {
  const workspace = useMemo(() => getPayrollHistory(activeCase), [activeCase]);
  const [view, setView] = useState('company');
  const [selectedRunId, setSelectedRunId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedPaystubId, setSelectedPaystubId] = useState('');
  const company = workspace.companyPayrollProfile;
  const selectedRun = workspace.payrollRuns.find((run) => run.id === selectedRunId) ?? null;
  const selectedRunEmployee = selectedRun?.employees.find((employee) => employee.employeeId === selectedEmployeeId) ?? null;
  const history = useMemo(
    () => employeePayrollHistory(workspace, selectedEmployeeId),
    [workspace, selectedEmployeeId],
  );
  const selectedPaycheck = history.paychecks.find((paycheck) => paycheck.paystub.id === selectedPaystubId)
    ?? (selectedRunEmployee ? { ...selectedRunEmployee, runId: selectedRun?.id, paystub: selectedRunEmployee.paystub } : null);
  const paystub = selectedPaycheck?.paystub ?? null;

  useEffect(() => {
    setView('company');
    setSelectedRunId('');
    setSelectedEmployeeId('');
    setSelectedPaystubId('');
  }, [activeCase.id]);

  useEffect(() => {
    const match = findPayrollRecord(workspace, query);
    if (!match) return;
    setSelectedRunId(match.run.id);
    if (match.type === 'run') {
      setView('run');
      return;
    }
    setSelectedEmployeeId(match.employee.employeeId);
    if (match.type === 'employee') {
      setView('employee');
      return;
    }
    setSelectedPaystubId(match.paystub.id);
    setView('paystub');
  }, [query, workspace]);

  function openRun(run) {
    setSelectedRunId(run.id);
    setSelectedEmployeeId('');
    setSelectedPaystubId('');
    setView('run');
  }

  function openEmployee(run, employee) {
    setSelectedRunId(run.id);
    setSelectedEmployeeId(employee.employeeId);
    setSelectedPaystubId('');
    setView('employee');
  }

  function openPaystub(paycheck) {
    setSelectedRunId(paycheck.runId);
    setSelectedEmployeeId(paycheck.employeeId);
    setSelectedPaystubId(paycheck.paystub.id);
    setView('paystub');
  }

  async function copyPayrollValue(label, value) {
    if (!value || value === 'Not applicable') return;
    try {
      if (window.navigator.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(String(value));
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const field = window.document.createElement('textarea');
      field.value = String(value);
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      window.document.body.appendChild(field);
      field.select();
      window.document.execCommand('copy');
      field.remove();
    }
    recordAction?.('Copied payroll identifier', `${label} ${value} copied from immutable paystub ${paystub?.id}.`, 'Payroll History');
  }

  function openPaymentVerification(destination) {
    const hint = buildPaymentLookupHint({
      bankCode: destination.bankCode,
      destinationId: destination.destinationId,
      ownerName: paystub.employee.legalName,
    });
    openTool('Payment Verification', 'investigate', { query: hint });
  }

  if (!company || !workspace.payrollRuns.length) {
    return (
      <>
        <div className="investigation-tool-empty" role="status">No company payroll history is recorded for this business profile.</div>
        <nav className="investigation-tool-next-routes" aria-label="Payroll History next routes"><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      </>
    );
  }

  return (
    <>
      <PayrollTrustedContactWorkflow
        activeCase={activeCase}
        payrollInvestigation={payrollInvestigation}
        setPayrollInvestigationsByCase={setPayrollInvestigationsByCase}
        saveNote={saveNote}
        recordAction={recordAction}
      />
      <nav className="payroll-breadcrumbs" aria-label="Payroll History hierarchy">
        <button type="button" className={view === 'company' ? 'active' : ''} onClick={() => setView('company')}>Company Payroll History</button>
        <span>›</span><button type="button" disabled={!selectedRun} className={view === 'run' ? 'active' : ''} onClick={() => selectedRun && setView('run')}>Payroll Run Detail</button>
        <span>›</span><button type="button" disabled={!selectedEmployeeId} className={view === 'employee' ? 'active' : ''} onClick={() => selectedEmployeeId && setView('employee')}>Employee Payroll History</button>
        <span>›</span><button type="button" disabled={!paystub} className={view === 'paystub' ? 'active' : ''} onClick={() => paystub && setView('paystub')}>Individual Paystub</button>
      </nav>

      {view === 'company' && <>
        <section className="payroll-company-header" aria-label="Company payroll header"><header><div><p>Company Payroll History</p><h3>{company.legalName}</h3><span>Immutable payroll snapshots for {company.selectedDateRange}</span></div><button type="button" onClick={() => pin(company.payrollId)}>Pin payroll ID</button></header><dl>{[['Payroll ID', company.payrollId], ['Pay schedule', company.paySchedule], ['Next pay date', company.nextPayDate], ['Active employee count', company.activeEmployeeCount], ['Selected date range', company.selectedDateRange]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
        <section className="payroll-company-summary" aria-label="Company payroll selected-range summary">{[
          ['Total payroll cost', workspace.summary.totalPayrollCost],
          ['Employees paid', workspace.summary.employeesPaid, false],
          ['Gross wages', workspace.summary.grossWages],
          ['Employee taxes withheld', workspace.summary.employeeTaxes],
          ['Employer taxes', workspace.summary.employerTaxes],
          ['Deductions', workspace.summary.deductions],
          ['Employer contributions', workspace.summary.employerContributions],
          ['Reimbursements', workspace.summary.reimbursements],
          ['Net pay', workspace.summary.netPay],
          ['Total funding amount', workspace.summary.totalFundingAmount],
        ].map(([label, value, money = true]) => <article key={label}><span>{label}</span><strong>{money ? payrollMoney(value) : value}</strong></article>)}</section>
        <section className="payroll-run-list" aria-label="Company payroll runs"><header><div><p>Payroll runs</p><h3>{workspace.payrollRuns.length} runs in the selected range</h3></div><span>Company-level history</span></header>{[...workspace.payrollRuns].reverse().map((run) => <article key={run.id} data-payroll-run={run.id}><div><span>{run.runType} · {run.status}</span><strong>{run.id}</strong><small>Pay date {run.payDate} · {run.payPeriod.label}</small></div><dl><div><dt>Employees</dt><dd>{run.employeeCount}</dd></div><div><dt>Gross wages</dt><dd>{payrollMoney(run.grossWages)}</dd></div><div><dt>Net pay</dt><dd>{payrollMoney(run.netPay)}</dd></div><div><dt>Total payroll cost</dt><dd>{payrollMoney(run.totalPayrollCost)}</dd></div></dl><button type="button" onClick={() => openRun(run)}>Open Payroll</button></article>)}</section>
      </>}

      {view === 'run' && selectedRun && <>
        <section className="payroll-run-detail" aria-label="Payroll Run Detail"><header><div><p>Payroll Run Detail</p><h3>{selectedRun.id}</h3><span>{selectedRun.runType} · {selectedRun.status}</span></div><button type="button" onClick={() => pin(selectedRun.id)}>Pin payroll run</button></header><dl>{[
          ['Run ID', selectedRun.id], ['Pay period', selectedRun.payPeriod.label], ['Pay date', selectedRun.payDate], ['Run type', selectedRun.runType], ['Status', selectedRun.status], ['Number of employees', selectedRun.employeeCount], ['Gross wages', payrollMoney(selectedRun.grossWages)], ['Employee taxes', payrollMoney(selectedRun.employeeTaxes)], ['Employer taxes', payrollMoney(selectedRun.employerTaxes)], ['Deductions', payrollMoney(selectedRun.deductions)], ['Employer contributions', payrollMoney(selectedRun.employerContributions)], ['Reimbursements', payrollMoney(selectedRun.reimbursements)], ['Net pay', payrollMoney(selectedRun.netPay)], ['Funding amount', payrollMoney(selectedRun.totalFundingAmount)], ['Funding status', selectedRun.fundingStatus], ['Total company debit', payrollMoney(selectedRun.totalCompanyDebit)], ['Company funding Bank Code', selectedRun.companyFunding.bankCode], ['Company funding account used', selectedRun.companyFunding.accountUsed], ['Submission date', selectedRun.submissionDate], ['Settlement date', selectedRun.settlementDate], ['Submitted by', selectedRun.submittedBy], ['Approved by', selectedRun.approvedBy],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
        <section className="payroll-employee-table" aria-label="Employees included in payroll run"><header><p>Employees included</p><h3>{selectedRun.employeeCount} paycheck snapshots</h3></header><div className="payroll-table-scroll"><table><thead><tr>{['Employee name', 'Employee ID', 'Department', 'Pay type', 'Regular hours', 'Overtime hours', 'Gross pay', 'Taxes', 'Deductions', 'Net pay', 'Payment method', 'Payment status'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{selectedRun.employees.map((employee) => <tr key={employee.paystub.id}><td><button type="button" onClick={() => openEmployee(selectedRun, employee)}>{employee.name}</button></td><td>{employee.employeeId}</td><td>{employee.department}</td><td>{employee.payType}</td><td>{employee.regularHours}</td><td>{employee.overtimeHours}</td><td>{payrollMoney(employee.grossPay)}</td><td>{payrollMoney(employee.taxes)}</td><td>{payrollMoney(employee.deductions)}</td><td>{payrollMoney(employee.netPay)}</td><td>{employee.paymentMethod}</td><td>{employee.paymentStatus}</td></tr>)}</tbody></table></div></section>
      </>}

      {view === 'employee' && history.employee && <>
        <section className="payroll-employee-history-header" aria-label="Employee Payroll History"><div><p>Employee Payroll History</p><h3>{history.employee.name}</h3><span>{history.employee.employeeId} · {company.legalName}</span></div><button type="button" onClick={() => openTool('Employee Profile', 'investigate', { query: history.employee.employeeId })}>Open Employee Profile</button></section>
        <section className="payroll-employee-ytd" aria-label="Employee payroll year summary">{[['Selected year', history.selectedYear, false], ['Paycheck count', history.paycheckCount, false], ['YTD gross', history.ytdGross], ['YTD net', history.ytdNet]].map(([label, value, money = true]) => <article key={label}><span>{label}</span><strong>{money ? payrollMoney(value) : value}</strong></article>)}</section>
        <section className="payroll-paycheck-list" aria-label={`${history.employee.name} paycheck history`}><header><p>Paychecks only</p><h3>{history.paycheckCount} recorded paychecks</h3></header>{history.paychecks.map((paycheck) => <button key={paycheck.paystub.id} type="button" onClick={() => openPaystub(paycheck)} data-paycheck={paycheck.paystub.id}><span>{paycheck.paymentStatus}</span><strong>{paycheck.payDate} · {paycheck.payPeriod.label}</strong><small>{paycheck.payrollType} · Gross {payrollMoney(paycheck.grossPay)} · Net {payrollMoney(paycheck.netPay)}</small></button>)}</section>
      </>}

      {view === 'paystub' && paystub && <>
        <section className="paystub-sheet" aria-label="Individual Paystub"><header><div><p>Individual Paystub</p><h3>{paystub.id}</h3><span>Immutable payroll snapshot as of {paystub.payDate}</span></div><button type="button" onClick={() => pin(paystub.id)}>Pin paystub</button></header>
          <div className="paystub-parties"><section><h4>Employer</h4><dl>{[['Legal name', paystub.employer.legalName], ['Address', paystub.employer.address], ['Masked EIN', paystub.employer.maskedEin]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section><h4>Employee</h4><dl>{[['Legal name', paystub.employee.legalName], ['Address', paystub.employee.address], ['Employee ID', paystub.employee.employeeId]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section><h4>Paycheck</h4><dl>{[['Pay period', paystub.payPeriod.label], ['Pay date', paystub.payDate], ['Paystub ID', paystub.id], ['Payroll type', paystub.payrollType]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section></div>

          <section className="paystub-ledger" aria-label="Paystub earnings"><h4>Earnings</h4><table><thead><tr><th>Earning type</th><th>Hours</th><th>Rate</th><th>Current amount</th><th>YTD amount</th></tr></thead><tbody>{paystub.earnings.map((item) => <tr key={item.type}><td>{item.type}</td><td>{item.hours}</td><td>{typeof item.rate === 'number' ? payrollMoney(item.rate) : item.rate}</td><td>{payrollMoney(item.current)}</td><td>{payrollMoney(item.ytd)}</td></tr>)}</tbody></table></section>
          <section className="paystub-ledger" aria-label="Paystub taxes"><h4>Taxes</h4><table><thead><tr><th>Tax</th><th>Current</th><th>YTD</th></tr></thead><tbody>{paystub.taxes.map((item) => <tr key={item.type}><td>{item.type}</td><td>{payrollMoney(item.current)}</td><td>{payrollMoney(item.ytd)}</td></tr>)}</tbody></table></section>
          <section className="paystub-ledger" aria-label="Paystub deductions and contributions"><h4>Deductions and contributions</h4><table><thead><tr><th>Type</th><th>Category</th><th>Current</th><th>YTD</th></tr></thead><tbody>{paystub.deductions.map((item) => <tr key={`deduction-${item.type}`}><td>{item.type}</td><td>Employee deduction</td><td>{payrollMoney(item.current)}</td><td>{payrollMoney(item.ytd)}</td></tr>)}{paystub.employerContributions.map((item) => <tr key={`contribution-${item.type}`}><td>{item.type}</td><td>Employer contribution</td><td>{payrollMoney(item.current)}</td><td>{payrollMoney(item.ytd)}</td></tr>)}</tbody></table></section>
          <div className="paystub-supplemental"><section><h4>Reimbursements</h4>{paystub.reimbursements.length ? paystub.reimbursements.map((item) => <p key={item.type}>{item.type}: {payrollMoney(item.current)} current · {payrollMoney(item.ytd)} YTD</p>) : <p>None recorded</p>}</section><section><h4>Adjustments</h4>{paystub.adjustments.length ? paystub.adjustments.map((item) => <p key={item.type}>{item.type}: {payrollMoney(item.current)} current · {payrollMoney(item.ytd)} YTD</p>) : <p>None recorded</p>}</section></div>
          <section className="paystub-totals" aria-label="Paystub totals">{[['Gross pay', paystub.summary.grossPay], ['Total deductions', paystub.summary.totalDeductions], ['Net pay', paystub.summary.netPay]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{payrollMoney(value)}</strong></article>)}</section>
          <section className="paystub-ytd" aria-label="Paystub YTD snapshot"><header><h4>YTD snapshot</h4><span>As of {paystub.payDate}</span></header><dl>{Object.entries(paystub.ytdSnapshot).map(([label, value]) => <div key={label}><dt>{label.replace(/([A-Z])/g, ' $1')}</dt><dd>{payrollMoney(value)}</dd></div>)}</dl></section>
        </section>

        <section className="paystub-payment" aria-label="Paystub payment destinations"><header><div><p>Payment</p><h3>{paystub.paymentDestinations.length > 1 ? 'Split direct deposit destinations' : paystub.paymentDestinations[0]?.method}</h3><span>Only identifiers and status recorded for this payroll event are shown.</span></div></header>{paystub.paymentDestinations.map((destination) => {
          const identifiersApply = !destination.destinationUnavailable
            && destination.bankCode !== 'Not applicable'
            && destination.destinationId !== 'Not applicable';
          return <article key={destination.id} data-payroll-destination={destination.destinationId} data-destination-unavailable={destination.destinationUnavailable ? 'true' : undefined}><dl>{[['Payment method', destination.method], ['Employee Bank Code', destination.bankCode], ['Destination ID', destination.destinationId], ['Deposited amount', payrollMoney(destination.amount)], ['Payment status', destination.status], ['Settlement date', destination.settlementDate], ['Payment record ID', destination.paymentRecordId ?? 'Not recorded'], ...(destination.method === 'Paper check' ? [['Check number', destination.checkNumber]] : [])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{destination.destinationUnavailable && <p role="status">{destination.unavailableReason}</p>}{identifiersApply && <div className="paystub-payment-actions"><button type="button" onClick={() => copyPayrollValue('Bank Code', destination.bankCode)}>Copy Bank Code</button><button type="button" onClick={() => quickPin({ label: 'Bank Code', value: destination.bankCode, sourceTool: 'Payroll History', sourceRecordId: paystub.id })}>Pin Bank Code to Quick Pad</button><button type="button" onClick={() => copyPayrollValue('Destination ID', destination.destinationId)}>Copy Destination ID</button><button type="button" onClick={() => quickPin({ label: 'Destination ID', value: destination.destinationId, sourceTool: 'Payroll History', sourceRecordId: paystub.id })}>Pin Destination ID to Quick Pad</button><button type="button" onClick={() => openPaymentVerification(destination)}>Open Payment Verification</button></div>}</article>;
        })}</section>
        <button type="button" onClick={() => saveNote(`Payroll History: immutable paystub ${paystub.id} reviewed.`, 'Payroll History')}>Save paystub note</button>
      </>}

      <nav className="investigation-tool-next-routes" aria-label="Payroll History next routes"><button type="button" onClick={() => openTool('Employee Profile')}>Open Employee Profile</button><button type="button" onClick={() => openTool('Business 360')}>Open Business 360</button><button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button><button type="button" onClick={jumpDecision}>Open Submit Decision</button></nav>
      <footer className="investigation-tool-review-bar"><div><strong>Payroll History review</strong><span>Review the company totals, applicable run, employee paycheck history, and event-level paystub before marking Payroll History reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Payroll History')}>{reviewed ? '✓ Payroll History reviewed' : 'Mark Payroll History reviewed'}</button></footer>
    </>
  );
}

