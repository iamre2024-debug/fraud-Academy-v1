import { useEffect, useMemo, useState } from 'react';
import {
  financialRecordSearchText,
  getFinancialInvestigation,
} from './data/financialInvestigationRecords.js';
import { publicCaseTaxonomy } from './data/publicCaseView.js';

const noop = () => {};

function comparisonWidth(value, peerValue) {
  const maximum = Math.max(1, Math.abs(value), Math.abs(peerValue));
  if (!value) return '0%';
  return `${Math.max(4, (Math.abs(value) / maximum) * 100)}%`;
}

function payrollMetricText(label, value, formatter = (item) => item) {
  if (value === null || value === undefined) return null;
  return `${label}: ${formatter(value)}`;
}

function displayMoney(value) {
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FinancialInvestigationWorkspace({
  activeCase,
  query = '',
  pin = noop,
  saveNote = noop,
  markReviewed = noop,
  reviewed = false,
  openTool = noop,
  jumpDecision = noop,
}) {
  const workspace = useMemo(() => getFinancialInvestigation(activeCase), [activeCase]);
  const firstSectionId = workspace.sections[0]?.id ?? 'account-review';
  const [activeSectionId, setActiveSectionId] = useState(firstSectionId);
  const [recordPeriod, setRecordPeriod] = useState('All periods');
  const [recordQuery, setRecordQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('All months');
  const [payrollPeriod, setPayrollPeriod] = useState('All pay periods');
  const [payrollRunType, setPayrollRunType] = useState('All run types');
  const [payrollRunStatus, setPayrollRunStatus] = useState('All run statuses');
  const [aggregateGranularity, setAggregateGranularity] = useState('month');
  const [aggregatePeriod, setAggregatePeriod] = useState('All dates');

  const section = workspace.sections.find((item) => item.id === activeSectionId)
    ?? workspace.sections[0];
  const sectionRecords = workspace.recordsBySection[section?.id] ?? [];
  const periods = ['All periods', ...new Set(sectionRecords.map((record) => record.period).filter(Boolean))];
  const aggregateAnalysis = section?.id === 'spending'
    ? workspace.spending
    : section?.id === 'deposits'
      ? workspace.deposits
      : null;
  const aggregateBuckets = aggregateAnalysis?.aggregations?.[aggregateGranularity] ?? [];
  const selectedAggregateBucket = aggregateBuckets.find((bucket) => bucket.id === aggregatePeriod);
  const visibleAggregateBuckets = selectedAggregateBucket ? [selectedAggregateBucket] : aggregateBuckets;
  const normalizedQuery = recordQuery.trim().toLowerCase();
  const filteredRecords = sectionRecords.filter((record) => (
    (recordPeriod === 'All periods' || record.period === recordPeriod)
    && (payrollMonth === 'All months' || record.monthId === payrollMonth)
    && (payrollPeriod === 'All pay periods' || record.payrollRunId === payrollPeriod)
    && (payrollRunType === 'All run types' || record.runType === payrollRunType)
    && (payrollRunStatus === 'All run statuses' || record.runStatus === payrollRunStatus)
    && (!selectedAggregateBucket || (
      record.periodRange.startDate >= selectedAggregateBucket.startDate
      && record.periodRange.startDate <= selectedAggregateBucket.endDate
    ))
    && (!normalizedQuery || financialRecordSearchText(record).includes(normalizedQuery))
  ));
  const activeRecord = filteredRecords.find((record) => record.id === selectedId)
    ?? filteredRecords[0]
    ?? sectionRecords[0];
  const visiblePayrollMonths = workspace.payroll.months.filter((month) => (
    payrollMonth === 'All months' || month.id === payrollMonth
  ));
  const maxDeposit = Math.max(1, ...workspace.depositTrend.map((item) => item.value));
  const taxonomy = publicCaseTaxonomy(activeCase);

  useEffect(() => {
    setActiveSectionId(workspace.sections[0]?.id ?? 'account-review');
    setRecordPeriod('All periods');
    setRecordQuery('');
    setSelectedId('');
    setPayrollMonth('All months');
    setPayrollPeriod('All pay periods');
    setPayrollRunType('All run types');
    setPayrollRunStatus('All run statuses');
    setAggregateGranularity('month');
    setAggregatePeriod('All dates');
  }, [activeCase.id, workspace.sections]);

  useEffect(() => {
    const requested = String(query ?? '').trim();
    if (!requested) return;
    setRecordQuery(requested);
    for (const candidate of workspace.sections) {
      const match = (workspace.recordsBySection[candidate.id] ?? []).find((record) => (
        record.id.toLowerCase() === requested.toLowerCase()
        || record.payrollRunId?.toLowerCase() === requested.toLowerCase()
      ));
      if (!match) continue;
      setActiveSectionId(candidate.id);
      setSelectedId(match.id);
      if (match.monthId) setPayrollMonth(match.monthId);
      if (match.payrollRunId) setPayrollPeriod(match.payrollRunId);
      break;
    }
  }, [query, workspace]);

  function selectSection(sectionId) {
    setActiveSectionId(sectionId);
    setRecordPeriod('All periods');
    setSelectedId('');
    setPayrollMonth('All months');
    setPayrollPeriod('All pay periods');
    setPayrollRunType('All run types');
    setPayrollRunStatus('All run statuses');
    setAggregateGranularity('month');
    setAggregatePeriod('All dates');
  }

  function saveFinancialNote(record) {
    saveNote(
      `Financial Investigation: ${record.id} — ${record.detail} Support records: ${record.supportRecordIds.join(', ') || 'none listed'}.`,
      'Financial investigation',
    );
  }

  function openPayrollRun(runId) {
    if (!runId) return;
    openTool('Payroll History', 'investigate', { query: runId });
  }

  function openRelatedTool(route) {
    if (route.tool === 'Payroll History') {
      openPayrollRun(activeRecord?.payrollRunId ?? workspace.payroll.records[0]?.payrollRunId);
      return;
    }
    openTool(route.tool, 'investigate');
  }

  return (
    <>
      {workspace.kpis.length > 0 && (
        <section className="financial-investigation-kpis" aria-label="Financial Investigation account metrics">
          {workspace.kpis.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.context}</small>
            </article>
          ))}
        </section>
      )}

      <section className="financial-account-strip" aria-label="Financial relationship snapshot">
        <div>
          <p>Account in review</p>
          <h3>{workspace.profile.account}</h3>
          <span>{workspace.profile.productTypeLabel} | {workspace.profile.accountStatus}</span>
        </div>
        <dl>
          <div><dt>Customer type</dt><dd>{workspace.profile.customerTypeLabel}</dd></div>
          <div><dt>Relationship</dt><dd>{workspace.profile.relationshipLength}</dd></div>
          <div><dt>Workflow</dt><dd>{workspace.profile.workflowTypeLabel}</dd></div>
          <div><dt>Case amount / exposure</dt><dd>{workspace.profile.caseAmountDisplay}</dd></div>
        </dl>
      </section>

      <nav className="financial-investigation-tabs" aria-label="Financial Investigation sections">
        {workspace.sections.map((item) => (
          <button
            key={item.id}
            type="button"
            className={section?.id === item.id ? 'active' : ''}
            aria-pressed={section?.id === item.id}
            onClick={() => selectSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="financial-investigation-findbar" aria-label="Financial Investigation filters">
        <div>
          <p>{section?.label}</p>
          <h3>{section?.question}</h3>
        </div>
        <label>
          <span>Search this section</span>
          <input
            value={recordQuery}
            onChange={(event) => setRecordQuery(event.target.value)}
            placeholder="Record, amount, account, source, date, or support ID"
            aria-label="Search Financial Investigation records"
          />
        </label>
        {section?.id === 'payroll' ? (
          <>
            <label>
              <span>Payroll month</span>
              <select
                value={payrollMonth}
                onChange={(event) => {
                  setPayrollMonth(event.target.value);
                  setPayrollPeriod('All pay periods');
                  setSelectedId('');
                }}
                aria-label="Financial Investigation payroll month filter"
              >
                <option value="All months">All months</option>
                {workspace.payroll.months.map((month) => (
                  <option key={month.id} value={month.id}>
                    {month.label} · {month.startDate} to {month.endDate}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Pay period</span>
              <select
                value={payrollPeriod}
                onChange={(event) => {
                  setPayrollPeriod(event.target.value);
                  setSelectedId(event.target.value === 'All pay periods' ? '' : event.target.value);
                }}
                aria-label="Financial Investigation pay-period filter"
              >
                <option value="All pay periods">All pay periods</option>
                {workspace.payroll.payPeriods
                  .filter((item) => payrollMonth === 'All months' || item.monthId === payrollMonth)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} · {item.totalDisplay}
                    </option>
                ))}
              </select>
            </label>
            <label>
              <span>Payroll run type</span>
              <select
                value={payrollRunType}
                onChange={(event) => {
                  setPayrollRunType(event.target.value);
                  setPayrollPeriod('All pay periods');
                  setSelectedId('');
                }}
                aria-label="Financial Investigation payroll run-type filter"
              >
                <option value="All run types">All run types</option>
                {workspace.payroll.runTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Payroll run status</span>
              <select
                value={payrollRunStatus}
                onChange={(event) => {
                  setPayrollRunStatus(event.target.value);
                  setPayrollPeriod('All pay periods');
                  setSelectedId('');
                }}
                aria-label="Financial Investigation payroll run-status filter"
              >
                <option value="All run statuses">All run statuses</option>
                {workspace.payroll.runStatuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </>
        ) : aggregateAnalysis ? (
          <>
            <label>
              <span>Aggregate by</span>
              <select
                value={aggregateGranularity}
                onChange={(event) => {
                  setAggregateGranularity(event.target.value);
                  setAggregatePeriod('All dates');
                  setSelectedId('');
                }}
                aria-label={`Financial Investigation ${section.id} granularity filter`}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
            <label>
              <span>Date bucket</span>
              <select
                value={aggregatePeriod}
                onChange={(event) => {
                  setAggregatePeriod(event.target.value);
                  setSelectedId('');
                }}
                aria-label={`Financial Investigation ${section.id} date filter`}
              >
                <option value="All dates">All dates</option>
                {aggregateBuckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.label} · {bucket.startDate} to {bucket.endDate}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label>
            <span>Record period</span>
            <select
              value={recordPeriod}
              onChange={(event) => {
                setRecordPeriod(event.target.value);
                setSelectedId('');
              }}
              aria-label="Financial Investigation period filter"
            >
              {periods.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        )}
        <span>{filteredRecords.length} of {sectionRecords.length} records shown</span>
      </section>

      {section?.id === 'comparisons' && workspace.comparisons.length > 0 && (
        <section className="financial-comparison-grid" aria-label="Current and historical financial comparisons">
          {workspace.comparisons.map((item) => (
            <article key={item.id}>
              <header>
                <strong>{item.label}</strong>
                <span>Baseline {item.baselineDisplay} · {item.baselineDateRange}</span>
                <span>Current {item.currentDisplay} · {item.currentDateRange}</span>
              </header>
              <div aria-hidden="true">
                <i style={{ width: comparisonWidth(item.baselineValue, item.currentValue) }} />
                <b style={{ width: comparisonWidth(item.currentValue, item.baselineValue) }} />
              </div>
              <p>{item.explanation}</p>
              <p>Support: {item.supportRecordIds.join(' · ') || 'No separate support ID supplied'}</p>
            </article>
          ))}
        </section>
      )}

      {section?.id === 'spending' && workspace.spending.records.length > 0 && (
        <section className="financial-investigation-kpis" aria-label="Spending total reconciliation">
          <article>
            <span>Visible records</span>
            <strong>{workspace.spending.visibleTotalDisplay}</strong>
            <small>{workspace.spending.periodRange.label}</small>
          </article>
          {workspace.spending.knownRemainder > 0 && (
            <article>
              <span>Known grouped remainder</span>
              <strong>{workspace.spending.knownRemainderDisplay}</strong>
              <small>Statement-level amount not itemized in the visible records</small>
            </article>
          )}
          <article>
            <span>Period outflow</span>
            <strong>{workspace.spending.periodOutflowDisplay}</strong>
            <small>{workspace.spending.explanation}</small>
          </article>
        </section>
      )}

      {section?.id === 'deposits' && workspace.deposits.transactionCount > 0 && (
        <section className="financial-investigation-kpis" aria-label="Personal deposit summary">
          <article>
            <span>Supplied deposit total</span>
            <strong>{workspace.deposits.visibleTotalDisplay}</strong>
            <small>{workspace.deposits.periodRange.label}</small>
          </article>
          <article>
            <span>Monthly average</span>
            <strong>{workspace.deposits.monthlyAverageDisplay}</strong>
            <small>{workspace.deposits.aggregations.month.length} supplied month{workspace.deposits.aggregations.month.length === 1 ? '' : 's'}</small>
          </article>
          <article>
            <span>Regular entries</span>
            <strong>{workspace.deposits.regularEntryCount.toLocaleString('en-US')}</strong>
            <small>{workspace.deposits.irregularEntryCount.toLocaleString('en-US')} irregular / one-time</small>
          </article>
          {workspace.deposits.returnedOrReversedCount > 0 && (
            <article>
              <span>Returned / reversed entries</span>
              <strong>{workspace.deposits.returnedOrReversedCount.toLocaleString('en-US')}</strong>
              <small>{workspace.deposits.returnedOrReversedEntries.map((record) => record.id).join(' · ')}</small>
            </article>
          )}
        </section>
      )}

      {aggregateAnalysis && visibleAggregateBuckets.length > 0 && (
        <section
          className="financial-comparison-grid"
          aria-label={`${section.label} ${aggregateGranularity} summaries`}
        >
          {visibleAggregateBuckets.map((bucket) => {
            const largest = bucket.largestTransactions[0];
            const categories = bucket.categoryTotals
              .map((item) => `${item.label} ${item.totalDisplay}`)
              .join(' · ');
            const counterparties = bucket.merchantTotals
              .map((item) => `${item.label} ${item.totalDisplay} (${item.count})`)
              .join(' · ');
            return (
              <article key={bucket.id}>
                <header>
                  <strong>{bucket.label}</strong>
                  <span>{bucket.startDate} to {bucket.endDate}</span>
                  <span>{bucket.visibleTotalDisplay} across {bucket.transactionCount.toLocaleString('en-US')} record{bucket.transactionCount === 1 ? '' : 's'}</span>
                </header>
                <p>Average {bucket.averageDisplay}{largest ? ` · Largest ${largest.amountDisplay} (${largest.id})` : ''}</p>
                <p>{section.id === 'deposits' ? 'Types' : 'Categories'}: {categories || 'No amount category supplied'}</p>
                <p>{section.id === 'deposits' ? 'Sources' : 'Merchants / vendors'}: {counterparties || 'No counterparty supplied'}</p>
                {section.id === 'spending' && bucket.repeatedMerchantCount > 0 && (
                  <p>Repeated merchants / vendors: {bucket.repeatedMerchants.map((item) => `${item.merchant} (${item.count})`).join(' · ')}</p>
                )}
                {section.id === 'deposits' && bucket.returnedEntryCount > 0 && (
                  <p>Returned / reversed entries: {bucket.returnedEntryCount.toLocaleString('en-US')}</p>
                )}
                <p>Support: {bucket.supportRecordIds.join(' · ')}</p>
              </article>
            );
          })}
        </section>
      )}

      {section?.id === 'deposits' && workspace.depositTrend.length > 0 && (
        <section className="financial-deposit-trend" aria-label="Personal deposit entries">
          <header>
            <p>Personal deposit analysis</p>
            <h3>Recorded incoming funds by exact source period</h3>
          </header>
          <div>
            {workspace.depositTrend.map((item) => (
              <article key={item.id}>
                <span>{item.periodRange.label}</span>
                <div><i style={{ height: `${Math.max(8, (item.value / maxDeposit) * 100)}%` }} /></div>
                <strong>{item.displayValue}</strong>
                <small>{item.title} · {item.supportRecordIds.join(', ')}</small>
              </article>
            ))}
          </div>
        </section>
      )}

      {section?.id === 'payments' && workspace.payments.datedRecords.length > 0 && (
        <>
          <section className="financial-investigation-kpis" aria-label="Credit and loan payment summary">
            <article>
              <span>Average monthly payment</span>
              <strong>{workspace.payments.averageMonthlyPaymentDisplay}</strong>
              <small>{workspace.payments.monthlyRows.length} supplied month{workspace.payments.monthlyRows.length === 1 ? '' : 's'}</small>
            </article>
            <article>
              <span>Actual paid in supplied rows</span>
              <strong>{workspace.payments.actualTotalDisplay}</strong>
              <small>{workspace.payments.datedRecords.length} dated payment record{workspace.payments.datedRecords.length === 1 ? '' : 's'}</small>
            </article>
          </section>
          <section className="financial-comparison-grid" aria-label="Monthly credit and loan payments">
            {workspace.payments.monthlyRows.map((month) => (
              <article key={month.id}>
                <header>
                  <strong>{month.label}</strong>
                  <span>{month.startDate} to {month.endDate}</span>
                  <span>Scheduled / minimum {month.scheduledAmountDisplay} · Actual {month.actualPaidDisplay}</span>
                </header>
                <p>Status: {month.statuses.join(' · ') || 'Not supplied'}</p>
                <p>Source: {month.sources.join(' · ') || 'Not supplied'}</p>
                <p>Balance after: {month.endingBalance === null ? 'Not supplied in the current training record' : `$${month.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
                <p>Support: {month.supportRecordIds.join(' · ')}</p>
              </article>
            ))}
          </section>
        </>
      )}

      {section?.id === 'payroll' && visiblePayrollMonths.length > 0 && (
        <section className="financial-comparison-grid" aria-label="Business payroll monthly totals">
          {visiblePayrollMonths.map((month) => {
            const details = [
              `${month.runCount} pay period${month.runCount === 1 ? '' : 's'}`,
              payrollMetricText('Employees', month.employeeCount),
              payrollMetricText('Gross wages', month.grossWages, displayMoney),
              payrollMetricText('Employee taxes', month.employeeTaxes, displayMoney),
              payrollMetricText('Employer taxes', month.employerTaxes, displayMoney),
              payrollMetricText('Deductions', month.deductions, displayMoney),
              payrollMetricText('Employer contributions', month.employerContributions, displayMoney),
              payrollMetricText('Net payroll', month.netPayroll, displayMoney),
            ].filter(Boolean);
            return (
              <article key={month.id}>
                <header>
                  <strong>{month.label}</strong>
                  <span>{month.startDate} to {month.endDate}</span>
                  <span>Total company debit {month.companyDebitDisplay}</span>
                </header>
                <p>{details.join(' · ')}</p>
                <p>Run types: {month.runTypes.join(' · ')} · Run statuses: {month.runStatuses.join(' · ')}</p>
                <p>Funding {month.fundingAmountDisplay} · {month.fundingStatuses.join(' · ')} · Support {month.supportRecordIds.join(' · ')}</p>
              </article>
            );
          })}
        </section>
      )}

      <div className="financial-investigation-workspace">
        <section className="financial-record-workspace">
          <section className="financial-record-list" aria-label={`${section?.label} records`}>
            <header>
              <div><p>Evidence records</p><h3>{section?.label}</h3></div>
              <span>{filteredRecords.length} shown</span>
            </header>
            {filteredRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                className={activeRecord?.id === record.id ? 'active' : ''}
                onClick={() => setSelectedId(record.id)}
                data-financial-investigation-record={record.id}
              >
                <span>{record.category} | {record.periodRange.label}</span>
                <strong>{record.title}</strong>
                <small>{record.value} | {record.status}</small>
              </button>
            ))}
            {!filteredRecords.length && (
              <div className="investigation-tool-empty" role="status">
                No financial records match these filters.
              </div>
            )}
          </section>

          {activeRecord ? (
            <section className="financial-record-detail" aria-label="Expanded financial record">
              <header>
                <div>
                  <p>Expanded evidence</p>
                  <h3>{activeRecord.id}</h3>
                  <span>{activeRecord.title} | {activeRecord.periodRange.label}</span>
                </div>
                <button type="button" onClick={() => pin(activeRecord.id)}>Pin record</button>
              </header>
              <dl>
                {activeRecord.fields.map(([label, value]) => (
                  <div key={`${activeRecord.id}-${label}`}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <article>
                <span>Recorded context</span>
                <p>{activeRecord.detail}</p>
              </article>
              <div className="financial-related-records">
                <span>Support records</span>
                <div>
                  {activeRecord.supportRecordIds.map((item) => (
                    <button key={item} type="button" onClick={() => pin(item)}>{item}</button>
                  ))}
                </div>
              </div>
              {activeRecord.payrollRunId && (
                <button type="button" onClick={() => openPayrollRun(activeRecord.payrollRunId)}>
                  Open {activeRecord.payrollRunId} in Payroll History
                </button>
              )}
              <button type="button" onClick={() => saveFinancialNote(activeRecord)}>Save evidence note</button>
            </section>
          ) : (
            <div className="investigation-tool-empty" role="status">
              Choose a financial record to open its details.
            </div>
          )}
        </section>

        <aside className="financial-case-rail" aria-label="Financial Investigation case summary">
          <header>
            <p>Case money summary</p>
            <h3>{workspace.profile.caseAmountDisplay}</h3>
            <span>{taxonomy.customerType} | {taxonomy.productType} | {taxonomy.workflowType}</span>
          </header>
          <section>
            <p>Reviewed financial facts</p>
            {workspace.reviewedFacts.map((fact) => <article key={fact}>{fact}</article>)}
          </section>
          <section>
            <p>Record inventory</p>
            <div>
              {workspace.sections.map((item) => (
                <button key={item.id} type="button" onClick={() => selectSection(item.id)}>
                  <span>{item.label}</span>
                  <strong>{workspace.recordsBySection[item.id]?.length ?? 0}</strong>
                </button>
              ))}
            </div>
          </section>
          <nav>
            {workspace.routes.map((route) => (
              <button key={route.tool} type="button" onClick={() => openRelatedTool(route)}>
                {route.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <nav className="investigation-tool-next-routes" aria-label="Financial Investigation next routes">
        {workspace.routes.map((route) => (
          <button key={route.tool} type="button" onClick={() => openRelatedTool(route)}>
            {route.label}
          </button>
        ))}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>
      <footer className="investigation-tool-review-bar">
        <div>
          <strong>Financial Investigation review</strong>
          <span>Mark reviewed after comparing the applicable account, dated activity, payment, deposit, and payroll records.</span>
        </div>
        <button
          type="button"
          className={reviewed ? '' : 'investigation-tool-primary'}
          onClick={() => markReviewed('Financial Investigation')}
        >
          {reviewed ? '✓ Financial Investigation reviewed' : 'Mark Financial Investigation reviewed'}
        </button>
      </footer>
    </>
  );
}
