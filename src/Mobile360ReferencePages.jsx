import { useEffect, useMemo, useRef, useState } from 'react';
import { getBusiness360Dossier } from './data/business360Dossier.js';
import { getCustomer360Dossier } from './data/customer360Dossier.js';
import { formatMoney } from './data/relationshipAccounts.js';

const unavailable = 'Not available in the current training record';

function display(value, fallback = unavailable) {
  if (Array.isArray(value)) return value.filter(Boolean).join(' · ') || fallback;
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function isAvailable(value) {
  return Boolean(value)
    && !/not (?:available|applicable|recorded|supplied)|no .* (?:record|supplied)/i.test(String(value));
}

function readableKey(value = '') {
  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function initials(value = '') {
  return String(value)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'FA';
}

function stableNumber(value = '') {
  return [...String(value)].reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) % 10000,
    19,
  );
}

function accountRoute(account, available) {
  const routes = /credit|loan|line/i.test(`${account.productKind} ${account.productLabel}`)
    ? ['Financial Investigation', 'Transaction History']
    : ['Transaction History', 'Financial Investigation'];
  return routes.find((route) => available.has(route)) ?? null;
}

function isCreditAccount(account) {
  return /credit|loan|line/i.test(`${account.productKind} ${account.productLabel}`);
}

function accountAmount(account) {
  if (account.currentBalance !== null && account.currentBalance !== undefined) {
    return formatMoney(account.currentBalance);
  }
  if (account.availableBalance !== null && account.availableBalance !== undefined) {
    return formatMoney(account.availableBalance);
  }
  if (account.availableCredit !== null && account.availableCredit !== undefined) {
    return formatMoney(account.availableCredit);
  }
  return display(account.status);
}

function accountUtilization(account) {
  const balance = Number(account.currentBalance);
  const limit = Number(account.creditLimit ?? account.originalLoanAmount);
  if (!Number.isFinite(balance) || !Number.isFinite(limit) || limit <= 0) return null;
  return Math.max(0, Math.min(100, (balance / limit) * 100));
}

function profileUpdateTitle(update) {
  return display(update.item ?? update.updateType, 'Profile maintenance');
}

