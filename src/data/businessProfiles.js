import { businessRecordsByCase } from './businessRecords.js';
import { evidenceRecordsByCase } from './evidenceRecords.js';
import { financialRecordsByCase } from './financialRecords.js';

const builtInLookup = {
  'FA-ATO-24018': {
    name: 'Northstar Digital Market LLC',
    businessId: 'TBI-NDM-7784',
    status: 'Active fictional registration',
    formed: 'Mar 14, 2019',
    entityType: 'Limited liability company',
    industry: 'Digital goods marketplace',
    address: 'Austin, TX training business address',
    phone: '(512) 555-0138',
    email: 'support@northstar.training.test',
    website: 'northstar.training.test',
  },
  'FA-CB-24007': {
    name: 'StreamBox Billing Services LLC',
    businessId: 'TBI-SBX-2207',
    status: 'Active fictional registration',
    formed: 'Aug 2, 2016',
    entityType: 'Limited liability company',
    industry: 'Subscription media billing',
    address: 'Denver, CO training business address',
    phone: '(303) 555-0187',
    email: 'billing@streambox.training.test',
    website: 'streambox.training.test',
  },
  'FA-CR-24003': {
    name: 'Lakeside Office Supply LLC',
    businessId: 'TBI-LOS-3301',
    status: 'Active fictional Texas registration',
    formed: 'Nov 19, 2014',
    entityType: 'Limited liability company',
    industry: 'Office supply distribution',
    address: 'Arlington, TX training business address',
    phone: '(817) 555-0126',
    email: 'payroll@lakeside.training.test',
    website: 'lakeside.training.test',
  },
};

function asItems(records = [], mapper) {
  return records.map(mapper);
}

function generatedLookup(activeCase) {
  const source = activeCase.businessProfile ?? {};
  return {
    name: source.name ?? `${activeCase.type} training entity`,
    businessId: source.businessId ?? `TBI-${String(activeCase.id).slice(-8)}`,
    status: 'Active fictional business record',
    formed: 'Generated business history',
    entityType: activeCase.type === 'Credit Risk Review' ? 'Employer or business entity' : 'Merchant or service entity',
    industry: source.industry ?? 'Training business relationship',
    address: source.address ?? `${activeCase.intake?.customerLocation ?? 'Dallas, TX'} training business address`,
    phone: source.phone ?? '(555) 020-0000',
    email: source.email ?? 'operations@business.training.test',
    website: `${String(source.name ?? 'business').toLowerCase().replace(/[^a-z0-9]+/g, '')}.training.test`,
  };
}

export function buildBusinessProfile(activeCase) {
  const lookup = builtInLookup[activeCase.id] ?? generatedLookup(activeCase);
  const business = businessRecordsByCase[activeCase.id] ?? null;
  const financial = financialRecordsByCase[activeCase.id] ?? null;
  const evidence = evidenceRecordsByCase[activeCase.id] ?? null;
  const generatedBusiness = activeCase.businessProfile ?? {};

  const business360 = business?.business360 ?? [
    { id: `${activeCase.id}-BUS-1`, entity: lookup.name, relationship: generatedBusiness.relationship ?? 'Case-linked business relationship', status: lookup.status, observed: activeCase.opened, context: `${lookup.businessId} · ${lookup.industry}.` },
    { id: `${activeCase.id}-BUS-2`, entity: generatedBusiness.contactName ?? 'Training business contact', relationship: 'Business contact', status: 'Contact available', observed: activeCase.opened, context: `${lookup.phone} · ${lookup.email}.` },
  ];
  const intelligence = business?.businessIntel ?? [
    { id: `${activeCase.id}-BIN-1`, type: 'Legal business name', value: lookup.name, observed: activeCase.opened, context: `Training Business ID ${lookup.businessId}.` },
    { id: `${activeCase.id}-BIN-2`, type: 'Business address', value: lookup.address, observed: activeCase.opened, context: lookup.status },
    { id: `${activeCase.id}-BIN-3`, type: 'Business contact', value: `${lookup.phone} · ${lookup.email}`, observed: activeCase.opened, context: lookup.industry },
  ];
  const employees = business?.employeeProfile ?? [
    { id: `${activeCase.id}-EMP-1`, name: generatedBusiness.contactName ?? 'Training business contact', role: 'Case-linked business contact', employer: lookup.name, status: 'Contact available', lastSeen: activeCase.opened, context: `${lookup.phone} · ${lookup.email}.` },
  ];
  const payroll = business?.payrollHistory ?? [
    { id: `${activeCase.id}-PAYROLL-1`, period: 'Generated current period', employer: lookup.name, amount: activeCase.type === 'Credit Risk Review' ? '$1,280.00' : 'Not applicable', channel: activeCase.type === 'Credit Risk Review' ? 'Direct deposit' : 'No payroll records in scope', status: activeCase.type === 'Credit Risk Review' ? 'Posted' : 'Scope record', context: lookup.businessId },
  ];
  const payments = financial?.paymentVerification ?? [
    { id: `${activeCase.id}-PAY-1`, type: 'Bank Code', object: generatedBusiness.bankCode ?? `BC-${String(activeCase.id).slice(-3)}`, status: 'Tokenized training record', lastSeen: activeCase.opened, context: lookup.name },
    { id: `${activeCase.id}-PAY-2`, type: 'Destination ID', object: generatedBusiness.destinationId ?? `DST-${String(activeCase.id).slice(-8)}`, status: 'Verification record available', lastSeen: activeCase.opened, context: lookup.address },
  ];
  const documents = evidence?.documents ?? (activeCase.documents ?? []).map((item) => ({
    id: item.id,
    title: item.name ?? item.title,
    status: item.status,
    category: item.category ?? 'Training document',
    preview: item.preview ?? item.detail,
  }));

  return {
    ...lookup,
    profileSummary: [
      { value: lookup.name, detail: `${lookup.entityType} · ${lookup.status}` },
      { value: lookup.businessId, detail: `Training Business ID · formed ${lookup.formed}` },
      { value: lookup.address, detail: 'Registered and operating address from the fictional source' },
      { value: `${lookup.phone} · ${lookup.email}`, detail: `Business contact · ${lookup.website}` },
    ],
    operations: asItems(intelligence, (item) => ({ value: `${item.type}: ${item.value}`, detail: `${item.observed} · ${item.context}` })),
    relationships: asItems(business360, (item) => ({ value: `${item.entity} · ${item.relationship}`, detail: `${item.status} · ${item.observed} · ${item.context}` })),
    contacts: asItems(employees, (item) => ({ value: `${item.name} · ${item.role}`, detail: `${item.employer} · ${item.status} · ${item.context}` })),
    payroll: asItems(payroll, (item) => ({ value: `${item.period} · ${item.amount}`, detail: `${item.employer} · ${item.channel} · ${item.status} · ${item.context}` })),
    paymentRelationships: asItems(payments, (item) => ({ value: `${item.type} · ${item.object}`, detail: `${item.status} · ${item.lastSeen} · ${item.context}` })),
    publicRecords: [
      { value: 'Training registration source', detail: `${lookup.status} · ${lookup.entityType} · formed ${lookup.formed}` },
      { value: 'Training public-record snapshot', detail: 'No final risk or legitimacy conclusion is included in the pre-submission report' },
    ],
    documents: asItems(documents, (item) => ({ value: `${item.id} · ${item.title}`, detail: `${item.status} · ${item.category} · ${item.preview ?? 'Open Document Viewer for detail'}` })),
    timeline: (activeCase.events ?? []).map((item) => ({ value: `${item.time} · ${item.label}`, detail: `${item.object} · ${item.detail}` })),
  };
}
