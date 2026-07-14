const identityProfiles = {
  'FA-ATO-24018': { dob: 'Feb 14, 1988', profileId: 'PRF-8842', confidence: 'Profile fields matched in the fictional training packet', applicationHistory: 'One active consumer relationship', watchlist: 'No fictional training watchlist record returned' },
  'FA-CB-24007': { dob: 'Nov 3, 1991', profileId: 'PRF-5510', confidence: 'Profile fields matched in the fictional training packet', applicationHistory: 'One active cardholder relationship', watchlist: 'No fictional training watchlist record returned' },
  'FA-CR-24003': { dob: 'Jun 22, 1995', profileId: 'PRF-2044', confidence: 'Limited early-history profile match in the fictional training packet', applicationHistory: 'One new credit relationship', watchlist: 'No fictional training watchlist record returned' },
};

function mask(value = '') {
  const text = String(value);
  return text ? `••••-${text.slice(-4)}` : 'Not recorded';
}

function records(fields) {
  return fields.map(([label, value]) => ({ label, value }));
}

export function getIdentityIntelReport(activeCase) {
  const profile = identityProfiles[activeCase.id] ?? {
    dob: 'Training DOB not supplied',
    profileId: `PRF-${String(activeCase.trainingId ?? '0000').slice(-4)}`,
    confidence: 'Fictional profile match available for review',
    applicationHistory: 'Current case relationship only',
    watchlist: 'No fictional training watchlist record returned',
  };
  const contact = activeCase.customer?.contact ?? {};
  const address = contact.address ?? activeCase.intake?.customerLocation ?? 'Training address not supplied';
  const firstName = String(activeCase.person ?? 'Training').split(' ')[0];
  const lastName = String(activeCase.person ?? 'Profile').split(' ').slice(-1)[0];
  const email = contact.email ?? activeCase.identityRecords?.find((item) => item.type === 'Email')?.value ?? 'Not recorded';
  const phone = contact.phone ?? activeCase.identityRecords?.find((item) => item.type === 'Phone')?.value ?? 'Not recorded';
  const devices = [...new Set((activeCase.loginHistory ?? []).map((item) => item.deviceId ?? item.device).filter(Boolean))];
  const locations = [...new Set((activeCase.loginHistory ?? []).map((item) => item.location).filter(Boolean))];
  const businessName = activeCase.type?.includes('Credit') ? `${lastName} Training Ventures` : 'No business relationship returned';

  return {
    profile,
    searchKeys: [activeCase.person, activeCase.trainingId, email, phone, profile.dob, profile.profileId],
    summary: [
      ['Name / DOB match', `${activeCase.person} · ${profile.dob}`],
      ['Masked ID', mask(activeCase.trainingId)],
      ['Address stability', `${address} · current training profile address`],
      ['Phone age', 'Training history available from current relationship packet'],
      ['Email age', 'Training history available from current relationship packet'],
      ['Identity confidence', profile.confidence],
      ['Linked profiles', 'One active fictional profile'],
      ['Application history', profile.applicationHistory],
      ['Watchlist / OFAC training result', profile.watchlist],
      ['Public record summary', 'Fictional public-record rows available below'],
    ],
    counts: [
      ['Addresses', 2], ['Phones', 1], ['Emails', 2], ['Associates', 3], ['Businesses', businessName.startsWith('No ') ? 0 : 1], ['Properties', 1], ['Vehicles', 1], ['Licenses', 1], ['Public records', 2], ['Bankruptcies', 0], ['Liens / judgments', 0], ['Social / digital', 2],
    ],
    sections: [
      { id: 'identity-summary', title: 'Identity Summary', fields: records([['Full name', activeCase.person], ['DOB', profile.dob], ['Profile ID', profile.profileId], ['Training ID', mask(activeCase.trainingId)], ['Primary address', address], ['Identity confidence', profile.confidence]]) },
      { id: 'address-history', title: 'Address History', fields: records([['Current address', address], ['Previous address', `${locations[0] ?? 'Training location'} prior address record`], ['Move date', 'Not supplied in current packet'], ['Address stability', 'Current fictional address is tied to the active profile'], ['Linked applications', profile.applicationHistory], ['Mail-drop indicator', 'No fictional indicator returned']]) },
      { id: 'phone-numbers', title: 'Phone Numbers', fields: records([['Primary phone', phone], ['Carrier', 'Training mobile carrier'], ['First seen', activeCase.customer?.relationshipSince ?? 'Not supplied'], ['Last seen', activeCase.opened], ['Ownership confidence', 'Fictional profile match available'], ['OTP delivery history', 'Review Login History for authentication records']]) },
      { id: 'email-history', title: 'Email History', fields: records([['Primary email', email], ['Business email', `contact@${lastName.toLowerCase()}-training.example.test`], ['Historical emails', 'No additional fictional email listed'], ['First seen', activeCase.customer?.relationshipSince ?? 'Not supplied'], ['Last seen', activeCase.opened], ['Breach indicators', 'No fictional indicator returned'], ['Disposable email check', 'Training domain record']]) },
      { id: 'associates', title: 'Associates & Relatives', fields: records([['Mother', 'Fictional relative record not returned'], ['Father', 'Fictional relative record not returned'], ['Spouse', 'No spouse record returned'], ['Children', 'No child record returned'], ['Business associates', businessName.startsWith('No ') ? 'No business associate returned' : `${lastName} Training Ventures officer`], ['Known roommates', 'No shared-residence record returned'], ['Shared addresses', address], ['Shared phone numbers', 'No shared phone record returned'], ['Emergency contacts', 'Not supplied in current packet']]) },
      { id: 'employment', title: 'Employment History', fields: records([['Current employer', 'Training employer record not supplied'], ['Position', 'Not supplied'], ['Hire date', 'Not supplied'], ['Previous employers', 'No prior employer record returned'], ['Employment timeline', 'No employment timeline supplied'], ['Estimated income range', 'Not supplied'], ['Business owner', businessName.startsWith('No ') ? 'No business owner record returned' : activeCase.person], ['Officer positions', businessName.startsWith('No ') ? 'None returned' : 'Training officer record'], ['Payroll relationships', 'Review Payroll History when available']]) },
      { id: 'business-records', title: 'Businesses & Ownership', fields: records([['Business name', businessName], ['Entity type', businessName.startsWith('No ') ? 'No entity returned' : 'Training limited liability company'], ['SOS status', businessName.startsWith('No ') ? 'No state filing returned' : 'Active training record'], ['EIN', businessName.startsWith('No ') ? 'Not supplied' : '••-••••8421'], ['Owner', businessName.startsWith('No ') ? 'Not supplied' : activeCase.person], ['Officer', businessName.startsWith('No ') ? 'Not supplied' : activeCase.person], ['Registered agent', businessName.startsWith('No ') ? 'Not supplied' : 'Training registered agent'], ['Business address', businessName.startsWith('No ') ? 'Not supplied' : address], ['State filing date', businessName.startsWith('No ') ? 'Not supplied' : 'Training filing date'], ['Business standing', businessName.startsWith('No ') ? 'No entity returned' : 'Active training record']]) },
      { id: 'licenses', title: 'Licenses / Certifications', fields: records([['License number', 'LIC-••••-190'], ['License type', 'Training record'], ['Status', 'No action recorded'], ['Expiration', 'Not supplied'], ['Issuing agency', 'Training licensing source'], ['Disciplinary actions', 'No fictional disciplinary action returned']]) },
      { id: 'properties', title: 'Properties', fields: records([['Current residence', address], ['Purchase date', 'Not supplied'], ['Purchase price', 'Not supplied'], ['Estimated value', 'Not supplied'], ['Mortgage holder', 'Not supplied'], ['Tax assessment', 'Not supplied'], ['Rental properties', 'No rental property record returned'], ['Commercial properties', 'No commercial property record returned']]) },
      { id: 'vehicles', title: 'Vehicles', fields: records([['Vehicle', 'Training vehicle record'], ['VIN', '•••••••••••4821'], ['Registration', locations[0] ?? 'Training location'], ['Title status', 'No title issue returned'], ['Lien holder', 'Not supplied'], ['Plate history', 'No historical plate record returned']]) },
      { id: 'credit-summary', title: 'Credit Summary', fields: records([['Credit relationship', activeCase.customer?.segment ?? 'Not supplied'], ['Account standing', activeCase.status ?? 'Not supplied'], ['Current exposure', activeCase.amount ?? 'Not supplied'], ['Application history', profile.applicationHistory], ['Financial context', 'Open Financial Investigation when available']]) },
      { id: 'bankruptcies', title: 'Bankruptcies', fields: records([['Chapter', 'No fictional bankruptcy record returned'], ['Filed', 'Not applicable'], ['Discharged', 'Not applicable'], ['Case number', 'Not applicable'], ['Court', 'Not applicable'], ['Status', 'No record returned']]) },
      { id: 'liens-judgments', title: 'Liens / Judgments', fields: records([['Federal', 'No record returned'], ['State', 'No record returned'], ['Civil', 'No record returned'], ['Tax', 'No record returned'], ['Satisfied', 'No record returned'], ['Outstanding', 'No record returned']]) },
      { id: 'criminal', title: 'Criminal Records (Training Only)', fields: records([['Record found', 'No fictional record returned'], ['Jurisdiction', 'Not applicable'], ['Offense type', 'Not applicable'], ['Disposition', 'Not applicable'], ['Sentence', 'Not applicable'], ['Case number', 'Not applicable']]) },
      { id: 'public-records', title: 'Public Records', fields: records([['Marriage', 'No record returned'], ['Divorce', 'No record returned'], ['Court filings', 'No record returned'], ['Civil cases', 'No record returned'], ['Professional discipline', 'No record returned'], ['Voter registration', locations[0] ?? 'Training location']]) },
      { id: 'social-digital', title: 'Social & Digital Presence', fields: records([['Known devices', devices.join(' · ') || 'No device record returned'], ['Known locations', locations.join(' · ') || 'No location record returned'], ['Digital profile links', activeCase.identityRecords?.map((item) => item.id).join(' · ') || 'No profile links returned'], ['Application activity', profile.applicationHistory]]) },
      { id: 'additional-sources', title: 'Additional Data Sources', fields: records([['Current case', activeCase.id], ['Claim lane', activeCase.type], ['Source note', 'All records in this report are fictional training data'], ['Related tools', 'Customer 360 · Evidence Center · Login History · Device Intelligence']]) },
    ],
  };
}

export function matchesIdentityIntelSearch(report, value) {
  const query = String(value ?? '').trim().toLowerCase();
  if (!query) return false;
  return report.searchKeys.some((key) => String(key ?? '').toLowerCase().includes(query));
}