function CustomerAvatar({ name }) {
  const seed = stableNumber(name);
  const skin = ['#f4c6a7', '#e6b18d', '#c88966', '#8d5a43'][seed % 4];
  const hair = ['#1a1216', '#3a211b', '#6b3c24', '#272130'][seed % 4];
  const shirt = ['#55dff3', '#7f91ff', '#f078c6', '#6ce0bd'][seed % 4];
  return (
    <svg className="mobile-360-person-avatar" viewBox="0 0 88 88" role="img" aria-label={`${name} profile illustration`}>
      <defs>
        <linearGradient id={`mobile-360-avatar-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#173d7b" />
          <stop offset="1" stopColor="#071d45" />
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r="42" fill={`url(#mobile-360-avatar-${seed})`} />
      <path d="M17 82c3-17 13-26 27-26s24 9 27 26" fill={shirt} />
      <ellipse cx="44" cy="39" rx="19" ry="23" fill={skin} />
      <path d="M24 39c-1-20 9-30 21-30 14 0 23 11 20 31-4-3-7-9-8-15-7 7-17 11-33 14Z" fill={hair} />
      <path d="M25 34c-3 3-4 8-3 14 2-3 4-5 7-6M63 33c3 4 4 9 2 15-1-4-3-6-6-8" fill={hair} />
      <ellipse cx="37" cy="41" rx="2.3" ry="2.8" fill="#152039" />
      <ellipse cx="51" cy="41" rx="2.3" ry="2.8" fill="#152039" />
      <path d="M37 51c4 3 10 3 14 0" fill="none" stroke="#9f4f59" strokeWidth="2" strokeLinecap="round" />
      <circle cx="31" cy="47" r="3.4" fill="#f195a2" opacity=".32" />
      <circle cx="57" cy="47" r="3.4" fill="#f195a2" opacity=".32" />
      <text x="44" y="79" textAnchor="middle" fill="#06152f" fontSize="10" fontWeight="900">{initials(name)}</text>
    </svg>
  );
}

function BusinessMark() {
  return (
    <svg className="mobile-360-business-mark" viewBox="0 0 88 88" role="img" aria-label="Business storefront">
      <defs>
        <linearGradient id="mobile-360-shop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#88f0ff" />
          <stop offset=".58" stopColor="#6a8dff" />
          <stop offset="1" stopColor="#cf6ae5" />
        </linearGradient>
      </defs>
      <circle cx="44" cy="44" r="42" fill="#08245a" stroke="#62dfff" strokeWidth="2" />
      <path d="M20 37h48l-4-13H24Z" fill="url(#mobile-360-shop)" />
      <path d="M21 37v8c3 4 8 4 11 0 3 4 8 4 12 0 3 4 8 4 12 0 3 4 8 4 11 0v-8Z" fill="#b9f5ff" />
      <path d="M25 48h38v25H25Z" fill="#2e68bb" stroke="#8defff" />
      <path d="M31 54h10v19H31Zm17 0h10v10H48Z" fill="#071d45" />
      <path d="M17 75h54" stroke="#77e8ff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Mobile360LunaBadge() {
  return (
    <aside className="mobile-360-luna-badge" aria-label="Luna, your AI assistant">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="mobile-360-luna" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8fdff" />
            <stop offset="1" stopColor="#bfe9ff" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="#092761" stroke="#62dcff" strokeWidth="2" />
        <path d="m17 22 4-12 10 9h3l10-9 4 13c5 6 6 18 0 25-7 8-25 8-32-1-5-7-4-18 1-25Z" fill="url(#mobile-360-luna)" />
        <path d="M22 13v11m20-11v11" stroke="#da89d8" strokeWidth="4" strokeLinecap="round" opacity=".55" />
        <ellipse cx="25" cy="32" rx="3" ry="4" fill="#17345d" />
        <ellipse cx="39" cy="32" rx="3" ry="4" fill="#17345d" />
        <circle cx="24" cy="31" r="1" fill="#fff" />
        <circle cx="38" cy="31" r="1" fill="#fff" />
        <path d="m32 37-3 2 3 2 3-2Z" fill="#d06d9e" />
        <path d="M23 42c3 5 15 5 18 0" fill="none" stroke="#31517a" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 36h10m20 0h10M13 41l9-2m20 0 9 2" stroke="#7ca4c0" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span><strong>Luna ✨</strong><small>Your AI assistant</small></span>
    </aside>
  );
}

function QuickPinButton({
  label,
  value,
  sourceTool,
  sourceRecordId = '',
  quickPin,
}) {
  if (!quickPin || !isAvailable(value)) return null;
  return (
    <button
      type="button"
      className="mobile-360-quick-pin"
      aria-label={`Add ${label} ${value} to Quick Pad`}
      onClick={() => quickPin({
        label,
        value,
        sourceTool,
        sourceRecordId,
      })}
    >
      📌
    </button>
  );
}

function SectionHeading({ icon, title, eyebrow, onViewAll, viewAllLabel }) {
  return (
    <header className="mobile-360-section-heading">
      <span aria-hidden="true">{icon}</span>
      <div><h3>{title}</h3>{eyebrow && <p>{eyebrow}</p>}</div>
      {onViewAll && (
        <button type="button" onClick={onViewAll} aria-label={viewAllLabel ?? `View all ${title}`}>
          View all
        </button>
      )}
    </header>
  );
}

function Mobile360Section({
  icon,
  title,
  eyebrow,
  onViewAll,
  viewAllLabel,
  children,
  className = '',
}) {
  return (
    <section className={`mobile-360-section ${className}`.trim()}>
      <SectionHeading
        icon={icon}
        title={title}
        eyebrow={eyebrow}
        onViewAll={onViewAll}
        viewAllLabel={viewAllLabel}
      />
      {children}
    </section>
  );
}

function CompactRows({ rows, emptyText = 'No records are supplied.' }) {
  if (!rows.length) return <p className="mobile-360-empty">{emptyText}</p>;
  return (
    <div className="mobile-360-compact-rows">
      {rows.map((row) => (
        <article key={row.id}>
          {row.date && <span>{row.date}</span>}
          {row.icon && <i aria-hidden="true">{row.icon}</i>}
          <div><strong>{row.title}</strong>{row.detail && <small>{row.detail}</small>}</div>
          {row.status && <em data-status={row.status}>{row.status}</em>}
          {row.action}
        </article>
      ))}
    </div>
  );
}

function FactGrid({ rows, className = '' }) {
  return (
    <dl className={`mobile-360-facts ${className}`.trim()}>
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

function Mobile360Drawer({ open, title, eyebrow, onClose, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const priorFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.dataset.mobile360Drawer = 'open';
    window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      delete document.body.dataset.mobile360Drawer;
      priorFocus?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="mobile-360-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="mobile-360-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div><p>{eyebrow}</p><h2>{title}</h2></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </header>
        <div className="mobile-360-drawer-content">{children}</div>
      </section>
    </div>
  );
}

function AccountCard({
  account,
  sourceTool,
  quickPin,
  onOpen,
  compact = false,
}) {
  const utilization = accountUtilization(account);
  return (
    <article className={`mobile-360-account-card${compact ? ' compact' : ''}`} data-360-account={account.accountId}>
      <header>
        <span aria-hidden="true">{isCreditAccount(account) ? '▣' : /saving/i.test(account.productLabel) ? '$' : '▤'}</span>
        <div><strong>{account.productLabel}</strong><small>{account.maskedAccountId}</small></div>
        <QuickPinButton
          label="Account ID"
          value={account.accountId}
          sourceTool={sourceTool}
          sourceRecordId={account.accountId}
          quickPin={quickPin}
        />
      </header>
      <p>{accountAmount(account)}</p>
      <small>{display(account.status)}</small>
      {utilization !== null && (
        <span className="mobile-360-account-meter" aria-label={`${Math.round(utilization)} percent of stated limit or original balance`}>
          <i style={{ '--mobile-360-meter': `${utilization}%` }} />
        </span>
      )}
      <button type="button" onClick={onOpen}>Open account</button>
    </article>
  );
}

function AccountDetails({ account, available, openTool, quickPin, sourceTool }) {
  const route = accountRoute(account, available);
  return (
    <article className="mobile-360-detail-card" data-360-account-detail={account.accountId}>
      <header><div><span>{account.maskedAccountId}</span><h3>{account.productLabel}</h3></div><strong>{display(account.status)}</strong></header>
      <FactGrid rows={[
        ['Account ID', account.maskedAccountId],
        ['Opened', account.openDate],
        ['Current balance', formatMoney(account.currentBalance)],
        ['Available balance', formatMoney(account.availableBalance)],
        ['Available credit', formatMoney(account.availableCredit)],
        ['Credit limit', formatMoney(account.creditLimit)],
        ['Original loan amount', formatMoney(account.originalLoanAmount)],
        ['Scheduled / minimum payment', formatMoney(account.scheduledPayment)],
        ['Next payment due', account.nextPaymentDueDate ?? 'Not applicable'],
        ['Payment status', account.paymentStatus],
        ['Past-due amount', formatMoney(account.pastDueAmount)],
        ['Restrictions', account.restrictions],
        ['Holds', account.holds],
      ]} />
      <nav>
        <QuickPinButton
          label="Account ID"
          value={account.accountId}
          sourceTool={sourceTool}
          sourceRecordId={account.accountId}
          quickPin={quickPin}
        />
        {route && (
          <button type="button" onClick={() => openTool(route, 'investigate', { query: account.accountId })}>
            Open {route}
          </button>
        )}
      </nav>
    </article>
  );
}

function CustomerDrawerContent({
  detail,
  dossier,
  available,
  openTool,
  quickPin,
  saveNote,
  notes,
}) {
  if (detail === 'updates') {
    return dossier.profileUpdates.length ? dossier.profileUpdates.map((update) => (
      <article className="mobile-360-detail-card" key={update.id} data-profile-event={update.id}>
        <header><div><span>{update.dateTime}</span><h3>{profileUpdateTitle(update)}</h3></div></header>
        <FactGrid rows={[
          ['Update type', update.updateType],
          ['Previous value', update.previousValue],
          ['New value', update.newValue],
          ['Channel', update.channel],
          ['Source', update.source],
          ['User / actor', update.actor],
          ['Device', update.deviceId],
          ['Session', update.sessionId],
          ['Authentication', update.authentication],
        ]} />
        <button type="button" onClick={() => saveNote(`Customer profile update ${update.id}: ${profileUpdateTitle(update)}.`, 'Customer profile update')}>Save learner note</button>
      </article>
    )) : <p className="mobile-360-empty">No customer profile updates are supplied.</p>;
  }

  if (detail === 'security') {
    return (
      <>
        <article className="mobile-360-detail-card">
          <header><div><span>Stored security profile</span><h3>Security settings</h3></div></header>
          <FactGrid rows={[
            ['MFA status', dossier.security.mfaStatus],
            ['Password last changed', dossier.security.passwordChanged],
            ['Trusted phone', dossier.security.trustedPhone],
            ['Trusted email', dossier.security.trustedEmail],
            ['Recent password reset', dossier.security.recentPasswordReset],
            ['Security alerts', dossier.security.securityAlertsSent ?? dossier.security.alerts],
            ['Recovery contact', dossier.security.recoveryContact],
            ['Lockouts', dossier.security.lockouts],
          ]} />
        </article>
        {dossier.security.trustedDevices.map((device) => (
          <article className="mobile-360-detail-card" key={device.id} data-trusted-device={device.id}>
            <header><div><span>{device.id}</span><h3>{device.name}</h3></div><strong>{device.trustStatus}</strong></header>
            <FactGrid rows={[
              ['Device type', device.type],
              ['Browser / operating system', device.browserOrOperatingSystem],
              ['First seen', device.firstSeen],
              ['Last seen', device.lastSeen],
              ['Most recent successful login', device.mostRecentSuccessfulLogin],
              ['MFA method', device.mfaMethod],
            ]} />
            <nav>
              <QuickPinButton label="Device ID" value={device.id} sourceTool="Customer 360" sourceRecordId={device.id} quickPin={quickPin} />
              {available.has('Device Intelligence') && (
                <button type="button" onClick={() => openTool('Device Intelligence', 'investigate', { query: device.id })}>Open Device History</button>
              )}
            </nav>
          </article>
        ))}
      </>
    );
  }

  if (detail === 'accounts') {
    return dossier.accounts.length ? dossier.accounts.map((account) => (
      <AccountDetails
        key={account.accountId}
        account={account}
        available={available}
        openTool={openTool}
        quickPin={quickPin}
        sourceTool="Customer 360"
      />
    )) : <p className="mobile-360-empty">No customer account records are supplied.</p>;
  }

  if (detail === 'relationship') {
    return (
      <>
        <article className="mobile-360-detail-card">
          <header><div><span>Established relationship facts</span><h3>Customer relationship</h3></div></header>
          <FactGrid rows={[
            ['Account standing', dossier.identity.accountStanding],
            ['Normal deposit behavior', dossier.relationship.normalDeposits],
            ['Normal spending behavior', dossier.relationship.normalSpending],
            ['Authorized users', dossier.relationship.authorizedUsers],
            ['Digital banking', dossier.relationship.digitalBanking],
          ]} />
        </article>
        {dossier.relationship.businessRelationships.map((business) => (
          <article className="mobile-360-detail-card" key={business.businessId ?? business.id}>
            <header>
              <div><span>{business.businessId ?? business.id}</span><h3>{business.businessName ?? business.legalName ?? business.name}</h3></div>
              <strong>{business.relationship ?? business.role}</strong>
            </header>
            <FactGrid rows={[
              ['Ownership', business.ownershipPercentage ?? business.ownership],
              ['Business status', business.status],
              ['Relationship since', business.relationshipSince ?? business.ownerSince],
            ]} />
            {available.has('Business 360') && (
              <button
                type="button"
                onClick={() => openTool('Business 360', 'investigate', { query: business.businessId ?? business.id })}
              >
                Open Business 360
              </button>
            )}
          </article>
        ))}
      </>
    );
  }

  return (
    <>
      {dossier.serviceContacts.map((contact) => (
        <article className="mobile-360-detail-card" key={contact.id}>
          <header><div><span>{contact.dateTime}</span><h3>{contact.type}</h3></div></header>
          <FactGrid rows={[
            ['Channel', contact.channel],
            ['Reason for contact', contact.reasonForContact],
            ['What the customer reported', contact.reportedInformation],
            ['Assistance provided', contact.assistanceProvided],
            ['Documents requested', contact.documentsRequested],
            ['Follow-up status', contact.followUpStatus],
            ['Agent / department', contact.agentOrDepartment ?? contact.agent],
            ['Related account', contact.relatedAccountId],
            ['Service note', contact.notes],
          ]} />
        </article>
      ))}
      {notes.map((note, index) => (
        <article className="mobile-360-detail-card investigator" key={`${note}-${index}`}>
          <header><div><span>Investigator notebook</span><h3>Learner-authored note</h3></div></header>
          <p>{note}</p>
        </article>
      ))}
      {!dossier.serviceContacts.length && !notes.length && <p className="mobile-360-empty">No service or investigator notes are supplied.</p>}
    </>
  );
}

export function MobileCustomer360Reference({
  activeCase,
  pin = () => {},
  quickPin,
  saveNote = () => {},
  markReviewed = () => {},
  currentCompleted = [],
  openTool = () => {},
  jumpDecision = () => {},
  notes = [],
}) {
  const dossier = useMemo(() => getCustomer360Dossier(activeCase), [activeCase]);
  const available = useMemo(() => new Set(activeCase.availableTools ?? []), [activeCase.availableTools]);
  const [detail, setDetail] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const customerId = dossier.identity.maskedMemberId;
  const relationshipRows = [
    ['Customer since', dossier.identity.customerSince],
    ['Relationship length', dossier.identity.relationshipLength],
    ['Account standing', dossier.identity.accountStanding],
    ['Preferred contact', dossier.identity.preferredContact],
  ];

  useEffect(() => {
    setDetail('');
    setSelectedAccountId('');
  }, [activeCase.id]);

  function openAccount(account) {
    setSelectedAccountId(account.accountId);
    setDetail('accounts');
  }

  const drawerTitles = {
    updates: ['Profile updates', 'Permanent customer profile history'],
    security: ['Trusted devices & security', 'Stored access and security facts'],
    accounts: ['Accounts & products', 'Relationship-level product records'],
    relationship: ['Relationship details', 'Established customer and linked-business facts'],
    notes: ['Recent contact notes', 'Service history and learner-authored notes'],
  };
  const [drawerTitle, drawerEyebrow] = drawerTitles[detail] ?? ['', ''];

  return (
    <section
      className="mobile-360-reference mobile-customer-360-reference"
      data-mobile-360-screen="customer"
      data-customer-360-screen="approved-theme-v1"
      data-customer-id={dossier.identity.trainingId}
    >
      <section className="mobile-360-hero mobile-360-customer-hero">
        <CustomerAvatar name={dossier.identity.legalName} />
        <div className="mobile-360-hero-copy">
          <div><h2>{dossier.identity.legalName}</h2><span>{dossier.identity.verificationStatus}</span></div>
          <p>{dossier.identity.segment}</p>
          <small>Customer since {dossier.identity.customerSince} · {dossier.identity.relationshipLength}</small>
          <div className="mobile-360-id-row">
            <span>Customer ID · {display(customerId)}</span>
            <QuickPinButton label="Customer ID" value={customerId} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
          <div className="mobile-360-id-row">
            <span>Training ID · {dossier.identity.trainingId}</span>
            <QuickPinButton label="Training ID" value={dossier.identity.trainingId} sourceTool="Customer 360" quickPin={quickPin} />
          </div>
        </div>
        <button type="button" className="mobile-360-pin-profile" onClick={() => pin(`${dossier.identity.trainingId} · ${dossier.identity.legalName}`)}>
          ☆ Pin customer profile
        </button>
        <FactGrid className="mobile-360-contact-grid" rows={[
          ['Date of birth', `${dossier.identity.dob} · age ${dossier.identity.age}`],
          ['Current address', dossier.identity.currentAddress],
          ['Previous address', dossier.identity.previousAddress],
          ['Phone', dossier.identity.mobilePhone, <QuickPinButton key="phone" label="Phone number" value={dossier.identity.mobilePhone} sourceTool="Customer 360" quickPin={quickPin} />],
          ['Email', dossier.identity.email, <QuickPinButton key="email" label="Email" value={dossier.identity.email} sourceTool="Customer 360" quickPin={quickPin} />],
        ]} />
      </section>

      {dossier.coverage?.sourceMode === 'Supplied records only' && (
        <p className="mobile-360-coverage">{dossier.coverage.identity}</p>
      )}

      <div className="mobile-360-pair">
        <Mobile360Section
          icon="▣"
          title="Profile updates"
          eyebrow={`${dossier.profileUpdates.length} recorded change${dossier.profileUpdates.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('updates')}
        >
          <CompactRows
            rows={dossier.profileUpdates.slice(0, 3).map((update) => ({
              id: update.id,
              date: update.dateTime,
              title: profileUpdateTitle(update),
              detail: `${display(update.previousValue)} → ${display(update.newValue)}`,
            }))}
            emptyText="No profile updates are supplied."
          />
        </Mobile360Section>

        <Mobile360Section
          icon="🛡"
          title="Trusted devices & security"
          eyebrow={`${dossier.security.trustedDevices.length} trusted device${dossier.security.trustedDevices.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('security')}
        >
          <CompactRows
            rows={dossier.security.trustedDevices.slice(0, 3).map((device) => ({
              id: device.id,
              icon: /phone|mobile/i.test(device.type) ? '▯' : '▱',
              title: device.name,
              detail: `${device.id} · Last seen ${device.lastSeen}`,
              status: device.trustStatus,
              action: <QuickPinButton label="Device ID" value={device.id} sourceTool="Customer 360" sourceRecordId={device.id} quickPin={quickPin} />,
            }))}
            emptyText="No trusted-device records are supplied."
          />
          <div className="mobile-360-security-line"><span>Security status</span><strong>{dossier.security.mfaStatus}</strong></div>
        </Mobile360Section>
      </div>

      <div className="mobile-360-pair mobile-360-product-pair">
        <Mobile360Section
          icon="◇"
          title="Accounts & products"
          eyebrow={`${dossier.accounts.length} relationship product${dossier.accounts.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('accounts')}
        >
          <div className="mobile-360-account-grid">
            {dossier.accounts.slice(0, 4).map((account) => (
              <AccountCard
                key={account.accountId}
                account={account}
                sourceTool="Customer 360"
                quickPin={quickPin}
                onOpen={() => openAccount(account)}
                compact
              />
            ))}
          </div>
          {!dossier.accounts.length && <p className="mobile-360-empty">No customer accounts are supplied.</p>}
        </Mobile360Section>

        <Mobile360Section
          icon="☆"
          title="Relationship"
          eyebrow="Established customer facts"
          onViewAll={() => setDetail('relationship')}
          className="mobile-360-pink-section"
        >
          <FactGrid rows={relationshipRows} />
          {dossier.relationship.businessRelationships.length > 0 && (
            <p className="mobile-360-linked-count">
              {dossier.relationship.businessRelationships.length} linked business relationship{dossier.relationship.businessRelationships.length === 1 ? '' : 's'}
            </p>
          )}
        </Mobile360Section>
      </div>

      <Mobile360Section
        icon="✎"
        title="Recent contact notes"
        eyebrow="Factual servicing history"
        onViewAll={() => setDetail('notes')}
        className="mobile-360-wide-section"
      >
        <CompactRows rows={dossier.serviceContacts.slice(0, 2).map((contact) => ({
          id: contact.id,
          date: contact.dateTime,
          title: contact.type,
          detail: contact.notes ?? contact.outcome,
        }))} emptyText="No service contact notes are supplied." />
        <button type="button" className="mobile-360-secondary" onClick={() => saveNote(`Customer 360 profile reviewed for ${dossier.identity.legalName}.`, 'Customer 360')}>
          Add review note
        </button>
      </Mobile360Section>

      <footer className="mobile-360-review">
        <div><span>Evidence First</span><strong>{currentCompleted.includes('Customer 360') ? 'Customer 360 reviewed' : 'Finish Customer 360 when ready'}</strong></div>
        <button type="button" onClick={() => markReviewed('Customer 360')}>
          {currentCompleted.includes('Customer 360') ? '✓ Reviewed' : 'Mark reviewed'}
        </button>
        <button type="button" onClick={jumpDecision}>Submit Decision</button>
      </footer>

      <Mobile360Drawer
        open={Boolean(detail)}
        title={drawerTitle}
        eyebrow={drawerEyebrow}
        onClose={() => {
          setDetail('');
          setSelectedAccountId('');
        }}
      >
        {detail === 'accounts' && selectedAccountId
          ? (
            <AccountDetails
              account={dossier.accounts.find((account) => account.accountId === selectedAccountId)}
              available={available}
              openTool={openTool}
              quickPin={quickPin}
              sourceTool="Customer 360"
            />
          )
          : (
            <CustomerDrawerContent
              detail={detail}
              dossier={dossier}
              available={available}
              openTool={openTool}
              quickPin={quickPin}
              saveNote={saveNote}
              notes={notes}
            />
          )}
      </Mobile360Drawer>
    </section>
  );
}

function OwnerDetails({ owner, available, openTool }) {
  if (!owner) return <p className="mobile-360-empty">No owner or controlling-party record is supplied.</p>;
  return (
    <article className="mobile-360-detail-card" data-business-owner={owner.id}>
      <header><div><span>{owner.trainingId}</span><h3>{owner.fullLegalName}</h3></div><strong>{owner.ownershipPercentage}</strong></header>
      <FactGrid rows={[
        ['Date of birth', owner.dateOfBirth],
        ['Business title', owner.businessTitle],
        ['Officer status', owner.officerStatus],
        ['Controlling-party status', owner.controllingPartyStatus],
        ['Guarantor status', owner.guarantorStatus],
        ['Current residential address', owner.currentResidentialAddress],
        ['Previous residential address', owner.previousResidentialAddress],
        ['Personal phone', owner.personalPhone],
        ['Personal email', owner.personalEmail],
        ['Identity verification', owner.identityVerificationStatus],
        ['Address verification', owner.addressVerificationStatus],
        ['Owner since', owner.ownerSince],
        ['Address comparison', owner.addressComparison],
      ]} />
      <nav>
        {available.has('Identity Intel / People Search') && <button type="button" onClick={() => openTool('Identity Intel / People Search', 'investigate', { query: owner.trainingId })}>Open Identity Information</button>}
        {available.has('Device Intelligence') && <button type="button" onClick={() => openTool('Device Intelligence', 'investigate', { query: owner.trainingId })}>Open Device History</button>}
        {available.has('Login History') && <button type="button" onClick={() => openTool('Login History', 'investigate', { query: owner.trainingId })}>Open Login History</button>}
      </nav>
    </article>
  );
}

function BusinessDrawerContent({
  detail,
  dossier,
  available,
  openTool,
  quickPin,
  saveNote,
  notes,
}) {
  if (detail === 'profile') {
    return (
      <>
        <article className="mobile-360-detail-card">
          <header><div><span>Reusable company record</span><h3>{dossier.profile.legalName}</h3></div><strong>{dossier.profile.standing}</strong></header>
          <FactGrid rows={[
            ['Legal business name', dossier.profile.legalName],
            ['DBA', dossier.profile.dba],
            ['Entity type', dossier.profile.entityType],
            ['Masked EIN', dossier.profile.maskedEin],
            ['Formation date', dossier.profile.formationDate],
            ['Formation state', dossier.profile.formationState],
            ['State registration / file number', dossier.profile.registrationFileNumber],
            ['Business standing', dossier.profile.standing],
            ['Industry', dossier.profile.industry],
            ['NAICS', dossier.profile.naics],
            ['Physical operating address', dossier.profile.operatingAddress],
            ['Mailing address', dossier.profile.mailingAddress],
            ['Registered-agent name', dossier.profile.registeredAgent.name],
            ['Registered-agent address', dossier.profile.registeredAgent.address],
            ['Business phone', dossier.profile.phone],
            ['Business email', dossier.profile.email],
            ['Website', dossier.profile.website],
            ['Business age', dossier.profile.businessAge],
            ['Customer since', dossier.profile.customerSince],
            ['Relationship length', dossier.profile.relationshipLength],
            ['Known operating locations', dossier.profile.operatingLocations],
            ['Estimated employee count', dossier.profile.estimatedEmployeeCount],
          ]} />
        </article>
        <article className="mobile-360-detail-card">
          <header><div><span>Stored access summary</span><h3>Trusted business access & security</h3></div></header>
          <CompactRows rows={dossier.access.authorizedUsers.map((user) => ({
            id: user.id,
            title: `${user.name} · ${user.role}`,
            detail: `${user.permissions} · ${user.mfaMethod}`,
          }))} emptyText="No authorized-business-user record is supplied." />
          <CompactRows rows={dossier.access.trustedDevices.map((device) => ({
            id: device.deviceId,
            icon: '▱',
            title: device.deviceName,
            detail: `${device.browserOrOperatingSystem} · ${device.trustStatus}`,
          }))} emptyText="No trusted-device record is supplied." />
        </article>
      </>
    );
  }

  if (detail === 'owners') {
    return dossier.owners.length ? dossier.owners.map((owner) => (
      <OwnerDetails key={owner.id} owner={owner} available={available} openTool={openTool} />
    )) : <p className="mobile-360-empty">No owner or controlling-party record is supplied.</p>;
  }

  if (detail === 'accounts' || detail === 'credit') {
    const accounts = dossier.accounts.filter((account) => detail === 'credit' ? isCreditAccount(account) : !isCreditAccount(account));
    return accounts.length ? accounts.map((account) => (
      <AccountDetails
        key={account.accountId}
        account={account}
        available={available}
        openTool={openTool}
        quickPin={quickPin}
        sourceTool="Business 360"
      />
    )) : <p className="mobile-360-empty">No applicable business product record is supplied.</p>;
  }

  if (detail === 'payroll') {
    if (!dossier.payrollRelationship) return <p className="mobile-360-empty">This business profile has no payroll relationship.</p>;
    return (
      <article className="mobile-360-detail-card">
        <header><div><span>Product relationship summary</span><h3>Payroll relationship</h3></div><strong>{dossier.payrollRelationship.payrollAccountStatus}</strong></header>
        <FactGrid rows={[
          ['Payroll customer since', dossier.payrollRelationship.payrollCustomerSince],
          ['Pay schedule', dossier.payrollRelationship.paySchedule],
          ['Next scheduled payroll', dossier.payrollRelationship.nextScheduledPayroll],
          ['Active employee count', dossier.payrollRelationship.activeEmployeeCount],
          ['Last completed payroll date', dossier.payrollRelationship.lastCompletedPayrollDate],
          ['Last payroll amount', dossier.payrollRelationship.lastPayrollAmount],
          ['Average monthly payroll', dossier.payrollRelationship.averageMonthlyPayroll],
          ['Payroll funding status', dossier.payrollRelationship.payrollFundingStatus],
          ['Payroll administrator', dossier.payrollRelationship.payrollAdministrator],
          ['Authorized payroll users', dossier.payrollRelationship.authorizedPayrollUsers],
          ['Employer tax-profile status', dossier.payrollRelationship.employerTaxProfileStatus],
        ]} />
        {available.has('Payroll History') && <button type="button" onClick={() => openTool('Payroll History')}>Open Payroll History</button>}
      </article>
    );
  }

  if (detail === 'updates') {
    return dossier.profileUpdates.length ? dossier.profileUpdates.map((update) => (
      <article className="mobile-360-detail-card" key={update.id}>
        <header><div><span>{update.dateTime}</span><h3>{update.updateType}</h3></div></header>
        <FactGrid rows={[
          ['Previous value', update.previousValue],
          ['New value', update.newValue],
          ['Channel', update.channel],
          ['Source', update.source],
          ['User', update.user],
          ['Session', update.linkedSession],
          ['Device', update.linkedDevice],
        ]} />
        <button type="button" onClick={() => saveNote(`Business profile update ${update.id}: ${update.updateType}.`, 'Business 360')}>Save business note</button>
      </article>
    )) : <p className="mobile-360-empty">No business profile updates are supplied.</p>;
  }

  if (detail === 'research') {
    return (
      <>
        <p className="mobile-360-neutral-note">A missing or conflicting record is a source result, not proof that the business does not exist and not a conclusion about the active review.</p>
        {dossier.researchChecks.map((check) => (
          <article className="mobile-360-detail-card" key={check.id} data-research-status={check.status}>
            <header><div><span>{check.sourceChecked}</span><h3>{check.subject}</h3></div><strong>{check.status}</strong></header>
            <p>{check.detail}</p>
            <small>Checked {check.dateChecked}</small>
          </article>
        ))}
      </>
    );
  }

  return (
    <>
      {dossier.contactNotes.map((contact) => (
        <article className="mobile-360-detail-card" key={contact.id}>
          <header><div><span>{contact.contactDate} · {contact.contactChannel}</span><h3>{contact.personContacted}</h3></div><strong>{contact.businessRole}</strong></header>
          <FactGrid rows={[
            ['Reason for contact', contact.reasonForContact],
            ['Information supplied', contact.informationSupplied],
            ['Assistance provided', contact.assistanceProvided],
            ['Documents requested', contact.documentsRequested],
            ['Follow-up status', contact.followUpStatus],
            ['Agent / department', contact.agentOrDepartment],
          ]} />
        </article>
      ))}
      {notes.map((note, index) => (
        <article className="mobile-360-detail-card investigator" key={`${note}-${index}`}>
          <header><div><span>Investigator notebook</span><h3>Learner-authored note</h3></div></header>
          <p>{note}</p>
        </article>
      ))}
      {!dossier.contactNotes.length && !notes.length && <p className="mobile-360-empty">No business service or investigator notes are supplied.</p>}
    </>
  );
}

export function MobileBusiness360Reference({
  activeCase,
  pin = () => {},
  quickPin,
  saveNote = () => {},
  markReviewed = () => {},
  reviewed = false,
  currentCompleted = [],
  openTool = () => {},
  jumpDecision = () => {},
  notes = [],
  query = '',
}) {
  const dossier = useMemo(
    () => getBusiness360Dossier(activeCase, { relationshipId: query }),
    [activeCase, query],
  );
  const available = useMemo(() => new Set(activeCase.availableTools ?? []), [activeCase.availableTools]);
  const [detail, setDetail] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const primaryOwner = dossier.owners[0];
  const operatingAccounts = dossier.accounts.filter((account) => !isCreditAccount(account));
  const creditAccounts = dossier.accounts.filter(isCreditAccount);
  const isReviewed = reviewed || currentCompleted.includes('Business 360');

  useEffect(() => {
    setDetail('');
    setSelectedAccountId('');
  }, [activeCase.id]);

  function openAccount(account, section) {
    setSelectedAccountId(account.accountId);
    setDetail(section);
  }

  const drawerTitles = {
    profile: ['Business profile', 'Reusable company, registration, and access facts'],
    owners: ['Owners & control', 'Distinct personal records for owners and controlling parties'],
    accounts: ['Business products & accounts', 'Operating and deposit relationships'],
    credit: ['Credit & loans', 'Business credit relationships'],
    payroll: ['Payroll overview', 'Business payroll relationship'],
    updates: ['Business updates', 'Recorded profile-maintenance history'],
    notes: ['Recent notes', 'Business servicing and learner-authored notes'],
    research: ['Luna Business Research', 'Factual fictional source comparison'],
  };
  const [drawerTitle, drawerEyebrow] = drawerTitles[detail] ?? ['', ''];

  return (
    <section
      className="mobile-360-reference mobile-business-360-reference"
      data-mobile-360-screen="business"
      data-business-360-screen="mobile-reference-v3"
      data-business-registration={dossier.profile.registrationFileNumber}
    >
      <section className="mobile-360-hero mobile-360-business-hero">
        <BusinessMark />
        <div className="mobile-360-hero-copy">
          <div><h2>{dossier.profile.legalName}</h2><span>{dossier.profile.standing}</span></div>
          <p>{dossier.profile.dba} · {dossier.profile.entityType}</p>
          <small>Business since {dossier.profile.formationDate} · Client since {dossier.profile.customerSince}</small>
          <div className="mobile-360-id-row">
            <span>Registration · {dossier.profile.registrationFileNumber}</span>
            <QuickPinButton label="Business registration" value={dossier.profile.registrationFileNumber} sourceTool="Business 360" quickPin={quickPin} />
          </div>
          <div className="mobile-360-id-row"><span>Masked EIN · {dossier.profile.maskedEin}</span></div>
        </div>
        <button type="button" className="mobile-360-pin-profile" onClick={() => pin(`${dossier.profile.registrationFileNumber} · ${dossier.profile.legalName}`)}>
          ☆ Pin business profile
        </button>
      </section>

      {dossier.coverageNotice && <p className="mobile-360-coverage">{dossier.coverageNotice}</p>}

      <section className="mobile-360-business-contact">
        <div>
          <span>Business address</span><strong>{dossier.profile.operatingAddress}</strong>
          <span>Business phone</span>
          <strong className="with-action">{dossier.profile.phone}<QuickPinButton label="Phone number" value={dossier.profile.phone} sourceTool="Business 360" quickPin={quickPin} /></strong>
          <span>Business email</span>
          <strong className="with-action">{dossier.profile.email}<QuickPinButton label="Email" value={dossier.profile.email} sourceTool="Business 360" quickPin={quickPin} /></strong>
        </div>
        <div>
          <span>Owner</span><strong>{display(primaryOwner?.fullLegalName)}</strong>
          <span>Ownership</span><strong>{display(primaryOwner?.ownershipPercentage)}</strong>
          <span>Owner address</span><strong>{display(primaryOwner?.currentResidentialAddress)}</strong>
          <button type="button" onClick={() => setDetail('owners')}>View owner profile</button>
        </div>
      </section>

      <Mobile360Section
        icon="▥"
        title="Business profile"
        eyebrow="Factual company and registration details"
        onViewAll={() => setDetail('profile')}
        className="mobile-360-wide-section"
      >
        <FactGrid className="mobile-360-two-column-facts" rows={[
          ['Legal name', dossier.profile.legalName],
          ['Industry', dossier.profile.industry],
          ['Formation state', dossier.profile.formationState],
          ['Registration', dossier.profile.registrationFileNumber],
          ['Registered agent', dossier.profile.registeredAgent.name],
          ['Website', dossier.profile.website],
        ]} />
      </Mobile360Section>

      <div className="mobile-360-pair mobile-360-product-pair">
        <Mobile360Section
          icon="▤"
          title="Business products & accounts"
          eyebrow={`${operatingAccounts.length} operating relationship${operatingAccounts.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('accounts')}
        >
          <div className="mobile-360-account-grid">
            {operatingAccounts.slice(0, 4).map((account) => (
              <AccountCard
                key={account.accountId}
                account={account}
                sourceTool="Business 360"
                quickPin={quickPin}
                onOpen={() => openAccount(account, 'accounts')}
                compact
              />
            ))}
          </div>
          {!operatingAccounts.length && <p className="mobile-360-empty">No operating account is supplied.</p>}
        </Mobile360Section>

        <Mobile360Section
          icon="◇"
          title="Credit & loans"
          eyebrow={`${creditAccounts.length} credit relationship${creditAccounts.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('credit')}
          className="mobile-360-pink-section"
        >
          <div className="mobile-360-account-grid">
            {creditAccounts.slice(0, 4).map((account) => (
              <AccountCard
                key={account.accountId}
                account={account}
                sourceTool="Business 360"
                quickPin={quickPin}
                onOpen={() => openAccount(account, 'credit')}
                compact
              />
            ))}
          </div>
          {!creditAccounts.length && <p className="mobile-360-empty">No credit or loan product is supplied.</p>}
        </Mobile360Section>
      </div>

      {dossier.payrollRelationship && (
        <Mobile360Section
          icon="↗"
          title="Payroll overview"
          eyebrow="Product relationship summary"
          onViewAll={() => setDetail('payroll')}
          className="mobile-360-wide-section"
        >
          <FactGrid className="mobile-360-payroll-metrics" rows={[
            ['Payroll frequency', dossier.payrollRelationship.paySchedule],
            ['Total payroll', dossier.payrollRelationship.lastPayrollAmount],
            ['Employees paid', dossier.payrollRelationship.activeEmployeeCount],
            ['Latest payroll', dossier.payrollRelationship.lastCompletedPayrollDate],
          ]} />
          {available.has('Payroll History') && <button type="button" className="mobile-360-secondary" onClick={() => openTool('Payroll History')}>Open Payroll History</button>}
        </Mobile360Section>
      )}

      <div className="mobile-360-pair">
        <Mobile360Section
          icon="✦"
          title="Business updates"
          eyebrow={`${dossier.profileUpdates.length} recorded change${dossier.profileUpdates.length === 1 ? '' : 's'}`}
          onViewAll={() => setDetail('updates')}
        >
          <CompactRows rows={dossier.profileUpdates.slice(0, 3).map((update) => ({
            id: update.id,
            date: update.dateTime,
            title: update.updateType,
            detail: `${display(update.previousValue)} → ${display(update.newValue)}`,
          }))} emptyText="No business profile updates are supplied." />
        </Mobile360Section>

        <Mobile360Section
          icon="✎"
          title="Recent notes"
          eyebrow="Recorded business servicing context"
          onViewAll={() => setDetail('notes')}
        >
          <CompactRows rows={dossier.contactNotes.slice(0, 3).map((contact) => ({
            id: contact.id,
            date: contact.contactDate,
            title: `${contact.personContacted} · ${contact.businessRole}`,
            detail: contact.reasonForContact,
          }))} emptyText="No business contact notes are supplied." />
          <button type="button" className="mobile-360-secondary" onClick={() => saveNote(`Business 360 profile reviewed for ${dossier.profile.legalName}.`, 'Business 360')}>
            Add business note
          </button>
        </Mobile360Section>
      </div>

      <button type="button" className="mobile-360-research-entry" onClick={() => setDetail('research')}>
        <span aria-hidden="true">🐾</span>
        <span><strong>Luna Business Research</strong><small>Open factual owner, registration, licensing, and web-presence checks</small></span>
        <b>›</b>
      </button>

      <footer className="mobile-360-review">
        <div><span>Evidence First</span><strong>{isReviewed ? 'Business 360 reviewed' : 'Finish Business 360 when ready'}</strong></div>
        <button type="button" onClick={() => markReviewed('Business 360')}>
          {isReviewed ? '✓ Reviewed' : 'Mark reviewed'}
        </button>
        <button type="button" onClick={jumpDecision}>Submit Decision</button>
      </footer>

      <Mobile360Drawer
        open={Boolean(detail)}
        title={drawerTitle}
        eyebrow={drawerEyebrow}
        onClose={() => {
          setDetail('');
          setSelectedAccountId('');
        }}
      >
        {(detail === 'accounts' || detail === 'credit') && selectedAccountId
          ? (
            <AccountDetails
              account={dossier.accounts.find((account) => account.accountId === selectedAccountId)}
              available={available}
              openTool={openTool}
              quickPin={quickPin}
              sourceTool="Business 360"
            />
          )
          : (
            <BusinessDrawerContent
              detail={detail}
              dossier={dossier}
              available={available}
              openTool={openTool}
              quickPin={quickPin}
              saveNote={saveNote}
              notes={notes}
            />
          )}
      </Mobile360Drawer>
    </section>
  );
}
