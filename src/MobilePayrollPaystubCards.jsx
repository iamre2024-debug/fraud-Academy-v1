import { buildPaymentLookupHint } from './data/paymentVerification.js';
import { formatMoney } from './data/relationshipAccounts.js';

const unavailableIdentifier = /^(?:not applicable|not supplied|not available|unavailable)$/i;

function displayValue(value, fallback = 'Not supplied') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function money(value) {
  return formatMoney(value, 'Not supplied');
}

function canUseIdentifier(value) {
  const normalized = String(value ?? '').trim();
  return Boolean(normalized) && !unavailableIdentifier.test(normalized);
}

function copyValue(value) {
  if (typeof window === 'undefined' || !canUseIdentifier(value)) return;
  window.navigator.clipboard?.writeText(String(value));
}

function Fact({ label, value }) {
  return <div><dt>{label}</dt><dd>{displayValue(value)}</dd></div>;
}

function MoneyFact({ label, value }) {
  return <Fact label={label} value={money(value)} />;
}

function PaystubBreakdown({ items = [], title }) {
  return (
    <section className="mobile-paystub-breakdown" aria-label={title}>
      <h5>{title}</h5>
      {items.length ? (
        <dl>
          {items.map((item, index) => (
            <div key={`${item.type ?? title}-${index}`}>
              <dt>{displayValue(item.type, title)}</dt>
              <dd>
                <span>{money(item.current)}</span>
                {item.hours !== undefined && <small>{displayValue(item.hours)} hours</small>}
                {item.rate !== undefined && <small>{money(item.rate)} rate</small>}
              </dd>
            </div>
          ))}
        </dl>
      ) : <p>None recorded on this paystub.</p>}
    </section>
  );
}

function DestinationActions({
  destination,
  employee,
  openTool,
  paystubId,
  quickPin,
}) {
  const bankCodeAvailable = canUseIdentifier(destination.bankCode);
  const destinationIdAvailable = canUseIdentifier(destination.destinationId);
  const lookupAvailable = bankCodeAvailable && destinationIdAvailable;
  const paymentHint = buildPaymentLookupHint({
    bankCode: destination.bankCode,
    destinationId: destination.destinationId,
    ownerName: employee.paystub.employee.legalName,
  });

  if (!lookupAvailable) {
    return (
      <p className="mobile-paystub-destination-unavailable">
        Payment Verification identifiers are not available for this payment method.
      </p>
    );
  }

  return (
    <div className="mobile-paystub-destination-actions">
      <button type="button" onClick={() => copyValue(destination.bankCode)}>Copy Bank Code</button>
      <button
        type="button"
        onClick={() => quickPin({
          label: 'Bank Code',
          value: destination.bankCode,
          sourceTool: 'Payroll History',
          sourceRecordId: paystubId,
        })}
      >
        Pin Bank Code to Quick Pad
      </button>
      <button type="button" onClick={() => copyValue(destination.destinationId)}>Copy Destination ID</button>
      <button
        type="button"
        onClick={() => quickPin({
          label: 'Destination ID',
          value: destination.destinationId,
          sourceTool: 'Payroll History',
          sourceRecordId: paystubId,
        })}
      >
        Pin Destination ID to Quick Pad
      </button>
      <button
        type="button"
        className="mobile-paystub-verification-action"
        onClick={() => openTool('Payment Verification', 'investigate', { query: paymentHint })}
      >
        Open Payment Verification
      </button>
    </div>
  );
}

