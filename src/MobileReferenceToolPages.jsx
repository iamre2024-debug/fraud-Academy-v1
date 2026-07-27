import { useMemo, useState } from 'react';
import {
  getBusiness360Workspace,
  getEmployeeProfiles,
  getPayrollHistory,
  getTransactionHistory,
} from './data/businessPayrollWorkspace.js';
import { getFinancialRecords } from './data/caseToolData.js';
import { getFinancialInvestigation } from './data/financialInvestigationRecords.js';
import { getCustomer360Dossier } from './data/customer360Dossier.js';
import { buildPaymentLookupHint } from './data/paymentVerification.js';

const unavailable = 'Not supplied in the current training packet';

function moneyNumber(value) {
  return Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function display(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(' · ') || unavailable;
  return value === null || value === undefined || value === '' ? unavailable : String(value);
}

function MobilePanel({ eyebrow, title, charm = '✦', children, className = '' }) {
  return (
    <section className={`mobile-reference-panel ${className}`.trim()}>
      <header className="mobile-reference-panel-heading">
        <span aria-hidden="true">{charm}</span>
        <div><p>{eyebrow}</p><h3>{title}</h3></div>
      </header>
      {children}
    </section>
  );
}

function MobileFacts({ rows, className = '' }) {
  return (
    <dl className={`mobile-reference-facts ${className}`.trim()}>
      {rows.map(([label, value, action]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{display(value)}</dd>
          {action}
        </div>
      ))}
    </dl>
  );
}

function QuickPinButton({ label, value, sourceTool, sourceRecordId = '', quickPin }) {
  if (!value || !quickPin || /not (?:supplied|available|applicable|recorded)/i.test(String(value))) return null;
  return (
    <button
      type="button"
      className="mobile-inline-quick-pin"
      aria-label={`Pin ${label} ${value} to Quick Pad`}
      onClick={() => quickPin({ label, value, sourceTool, sourceRecordId })}
    >
      📌
    </button>
  );
}

function hasPaymentIdentifier(value) {
  return Boolean(value) && !/not (?:supplied|available|applicable|recorded)/i.test(String(value));
}

function MobilePaymentSourceHandoff({
  source,
  activeCase,
  openTool,
  quickPin,
  sourceTool,
  sourceLabel,
  sourceRecordId = '',
  ariaLabel,
  ownerName: ownerNameOverride,
}) {
  if (
    !source
    || !openTool
    || !activeCase.availableTools?.includes('Payment Verification')
    || !hasPaymentIdentifier(source.bankCode)
    || !hasPaymentIdentifier(source.destinationId)
  ) return null;

  const recordId = sourceRecordId || source.recordId || source.id || '';
  const ownerName = ownerNameOverride || source.ownerToCompare || source.accountHolder || activeCase.person;
  const hint = buildPaymentLookupHint({
    bankCode: source.bankCode,
    destinationId: source.destinationId,
    ownerName,
  });

  return (
    <section
      className="mobile-payment-source-handoff"
      aria-label={ariaLabel ?? `${sourceLabel} payment source identifiers`}
      data-payment-source-record={recordId || undefined}
    >
      <header>
        <div><p>Source identifiers · search before reveal</p><h4>Payment account change</h4></div>
        {recordId && <strong>{recordId}</strong>}
      </header>
      <MobileFacts rows={[
        ['Bank Code', source.bankCode, <QuickPinButton key="bank" label="Bank Code" value={source.bankCode} sourceTool={sourceTool} sourceRecordId={recordId} quickPin={quickPin} />],
        ['Destination ID', source.destinationId, <QuickPinButton key="destination" label="Destination ID" value={source.destinationId} sourceTool={sourceTool} sourceRecordId={recordId} quickPin={quickPin} />],
        ['Previous account / destination', source.previousDestination ?? source.oldDestination],
        ['New account / destination', source.newDestination],
        ['Change comparison', source.changeComparison],
      ]} />
      <button
        type="button"
        className="mobile-reference-primary"
        onClick={() => openTool('Payment Verification', 'investigate', { query: hint })}
      >
        Prefill Payment Verification
      </button>
      <small>Name match, account standing, and verification results remain hidden until the investigator runs the search.</small>
    </section>
  );
}

function ReviewFooter({ title, reviewed, onReview, onDecision }) {
  return (
    <footer className="mobile-reference-review">
      <div><span>Evidence First</span><strong>{reviewed ? `${title} reviewed` : `Finish ${title} when ready`}</strong></div>
      <button type="button" onClick={onReview}>{reviewed ? '✓ Reviewed' : 'Mark reviewed'}</button>
      <button type="button" onClick={onDecision}>Submit Decision</button>
    </footer>
  );
}

export function MobileCustomer360Page({
  activeCase,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  currentCompleted,
  openTool,
  jumpDecision,
  notes = [],
}) {
  const dossier = getCustomer360Dossier(activeCase);
  const paymentSource = getFinancialRecords(activeCase).paymentVerification?.[0] ?? null;
  const contact = activeCase.customer?.contact ?? {};
  const customerId = activeCase.customerId ?? dossier.identity.maskedMemberId;
  const profileChanges = activeCase.customer?.profileChanges ?? [];
  const devices = [...new Map((activeCase.loginHistory ?? []).map((item) => [item.deviceId ?? item.device, item])).values()];

  return (
    <section
      className="mobile-reference-tool mobile-customer-360"
      data-mobile-reference-tool="Customer 360"
      data-customer-360-screen="approved-theme-v1"
      data-case-id={activeCase.id}
    >
      <section className="mobile-profile-hero">
        <div className="mobile-profile-avatar" aria-hidden="true">{activeCase.person.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
        <div><p>Personal customer · {activeCase.status}</p><h2>{activeCase.person}</h2><span>Client since {activeCase.customer?.relationshipSince ?? 'not supplied'}</span></div>
        <button type="button" onClick={() => pin(`${activeCase.id} · ${activeCase.person}`)}>Pin evidence</button>
      </section>

      <MobilePanel eyebrow="Customer home base" title="Identity & contact" charm="♡">
        <MobileFacts rows={[
          ['Name', activeCase.person],
          ['Date of birth', dossier.identity.dob],
          ['Personal address', dossier.contact.physicalAddress],
          ['Phone', contact.phone, <QuickPinButton key="phone" label="Phone number" value={contact.phone} sourceTool="Customer 360" quickPin={quickPin} />],
          ['Email', contact.email, <QuickPinButton key="email" label="Email" value={contact.email} sourceTool="Customer 360" quickPin={quickPin} />],
          ['Training ID', activeCase.trainingId, <QuickPinButton key="training" label="Training ID" value={activeCase.trainingId} sourceTool="Customer 360" quickPin={quickPin} />],
          ['Customer ID', customerId, <QuickPinButton key="customer" label="Customer ID" value={customerId} sourceTool="Customer 360" quickPin={quickPin} />],
          ['Relationship length', dossier.atAGlance?.find(([label]) => /relationship/i.test(label))?.[1] ?? activeCase.customer?.relationshipSince],
        ]} />
      </MobilePanel>

      <MobilePanel eyebrow="Products on file" title="Accounts & products" charm="◇">
        <div className="mobile-reference-expand-list">
          {dossier.products.map((product, index) => (
            <details key={product.id} open={index === 0} data-customer-account={product.id}>
              <summary>
                <span><small>{product.id}</small><strong>{product.product}</strong><em>{product.status}</em></span>
                <QuickPinButton label="Account ID" value={product.id} sourceTool="Customer 360" sourceRecordId={product.id} quickPin={quickPin} />
              </summary>
              <MobileFacts rows={[
                ['Account ID', product.id],
                ['Masked account', product.maskedNumber],
                ['Opened', product.opened],
                ['Status', product.status],
                ['Balance', product.balance],
                ['Limit', product.limit],
                ['Standing', product.standing],
              ]} />
            </details>
          ))}
        </div>
      </MobilePanel>

      {paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <MobilePanel eyebrow="Recorded source values" title="Payment verification inputs" charm="↗">
          <MobilePaymentSourceHandoff
            source={paymentSource}
            activeCase={activeCase}
            openTool={openTool}
            quickPin={quickPin}
            sourceTool="Customer 360"
            sourceLabel="Customer 360"
            ariaLabel="Payment Account Change"
            ownerName={activeCase.person}
          />
        </MobilePanel>
      )}

      <MobilePanel eyebrow="Factual maintenance history" title="Profile updates" charm="✦">
        <div className="mobile-reference-event-list">
          {profileChanges.length ? profileChanges.map((event) => (
            <article key={event.id} data-profile-event={event.id}>
              <i />
              <div><span>{event.date}{event.time ? ` · ${event.time}` : ''}</span><strong>{event.item}</strong><p>{event.oldValue ?? 'Not supplied'} → {event.newValue ?? event.detail}</p><small>{event.source ?? event.channel}</small></div>
              <button type="button" onClick={() => saveNote(`Customer 360 profile event ${event.id}: ${event.item}.`, 'Customer profile event')}>Note</button>
            </article>
          )) : <p className="mobile-reference-empty">No profile updates are supplied in this case.</p>}
        </div>
      </MobilePanel>

      <MobilePanel eyebrow="Known access facts" title="Trusted devices & security" charm="🛡">
        <MobileFacts rows={[
          ['MFA status', dossier.security.mfaStatus],
          ['Password last changed', dossier.security.passwordChanged],
          ['Trusted-device summary', dossier.security.trustedDevices],
          ['Security alerts', dossier.security.alerts],
          ['Recovery contact', dossier.security.recoveryContact],
        ]} />
        <div className="mobile-reference-chip-list">
          {devices.map((device) => (
            <button
              key={device.deviceId ?? device.device}
              type="button"
              onClick={() => quickPin({
                label: 'Device ID',
                value: device.deviceId ?? device.device,
                sourceTool: 'Customer 360',
                sourceRecordId: device.id,
              })}
            >
              📌 {device.deviceId ?? device.device}
            </button>
          ))}
        </div>
      </MobilePanel>

      <MobilePanel eyebrow="Service history" title="Prior contact & customer notes" charm="✎">
        <div className="mobile-reference-card-list">
          {dossier.recentContacts.map((item) => (
            <article key={item.id}><span>{item.dateTime} · {item.channel}</span><strong>{item.type}</strong><p>{item.notes}</p><small>{item.outcome}</small></article>
          ))}
          {notes.map((note, index) => <article key={`${note}-${index}`}><span>Investigator notebook</span><p>{note}</p></article>)}
        </div>
        <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Customer 360 reviewed for ${activeCase.person}.`, 'Customer 360')}>Add review note</button>
      </MobilePanel>

      <ReviewFooter
        title="Customer 360"
        reviewed={currentCompleted.includes('Customer 360')}
        onReview={() => markReviewed('Customer 360')}
        onDecision={jumpDecision}
      />
    </section>
  );
}

function businessContact(activeCase, workspace) {
  const profile = activeCase.businessProfile ?? {};
  const contact = activeCase.customer?.contact ?? {};
  return {
    phone: profile.phone ?? contact.phone ?? workspace.profile.contact,
    email: profile.email ?? contact.email,
    address: profile.address ?? workspace.profile.address,
    ownerAddress: profile.ownerAddress ?? contact.address ?? workspace.profile.address,
  };
}

export function MobileBusiness360Page({
  activeCase,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const workspace = getBusiness360Workspace(activeCase);
  const payroll = getPayrollHistory(activeCase);
  const dossier = getCustomer360Dossier(activeCase);
  const contact = businessContact(activeCase, workspace);
  const businessId = workspace.relationships?.[0]?.id ?? activeCase.businessId ?? `BIZ-${activeCase.id}`;
  const payrollTotal = payroll.reduce((total, item) => total + moneyNumber(item.amount), 0);
  const employeeCount = new Set(payroll.map((item) => item.employee).filter(Boolean)).size;
  const isPayroll = activeCase.claimTypeId === 'payroll-direct-deposit' || activeCase.taxonomyTags?.productRail === 'payroll';

  return (
    <section
      className="mobile-reference-tool mobile-business-360"
      data-mobile-reference-tool="Business 360"
      data-business-360-screen="approved-mobile-reference"
      data-case-id={activeCase.id}
    >
      <section className="mobile-business-hero">
        <div aria-hidden="true">🏢</div>
        <span>Business home base · {activeCase.status}</span>
        <h2>{workspace.profile.entity}</h2>
        <p>{workspace.profile.entityType}</p>
        <button type="button" onClick={() => pin(`${businessId} · ${workspace.profile.entity}`)}>Pin business evidence</button>
      </section>

      <MobilePanel eyebrow="Business identity" title="Company information" charm="✦">
        <MobileFacts rows={[
          ['Legal name', workspace.profile.entity],
          ['Business ID', businessId, <QuickPinButton key="biz" label="Business ID" value={businessId} sourceTool="Business 360" quickPin={quickPin} />],
          ['EIN / training equivalent', workspace.profile.ein],
          ['Business address', contact.address],
          ['Business phone', contact.phone, <QuickPinButton key="phone" label="Phone number" value={contact.phone} sourceTool="Business 360" quickPin={quickPin} />],
          ['Business email', contact.email, <QuickPinButton key="email" label="Email" value={contact.email} sourceTool="Business 360" quickPin={quickPin} />],
          ['Industry', activeCase.businessProfile?.industry ?? workspace.profile.entityType],
          ['Business start / client date', activeCase.businessProfile?.clientSince ?? workspace.profile.filingDate ?? workspace.profile.observed],
          ['Registration', workspace.profile.registration],
        ]} />
      </MobilePanel>

      <MobilePanel eyebrow="Ownership records" title="Owners & controlling people" charm="♡">
        <MobileFacts rows={[
          ['Owner name', activeCase.businessProfile?.ownerName ?? activeCase.person],
          ['Ownership percentage', activeCase.businessProfile?.ownershipPercentage ?? 'Percentage not supplied'],
          ['Owner phone', activeCase.businessProfile?.ownerPhone ?? activeCase.customer?.contact?.phone],
          ['Owner email', activeCase.businessProfile?.ownerEmail ?? activeCase.customer?.contact?.email],
          ['Owner residential address', contact.ownerAddress],
          ['Officer / role', workspace.profile.officer ?? activeCase.profile?.entityRole],
          ['Registered agent', workspace.profile.registeredAgent],
        ]} />
      </MobilePanel>

      <MobilePanel eyebrow="Relationship inventory" title="Products, credit & accounts" charm="◇">
        <div className="mobile-reference-expand-list">
          {dossier.products.map((product, index) => (
            <details key={product.id} open={index === 0}>
              <summary><span><small>{product.id}</small><strong>{product.product}</strong><em>{product.status}</em></span><QuickPinButton label="Account ID" value={product.id} sourceTool="Business 360" sourceRecordId={product.id} quickPin={quickPin} /></summary>
              <MobileFacts rows={[
                ['Product', product.product],
                ['Balance / exposure', product.balance],
                ['Limit', product.limit],
                ['Standing', product.standing],
                ['Opened', product.opened],
              ]} />
            </details>
          ))}
          {workspace.relationships.map((item) => (
            <details key={item.id}>
              <summary><span><small>{item.id}</small><strong>{item.entity}</strong><em>{item.status}</em></span></summary>
              <MobileFacts rows={[['Relationship', item.relationship], ['Observed', item.observed], ['Context', item.context]]} />
            </details>
          ))}
        </div>
      </MobilePanel>

      {workspace.paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <MobilePanel eyebrow="Recorded payment destination" title="Payment verification inputs" charm="↗">
          <MobilePaymentSourceHandoff
            source={workspace.paymentSource}
            activeCase={activeCase}
            openTool={openTool}
            quickPin={quickPin}
            sourceTool="Business 360"
            sourceLabel="Business 360"
          />
        </MobilePanel>
      )}

      {isPayroll && (
        <MobilePanel eyebrow="Compact payroll overview" title="Current payroll relationship" charm="↗">
          <section className="mobile-reference-metrics">
            <article><span>Total payroll</span><strong>{payrollTotal ? money(payrollTotal) : unavailable}</strong></article>
            <article><span>Employees paid</span><strong>{employeeCount || 'Not supplied'}</strong></article>
            <article><span>Frequency</span><strong>{activeCase.businessProfile?.payrollFrequency ?? 'Per recorded cycle'}</strong></article>
            <article><span>Latest payroll</span><strong>{payroll[0]?.period ?? unavailable}</strong></article>
          </section>
          <button type="button" className="mobile-reference-primary" onClick={() => openTool('Payroll History')}>Open detailed Payroll History</button>
        </MobilePanel>
      )}

      <MobilePanel eyebrow="Factual business history" title="Profile changes & contact notes" charm="✎">
        <div className="mobile-reference-card-list">
          {(activeCase.customer?.profileChanges ?? []).map((item) => <article key={item.id}><span>{item.date} · {item.source}</span><strong>{item.item}</strong><p>{item.oldValue ?? 'Not supplied'} → {item.newValue ?? item.detail}</p></article>)}
          {(activeCase.intakeAnswers ?? []).slice(0, 4).map((item) => <article key={item.id}><span>Business contact note</span><p>{item.answer}</p></article>)}
        </div>
        <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Business 360 reviewed for ${workspace.profile.entity}.`, 'Business 360')}>Add business note</button>
      </MobilePanel>

      <ReviewFooter title="Business 360" reviewed={reviewed} onReview={() => markReviewed('Business 360')} onDecision={jumpDecision} />
    </section>
  );
}

