function entry(value, detail) {
  return { value, detail };
}

const builtInProfiles = {
  'FA-ATO-24018': {
    dob: '1988-02-19',
    language: 'English',
    passwordLastChanged: 'Jun 18, 2026',
    nameHistory: [
      entry('Maya Sterling', 'Current fictional customer name · observed since 2018'),
      entry('Maya R. Carter', 'Prior training-only name record · observed 2012–2018'),
    ],
    addresses: [
      entry('Dallas, TX training address', 'Current residential and mailing address · observed 2018–present'),
      entry('Irving, TX prior training address', 'Prior training-only address · observed 2014–2018'),
    ],
    phones: [
      entry('(214) 555-0184', 'Primary mobile · active customer-profile contact'),
      entry('(972) 555-0119', 'Prior training-only phone · last observed 2018'),
    ],
    emails: [
      entry('maya.training@example.test', 'Primary active customer-profile email'),
      entry('maya.sterling.archive@example.test', 'Prior training-only email · historical source record'),
    ],
    associates: [
      entry('Leah Sterling', 'Relative record · linked through prior address history'),
      entry('Owen Carter', 'Possible associate · linked through a historical contact source'),
    ],
    linkedProfiles: [
      entry('Consumer checking profile', 'Opened 2018 · active relationship record'),
      entry('Savings profile', 'Opened 2020 · active relationship record'),
    ],
    businesses: [entry('Sterling Creative Services', 'Sole-proprietor training record · inactive since 2024')],
    licenses: [entry('Texas driver credential', 'Training-only credential record · current through 2028')],
    vehicles: [entry('2021 compact SUV', 'Training vehicle record · Dallas registration area')],
    properties: [entry('Dallas residential lease record', 'Address-linked property source · 2018–present')],
    publicRecords: [entry('Training public-record search', 'No separate bankruptcy or civil judgment record supplied in the current fictional source set')],
    priorCases: [entry('2024 card replacement service case', 'Servicing history only · no investigation outcome is included in this report')],
  },
  'FA-CB-24007': {
    dob: '1991-10-06',
    language: 'English',
    passwordLastChanged: 'May 30, 2026',
    nameHistory: [
      entry('Jordan Ellis', 'Current fictional cardholder name · observed since 2021'),
      entry('Jordan M. Ellis', 'Expanded-name variation from a historical training source'),
    ],
    addresses: [
      entry('Fort Worth, TX training address', 'Current mailing and residential address · observed 2021–present'),
      entry('Arlington, TX prior training address', 'Prior training-only address · observed 2017–2021'),
    ],
    phones: [
      entry('(817) 555-0149', 'Primary mobile · active notification contact'),
      entry('(682) 555-0127', 'Prior training-only phone · historical source record'),
    ],
    emails: [
      entry('jordan.training@example.test', 'Primary active dispute-notification email'),
      entry('j.ellis.archive@example.test', 'Prior training-only email · historical source record'),
    ],
    associates: [
      entry('Morgan Ellis', 'Relative record · linked through the current address source'),
      entry('Taylor Reed', 'Possible associate · linked through a prior shared-address source'),
    ],
    linkedProfiles: [
      entry('Consumer cardholder profile', 'Opened 2021 · active card relationship'),
      entry('Merchant-contact profile', 'Current billing-dispute contact record'),
    ],
    businesses: [entry('Ellis Home Services', 'Training-only sole-proprietor record · active registration source')],
    licenses: [entry('Texas driver credential', 'Training-only credential record · current through 2027')],
    vehicles: [entry('2018 midsize sedan', 'Training vehicle record · Fort Worth registration area')],
    properties: [entry('Fort Worth residential lease record', 'Address-linked property source · 2021–present')],
    publicRecords: [entry('Training public-record search', 'One historical address filing is available; no judgment conclusion is included')],
    priorCases: [entry('2025 merchant inquiry', 'Customer-service history tied to another merchant · no outcome inference')],
  },
  'FA-CR-24003': {
    dob: '1997-04-17',
    language: 'English',
    passwordLastChanged: 'Jul 7, 2026',
    nameHistory: [
      entry('Avery Brooks', 'Current fictional applicant name · profile created in 2026'),
      entry('Avery J. Brooks', 'Expanded-name variation from the identity-setup source'),
    ],
    addresses: [
      entry('Arlington, TX training address', 'Current application and mailing address · observed in 2026'),
      entry('Grand Prairie, TX prior training address', 'Prior training-only address · observed 2023–2026'),
    ],
    phones: [
      entry('(682) 555-0167', 'Primary mobile · captured during profile creation'),
      entry('(469) 555-0193', 'Prior training-only phone · historical source record'),
    ],
    emails: [
      entry('avery.training@example.test', 'Primary active account-notification email'),
      entry('avery.brooks.archive@example.test', 'Prior training-only email · historical source record'),
    ],
    associates: [
      entry('Cameron Brooks', 'Relative record · linked through a prior address source'),
      entry('Riley James', 'Possible associate · linked through a historical contact source'),
    ],
    linkedProfiles: [
      entry('New credit profile', 'Opened Jul 7, 2026 · limited relationship history'),
      entry('Payment setup profile', 'Bank Code and Destination ID objects are stored in Payment Verification'),
    ],
    businesses: [entry('Brooks Technical Support', 'Training-only employer/source record · active since 2024')],
    licenses: [entry('Texas driver credential', 'Training-only credential record · current through 2029')],
    vehicles: [entry('2020 compact sedan', 'Training vehicle record · Arlington registration area')],
    properties: [entry('Arlington residential lease record', 'Address-linked property source · current application address')],
    publicRecords: [entry('Training public-record search', 'No separate bankruptcy or civil judgment record supplied in the current fictional source set')],
    priorCases: [entry('No prior Fraud Academy case record', 'The current fictional source set contains only the new-profile review')],
  },
};