export default function MobilePayrollPaystubCards({
  employees = [],
  openTool,
  pin,
  quickPin,
}) {
  return (
    <section
      className="mobile-paystub-card-stack"
      aria-label="Immutable employee paystubs"
      data-mobile-paystub-cards="true"
    >
      <header>
        <p>Employee payroll history</p>
        <h3>{employees.length} immutable paystub snapshot{employees.length === 1 ? '' : 's'}</h3>
        <span>Open an employee card to review only that paycheck and its recorded payment destination.</span>
      </header>

      <div className="mobile-paystub-card-list">
        {employees.map((employee, employeeIndex) => {
          const paystub = employee.paystub;
          const destinations = paystub.paymentDestinations ?? [];
          const summary = paystub.summary ?? {};
          const ytd = paystub.ytdSnapshot ?? {};

          return (
            <details
              key={paystub.id}
              className="mobile-paystub-card"
              data-mobile-paystub-card={paystub.id}
              defaultOpen={employeeIndex === 0}
            >
              <summary>
                <span className="mobile-paystub-card-marker" aria-hidden="true">▾</span>
                <span>
                  <strong>{employee.name}</strong>
                  <small>{employee.employeeId} · {paystub.payPeriod?.label ?? paystub.payDate}</small>
                </span>
                <span>
                  <strong>{money(employee.netPay)}</strong>
                  <small>{employee.paymentStatus ?? 'Status not supplied'}</small>
                </span>
              </summary>

              <div className="mobile-paystub-card-body">
                <header>
                  <div>
                    <p>Individual paystub</p>
                    <h4>{paystub.id}</h4>
                  </div>
                  <button type="button" onClick={() => pin(paystub.id)}>Pin paystub</button>
                </header>

                <dl className="mobile-paystub-core-facts">
                  <Fact label="Employer" value={paystub.employer?.legalName} />
                  <Fact label="Employee" value={paystub.employee?.legalName} />
                  <Fact label="Employee ID" value={employee.employeeId} />
                  <Fact label="Pay period" value={paystub.payPeriod?.label} />
                  <Fact label="Pay date" value={paystub.payDate} />
                  <Fact label="Payroll type" value={paystub.payrollType} />
                  <Fact label="Payment method" value={employee.paymentMethod} />
                  <Fact label="Settlement status" value={employee.paymentStatus} />
                </dl>

                <section className="mobile-paystub-totals" aria-label={`${paystub.id} current totals`}>
                  <h5>Current paycheck totals</h5>
                  <dl>
                    <MoneyFact label="Gross pay" value={summary.grossPay ?? employee.grossPay} />
                    <MoneyFact label="Employee taxes" value={summary.employeeTaxes ?? employee.taxes} />
                    <MoneyFact label="Employer taxes" value={summary.employerTaxes} />
                    <MoneyFact label="Deductions" value={summary.employeeDeductions ?? employee.deductions} />
                    <MoneyFact label="Employer contributions" value={summary.employerContributions} />
                    <MoneyFact label="Reimbursements" value={summary.reimbursements} />
                    <MoneyFact label="Adjustments" value={summary.adjustments} />
                    <MoneyFact label="Net pay" value={summary.netPay ?? employee.netPay} />
                  </dl>
                </section>

                <section className="mobile-paystub-totals mobile-paystub-ytd" aria-label={`${paystub.id} year-to-date totals`}>
                  <h5>Year-to-date totals</h5>
                  <dl>
                    <MoneyFact label="Gross pay" value={ytd.grossPay} />
                    <MoneyFact label="Employee taxes" value={ytd.employeeTaxes} />
                    <MoneyFact label="Deductions" value={ytd.employeeDeductions} />
                    <MoneyFact label="Employer contributions" value={ytd.employerContributions} />
                    <MoneyFact label="Reimbursements" value={ytd.reimbursements} />
                    <MoneyFact label="Net pay" value={ytd.netPay} />
                  </dl>
                </section>

                <div className="mobile-paystub-breakdown-grid">
                  <PaystubBreakdown title="Earnings" items={paystub.earnings} />
                  <PaystubBreakdown title="Taxes" items={paystub.taxes} />
                  <PaystubBreakdown title="Deductions" items={paystub.deductions} />
                  <PaystubBreakdown title="Employer contributions" items={paystub.employerContributions} />
                  <PaystubBreakdown title="Reimbursements" items={paystub.reimbursements} />
                  <PaystubBreakdown title="Adjustments" items={paystub.adjustments} />
                </div>

                <section className="mobile-paystub-destinations" aria-label={`${paystub.id} payment destinations`}>
                  <header>
                    <p>Payment destinations</p>
                    <h5>{destinations.length} recorded destination{destinations.length === 1 ? '' : 's'}</h5>
                  </header>
                  {destinations.map((destination, destinationIndex) => (
                    <article
                      key={destination.id ?? `${paystub.id}-destination-${destinationIndex}`}
                      data-mobile-paystub-destination={destination.id ?? destinationIndex}
                    >
                      <header>
                        <strong>{destination.method ?? employee.paymentMethod}</strong>
                        <span>{money(destination.amount)}</span>
                      </header>
                      <dl>
                        <Fact label="Bank Code" value={destination.bankCode} />
                        <Fact label="Destination ID" value={destination.destinationId} />
                        <Fact label="Status" value={destination.status} />
                        <Fact label="Settlement date" value={destination.settlementDate} />
                        <Fact label="First seen" value={destination.firstSeen} />
                        <Fact label="Payment record" value={destination.paymentRecordId} />
                        <Fact label="Check number" value={destination.checkNumber} />
                      </dl>
                      <DestinationActions
                        destination={destination}
                        employee={employee}
                        openTool={openTool}
                        paystubId={paystub.id}
                        quickPin={quickPin}
                      />
                    </article>
                  ))}
                </section>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