function totalsBy(items, key) {
  const totals = new Map();
  items.forEach((item) => {
    const label = item[key] ?? 'Not supplied';
    totals.set(label, (totals.get(label) ?? 0) + moneyNumber(item.amount));
  });
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

export function MobileFinancialInvestigationPage({
  activeCase,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const [tab, setTab] = useState('account');
  const workspace = getFinancialInvestigation(activeCase);
  const transactions = getTransactionHistory(activeCase);
  const payroll = getPayrollHistory(activeCase);
  const isPayroll = activeCase.claimTypeId === 'payroll-direct-deposit' || activeCase.taxonomyTags?.productRail === 'payroll';
  const outgoing = workspace.profile.monthlyOutflow;
  const incoming = workspace.profile.monthlyDeposits;
  const merchantTotals = totalsBy(transactions, 'merchant');
  const dayTotals = totalsBy(transactions, 'posted');
  const categoryTotals = totalsBy(transactions, 'category');
  const payrollTotal = payroll.reduce((total, item) => total + moneyNumber(item.amount), 0);

  if (isPayroll) {
    return (
      <section
        className="mobile-reference-tool mobile-financial-payroll"
        data-mobile-reference-tool="Financial Investigation"
        data-financial-investigation-screen="approved-mobile-reference"
        data-case-id={activeCase.id}
      >
        <MobilePanel eyebrow="Business payroll account" title="Payroll account review" charm="↗">
          <section className="mobile-reference-metrics">
            <article><span>Total payroll</span><strong>{payrollTotal ? money(payrollTotal) : unavailable}</strong></article>
            <article><span>Employees paid</span><strong>{new Set(payroll.map((item) => item.employee)).size}</strong></article>
            <article><span>Frequency</span><strong>{activeCase.businessProfile?.payrollFrequency ?? 'Per recorded cycle'}</strong></article>
            <article><span>Returned payments</span><strong>{payroll.filter((item) => /return|failed|rejected/i.test(item.runStatus)).length}</strong></article>
          </section>
        </MobilePanel>
        <MobilePanel eyebrow="Pay-cycle facts" title="Payroll amount by cycle" charm="◇">
          <div className="mobile-reference-expand-list">
            {payroll.map((item, index) => (
              <details key={item.id} open={index === 0}>
                <summary><span><small>{item.period}</small><strong>{item.amount}</strong><em>{item.runStatus}</em></span><QuickPinButton label="Destination ID" value={item.destinationId} sourceTool="Financial Investigation" sourceRecordId={item.id} quickPin={quickPin} /></summary>
                <MobileFacts rows={[
                  ['Employee', item.employee],
                  ['Type', /bonus/i.test(item.context) ? 'Bonus' : /off.?cycle/i.test(item.context) ? 'Off-cycle' : 'Regular'],
                  ['Bank Code', item.bankCode],
                  ['Destination ID', item.destinationId],
                  ['Change request', item.changeRequest],
                  ['Trusted callback', item.callback],
                  ['Context', item.context],
                ]} />
                <MobilePaymentSourceHandoff
                  source={item.paymentSource}
                  activeCase={activeCase}
                  openTool={openTool}
                  quickPin={quickPin}
                  sourceTool="Financial Investigation"
                  sourceLabel="Financial Investigation"
                  sourceRecordId={item.id}
                />
              </details>
            ))}
          </div>
        </MobilePanel>
        <MobilePanel eyebrow="Recorded payroll maintenance" title="Changes, employees & off-cycle activity" charm="✦">
          <div className="mobile-reference-card-list">
            {(activeCase.customer?.profileChanges ?? []).map((item) => <article key={item.id}><span>{item.date}</span><strong>{item.item}</strong><p>{item.oldValue ?? 'Not supplied'} → {item.newValue ?? item.detail}</p></article>)}
            {!activeCase.customer?.profileChanges?.length && <p className="mobile-reference-empty">No payroll profile changes are supplied in this case.</p>}
          </div>
          <nav className="mobile-reference-routes"><button type="button" onClick={() => openTool('Payroll History')}>Payroll History</button><button type="button" onClick={() => openTool('Employee Profile')}>Employee Profile</button><button type="button" onClick={() => openTool('Payment Verification')}>Payment Verification</button></nav>
        </MobilePanel>
        <ReviewFooter title="Financial Investigation" reviewed={reviewed} onReview={() => markReviewed('Financial Investigation')} onDecision={jumpDecision} />
      </section>
    );
  }

  return (
    <section
      className="mobile-reference-tool mobile-financial-personal"
      data-mobile-reference-tool="Financial Investigation"
      data-financial-investigation-screen="approved-mobile-reference"
      data-case-id={activeCase.id}
    >
      <nav className="mobile-reference-segmented" aria-label="Financial Investigation sections">
        <button type="button" className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>Account Review</button>
        <button type="button" className={tab === 'spending' ? 'active' : ''} onClick={() => setTab('spending')}>Spending Analysis</button>
      </nav>

      {tab === 'account' ? (
        <>
          <MobilePanel eyebrow="Product-specific activity" title="Account Review" charm="◇">
            <section className="mobile-reference-metrics">
              <article><span>Incoming funds</span><strong>{money(incoming)}</strong></article>
              <article><span>Outgoing funds</span><strong>{money(outgoing)}</strong></article>
              <article><span>Net movement</span><strong>{money(incoming - outgoing)}</strong></article>
              <article><span>Average balance</span><strong>{money(workspace.profile.averageBalance)}</strong></article>
            </section>
            <MobileFacts rows={[
              ['Product', workspace.profile.account],
              ['Account type', workspace.profile.accountType],
              ['Current status', workspace.profile.accountStatus],
              ['Available balance', money(workspace.profile.availableBalance)],
              ['Relationship length', workspace.profile.relationshipLength],
              ['Overdraft / NSF context', workspace.profile.overdraft],
            ]} />
          </MobilePanel>
          <MobilePanel eyebrow="Incoming, outgoing & transfer facts" title="Account activity" charm="↗">
            <div className="mobile-reference-card-list">
              {[...(workspace.recordsByTab.deposits ?? []), ...(workspace.recordsByTab.digital ?? []), ...(workspace.recordsByTab.cash ?? [])].map((record) => (
                <article key={record.id}>
                  <span>{record.observed} · {record.category}</span><strong>{record.title} · {record.value}</strong><p>{record.detail}</p>
                  <div><button type="button" onClick={() => pin(record.id)}>Pin evidence</button><QuickPinButton label="Transaction ID" value={record.id} sourceTool="Financial Investigation" sourceRecordId={record.id} quickPin={quickPin} /></div>
                </article>
              ))}
            </div>
          </MobilePanel>
        </>
      ) : (
        <>
          <MobilePanel eyebrow="Recorded spending totals" title="Day, week & month" charm="✦">
            <section className="mobile-reference-metrics">
              <article><span>Latest day</span><strong>{money(dayTotals[0]?.[1] ?? 0)}</strong><small>{dayTotals[0]?.[0] ?? 'No date'}</small></article>
              <article><span>Current record week</span><strong>{money(transactions.reduce((sum, item) => sum + moneyNumber(item.amount), 0))}</strong></article>
              <article><span>Current month</span><strong>{money(workspace.profile.monthlyOutflow)}</strong></article>
              <article><span>Transactions</span><strong>{transactions.length}</strong></article>
            </section>
          </MobilePanel>
          <MobilePanel eyebrow="Merchant behavior" title="Top & recurring merchants" charm="♡">
            <div className="mobile-reference-bar-list">
              {merchantTotals.slice(0, 6).map(([merchant, total]) => <article key={merchant}><span><strong>{merchant}</strong><em>{money(total)}</em></span><i style={{ width: `${Math.max(12, (total / (merchantTotals[0]?.[1] || 1)) * 100)}%` }} /></article>)}
            </div>
            <div className="mobile-reference-chip-list">
              {transactions.filter((item) => /recurring/i.test(item.channel)).map((item) => <span key={item.id}>{item.merchant} · {item.amount}</span>)}
              {!transactions.some((item) => /recurring/i.test(item.channel)) && <span>No recurring merchant record in this view</span>}
            </div>
          </MobilePanel>
          <MobilePanel eyebrow="Channels & categories" title="Cash, transfers & digital wallet" charm="◇">
            <MobileFacts rows={[
              ['Cash withdrawals', (workspace.recordsByTab.cash ?? []).map((item) => `${item.title}: ${item.value}`).join(' · ')],
              ['Transfer behavior', (workspace.recordsByTab['funds-flow'] ?? []).map((item) => item.title).join(' · ')],
              ['Digital wallet activity', (workspace.recordsByTab.digital ?? []).map((item) => `${item.title}: ${item.value}`).join(' · ')],
              ['Category totals', categoryTotals.map(([label, total]) => `${label}: ${money(total)}`).join(' · ')],
            ]} />
          </MobilePanel>
        </>
      )}

      <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Financial Investigation ${tab} section reviewed for ${activeCase.id}.`, 'Financial investigation')}>Add section note</button>
      <ReviewFooter title="Financial Investigation" reviewed={reviewed} onReview={() => markReviewed('Financial Investigation')} onDecision={jumpDecision} />
    </section>
  );
}

export function MobileEmployeeProfilePage({
  activeCase,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const employees = getEmployeeProfiles(activeCase);
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? '');
  const employee = employees.find((item) => item.id === selectedId) ?? employees[0];
  const history = (activeCase.customer?.profileChanges ?? []).filter((item) => /position|salary|department|personal|employment|destination|pay/i.test(`${item.eventType} ${item.item} ${item.detail}`));
  if (!employee) return <p className="mobile-reference-empty">No employee profile is supplied in this case.</p>;

  return (
    <section
      className="mobile-reference-tool mobile-employee-profile"
      data-mobile-reference-tool="Employee Profile"
      data-employee-profile-screen="approved-mobile-reference"
      data-case-id={activeCase.id}
    >
      <nav className="mobile-reference-record-picker" aria-label="Employee profiles">
        {employees.map((item) => <button key={item.id} type="button" className={item.id === employee.id ? 'active' : ''} onClick={() => setSelectedId(item.id)}><small>{item.id}</small><strong>{item.name}</strong><span>{item.status}</span></button>)}
      </nav>
      <MobilePanel eyebrow="Employee record" title={employee.name} charm="♡">
        <MobileFacts rows={[
          ['Employee ID', employee.id, <QuickPinButton key="employee" label="Employee ID" value={employee.id} sourceTool="Employee Profile" sourceRecordId={employee.id} quickPin={quickPin} />],
          ['Department', employee.department],
          ['Position', employee.role],
          ['Hire date', employee.hireDate],
          ['Manager', activeCase.employeeProfile?.manager ?? unavailable],
          ['Employment status', employee.status],
          ['Compensation type', activeCase.employeeProfile?.compensationType ?? unavailable],
          ['Pay schedule', activeCase.employeeProfile?.paySchedule ?? activeCase.businessProfile?.payrollFrequency ?? unavailable],
          ['Bank Code', employee.paymentSource?.bankCode, <QuickPinButton key="bank" label="Bank Code" value={employee.paymentSource?.bankCode} sourceTool="Employee Profile" sourceRecordId={employee.id} quickPin={quickPin} />],
          ['Destination ID', employee.paymentSource?.destinationId, <QuickPinButton key="destination" label="Destination ID" value={employee.paymentSource?.destinationId} sourceTool="Employee Profile" sourceRecordId={employee.id} quickPin={quickPin} />],
        ]} />
        <div className="mobile-reference-inline-actions"><button type="button" onClick={() => pin(`${employee.id} · ${employee.name}`)}>Pin evidence</button><button type="button" onClick={() => saveNote(`Employee Profile ${employee.id} reviewed.`, 'Employee profile')}>Add note</button></div>
      </MobilePanel>
      {employee.paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <MobilePanel eyebrow="Recorded pay destination" title="Payment verification inputs" charm="↗">
          <MobilePaymentSourceHandoff
            source={employee.paymentSource}
            activeCase={activeCase}
            openTool={openTool}
            quickPin={quickPin}
            sourceTool="Employee Profile"
            sourceLabel="Employee Profile"
            sourceRecordId={employee.id}
          />
        </MobilePanel>
      )}
      <MobilePanel eyebrow="Factual changes only" title="Employee profile history" charm="✦">
        <div className="mobile-reference-event-list">
          {history.length ? history.map((item) => <article key={item.id}><i /><div><span>{item.date}{item.time ? ` · ${item.time}` : ''}</span><strong>{item.item}</strong><p>{item.oldValue ?? 'Not supplied'} → {item.newValue ?? item.detail}</p></div></article>) : <p className="mobile-reference-empty">No structured employee profile change is supplied.</p>}
          <article><i /><div><span>{employee.hireDate}</span><strong>Employment start</strong><p>{employee.employmentTimeline}</p></div></article>
        </div>
      </MobilePanel>
      <nav className="mobile-reference-routes"><button type="button" onClick={() => openTool('Payroll History')}>Payroll History</button><button type="button" onClick={() => openTool('Payment Verification')}>Payment Verification</button></nav>
      <ReviewFooter title="Employee Profile" reviewed={reviewed} onReview={() => markReviewed('Employee Profile')} onDecision={jumpDecision} />
    </section>
  );
}

function payrollType(record) {
  const text = `${record.context} ${record.changeRequest}`.toLowerCase();
  if (/bonus/.test(text)) return 'Bonus';
  if (/correction/.test(text)) return 'Correction';
  if (/off.?cycle/.test(text)) return 'Off-cycle';
  return 'Regular';
}

export function MobilePayrollHistoryPage({
  activeCase,
  pin,
  quickPin,
  saveNote,
  markReviewed,
  reviewed,
  openTool,
  jumpDecision,
}) {
  const records = getPayrollHistory(activeCase);
  const employees = getEmployeeProfiles(activeCase);
  const [selectedId, setSelectedId] = useState(records[0]?.id ?? '');
  const activeRecord = records.find((item) => item.id === selectedId) ?? records[0];
  const runTotal = useMemo(() => records.reduce((total, item) => total + moneyNumber(item.amount), 0), [records]);

  return (
    <section
      className="mobile-reference-tool mobile-payroll-history"
      data-mobile-reference-tool="Payroll History"
      data-payroll-history-screen="approved-mobile-reference"
      data-case-id={activeCase.id}
    >
      <MobilePanel eyebrow="Detailed payroll tool" title="Payroll run summary" charm="↗">
        <section className="mobile-reference-metrics">
          <article><span>Payroll runs</span><strong>{records.length}</strong></article>
          <article><span>Total net payroll</span><strong>{money(runTotal)}</strong></article>
          <article><span>Employees paid</span><strong>{new Set(records.map((item) => item.employee)).size}</strong></article>
          <article><span>Latest pay date</span><strong>{records[0]?.period ?? unavailable}</strong></article>
        </section>
      </MobilePanel>

      <section className="mobile-payroll-run-list" aria-label="Expandable payroll runs">
        {records.map((record) => (
          <details key={record.id} open={record.id === activeRecord?.id} onToggle={(event) => event.currentTarget.open && setSelectedId(record.id)}>
            <summary>
              <span><small>{record.period} · {payrollType(record)}</small><strong>{record.id}</strong><em>{record.runStatus}</em></span>
              <b>{record.amount}</b>
            </summary>
            <MobileFacts rows={[
              ['Pay date', record.period],
              ['Pay period', record.period],
              ['Employees paid', records.filter((item) => item.period === record.period).length],
              ['Gross payroll', unavailable],
              ['Net payroll', record.amount],
              ['Status', record.runStatus],
              ['Run type', payrollType(record)],
            ]} />
            <section className="mobile-paycheck-card">
              <header><span>Employee paycheck</span><strong>{record.employee}</strong></header>
              <MobileFacts rows={[
                ['Employee ID', employees.find((item) => item.name === record.employee)?.id ?? employees[0]?.id],
                ['Gross pay', unavailable],
                ['Deductions', unavailable],
                ['Net pay', record.amount],
                ['Payment status', record.runStatus],
                ['Bank Code', record.bankCode, <QuickPinButton key="bank" label="Bank Code" value={record.bankCode} sourceTool="Payroll History" sourceRecordId={record.id} quickPin={quickPin} />],
                ['Destination ID', record.destinationId, <QuickPinButton key="destination" label="Destination ID" value={record.destinationId} sourceTool="Payroll History" sourceRecordId={record.id} quickPin={quickPin} />],
                ['Change comparison', record.changeComparison],
              ]} />
            </section>
            <MobilePaymentSourceHandoff
              source={record.paymentSource}
              activeCase={activeCase}
              openTool={openTool}
              quickPin={quickPin}
              sourceTool="Payroll History"
              sourceLabel="Payroll History"
              sourceRecordId={record.id}
            />
            <div className="mobile-reference-inline-actions"><button type="button" onClick={() => pin(record.id)}>Pin evidence</button><button type="button" onClick={() => saveNote(`Payroll run ${record.id} reviewed.`, 'Payroll history')}>Add note</button></div>
          </details>
        ))}
        {!records.length && <p className="mobile-reference-empty">No payroll run is supplied in this case.</p>}
      </section>

      <nav className="mobile-reference-routes"><button type="button" onClick={() => openTool('Employee Profile')}>Employee Profile</button><button type="button" onClick={() => openTool('Payment Verification')}>Payment Verification</button><button type="button" onClick={() => openTool('Timeline')}>Timeline</button></nav>
      <ReviewFooter title="Payroll History" reviewed={reviewed} onReview={() => markReviewed('Payroll History')} onDecision={jumpDecision} />
    </section>
  );
}