function deterministicDob(activeCase) {
  const seed = [...String(activeCase.id ?? activeCase.trainingId ?? 'generated')]
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const year = 1982 + (seed % 19);
  const month = 1 + (seed % 12);
  const day = 1 + (seed % 27);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function ageFor(dob) {
  const year = Number.parseInt(String(dob).slice(0, 4), 10);
  return Number.isFinite(year) ? 2026 - year : 'Not recorded';
}

function generatedProfile(activeCase) {
  const name = activeCase.person ?? 'Generated Customer';
  const [firstName = 'Generated'] = name.split(' ');
  const lastName = name.split(' ').slice(-1)[0] ?? 'Customer';
  const contact = activeCase.customer?.contact ?? {};
  const city = activeCase.intake?.customerLocation ?? 'Dallas, TX';
  const suffix = String(activeCase.id ?? '000').replace(/\D/g, '').slice(-3).padStart(3, '0');

  return {
    dob: deterministicDob(activeCase),
    language: 'English',
    passwordLastChanged: 'Generated case history',
    nameHistory: [
      entry(name, 'Current fictional generated-profile name'),
      entry(`${firstName} ${lastName.slice(0, 1)}. ${lastName}`, 'Expanded-name variation from a generated training source'),
    ],
    addresses: [
      entry(contact.address ?? `${city} training address`, 'Current generated residential and mailing address'),
      entry(`${city} prior training address ${suffix}`, 'Prior generated address source'),
    ],
    phones: [
      entry(contact.phone ?? `(555) 010-${suffix.padStart(4, '0')}`, 'Primary generated mobile contact'),
      entry(`(555) 019-${suffix.padStart(4, '0')}`, 'Prior training-only phone source'),
    ],
    emails: [
      entry(contact.email ?? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@training.example.test`, 'Primary generated profile email'),
      entry(`${firstName.toLowerCase()}.${suffix}@archive.example.test`, 'Prior training-only email source'),
    ],
    associates: [
      entry(`Alex ${lastName}`, 'Generated relative record · linked through address history'),
      entry(`Taylor ${lastName}`, 'Generated possible associate · linked through a prior contact source'),
    ],
    linkedProfiles: [
      entry(activeCase.customer?.segment ?? 'Generated customer profile', 'Primary generated relationship profile'),
      entry(`${activeCase.type ?? 'Case'} supporting profile`, 'Case-linked generated relationship record'),
    ],
    businesses: [entry(`${lastName} Services`, 'Generated training-only business or employer association')],
    licenses: [entry('Texas driver credential', 'Generated training-only credential record')],
    vehicles: [entry('Generated vehicle record', `Training vehicle source · ${city} area`)],
    properties: [entry(`${city} residential record`, 'Generated address-linked property source')],
    publicRecords: [entry('Training public-record search', 'No separate judgment conclusion is included in the generated source set')],
    priorCases: [entry('Generated historical service inquiry', 'Neutral historical context without an outcome label')],
  };
}

function relationshipValues(activeCase) {
  return (activeCase.customer?.relationship ?? []).map((item) => entry(item.value, item.label));
}

export function buildIdentityProfile(activeCase) {
  const base = builtInProfiles[activeCase.id] ?? generatedProfile(activeCase);
  const contact = activeCase.customer?.contact ?? {};
  const documents = activeCase.documents ?? [];
  const logins = activeCase.loginHistory ?? [];

  return {
    ...base,
    age: ageFor(base.dob),
    financialSummary: [
      ...relationshipValues(activeCase),
      entry(`${activeCase.amount ?? 'No amount recorded'} current case exposure`, 'Case amount is neutral investigation context, not an outcome indicator'),
    ],
    digitalPresence: [
      entry('Customer portal profile', `${contact.email ?? 'No email recorded'} · ${contact.phone ?? 'No phone recorded'}`),
      entry('Observed access history', `${logins.length} login record(s) · ${new Set(logins.map((item) => item.device).filter(Boolean)).size} device description(s)`),
    ],
    additionalSources: [
      entry('Document Viewer', documents.length ? documents.map((item) => `${item.id} ${item.name ?? item.title}`).join(' · ') : 'No documents recorded'),
      entry('Login, Session, and IP tools', logins.length ? logins.map((item) => `${item.session} · ${item.ip} · ${item.location}`).join(' | ') : 'No access records recorded'),
    ],
  };
}
