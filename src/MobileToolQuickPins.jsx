import { getBusiness360Workspace, getEmployeeProfiles, getPayrollHistory } from './data/businessPayrollWorkspace.js';
import { getFinancialRecords } from './data/caseToolData.js';
import { getCustomer360Dossier } from './data/customer360Dossier.js';
import { getMerchantIntelligence } from './data/merchantIntelligenceRecords.js';

function cleanIdentifier(item) {
  return item?.value && !/not (?:available|supplied|applicable|recorded)/i.test(String(item.value))
    ? item
    : null;
}

function uniqueIdentifiers(items = []) {
  const seen = new Set();
  return items.filter(cleanIdentifier).filter((item) => {
    const key = `${item.label}:${String(item.value).trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function identifiersFor(activeTool, activeCase, activeRow) {
  const dossier = getCustomer360Dossier(activeCase);
  const financial = getFinancialRecords(activeCase);
  const business = getBusiness360Workspace(activeCase);
  const employees = getEmployeeProfiles(activeCase);
  const payroll = getPayrollHistory(activeCase);
  const login = activeCase.loginHistory?.find((item) => item.id === activeRow?.id)
    ?? activeCase.loginHistory?.find((item) => item.deviceId === activeRow?.id)
    ?? activeCase.loginHistory?.[0];
  const payment = financial.paymentVerification?.find((item) => item.id === activeRow?.id)
    ?? financial.paymentVerification?.[0];
  const transaction = financial.transactions?.find((item) => item.id === activeRow?.id)
    ?? financial.transactions?.[0];
  const employee = employees.find((item) => item.id === activeRow?.id) ?? employees[0];
  const payrollRecord = payroll.find((item) => item.id === activeRow?.id) ?? payroll[0];
  const merchant = getMerchantIntelligence(activeCase).records?.[0];
  const common = [{ label: 'Case ID', value: activeCase.id, recordId: activeCase.id }];

  if (activeTool === 'Customer 360') return uniqueIdentifiers([
    ...common,
    { label: 'Customer ID', value: activeCase.customerId ?? dossier.identity.maskedMemberId },
    { label: 'Training ID', value: activeCase.trainingId },
    { label: 'Phone number', value: activeCase.customer?.contact?.phone },
    { label: 'Email', value: activeCase.customer?.contact?.email },
  ]);

  if (activeTool === 'Identity Intel / People Search') return uniqueIdentifiers([
    ...common,
    { label: 'Training ID', value: activeCase.trainingId },
    { label: 'Phone number', value: activeCase.customer?.contact?.phone },
    { label: 'Email', value: activeCase.customer?.contact?.email },
  ]);

  if (activeTool === 'Business 360' || activeTool === 'KYB Review' || activeTool === 'Business Intelligence') {
    return uniqueIdentifiers([
      ...common,
      { label: 'Business ID', value: business.relationships?.[0]?.id },
      { label: 'Phone number', value: activeCase.businessProfile?.phone ?? activeCase.customer?.contact?.phone },
      { label: 'Email', value: activeCase.businessProfile?.email ?? activeCase.customer?.contact?.email },
    ]);
  }

  if (activeTool === 'Employee Profile') return uniqueIdentifiers([
    ...common,
    { label: 'Employee ID', value: employee?.id, recordId: employee?.id },
    { label: 'Bank Code', value: employee?.paymentSource?.bankCode, recordId: employee?.id },
    { label: 'Destination ID', value: employee?.paymentSource?.destinationId, recordId: employee?.id },
  ]);

  if (activeTool === 'Payroll History') return uniqueIdentifiers([
    ...common,
    { label: 'Employee ID', value: employee?.id, recordId: employee?.id },
    { label: 'Bank Code', value: payrollRecord?.bankCode, recordId: payrollRecord?.id },
    { label: 'Destination ID', value: payrollRecord?.destinationId, recordId: payrollRecord?.id },
  ]);

  if (activeTool === 'Payment Verification') return uniqueIdentifiers([
    ...common,
    { label: 'Bank Code', value: payment?.bankCode, recordId: payment?.id },
    { label: 'Destination ID', value: payment?.destinationId, recordId: payment?.id },
  ]);

  if (activeTool === 'Login History' || activeTool === 'Device Intelligence' || activeTool === 'Session History') {
    return uniqueIdentifiers([
      ...common,
      { label: 'Device ID', value: login?.deviceId, recordId: login?.id },
      { label: 'IP address', value: login?.ip, recordId: login?.id },
      { label: 'Session ID', value: login?.session, recordId: login?.id },
    ]);
  }

  if (activeTool === 'IP Intelligence') return uniqueIdentifiers([
    ...common,
    { label: 'IP address', value: login?.ip, recordId: login?.id },
    { label: 'Device ID', value: login?.deviceId, recordId: login?.id },
  ]);

  if (activeTool === 'Transaction History' || activeTool === 'Financial Investigation') return uniqueIdentifiers([
    ...common,
    { label: 'Account ID', value: dossier.products?.[0]?.id },
    { label: 'Transaction ID', value: transaction?.id, recordId: transaction?.id },
  ]);

  if (activeTool === 'Merchant Intelligence') return uniqueIdentifiers([
    ...common,
    { label: 'Merchant ID', value: merchant?.id ?? transaction?.id, recordId: merchant?.id ?? transaction?.id },
    { label: 'Transaction ID', value: transaction?.id, recordId: transaction?.id },
  ]);

  return uniqueIdentifiers([
    ...common,
    activeRow?.id ? { label: 'Record ID', value: activeRow.id, recordId: activeRow.id } : null,
  ]);
}

export default function MobileToolQuickPins({ activeTool, activeCase, activeRow, quickPin }) {
  const identifiers = identifiersFor(activeTool, activeCase, activeRow);
  if (!quickPin || !identifiers.length) return null;

  return (
    <section className="mobile-tool-quick-pins" aria-label={`Pin ${activeTool} identifiers to Quick Pad`}>
      <header>
        <span aria-hidden="true">📌</span>
        <div><strong>Quick Pad shortcuts</strong><small>Copies only—these do not become evidence.</small></div>
      </header>
      <div>
        {identifiers.map((item) => (
          <button
            key={`${item.label}-${item.value}`}
            type="button"
            onClick={() => quickPin({
              label: item.label,
              value: item.value,
              sourceTool: activeTool,
              sourceRecordId: item.recordId ?? '',
            })}
          >
            <span>＋</span>{item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
