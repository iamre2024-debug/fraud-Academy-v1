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

function QuickPinButton({
  label,
  value,
  sourceTool,
  sourceRecordId = '',
  queryHint = '',
  useTool = '',
  openAction = '',
  openTargetTool = '',
  quickPin,
}) {
  if (!value || !quickPin || /not (?:supplied|available|applicable|recorded)/i.test(String(value))) return null;
  return (
    <button
      type="button"
      className="mobile-inline-quick-pin"
      aria-label={`Pin ${label} ${value} to Quick Pad`}
      onClick={() => quickPin({
        label,
        value,
        sourceTool,
        sourceRecordId,
        queryHint,
        useTool,
        openAction,
        openTargetTool,
      })}
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
        ['Bank Code', source.bankCode, <QuickPinButton key="bank" label="Bank Code" value={source.bankCode} sourceTool={sourceTool} sourceRecordId={recordId} queryHint={hint} useTool="Payment Verification" openAction="source-query" openTargetTool="Payment Verification" quickPin={quickPin} />],
        ['Destination ID', source.destinationId, <QuickPinButton key="destination" label="Destination ID" value={source.destinationId} sourceTool={sourceTool} sourceRecordId={recordId} queryHint={hint} useTool="Payment Verification" openAction="source-query" openTargetTool="Payment Verification" quickPin={quickPin} />],
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

function readableKey(value = '') {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function recordTimestamp(value) {
  if (!value) return Number.NaN;
  const normalized = String(value)
    .replace(/\s+·.*$/, '')
    .replace(/\s+-\s+\d{1,2}:\d{2}.*$/i, '')
    .trim();
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function recordDateValue(record = {}) {
  return record.posted ?? record.observed ?? record.period ?? record.date ?? record.time;
}

function periodKey(timestamp, period) {
  const date = new Date(timestamp);
  if (period === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  if (period === 'week') {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));
    return start.toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString().slice(0, 10);
}

function periodLabel(timestamp, period) {
  const date = new Date(timestamp);
  if (period === 'month') return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date);
  if (period === 'week') return `Wk ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)}`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function buildActualSeries(records, period = 'day', amountAccessor = (record) => record.amount) {
  const buckets = new Map();
  records.forEach((record) => {
    const timestamp = recordTimestamp(recordDateValue(record));
    if (!Number.isFinite(timestamp)) return;
    const key = periodKey(timestamp, period);
    const current = buckets.get(key) ?? { key, timestamp, value: 0, count: 0 };
    current.timestamp = Math.min(current.timestamp, timestamp);
    current.value += moneyNumber(amountAccessor(record));
    current.count += 1;
    buckets.set(key, current);
  });
  const limit = period === 'day' ? 14 : period === 'week' ? 8 : 6;
  return [...buckets.values()]
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-limit)
    .map((item) => ({ ...item, label: periodLabel(item.timestamp, period) }));
}

function latestRecord(records) {
  return records
    .map((record) => ({ record, timestamp: recordTimestamp(recordDateValue(record)) }))
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)[0] ?? null;
}

function sumLatestPeriod(records, period, amountAccessor = (record) => record.amount) {
  const latest = latestRecord(records);
  if (!latest) return 0;
  const latestKey = periodKey(latest.timestamp, period);
  return records.reduce((total, record) => {
    const timestamp = recordTimestamp(recordDateValue(record));
    return Number.isFinite(timestamp) && periodKey(timestamp, period) === latestKey
      ? total + moneyNumber(amountAccessor(record))
      : total;
  }, 0);
}

function DossierBars({ series, label }) {
  if (!series.length) return <p className="dossier-v2-empty-chart">No dated records are supplied for this view.</p>;
  const maximum = Math.max(...series.map((item) => item.value), 1);
  return (
    <div className="dossier-v2-bars" role="img" aria-label={label}>
      {series.map((item) => (
        <div key={item.key} title={`${item.label}: ${money(item.value)} · ${item.count} record${item.count === 1 ? '' : 's'}`}>
          <span><i style={{ '--dossier-bar-height': `${Math.max(9, (item.value / maximum) * 100)}%` }} /></span>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function DossierMetric({ label, value, note, tone = 'blue' }) {
  return (
    <article className={`dossier-v2-metric dossier-v2-tone-${tone}`}>
      <span>{label}</span>
      <strong>{display(value)}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function DossierSection({ eyebrow, title, icon = '✦', children, className = '' }) {
  return (
    <section className={`dossier-v2-section ${className}`.trim()}>
      <header className="dossier-v2-section-heading">
        <span aria-hidden="true">{icon}</span>
        <div><h3>{title}</h3>{eyebrow && <p>{eyebrow}</p>}</div>
      </header>
      {children}
    </section>
  );
}

function ProductGrid({ products, sourceTool, quickPin, pin }) {
  return (
    <div className="dossier-v2-products">
      {products.map((product) => (
        <article key={product.id} data-customer-account={product.id}>
          <header>
            <span aria-hidden="true">{/credit|card|line/i.test(product.product) ? '▣' : /loan/i.test(product.product) ? '◆' : '▤'}</span>
            <div><strong>{product.product}</strong><small>{product.maskedNumber ?? product.id}</small></div>
            <QuickPinButton label="Account ID" value={product.id} sourceTool={sourceTool} sourceRecordId={product.id} quickPin={quickPin} />
          </header>
          <dl>
            <div><dt>Status</dt><dd>{display(product.status)}</dd></div>
            <div><dt>Balance</dt><dd>{display(product.balance)}</dd></div>
            {product.limit && !/not applicable/i.test(product.limit) && <div><dt>Limit</dt><dd>{display(product.limit)}</dd></div>}
          </dl>
          <button type="button" onClick={() => pin(`${product.id} · ${product.product}`)}>Pin evidence</button>
        </article>
      ))}
      {!products.length && <p className="mobile-reference-empty">No applicable products are supplied in this case.</p>}
    </div>
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
  const devices = [...new Map((activeCase.loginHistory ?? [])
    .filter((item) => item.deviceId ?? item.device)
    .map((item) => [item.deviceId ?? item.device, item])).values()];
  const relationshipRows = Object.entries(dossier.relationship ?? {});

  return (
    <section
      className="mobile-reference-tool mobile-customer-360 dossier-v2 dossier-v2-customer"
      data-mobile-reference-tool="Customer 360"
      data-customer-360-screen="approved-theme-v2"
      data-case-id={activeCase.id}
    >
      <section className="dossier-v2-hero dossier-v2-person-hero">
        <div className="dossier-v2-avatar" aria-hidden="true">
          {activeCase.person.split(' ').map((part) => part[0]).join('').slice(0, 2)}
        </div>
        <div className="dossier-v2-hero-copy">
          <p><span>Personal</span> {activeCase.status}</p>
          <h2>{activeCase.person}</h2>
          <small>Customer since {activeCase.customer?.relationshipSince ?? unavailable}</small>
          <div className="dossier-v2-id-line">
            <span>Customer ID · {display(customerId)}</span>
            <QuickPinButton label="Customer ID" value={customerId} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
          <div className="dossier-v2-id-line">
            <span>Training ID · {display(activeCase.trainingId)}</span>
            <QuickPinButton label="Training ID" value={activeCase.trainingId} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
        </div>
        <button className="dossier-v2-evidence-button" type="button" onClick={() => pin(`${activeCase.id} · ${activeCase.person}`)}>Pin profile evidence</button>
        <div className="dossier-v2-contact-grid">
          <div><span>Date of birth</span><strong>{display(dossier.identity.dob)}</strong></div>
          <div className="wide"><span>Address</span><strong>{display(dossier.contact.physicalAddress)}</strong></div>
          <div>
            <span>Phone</span><strong>{display(contact.phone ?? dossier.contact.homePhone)}</strong>
            <QuickPinButton label="Phone number" value={contact.phone ?? dossier.contact.homePhone} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
          <div>
            <span>Email</span><strong>{display(contact.email)}</strong>
            <QuickPinButton label="Email" value={contact.email} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
        </div>
      </section>

      <div className="dossier-v2-pair">
        <DossierSection eyebrow={`${profileChanges.length} recorded change${profileChanges.length === 1 ? '' : 's'}`} title="Profile updates" icon="▣">
          <div className="dossier-v2-compact-list">
            {profileChanges.slice(0, 4).map((event) => (
              <article key={event.id} data-profile-event={event.id}>
                <span>{event.date}</span>
                <div><strong>{event.item}</strong><small>{event.oldValue ?? 'Not supplied'} → {event.newValue ?? event.detail}</small></div>
                <button type="button" onClick={() => saveNote(`Customer 360 profile event ${event.id}: ${event.item}.`, 'Customer profile event')}>Note</button>
              </article>
            ))}
            {!profileChanges.length && <p className="dossier-v2-empty">No profile updates are supplied.</p>}
          </div>
        </DossierSection>

        <DossierSection eyebrow={`${devices.length} device record${devices.length === 1 ? '' : 's'}`} title="Trusted devices & security" icon="🛡">
          <div className="dossier-v2-device-list">
            {devices.slice(0, 4).map((device) => (
              <article key={device.deviceId ?? device.device}>
                <span aria-hidden="true">▱</span>
                <div><strong>{device.device}</strong><small>{device.deviceId ?? 'Device ID not supplied'} · {device.result}</small></div>
                <QuickPinButton label="Device ID" value={device.deviceId ?? device.device} sourceTool="Customer 360" sourceRecordId={device.id} quickPin={quickPin} />
              </article>
            ))}
          </div>
          <dl className="dossier-v2-mini-facts">
            <div><dt>MFA</dt><dd>{display(dossier.security.mfaStatus)}</dd></div>
            <div><dt>Password</dt><dd>{display(dossier.security.passwordChanged)}</dd></div>
            <div><dt>Security alerts</dt><dd>{display(dossier.security.alerts)}</dd></div>
          </dl>
        </DossierSection>
      </div>

      <div className="dossier-v2-pair dossier-v2-products-pair">
        <DossierSection eyebrow={`${dossier.products.length} relationship product${dossier.products.length === 1 ? '' : 's'}`} title="Accounts & products" icon="◇">
          <ProductGrid products={dossier.products} sourceTool="Customer 360" quickPin={quickPin} pin={pin} />
        </DossierSection>
        <DossierSection eyebrow="Established service context" title="Relationship details" icon="☆">
          <dl className="dossier-v2-mini-facts">
            {relationshipRows.map(([key, value]) => <div key={key}><dt>{readableKey(key)}</dt><dd>{display(value)}</dd></div>)}
          </dl>
        </DossierSection>
      </div>

      {paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <details className="dossier-v2-disclosure">
          <summary><span>↗</span><strong>Payment Verification Inputs</strong><small>Recorded Bank Code and Destination ID</small></summary>
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
        </details>
      )}

      <DossierSection eyebrow="Customer service and investigator-authored notes remain separate" title="Recent contact notes" icon="✎">
        <div className="dossier-v2-contact-notes">
          {dossier.recentContacts.map((item) => (
            <article key={item.id}>
              <span>{item.dateTime} · {item.channel}</span>
              <strong>{item.type}</strong>
              <p>{item.notes}</p>
              <small>{item.outcome}{item.agent ? ` · ${item.agent}` : ''}</small>
            </article>
          ))}
          {notes.map((note, index) => <article key={`${note}-${index}`} className="investigator"><span>Investigator notebook</span><p>{note}</p></article>)}
        </div>
        <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Customer 360 reviewed for ${activeCase.person}.`, 'Customer 360')}>Add review note</button>
      </DossierSection>

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
  const creditProducts = dossier.products.filter((product) => /credit|loan|line/i.test(product.product));
  const accountProducts = dossier.products.filter((product) => !creditProducts.includes(product));
  const ownerName = activeCase.businessProfile?.ownerName ?? workspace.profile.owner ?? activeCase.person;
  const ownerPercentage = activeCase.businessProfile?.ownershipPercentage ?? 'Percentage not supplied';
  const businessChanges = activeCase.customer?.profileChanges ?? [];
  const businessNotes = (activeCase.intakeAnswers ?? []).slice(0, 4);
  const latestPayroll = latestRecord(payroll);

  return (
    <section
      className="mobile-reference-tool mobile-business-360 dossier-v2 dossier-v2-business"
      data-mobile-reference-tool="Business 360"
      data-business-360-screen="approved-mobile-reference-v2"
      data-case-id={activeCase.id}
    >
      <section className="dossier-v2-hero dossier-v2-business-hero">
        <div className="dossier-v2-business-mark" aria-hidden="true">▥</div>
        <div className="dossier-v2-hero-copy">
          <p><span>Business</span> {activeCase.status}</p>
          <h2>{workspace.profile.entity}</h2>
          <small>{workspace.profile.entityType} · Client since {activeCase.businessProfile?.clientSince ?? workspace.profile.filingDate ?? workspace.profile.observed}</small>
          <div className="dossier-v2-id-line">
            <span>Business ID · {businessId}</span>
            <QuickPinButton label="Business ID" value={businessId} sourceTool="Business 360" quickPin={quickPin} />
          </div>
          <div className="dossier-v2-id-line"><span>EIN / training equivalent · {display(workspace.profile.ein)}</span></div>
        </div>
        <button className="dossier-v2-evidence-button" type="button" onClick={() => pin(`${businessId} · ${workspace.profile.entity}`)}>Pin business evidence</button>
      </section>

      <section className="dossier-v2-business-contact">
        <div>
          <span>Business address</span><strong>{display(contact.address)}</strong>
          <span>Business phone</span>
          <strong className="with-action">{display(contact.phone)}<QuickPinButton label="Phone number" value={contact.phone} sourceTool="Business 360" quickPin={quickPin} /></strong>
          <span>Business email</span>
          <strong className="with-action">{display(contact.email)}<QuickPinButton label="Email" value={contact.email} sourceTool="Business 360" quickPin={quickPin} /></strong>
        </div>
        <div>
          <span>Owner</span><strong>{display(ownerName)}</strong>
          <span>Ownership</span><strong>{display(ownerPercentage)}</strong>
          <span>Owner address</span><strong>{display(contact.ownerAddress)}</strong>
          <span>Owner phone & email</span><strong>{display(activeCase.businessProfile?.ownerPhone ?? activeCase.customer?.contact?.phone)} · {display(activeCase.businessProfile?.ownerEmail ?? activeCase.customer?.contact?.email)}</strong>
        </div>
      </section>

      <DossierSection eyebrow="Factual registration and operating details" title="Business profile" icon="▥">
        <dl className="dossier-v2-mini-facts dossier-v2-mini-facts-two">
          <div><dt>Legal name</dt><dd>{display(workspace.profile.entity)}</dd></div>
          <div><dt>Industry</dt><dd>{display(activeCase.businessProfile?.industry ?? workspace.profile.entityType)}</dd></div>
          <div><dt>Registration</dt><dd>{display(workspace.profile.registration)}</dd></div>
          <div><dt>Registered agent</dt><dd>{display(workspace.profile.registeredAgent)}</dd></div>
          <div><dt>Officer / role</dt><dd>{display(workspace.profile.officer ?? activeCase.profile?.entityRole)}</dd></div>
          <div><dt>Website</dt><dd>{display(activeCase.businessProfile?.website)}</dd></div>
        </dl>
      </DossierSection>

      <div className="dossier-v2-pair dossier-v2-products-pair">
        <DossierSection eyebrow="Deposit and service relationships" title="Business products & accounts" icon="▤">
          <ProductGrid products={accountProducts} sourceTool="Business 360" quickPin={quickPin} pin={pin} />
          <div className="dossier-v2-relationship-list">
            {workspace.relationships.slice(0, 4).map((item) => (
              <article key={item.id}>
                <div><strong>{item.entity}</strong><small>{item.id} · {item.relationship}</small></div>
                <span>{display(item.status)}</span>
              </article>
            ))}
          </div>
        </DossierSection>
        <DossierSection eyebrow="Credit products remain distinct from operating accounts" title="Credit & loans" icon="◇">
          <ProductGrid products={creditProducts} sourceTool="Business 360" quickPin={quickPin} pin={pin} />
        </DossierSection>
      </div>

      {workspace.paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <details className="dossier-v2-disclosure">
          <summary><span>↗</span><strong>Payment Verification Inputs</strong><small>Recorded business payment destination</small></summary>
          <MobilePaymentSourceHandoff
            source={workspace.paymentSource}
            activeCase={activeCase}
            openTool={openTool}
            quickPin={quickPin}
            sourceTool="Business 360"
            sourceLabel="Business 360"
          />
        </details>
      )}

      {isPayroll && (
        <DossierSection eyebrow="Compact payroll overview" title="Payroll overview" icon="↗">
          <section className="dossier-v2-metric-grid dossier-v2-four">
            <DossierMetric label="Total payroll" value={payrollTotal ? money(payrollTotal) : unavailable} />
            <DossierMetric label="Employees paid" value={employeeCount || unavailable} tone="teal" />
            <DossierMetric label="Frequency" value={activeCase.businessProfile?.payrollFrequency ?? 'Per recorded cycle'} tone="violet" />
            <DossierMetric label="Latest payroll" value={latestPayroll?.record?.period ?? unavailable} tone="pink" />
          </section>
          <button type="button" className="mobile-reference-primary" onClick={() => openTool('Payroll History')}>Open detailed Payroll History</button>
        </DossierSection>
      )}

      <div className="dossier-v2-pair">
        <DossierSection eyebrow={`${businessChanges.length} factual event${businessChanges.length === 1 ? '' : 's'}`} title="Business updates" icon="✦">
          <div className="dossier-v2-compact-list">
            {businessChanges.slice(0, 5).map((item) => (
              <article key={item.id}>
                <span>{item.date}</span>
                <div><strong>{item.item}</strong><small>{item.oldValue ?? 'Not supplied'} → {item.newValue ?? item.detail}</small></div>
              </article>
            ))}
            {!businessChanges.length && <p className="dossier-v2-empty">No business profile changes are supplied.</p>}
          </div>
        </DossierSection>
        <DossierSection eyebrow="Recorded intake and servicing context" title="Recent notes" icon="✎">
          <div className="dossier-v2-contact-notes">
            {businessNotes.map((item) => <article key={item.id}><span>Business contact note</span><p>{item.answer}</p></article>)}
            {!businessNotes.length && <article><span>Business profile record</span><p>{display(workspace.profile.contact)}</p></article>}
          </div>
          <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Business 360 reviewed for ${workspace.profile.entity}.`, 'Business 360')}>Add business note</button>
        </DossierSection>
      </div>

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
  const [spendingPeriod, setSpendingPeriod] = useState('day');
  const workspace = getFinancialInvestigation(activeCase);
  const transactions = getTransactionHistory(activeCase);
  const payroll = getPayrollHistory(activeCase);
  const financialRecords = getFinancialRecords(activeCase);
  const isPayroll = activeCase.claimTypeId === 'payroll-direct-deposit' || activeCase.taxonomyTags?.productRail === 'payroll';
  const outgoing = workspace.profile.monthlyOutflow;
  const incoming = workspace.profile.monthlyDeposits;
  const merchantTotals = totalsBy(transactions, 'merchant');
  const categoryTotals = totalsBy(transactions, 'category');
  const payrollTotal = payroll.reduce((total, item) => total + moneyNumber(item.amount), 0);
  const transactionSeries = buildActualSeries(transactions, spendingPeriod);
  const dailySeries = buildActualSeries(transactions, 'day');
  const latestDay = dailySeries[dailySeries.length - 1];
  const latestWeekTotal = sumLatestPeriod(transactions, 'week');
  const latestMonthTotal = sumLatestPeriod(transactions, 'month');
  const latestTransaction = latestRecord(transactions);
  const accountId = activeCase.accountId
    ?? activeCase.customer?.relationship?.find((item) => item.label === 'Account ID')?.value;
  const paymentSource = financialRecords.paymentVerification?.[0] ?? null;
  const recurringMerchants = [...new Set(transactions
    .filter((item) => /recurring/i.test(`${item.channel} ${item.category}`))
    .map((item) => item.merchant)
    .filter(Boolean))];
  const cashRecords = workspace.recordsByTab.cash ?? [];
  const digitalRecords = workspace.recordsByTab.digital ?? [];
  const transferRecords = workspace.recordsByTab['funds-flow'] ?? [];
  const depositRecords = workspace.recordsByTab.deposits ?? [];
  const cashTotal = cashRecords.reduce((total, record) => total + moneyNumber(record.value), 0);
  const digitalTotal = digitalRecords.reduce((total, record) => total + moneyNumber(record.value), 0);
  const depositTotal = depositRecords.reduce((total, record) => total + moneyNumber(record.value), 0);
  const recentTransactions = [...transactions]
    .sort((left, right) => {
      const leftTime = recordTimestamp(recordDateValue(left));
      const rightTime = recordTimestamp(recordDateValue(right));
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return rightTime - leftTime;
      if (Number.isFinite(rightTime)) return 1;
      if (Number.isFinite(leftTime)) return -1;
      return 0;
    })
    .slice(0, 6);

  if (isPayroll) {
    const payrollSeries = buildActualSeries(payroll, spendingPeriod);
    const employeeCount = new Set(payroll.map((item) => item.employee).filter(Boolean)).size;
    const returnedCount = payroll.filter((item) => /return|failed|rejected/i.test(item.runStatus)).length;
    const payrollChanges = activeCase.customer?.profileChanges ?? [];
    const newHires = payrollChanges.filter((item) => /new hire|employment start|hired/i.test(`${item.eventType} ${item.item} ${item.detail}`));
    const terminations = payrollChanges.filter((item) => /terminat|employment end/i.test(`${item.eventType} ${item.item} ${item.detail}`));
    const payRateChanges = payrollChanges.filter((item) => /pay rate|salary|compensation/i.test(`${item.eventType} ${item.item} ${item.detail}`));
    const offCycle = payroll.filter((item) => /off.?cycle/i.test(`${item.context} ${item.changeRequest}`));
    const payrollCategories = [...payroll.reduce((totals, item) => {
      const label = payrollType(item);
      totals.set(label, (totals.get(label) ?? 0) + moneyNumber(item.amount));
      return totals;
    }, new Map()).entries()].sort((left, right) => right[1] - left[1]);
    const businessName = activeCase.profile?.business ?? getBusiness360Workspace(activeCase).profile.entity;
    const latestPayroll = latestRecord(payroll);

    return (
      <section
        className="mobile-reference-tool mobile-financial-payroll dossier-v2 dossier-v2-financial"
        data-mobile-reference-tool="Financial Investigation"
        data-financial-investigation-screen="approved-mobile-reference-v2"
        data-case-id={activeCase.id}
      >
        <section className="dossier-v2-financial-hero">
          <div>
            <p>Payroll Business</p>
            <h2>{businessName}</h2>
            <small>{workspace.profile.accountType} · {workspace.profile.accountStatus}</small>
            <div className="dossier-v2-id-line">
              <span>Account ID · {display(accountId ?? workspace.profile.account)}</span>
              <QuickPinButton label="Account ID" value={accountId ?? workspace.profile.account} sourceTool="Financial Investigation" quickPin={quickPin} />
            </div>
          </div>
          <aside aria-label="Luna factual guidance"><span aria-hidden="true">🐱</span><strong>Luna</strong><small>Recorded payroll facts only</small></aside>
          <button type="button" onClick={() => pin(`${accountId ?? workspace.profile.account} · ${businessName}`)}>Pin account evidence</button>
        </section>

        <DossierSection eyebrow="Recorded payroll activity overview" title="Payroll Overview" icon="▣">
          <section className="dossier-v2-metric-grid dossier-v2-four">
            <DossierMetric label="Payroll total" value={payrollTotal ? money(payrollTotal) : unavailable} />
            <DossierMetric label="Employees paid" value={employeeCount || unavailable} tone="teal" />
            <DossierMetric label="Payroll frequency" value={activeCase.businessProfile?.payrollFrequency ?? 'Per recorded cycle'} tone="violet" />
            <DossierMetric label="Returned payments" value={returnedCount} tone="pink" />
          </section>
          <div className="dossier-v2-pair dossier-v2-financial-pair">
            <div className="dossier-v2-chart-card">
              <header><div><strong>Payroll trend</strong><small>{payrollSeries.length} recorded period{payrollSeries.length === 1 ? '' : 's'}</small></div></header>
              <DossierBars series={payrollSeries} label={`Payroll amounts grouped by ${spendingPeriod}`} />
            </div>
            <dl className="dossier-v2-change-list">
              <div><dt>New hires</dt><dd>{newHires.length}</dd></div>
              <div><dt>Terminations</dt><dd>{terminations.length}</dd></div>
              <div><dt>Pay-rate changes</dt><dd>{payRateChanges.length}</dd></div>
              <div><dt>Latest pay date</dt><dd>{display(latestPayroll?.record?.period)}</dd></div>
            </dl>
          </div>
        </DossierSection>

        <DossierSection eyebrow="Business account spending insights" title="Spending Analysis" icon="◇">
          <nav className="dossier-v2-period-tabs" aria-label="Payroll spending period">
            {['day', 'week', 'month'].map((period) => (
              <button key={period} type="button" className={spendingPeriod === period ? 'active' : ''} onClick={() => setSpendingPeriod(period)}>{readableKey(period)}</button>
            ))}
          </nav>
          <div className="dossier-v2-pair dossier-v2-financial-pair">
            <div className="dossier-v2-chart-card">
              <header><div><strong>Payroll spending over time</strong><small>Amounts from payroll records</small></div></header>
              <DossierBars series={payrollSeries} label={`Payroll spending grouped by ${spendingPeriod}`} />
            </div>
            <div className="dossier-v2-ranking">
              <header><strong>Payroll categories</strong><small>Recorded pay-cycle types</small></header>
              {payrollCategories.map(([label, total], index) => (
                <article key={label}>
                  <span>{label}</span><strong>{money(total)}</strong>
                  <i style={{ '--dossier-rank-width': `${Math.max(12, (total / (payrollCategories[0]?.[1] || 1)) * 100)}%` }} />
                  <small>#{index + 1}</small>
                </article>
              ))}
              {!payrollCategories.length && <p className="dossier-v2-empty">No payroll category records are supplied.</p>}
            </div>
          </div>
        </DossierSection>

        <DossierSection eyebrow="Recorded insights · no conclusions provided" title="Payroll fact check" icon="✦">
          <section className="dossier-v2-fact-check">
            <article><span>Off-cycle payments</span><strong>{offCycle.length} recorded</strong><small>{offCycle.map((item) => item.id).join(' · ') || 'No off-cycle item supplied'}</small></article>
            <article><span>Pay-rate variance</span><strong>{payRateChanges.length} change{payRateChanges.length === 1 ? '' : 's'}</strong><small>Open factual profile history for details</small></article>
            <article><span>Returned payroll</span><strong>{returnedCount} payment{returnedCount === 1 ? '' : 's'}</strong><small>Status is taken from recorded payroll runs</small></article>
          </section>
        </DossierSection>

        <DossierSection eyebrow="Expandable source records" title="Payroll amount by pay cycle" icon="↗">
          <div className="dossier-v2-pay-cycle-list">
            {payroll.map((item, index) => (
              <details key={item.id} open={index === 0}>
                <summary>
                  <span><small>{item.period} · {payrollType(item)}</small><strong>{item.amount}</strong><em>{item.runStatus}</em></span>
                  <QuickPinButton label="Destination ID" value={item.destinationId} sourceTool="Financial Investigation" sourceRecordId={item.id} quickPin={quickPin} />
                </summary>
                <MobileFacts rows={[
                  ['Employee', item.employee],
                  ['Bank Code', item.bankCode, <QuickPinButton key="bank" label="Bank Code" value={item.bankCode} sourceTool="Financial Investigation" sourceRecordId={item.id} quickPin={quickPin} />],
                  ['Destination ID', item.destinationId],
                  ['Change request', item.changeRequest],
                  ['Callback record', item.callback],
                  ['Context', item.context],
                ]} />
                <div className="mobile-reference-inline-actions">
                  <button type="button" onClick={() => pin(item.id)}>Pin evidence</button>
                  <button type="button" onClick={() => saveNote(`Payroll cycle ${item.id} reviewed.`, 'Financial investigation')}>Add note</button>
                </div>
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
            {!payroll.length && <p className="mobile-reference-empty">No payroll cycle is supplied in this case.</p>}
          </div>
        </DossierSection>
        <nav className="mobile-reference-routes"><button type="button" onClick={() => openTool('Payroll History')}>Payroll History</button><button type="button" onClick={() => openTool('Employee Profile')}>Employee Profile</button><button type="button" onClick={() => openTool('Payment Verification')}>Payment Verification</button></nav>
        <ReviewFooter title="Financial Investigation" reviewed={reviewed} onReview={() => markReviewed('Financial Investigation')} onDecision={jumpDecision} />
      </section>
    );
  }

  return (
    <section
      className="mobile-reference-tool mobile-financial-personal dossier-v2 dossier-v2-financial"
      data-mobile-reference-tool="Financial Investigation"
      data-financial-investigation-screen="approved-mobile-reference-v2"
      data-case-id={activeCase.id}
    >
      <section className="dossier-v2-financial-hero">
        <div>
          <p>Personal</p>
          <h2>{activeCase.person}</h2>
          <small>{workspace.profile.account} · {workspace.profile.accountStatus}</small>
          <div className="dossier-v2-id-line">
            <span>Account ID · {display(accountId)}</span>
            <QuickPinButton label="Account ID" value={accountId} sourceTool="Financial Investigation" quickPin={quickPin} />
          </div>
        </div>
        <aside aria-label="Luna factual guidance"><span aria-hidden="true">🐱</span><strong>Luna</strong><small>Factual account activity</small></aside>
        <button type="button" onClick={() => pin(`${accountId ?? workspace.profile.account} · ${activeCase.person}`)}>Pin account evidence</button>
      </section>

      <DossierSection eyebrow="Recorded account activity overview" title="Account Review" icon="▣">
        <section className="dossier-v2-metric-grid dossier-v2-four">
          <DossierMetric label="Incoming funds" value={money(incoming)} note="Current comparison period" />
          <DossierMetric label="Outgoing funds" value={money(outgoing)} note="Current comparison period" tone="pink" />
          <DossierMetric label="Net movement" value={money(incoming - outgoing)} note="Incoming minus outgoing" tone="teal" />
          <DossierMetric label="Average balance" value={money(workspace.profile.averageBalance)} note={workspace.profile.relationshipLength} tone="violet" />
        </section>
        <dl className="dossier-v2-account-strip">
          <div><dt>Product</dt><dd>{display(workspace.profile.accountType)}</dd></div>
          <div><dt>Available</dt><dd>{money(workspace.profile.availableBalance)}</dd></div>
          <div><dt>Standing</dt><dd>{display(workspace.profile.accountStatus)}</dd></div>
          <div><dt>NSF / overdraft</dt><dd>{display(workspace.profile.overdraft)}</dd></div>
        </dl>
      </DossierSection>

      <DossierSection eyebrow="Amounts are grouped from posted transaction records" title="Spending Analysis" icon="◇">
        <nav className="dossier-v2-period-tabs" aria-label="Spending analysis period">
          {['day', 'week', 'month'].map((period) => (
            <button key={period} type="button" className={spendingPeriod === period ? 'active' : ''} onClick={() => setSpendingPeriod(period)}>{readableKey(period)}</button>
          ))}
        </nav>
        <section className="dossier-v2-period-totals">
          <div><span>Latest day</span><strong>{money(latestDay?.value ?? 0)}</strong><small>{latestDay?.label ?? 'No dated record'}</small></div>
          <div><span>Latest record week</span><strong>{money(latestWeekTotal)}</strong><small>Same Monday–Sunday period as latest record</small></div>
          <div><span>Latest record month</span><strong>{money(latestMonthTotal)}</strong><small>{latestTransaction ? periodLabel(latestTransaction.timestamp, 'month') : 'No dated record'}</small></div>
        </section>
        <div className="dossier-v2-pair dossier-v2-financial-pair">
          <div className="dossier-v2-chart-card">
            <header><div><strong>Spending over time</strong><small>{transactions.length} posted transaction record{transactions.length === 1 ? '' : 's'}</small></div></header>
            <DossierBars series={transactionSeries} label={`Posted spending grouped by ${spendingPeriod}`} />
          </div>
          <div className="dossier-v2-ranking">
            <header><strong>Top merchants</strong><small>Actual posted totals</small></header>
            {merchantTotals.slice(0, 5).map(([merchant, total], index) => (
              <article key={merchant}>
                <span>{merchant}</span><strong>{money(total)}</strong>
                <i style={{ '--dossier-rank-width': `${Math.max(12, (total / (merchantTotals[0]?.[1] || 1)) * 100)}%` }} />
                <small>#{index + 1}</small>
              </article>
            ))}
            {!merchantTotals.length && <p className="dossier-v2-empty">No merchant records are supplied.</p>}
          </div>
        </div>
      </DossierSection>

      <section className="dossier-v2-behavior-grid" aria-label="Recorded spending behavior">
        <DossierMetric label="Recurring merchants" value={recurringMerchants.length} note={recurringMerchants.join(' · ') || 'None in current records'} />
        <DossierMetric label="Payroll / deposits" value={money(depositTotal)} note={`${depositRecords.length} record${depositRecords.length === 1 ? '' : 's'}`} tone="teal" />
        <DossierMetric label="Transfer behavior" value={`${transferRecords.length} step${transferRecords.length === 1 ? '' : 's'}`} note={transferRecords[0]?.title ?? 'No recorded transfer step'} tone="violet" />
        <DossierMetric label="Cash withdrawals" value={money(cashTotal)} note={`${cashRecords.length} record${cashRecords.length === 1 ? '' : 's'}`} tone="pink" />
        <DossierMetric label="Digital wallet activity" value={money(digitalTotal)} note={`${digitalRecords.length} digital record${digitalRecords.length === 1 ? '' : 's'}`} />
        <DossierMetric label="Categories" value={categoryTotals.length} note={categoryTotals.slice(0, 3).map(([label]) => label).join(' · ') || 'No category record'} tone="teal" />
      </section>

      <DossierSection eyebrow="Case-linked transaction records" title="Recent account activity" icon="↗">
        <div className="dossier-v2-transaction-list">
          {recentTransactions.map((record) => (
            <article key={record.id}>
              <div><span>{display(record.posted)} · {display(record.category)}</span><strong>{display(record.merchant)}</strong><small>{record.id} · {display(record.channel)}</small></div>
              <b>{display(record.amount)}</b>
              <div className="dossier-v2-row-actions">
                <QuickPinButton label="Transaction ID" value={record.id} sourceTool="Financial Investigation" sourceRecordId={record.id} quickPin={quickPin} />
                <button type="button" onClick={() => pin(record.id)}>Pin evidence</button>
              </div>
            </article>
          ))}
          {!recentTransactions.length && <p className="mobile-reference-empty">No transaction records are supplied.</p>}
        </div>
      </DossierSection>

      {paymentSource && activeCase.availableTools?.includes('Payment Verification') && (
        <details className="dossier-v2-disclosure">
          <summary><span>↗</span><strong>Payment Verification Inputs</strong><small>Search the recorded payment source without leaving this tool</small></summary>
          <MobilePaymentSourceHandoff
            source={paymentSource}
            activeCase={activeCase}
            openTool={openTool}
            quickPin={quickPin}
            sourceTool="Financial Investigation"
            sourceLabel="Financial Investigation"
            ownerName={activeCase.person}
          />
        </details>
      )}

      <section className="dossier-v2-luna-caption">
        <span aria-hidden="true">✦</span>
        <div><strong>Activity summary</strong><p>{transactions.length} posted transaction record{transactions.length === 1 ? '' : 's'} and {merchantTotals.length} merchant total{merchantTotals.length === 1 ? '' : 's'} are available for review. No investigative conclusion is generated here.</p></div>
      </section>

      <button type="button" className="mobile-reference-secondary" onClick={() => saveNote(`Financial Investigation reviewed for ${activeCase.id}.`, 'Financial investigation')}>Add section note</button>
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
