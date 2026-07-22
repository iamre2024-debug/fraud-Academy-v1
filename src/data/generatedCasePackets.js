const merchantNames = [
  ['Northstar Digital Market', '5734', 'Computer software and digital goods', 'Austin, TX'],
  ['Cedar Square Outfitters', '5651', 'Family clothing stores', 'Fort Worth, TX'],
  ['Riverbend Home Goods', '5712', 'Furniture and home furnishings', 'Plano, TX'],
  ['Juniper Tech Outlet', '5732', 'Electronics stores', 'Dallas, TX'],
  ['Lakeside Event Services', '7299', 'Business and personal services', 'Grapevine, TX'],
  ['Oakline Games', '5816', 'Digital games and media', 'Seattle, WA'],
  ['BrightCart Online', '5399', 'General merchandise ecommerce', 'Phoenix, AZ'],
  ['Cedar Table Restaurant', '5812', 'Eating places and restaurants', 'Arlington, TX'],
  ['Planwell Learning', '8299', 'Educational services', 'Chicago, IL'],
  ['StreamBox Premium', '4899', 'Digital subscription services', 'San Jose, CA'],
  ['Northline Apparel', '5691', 'Clothing stores', 'Irving, TX'],
  ['Harbor Electronics', '5732', 'Electronics stores', 'Denver, CO'],
];

const creditBureaus = ['Training Bureau North', 'Training Bureau Central', 'Training Bureau South'];

function stableNumber(value = '') {
  return [...String(value)].reduce((total, character) => ((total * 33) + character.charCodeAt(0)) % 2147483647, 5381);
}

function numberFromMoney(value = '') {
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function money(value = 0) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(value);
}

function shiftedDate(displayDate, days) {
  const date = new Date(displayDate);
  if (Number.isNaN(date.getTime())) return displayDate;
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function deadlineFrom(displayDate, days, time) {
  return `${shiftedDate(displayDate, days)} - ${time}`;
}

function pick(values, seed, offset = 0) {
  return values[(Math.abs(seed) + offset) % values.length];
}

function determinationTone(scenario) {
  const choice = scenario.caseTruth?.correctDetermination ?? '';
  if (/do not support|deny|refer to fraud|hold|support customer claim|route for secondary fraud/i.test(choice)) {
    if (/do not support|deny/i.test(choice)) return 'established';
    if (/support customer claim|hold|refer to fraud|route for secondary fraud/i.test(choice)) return 'exception';
  }
  if (/partial|insufficient|more information|request documents|escalate|unable|restrictions/i.test(choice)) return 'mixed';
  return 'established';
}

function creditDeterminationTone(scenario) {
  const choice = scenario.caseTruth?.correctDetermination ?? '';
  if (/support credit request|maintain account|^approve application$|release/i.test(choice)) return 'established';
  if (/more information|escalate|request documents|restrictions|hold pending|unable/i.test(choice)) return 'mixed';
  return 'exception';
}

function merchantChannel(subtype = '') {
  if (/wallet/i.test(subtype)) return 'Digital wallet';
  if (/ATM/i.test(subtype)) return 'ATM';
  if (/lost|stolen|counterfeit|incorrect amount/i.test(subtype)) return 'In-store';
  if (/subscription|cancel|recurring/i.test(subtype)) return 'Recurring';
  return 'Online';
}

function entryMode(subtype = '') {
  if (/wallet/i.test(subtype)) return 'Tokenized wallet credential';
  if (/ATM/i.test(subtype)) return 'EMV chip and PIN';
  if (/counterfeit/i.test(subtype)) return 'Magnetic-stripe fallback';
  if (/lost|stolen|incorrect amount/i.test(subtype)) return 'EMV chip or contactless';
  if (/subscription|cancel|recurring/i.test(subtype)) return 'Stored credential / recurring';
  return 'Card not present';
}

function reasonCodeFor(subtype = '') {
  const mappings = [
    [/duplicate/i, 'Training duplicate-processing review'],
    [/incorrect amount/i, 'Training incorrect-amount review'],
    [/refund not received|return credit/i, 'Training credit-not-processed review'],
    [/cancel|subscription/i, 'Training canceled-recurring-transaction review'],
    [/not as described/i, 'Training merchandise-not-as-described review'],
    [/services not rendered/i, 'Training services-not-provided review'],
    [/ATM/i, 'Training cash-withdrawal authorization review'],
    [/wallet/i, 'Training tokenized-card authorization review'],
    [/lost|stolen|never received|counterfeit|CNP|online purchase/i, 'Training unauthorized-card-activity review'],
  ];
  return mappings.find(([pattern]) => pattern.test(subtype))?.[1] ?? 'Training card-dispute review';
}

function fulfillmentFor(subtype = '', tone = 'mixed') {
  if (/duplicate/i.test(subtype)) return 'Two settled transactions map to the same order and fulfillment record';
  if (/incorrect amount/i.test(subtype)) return 'Signed receipt total differs from the posted transaction amount';
  if (/refund not received/i.test(subtype)) return 'Merchant credit confirmation exists without a matching posted credit';
  if (/return credit/i.test(subtype)) return 'Carrier and warehouse records show the returned item was received';
  if (/canceled service/i.test(subtype)) return 'Customer and merchant records show different cancellation-effective dates';
  if (/not as described/i.test(subtype)) return 'Listing and received-item records differ, while part of the order remains with the customer';
  if (/services not rendered/i.test(subtype)) return 'Merchant schedule shows the service was canceled and not rescheduled';
  if (/subscription terms/i.test(subtype)) return 'Checkout and renewal-notice records show the subscription terms presented to the customer';
  return tone === 'established' ? 'Customer address and recipient fields match' : tone === 'mixed' ? 'One order field matches and one differs' : 'Delivery or service record does not match the customer profile';
}

function makeMerchantPacket({ id, index, claimType, scenario, person, reportedDate, issueStartDate, amount, recordCount, difficulty }) {
  const seed = stableNumber(`${id}-${scenario.id}`);
  const [fallbackName, mcc, category, location] = pick(merchantNames, seed);
  const transactionLabel = scenario.transactionInfo.split(' - ')[0].trim();
  const scenarioMerchant = transactionLabel.replace(/\s+(purchase|billing|payment|order|disputes?|activity)$/i, '').trim();
  const name = /merchant|retail|online|card|transaction/i.test(scenarioMerchant) && scenarioMerchant.split(/\s+/).length < 3 ? fallbackName : scenarioMerchant || fallbackName;
  const tone = determinationTone(scenario);
  const authorizationTone = claimType.id === 'non-fraud-chargeback' ? 'established' : tone;
  const channel = merchantChannel(scenario.subtype);
  const authEntryMode = entryMode(scenario.subtype);
  const priorCount = Math.max(1, recordCount - 1);
  const disputeCount = /first-party/i.test(claimType.id) ? 2 + (seed % 3) : seed % 2;
  const refundCount = /refund|return|cancel/i.test(scenario.subtype) ? 1 + (seed % 3) : seed % 2;
  const attemptCount = difficulty === 'deep' ? 4 : difficulty === 'standard' ? 2 : 1;
  const declineCount = authorizationTone === 'exception' ? Math.min(2, attemptCount - 1) : seed % 2;
  const orderId = `ORD-${String(seed).slice(-7).padStart(7, '0')}`;
  const authorizationId = `AUTH-${String(seed * 7).slice(-8).padStart(8, '0')}`;
  const deliveryMatch = fulfillmentFor(scenario.subtype, tone);
  const deviceMatch = authorizationTone === 'established' ? 'Established customer device' : authorizationTone === 'mixed' ? 'Device seen once in prior browsing history' : 'Device not found in prior customer history';
  const avs = authorizationTone === 'established' ? 'Full street and postal-code match' : authorizationTone === 'mixed' ? 'Postal code match only' : 'No match';
  const cvv = authorizationTone === 'established' ? 'Match' : authorizationTone === 'mixed' ? 'Not supplied by merchant' : 'Mismatch or not processed';
  const auth = {
    id: authorizationId,
    authorizedAt: `${issueStartDate} - 6:42 PM`,
    amount: money(amount),
    entryMode: authEntryMode,
    avs,
    cvv,
    threeDS: /online|CNP|wallet/i.test(`${scenario.subtype} ${channel}`) ? (authorizationTone === 'established' ? 'Challenge completed' : 'No challenge result supplied') : 'Not applicable',
    otp: /wallet/i.test(scenario.subtype) ? (authorizationTone === 'established' ? 'OTP completed on established device' : 'OTP destination changed before enrollment') : 'Not used for this authorization',
    walletToken: /wallet/i.test(scenario.subtype) ? `TKN-${String(seed).slice(-6)} - ${deviceMatch}` : 'No wallet token in scope',
    device: deviceMatch,
    ip: authorizationTone === 'established' ? '198.51.100.42 - previously recorded training range' : '203.0.113.84 - new training range',
    attempts: `${attemptCount} attempt${attemptCount === 1 ? '' : 's'}; ${declineCount} declined before settlement`,
  };
  const responseStatus = seed % 7 === 0 ? 'Pending' : seed % 5 === 0 ? 'Accepted' : 'Challenged';
  const response = {
    status: responseStatus,
    receivedDate: responseStatus === 'Pending' ? 'Pending' : `${shiftedDate(reportedDate, 1)} - 2:14 PM`,
    cancellationRequestFound: /cancel|subscription|recurring/i.test(scenario.subtype)
      ? responseStatus === 'Accepted' ? 'Not contested' : 'No completed request located'
      : 'Not applicable to this dispute type',
    refundIssued: responseStatus === 'Accepted' ? 'Chargeback accepted; issuer credit review pending' : refundCount ? 'Refund entry recorded' : 'No',
  };
  const profile = {
    name,
    legalName: `${name} Training Commerce LLC`,
    descriptor: name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18),
    mcc,
    category,
    location,
    channel,
    website: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.example.test`,
    firstUsed: priorCount ? shiftedDate(issueStartDate, -(120 + (seed % 600))) : issueStartDate,
    priorTransactionCount: priorCount,
    priorDisputeCount: disputeCount,
    refundCount,
    attemptedTransactions: attemptCount,
    declinedTransactions: declineCount,
  };
  const records = [
    {
      id: `${id}-MER-PROFILE`, section: 'overview', title: 'Merchant identity and category', status: 'Record available', observed: reportedDate,
      summary: `${name} is recorded under MCC ${mcc} for ${category.toLowerCase()}.`,
      fields: [['Merchant name', name], ['Legal name', profile.legalName], ['Descriptor', profile.descriptor], ['MCC', mcc], ['Category', category], ['Location', location], ['Channel', channel], ['Website', profile.website]],
      relatedRecords: [orderId, authorizationId],
    },
    {
      id: `${id}-MER-HISTORY`, section: 'history', title: 'Customer and merchant history', status: 'History available', observed: reportedDate,
      summary: `${priorCount} prior transaction(s), ${disputeCount} prior dispute(s), and ${refundCount} prior refund(s) are recorded.`,
      fields: [['First used', profile.firstUsed], ['Prior transaction count', priorCount], ['Prior dispute count', disputeCount], ['Refund count', refundCount], ['Prior relationship', priorCount ? 'Recorded in customer transaction history' : 'No prior customer transaction located']],
      relatedRecords: Array.from({ length: Math.min(recordCount, Math.max(1, priorCount)) }, (_, itemIndex) => `${id}-TXN-${itemIndex + 2}`),
    },
    {
      id: `${id}-MER-AUTH`, section: 'authorization', title: 'Authorization and order match', status: 'Packet available', observed: issueStartDate,
      summary: `${authEntryMode}; AVS ${avs.toLowerCase()}; CVV ${cvv.toLowerCase()}.`,
      fields: [['Authorization ID', authorizationId], ['Order ID', orderId], ['Authorized amount', money(amount)], ['Entry mode', authEntryMode], ['AVS', avs], ['CVV', cvv], ['3DS', auth.threeDS], ['OTP', auth.otp], ['Wallet token', auth.walletToken], ['Device', auth.device], ['IP record', auth.ip], ['Attempts', auth.attempts]],
      relatedRecords: [authorizationId, `${id}-TXN-1`],
    },
    {
      id: `${id}-MER-FULFILLMENT`, section: 'fulfillment', title: 'Delivery, service, or usage record', status: /requested|missing/i.test(deliveryMatch) ? 'Requested' : 'Record available', observed: shiftedDate(issueStartDate, 2),
      summary: deliveryMatch,
      fields: [['Order ID', orderId], ['Fulfillment type', /digital|subscription/i.test(category) ? 'Digital activation or service access' : 'Carrier or merchant delivery'], ['Address / recipient comparison', deliveryMatch], ['Usage or activation', tone === 'established' ? 'Recorded after purchase' : tone === 'mixed' ? 'Partial activity recorded' : 'No supported customer usage supplied'], ['Merchant response', difficulty === 'light' ? 'Summary response supplied' : 'Detailed response packet available in Document Viewer']],
      relatedRecords: [orderId, `${id}-DOC-1`],
    },
    {
      id: `${id}-MER-DISPUTES`, section: 'disputes', title: 'Disputes, refunds, and customer contact', status: 'History available', observed: reportedDate,
      summary: `Prior disputes: ${disputeCount}; refunds: ${refundCount}; current contact record is included in the case packet.`,
      fields: [['Prior disputes', disputeCount], ['Prior refunds', refundCount], ['Customer contact', scenario.channel], ['Cancellation or return context', /cancel|return|refund/i.test(scenario.subtype) ? 'Merchant and customer records are both available for date comparison' : 'No cancellation or return is central to this subtype'], ['Current response status', difficulty === 'deep' ? 'Merchant response contains an additional record requiring reconciliation' : 'Merchant response available']],
      relatedRecords: [`${id}-DOC-1`, `${id}-INT-1`],
    },
    {
      id: `${id}-MER-REASON`, section: 'reason-code', title: 'Reason-code evidence checklist', status: 'Training guide available', observed: reportedDate,
      summary: `${reasonCodeFor(scenario.subtype)} is the recorded training standard for this packet.`,
      fields: [['Reason-code guide', reasonCodeFor(scenario.subtype)], ['Required authorization evidence', 'Authorization ID, entry mode, AVS/CVV, device or token context'], ['Required merchant evidence', 'Order, response, fulfillment or service, and customer-contact history'], ['Response deadline', deadlineFrom(reportedDate, 10, '3:00 PM')], ['Provisional-credit context', 'Training status recorded separately; no outcome is assigned here']],
      relatedRecords: [authorizationId, orderId, `${id}-DOC-1`],
    },
  ];

  if (difficulty === 'deep') {
    records.push({
      id: `${id}-MER-COMPARISON`, section: 'marketplace', title: 'Marketplace and subscription comparison', status: 'Comparison available', observed: reportedDate,
      summary: 'An additional merchant-account or subscription record must be reconciled with the card transaction.',
      fields: [['Merchant account login', deviceMatch], ['Subscription status', /subscription|cancel|recurring/i.test(scenario.subtype) ? 'Enrollment and cancellation dates differ across sources' : 'No recurring enrollment in scope'], ['Marketplace account', /online|digital/i.test(`${channel} ${category}`) ? 'Marketplace order account available' : 'Not applicable'], ['Billing descriptor comparison', `Statement descriptor ${profile.descriptor}`]],
      relatedRecords: [orderId, authorizationId],
    });
  }

  return { profile, authorization: auth, response, records, reasonCode: reasonCodeFor(scenario.subtype), responseDeadline: deadlineFrom(reportedDate, 10, '3:00 PM') };
}

function makeCreditProfile({ id, index, claimType, scenario, person, business, amount, reportedDate, difficulty }) {
  const seed = stableNumber(`${id}-${scenario.id}-credit`);
  const family = scenario.family ?? 'Credit review';
  const businessReview = claimType.id === 'business-loan-bust-out' || /business/i.test(family);
  const existing = /existing/i.test(family);
  const tone = creditDeterminationTone(scenario);
  const statedAnnual = Math.max(businessReview ? 420000 : 68000, Math.round(amount * (businessReview ? 28 : 8)));
  const verifiedRatio = tone === 'established' ? 0.96 : tone === 'mixed' ? 0.74 : 0.48;
  const verifiedAnnual = Math.round(statedAnnual * verifiedRatio);
  const monthlyGross = Math.round(verifiedAnnual / 12);
  const housing = businessReview ? 0 : 1450 + (seed % 900);
  const monthlyDebt = Math.round(monthlyGross * (tone === 'established' ? 0.25 : tone === 'mixed' ? 0.43 : 0.61));
  const dti = businessReview ? 'Not used as the primary business measure' : `${Math.round(((monthlyDebt + housing) / Math.max(1, monthlyGross)) * 100)}%`;
  const utilization = tone === 'established' ? 34 + (seed % 16) : tone === 'mixed' ? 68 + (seed % 15) : 91 + (seed % 8);
  const inquiries = existing ? seed % 3 : 3 + (seed % 6);
  const delinquencies = tone === 'established' ? 0 : tone === 'mixed' ? 1 : 2 + (seed % 3);
  const nsf = tone === 'established' ? 0 : tone === 'mixed' ? 2 : 4 + (seed % 5);
  const deposits = Math.round(verifiedAnnual / 12 * (businessReview ? 1.05 : 0.84));
  const outflow = Math.round(deposits * (tone === 'established' ? 0.68 : tone === 'mixed' ? 0.92 : 1.14));
  const missingDocuments = tone === 'established' ? [] : businessReview ? ['Current tax return', 'Two recent operating-account statements'] : ['Current paystub', 'Income-source confirmation'];

  return {
    id: `${id}-CRP-1`,
    family,
    customerType: businessReview ? 'Business' : 'Consumer',
    relationshipStage: existing ? 'Existing relationship review' : 'New application review',
    subject: businessReview ? business : person,
    applicationStatus: existing ? 'Portfolio review open' : 'Application review open',
    requestedExposure: money(amount),
    statedAnnualIncome: money(statedAnnual),
    verifiedAnnualIncome: money(verifiedAnnual),
    incomeSource: businessReview ? 'Operating deposits, tax support, invoices, and contracts' : 'Payroll deposits, paystub, employer, and bank statements',
    incomeFrequency: businessReview ? 'Monthly operating cycle' : 'Biweekly payroll',
    employerOrBusiness: businessReview ? business : `Employer record for ${person}`,
    monthlyGrossIncome: money(monthlyGross),
    monthlyDebt: money(monthlyDebt),
    housingExpense: businessReview ? 'Included in business cash-flow review' : money(housing),
    dti,
    bureau: pick(creditBureaus, seed),
    creditScoreBand: tone === 'established' ? '680-719 training band' : tone === 'mixed' ? '620-659 training band' : 'Below 620 training band',
    tradelines: 3 + (seed % 7),
    utilization: `${Math.min(99, utilization)}%`,
    delinquencies,
    inquiries,
    collections: tone === 'exception' ? 1 + (seed % 2) : 0,
    bankruptcyPublicRecord: /bankruptcy/i.test(scenario.subtype) ? 'Training public record located' : 'No bankruptcy record located in the training packet',
    averageMonthlyDeposits: money(deposits),
    averageMonthlyOutflow: money(outflow),
    averageBalance: money(Math.max(320, deposits - outflow + 1100)),
    overdrafts: nsf,
    nsfReturns: nsf,
    paymentHistory: tone === 'established' ? 'Paid as agreed in the available history' : tone === 'mixed' ? 'One recent late payment and otherwise established history' : 'Multiple missed or returned payments in the current review window',
    existingLimit: existing ? money(Math.max(amount * 1.4, 5000)) : 'No existing limit',
    requestedLimit: money(Math.max(amount, 2500)),
    completedDocuments: businessReview ? ['Business registration', 'Owner identity record', 'Application or review request'] : ['Identity record', 'Application or review request', 'Credit-file summary'],
    missingDocuments,
    sourceNote: `All values are fictional and derived for ${scenario.subtype} training.`,
    complexityNote: difficulty === 'deep' ? 'Deep review includes a source conflict and an additional missing-document dependency.' : difficulty === 'standard' ? 'Standard review includes one reconciliation issue.' : 'Focused review contains the primary income, credit, and cash-flow records.',
    deadline: deadlineFrom(reportedDate, businessReview ? 3 : 2, '4:00 PM'),
    reasonCode: businessReview ? `Training ${existing ? 'existing-business exposure' : 'new-business application'} review` : `Training ${existing ? 'existing-consumer account' : 'new-consumer application'} review`,
  };
}

function makeTransactions({ id, claimType, scenario, amount, reportedDate, issueStartDate, recordCount, difficulty, merchantPacket }) {
  if (!claimType.availableTools.includes('Transaction History')) return [];
  const rail = scenario.taxonomyTags?.productRail ?? claimType.taxonomy.productRail;
  const primaryName = merchantPacket?.profile.name ?? scenario.transactionInfo.split(' - ')[0];
  const step = Math.max(18, Math.round(Math.max(amount, 120) * 0.13));
  const recurring = /subscription|cancel|recurring/i.test(scenario.subtype);
  const recurringDays = /annual/i.test(`${scenario.subtype} ${scenario.transactionInfo}`) ? 365 : 30;
  const records = Array.from({ length: Math.max(2, recordCount) }, (_, itemIndex) => {
    const current = itemIndex === 0;
    const itemAmount = current ? amount : Math.max(0, amount - (itemIndex * step));
    let channel = 'Account activity';
    let instrument = 'Training payment object';
    let merchant = current || recurring ? primaryName : `${primaryName} prior activity ${itemIndex}`;

    if (rail === 'card') {
      channel = merchantChannel(scenario.subtype) === 'Recurring' ? 'Recurring card billing' : merchantChannel(scenario.subtype) === 'In-store' ? 'Card present' : merchantChannel(scenario.subtype) === 'Digital wallet' ? 'Digital wallet payment' : 'Card not present';
      instrument = scenario.transactionInfo.match(/training card ending \d+/i)?.[0] ?? 'Training card';
    } else if (rail === 'payroll') {
      channel = current ? 'Direct deposit destination activity' : 'Prior payroll deposit';
      instrument = 'Training payroll account';
      merchant = current ? 'Payroll destination change' : `Payroll deposit period ${itemIndex}`;
    } else if (rail === 'wire') {
      channel = current ? 'Wire instruction record' : 'Prior beneficiary payment';
      instrument = 'Training business payment account';
      merchant = current ? scenario.transactionInfo.split(' - ')[0] : `Established beneficiary ${itemIndex}`;
    } else if (/credit|loan/.test(rail)) {
      channel = current ? 'Credit exposure activity' : itemIndex % 2 ? 'Scheduled payment history' : 'Line utilization history';
      instrument = rail === 'loan' ? 'Training business credit line' : 'Training credit account';
      merchant = current ? scenario.transactionInfo.split(' - ')[0] : `Credit relationship record ${itemIndex}`;
    }

    return {
      id: `${id}-TXN-${itemIndex + 1}`,
      posted: current ? reportedDate : shiftedDate(recurring ? reportedDate : issueStartDate, -(itemIndex * (recurring ? recurringDays : 21))),
      time: current ? '9:18 AM' : `${String(8 + itemIndex).padStart(2, '0')}:42 AM`,
      merchant,
      amount: money(itemAmount),
      channel,
      instrument,
      status: current ? 'Posted record' : 'Historical record',
      context: current ? `${scenario.subtype} activity in the current fictional case.` : `Prior ${claimType.shortLabel.toLowerCase()} activity supplied for baseline comparison.`,
    };
  });

  if (difficulty === 'deep') {
    records.push({
      id: `${id}-TXN-C1`, posted: shiftedDate(reportedDate, -1), time: '7:56 PM', merchant: primaryName, amount: money(Math.max(1, Math.round(amount * 0.03 * 100) / 100)), channel: records[0].channel, instrument: records[0].instrument, status: 'Declined attempt', context: 'Additional deep-review attempt record with timing that must be compared to the settled activity.',
    });
  }
  return records;
}

function makePaymentVerification({ id, claimType, scenario, person, business, reportedDate, issueStartDate, transactions, index }) {
  if (!claimType.availableTools.includes('Payment Verification')) return [];
  const seed = stableNumber(`${id}-payment`);
  const rail = scenario.taxonomyTags?.productRail ?? claimType.taxonomy.productRail;
  const destinationType = rail === 'payroll' ? 'Payroll destination' : rail === 'wire' ? 'Beneficiary destination' : /credit|loan/.test(rail) ? 'Payment account' : 'Card authorization object';
  const destination = `DST-${String(seed).slice(-7).padStart(7, '0')}`;
  const tone = claimType.id === 'non-fraud-chargeback' ? 'established' : /credit|loan/.test(rail) ? creditDeterminationTone(scenario) : determinationTone(scenario);
  const recordedOwner = rail === 'wire' || rail === 'loan' ? business : person;
  return [{
    id: `${id}-PV-1`, type: destinationType, object: `Destination ID ${destination}`, status: 'Lookup completed', lastSeen: `${reportedDate} - 9:18 AM`,
    context: `${destinationType} ${destination} is linked to ${scenario.transactionInfo} and ${transactions.length} transaction record(s).`, bankName: pick(['Training Atlantic Bank', 'Training Community Bank', 'Training Mobile Money Network', 'Training Federal Credit Union'], seed),
    accountType: rail === 'payroll' ? 'Payroll destination account' : rail === 'wire' ? 'Business beneficiary account' : /credit|loan/.test(rail) ? 'External payment account' : 'Card network object',
    accountHolder: tone === 'established' ? recordedOwner : `Training holder ${String(seed).slice(-4)}`, ownerMatch: tone === 'established' ? `Exact match to ${recordedOwner}` : tone === 'mixed' ? `Partial match to ${recordedOwner}` : `No match to ${recordedOwner}`,
    accountStatus: 'Open training record', standing: tone === 'exception' ? 'Recently opened record' : 'History available', priorUse: tone === 'established' ? 'Prior use recorded' : 'No prior use located', firstSeen: issueStartDate,
    verificationMethod: rail === 'card' ? 'Network authorization packet' : 'Training ownership and history comparison', recoverability: rail === 'wire' ? 'Recall status pending receiving-bank response' : 'Review path documented in the payment packet',
    bankCode: `BC-${String(seed).slice(-5)}`, destinationId: destination, oldDestination: rail === 'payroll' || rail === 'wire' ? 'Established destination ending 2204' : 'Prior payment object on file', newDestination: `Destination ID ${destination}`,
    changeComparison: `${destination} was ${tone === 'established' ? 'used before the current activity window' : `first observed ${issueStartDate}`}.`, verificationOutcome: `${destinationType}, ownership, status, prior use, and first-seen date recorded`, relatedRecords: transactions.map((item) => item.id),
    actions: ['Compare ownership and prior use', 'Document the trusted verification source'], verificationLog: [{ time: `${reportedDate} - 9:30 AM`, method: 'Training lookup', result: tone === 'mixed' ? 'Manual review' : 'Recorded', note: 'The log records source evidence only.' }], notes: `Generated payment object ${index} for ${scenario.subtype}.`,
  }];
}

function makeBusinessRecords({ id, claimType, scenario, person, employer, business, reportedDate, issueStartDate, amount, recordCount, creditProfile }) {
  const tools = new Set(claimType.availableTools);
  const result = {};
  if (tools.has('Business 360')) {
    const entity = /business|vendor|payroll|merchant/i.test(`${scenario.entityRole} ${claimType.lane}`) ? business : scenario.transactionInfo.split(' - ')[0];
    result.business360 = [
      { id: `${id}-BIZ-1`, entity, relationship: `${scenario.family ?? claimType.lane} relationship`, status: 'Active profile', observed: reportedDate, context: `${entity} is connected to ${person} and claim ${id}.` },
      { id: `${id}-BIZ-2`, entity: person, relationship: scenario.entityRole, status: 'Named in intake', observed: reportedDate, context: `${person} submitted or is named in the ${scenario.channel} record.` },
      { id: `${id}-BIZ-3`, entity: scenario.transactionInfo, relationship: 'Activity or exposure in scope', status: scenario.amount, observed: issueStartDate, context: `${scenario.subtype} review covers ${scenario.amount} from ${issueStartDate} through ${reportedDate}.` },
    ];
  }
  if (tools.has('KYB Review')) {
    result.businessIntel = [
      { id: `${id}-BIN-1`, type: 'Registration and legal-name record', value: business, observed: reportedDate, context: `${business} is recorded as the legal entity connected to claim ${id}.` },
      { id: `${id}-BIN-2`, type: 'Owner or controlling party', value: person, observed: reportedDate, context: `${person} is recorded as ${scenario.entityRole}.` },
      { id: `${id}-BIN-3`, type: 'Operating and revenue context', value: creditProfile?.statedAnnualIncome ?? money(Math.max(amount * 18, 85000)), observed: reportedDate, context: `Stated annual revenue is compared with ${scenario.amount} in current exposure.` },
      { id: `${id}-BIN-4`, type: 'Case activity', value: scenario.transactionInfo, observed: issueStartDate, context: `${scenario.subtype} activity was reported through ${scenario.channel} on ${reportedDate}.` },
    ];
  }
  if (tools.has('Employee Profile')) {
    result.employeeProfile = [
      { id: `${id}-EMP-1`, name: person, role: /payroll/i.test(claimType.lane) ? 'Employee payroll record' : scenario.entityRole, employer, status: 'Active profile', lastSeen: reportedDate, context: `${person} is linked to ${employer} in the current ${scenario.subtype} review.` },
      { id: `${id}-EMP-2`, name: person, role: 'Change authorization subject', employer, status: 'Authorization under review', lastSeen: issueStartDate, context: `${scenario.transactionInfo} for ${scenario.amount} is the employee-linked activity in scope.` },
    ];
  }
  if (tools.has('Payroll History')) {
    result.payrollHistory = Array.from({ length: Math.max(2, Math.min(4, recordCount)) }, (_, itemIndex) => ({ id: `${id}-PAYR-${itemIndex + 1}`, period: shiftedDate(reportedDate, -(itemIndex * 14)), employer, amount: money(Math.max(900, Math.round(amount / Math.max(1, recordCount)) + (itemIndex * 45))), channel: /payroll/i.test(claimType.lane) ? 'Direct deposit record' : 'Verified payroll income record', status: itemIndex === 0 ? 'Current period' : 'Posted prior period', context: itemIndex === 0 ? `${scenario.transactionInfo} is the current payroll activity in scope.` : `${person}'s prior payroll from ${employer} provides a dated amount and destination baseline.` }));
  }
  return result;
}

function makeIdentityReport({ id, claimType, trainingId, person, reportedDate }) {
  if (!claimType.availableTools.includes('Identity Intel / People Search')) return [];
  return [
    { id: `${id}-IDR-1`, label: 'Training identity', value: trainingId, observed: reportedDate },
    { id: `${id}-IDR-2`, label: 'Profile subject', value: person, observed: reportedDate },
  ];
}

function makeFinancialIntel({ id, claimType, scenario, reportedDate, issueStartDate, amount, creditProfile, recordCount, transactions, documents }) {
  if (!claimType.availableTools.includes('Financial Investigation')) return [];
  if (creditProfile) {
    if (creditProfile.customerType === 'Business') {
      return [
        ['Stated annual revenue', creditProfile.statedAnnualIncome, creditProfile.incomeSource],
        ['Verified annual revenue', creditProfile.verifiedAnnualIncome, creditProfile.employerOrBusiness],
        ['Operating cash flow', `${creditProfile.averageMonthlyDeposits} deposits; ${creditProfile.averageMonthlyOutflow} outflow`, `${creditProfile.nsfReturns} NSF or returned-payment event(s)`],
        ['Business credit summary', `${creditProfile.creditScoreBand}; ${creditProfile.utilization} utilization`, `${creditProfile.tradelines} tradelines; ${creditProfile.delinquencies} delinquencies; ${creditProfile.inquiries} recent inquiries`],
        ['Exposure and payment history', creditProfile.requestedExposure, creditProfile.paymentHistory],
        ['Document status', `${creditProfile.completedDocuments.length} complete; ${creditProfile.missingDocuments.length} missing`, creditProfile.missingDocuments.join(', ') || 'No required document is missing'],
      ].map(([type, value, context], itemIndex) => ({ id: `${id}-FIN-${itemIndex + 1}`, type, value, observed: reportedDate, context }));
    }
    return [
      ['Stated income / revenue', creditProfile.statedAnnualIncome, creditProfile.incomeSource],
      ['Verified income / revenue', creditProfile.verifiedAnnualIncome, creditProfile.employerOrBusiness],
      ['Debt-to-income', creditProfile.dti, `${creditProfile.monthlyDebt} monthly debt; ${creditProfile.housingExpense} housing`],
      ['Credit-file summary', `${creditProfile.creditScoreBand}; ${creditProfile.utilization} utilization`, `${creditProfile.tradelines} tradelines; ${creditProfile.delinquencies} delinquencies; ${creditProfile.inquiries} recent inquiries`],
      ['Cash flow', `${creditProfile.averageMonthlyDeposits} deposits; ${creditProfile.averageMonthlyOutflow} outflow`, `${creditProfile.nsfReturns} NSF or returned-payment event(s)`],
      ['Document status', `${creditProfile.completedDocuments.length} complete; ${creditProfile.missingDocuments.length} missing`, creditProfile.missingDocuments.join(', ') || 'No required document is missing'],
    ].map(([type, value, context], itemIndex) => ({ id: `${id}-FIN-${itemIndex + 1}`, type, value, observed: reportedDate, context }));
  }
  const availableDocuments = documents.filter((item) => item.status !== 'Requested').length;
  const requestedDocuments = documents.filter((item) => item.status === 'Requested').length;
  const values = [
    money(amount),
    scenario.transactionInfo,
    `${transactions.length} transaction or activity record(s)`,
    `${availableDocuments} document(s) available; ${requestedDocuments} requested`,
    `${issueStartDate} to ${reportedDate}`,
  ];
  return claimType.evidenceAreas.slice(0, Math.max(2, recordCount)).map((area, itemIndex) => ({
    id: `${id}-FIN-${itemIndex + 1}`,
    type: area,
    value: values[itemIndex % values.length],
    observed: shiftedDate(reportedDate, -itemIndex),
    context: `${scenario.subtype}: ${scenario.statement} Source: ${scenario.channel}.`,
  }));
}

function makeEvidence({ id, scenario, documents, transactions, reportedDate }) {
  return {
    evidence: documents.map((document, itemIndex) => ({ id: `${id}-EVD-${itemIndex + 1}`, status: document.status, type: itemIndex === 0 ? 'Case packet' : 'Supporting document', name: document.name, source: itemIndex === 0 ? scenario.channel : 'Generated training packet', received: document.status === 'Requested' ? 'Pending' : shiftedDate(reportedDate, -itemIndex), summary: document.detail, linkedObject: itemIndex === 0 ? id : transactions[itemIndex % Math.max(1, transactions.length)]?.id ?? id })),
    documents: documents.map((document, itemIndex) => ({ id: document.id, title: document.name, category: document.status === 'Requested' ? 'Requested document' : 'Case document', status: document.status, updated: document.status === 'Requested' ? 'Pending' : shiftedDate(reportedDate, -itemIndex), preview: document.detail, fields: `Case ID, ${scenario.subtype}, source, observed date, training packet status` })),
  };
}

export function buildGeneratedPersona(index, scenario) {
  const firstNames = ['Avery', 'Cameron', 'Drew', 'Emery', 'Harper', 'Jordan', 'Kai', 'Morgan', 'Parker', 'Quinn', 'Reese', 'Riley', 'Rowan', 'Sage', 'Sienna', 'Skyler', 'Taylor', 'Tatum', 'Val', 'Wren'];
  const lastNames = ['Bennett', 'Blake', 'Brooks', 'Carter', 'Ellis', 'Foster', 'Grant', 'Hayes', 'James', 'Lane', 'Monroe', 'Nash', 'Owens', 'Price', 'Reed', 'Shaw', 'Stone', 'Vale', 'West', 'Young'];
  const cities = ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Irving, TX', 'DeSoto, TX', 'Cedar Hill, TX', 'Plano, TX', 'Grapevine, TX', 'Austin, TX', 'San Antonio, TX', 'Houston, TX', 'Phoenix, AZ', 'Denver, CO', 'Chicago, IL', 'Charlotte, NC', 'Atlanta, GA'];
  const employers = ['Lakeside Office Supply', 'Riverbend Services', 'Northline Operations', 'Cedar Square Logistics', 'Brightline Studio', 'Oakline Health Group', 'Juniper Field Services', 'Parkline Manufacturing', 'Westhaven Education', 'Harbor City Works'];
  const businesses = ['Northline Services LLC', 'Cedar Square Market LLC', 'Riverbend Operations Inc.', 'Brightline Supply Co.', 'Lakeside Trade Group LLC', 'Oakline Media Works LLC', 'Juniper Logistics Inc.', 'Parkline Home Services LLC', 'Westhaven Consulting LLC', 'Harbor Retail Group Inc.'];
  const seed = stableNumber(`${index}-${scenario.id}`);
  const person = `${pick(firstNames, seed)} ${pick(lastNames, seed, 7)}`;
  const city = pick(cities, seed, 3);
  const phoneSuffix = 100 + (seed % 900);
  const street = 100 + (seed % 9700);
  return {
    person,
    city,
    employer: pick(employers, seed, 5),
    business: pick(businesses, seed, 9),
    phone: `(555) 010-${String(phoneSuffix).padStart(4, '0')}`,
    email: `${person.toLowerCase().replace(/[^a-z0-9]+/g, '.')}+${String(seed).slice(-4)}@training.example.test`,
    address: `${street} Training Way, ${city}`,
  };
}

export function buildGeneratedToolResults({ id, index, person, city, employer, business, claimType, scenario, documents, recordCount, trainingId, reportedDate, issueStartDate, difficulty }) {
  const amount = numberFromMoney(scenario.amount);
  const merchantRelevant = ['fraud-chargeback', 'non-fraud-chargeback', 'first-party-fraud'].includes(claimType.id);
  const merchantPacket = merchantRelevant ? makeMerchantPacket({ id, index, claimType, scenario, person, reportedDate, issueStartDate, amount, recordCount, difficulty }) : null;
  const creditRelevant = ['credit-risk', 'business-loan-bust-out'].includes(claimType.id);
  const creditProfile = creditRelevant ? makeCreditProfile({ id, index, claimType, scenario, person, business, amount, reportedDate, difficulty }) : null;
  const transactions = makeTransactions({ id, claimType, scenario, amount, reportedDate, issueStartDate, recordCount, difficulty, merchantPacket });
  const paymentVerification = makePaymentVerification({ id, claimType, scenario, person, business, reportedDate, issueStartDate, transactions, index });
  const evidence = makeEvidence({ id, scenario, documents, transactions, reportedDate });
  const result = {
    transactions,
    financialIntel: makeFinancialIntel({ id, claimType, scenario, reportedDate, issueStartDate, amount, creditProfile, recordCount, transactions, documents }),
    paymentVerification,
    ...makeBusinessRecords({ id, claimType, scenario, person, employer, business, reportedDate, issueStartDate, amount, recordCount, creditProfile }),
    ...evidence,
    identityReport: makeIdentityReport({ id, claimType, trainingId, person, reportedDate }),
  };
  if (merchantPacket) result.merchantIntelligence = merchantPacket;
  if (creditProfile) result.creditProfile = creditProfile;
  return result;
}

export function buildScenarioDecisionData({ claimType, scenario, reportedDate, toolResults }) {
  if (claimType.chargeback) {
    const merchant = toolResults.merchantIntelligence;
    return {
      chargebackDecision: {
        ...claimType.chargeback,
        reasonCode: merchant?.reasonCode ?? reasonCodeFor(scenario.subtype),
        responseDeadline: merchant?.responseDeadline ?? deadlineFrom(reportedDate, 10, '3:00 PM'),
        merchantEvidence: 'Merchant identity, order, customer history, response, fulfillment, refund, dispute, and contact records',
        authorizationReview: 'Entry mode, AVS, CVV, 3DS, OTP, wallet token, device, IP, and approval or decline attempts',
        fulfillmentReview: 'Delivery, service, activation, usage, return, cancellation, and refund evidence for the selected subtype',
        customerContact: 'Cardholder statement and merchant-contact history compared to the reason-code requirement',
      },
      creditDecision: null,
    };
  }
  if (claimType.credit) {
    const credit = toolResults.creditProfile;
    return {
      chargebackDecision: null,
      creditDecision: {
        ...claimType.credit,
        family: scenario.family ?? 'Credit review',
        deadline: credit?.deadline ?? deadlineFrom(reportedDate, 2, '4:00 PM'),
        reasonCode: credit?.reasonCode ?? `Training ${scenario.subtype} review`,
        completeDocuments: credit?.completedDocuments ?? [],
        missingDocuments: credit?.missingDocuments ?? [],
      },
    };
  }
  return { chargebackDecision: null, creditDecision: null };
}

export function buildScenarioEvents({ id, scenario, claimType, reportedDate, issueStartDate, difficulty, evidenceDepth, documents = [] }) {
  const availableDocuments = documents.filter((item) => item.status !== 'Requested');
  const requestedDocuments = documents.filter((item) => item.status === 'Requested');
  const events = [
    { id: `${id}-EVT-1`, time: `${issueStartDate} - 10:10 AM`, label: `${scenario.subtype} activity recorded`, detail: `${scenario.transactionInfo} for ${scenario.amount} entered the activity window.`, chip: 'Case event', object: 'Case' },
    { id: `${id}-EVT-2`, time: `${reportedDate} - 9:05 AM`, label: 'Intake or alert received', detail: `${scenario.channel} opened the case with this statement: ${scenario.statement}`, chip: 'Intake', object: 'Statement' },
    { id: `${id}-EVT-3`, time: `${reportedDate} - 9:18 AM`, label: 'Evidence packet initialized', detail: `${evidenceDepth} packet created with ${availableDocuments.length} available document(s) and ${requestedDocuments.length} requested document(s) for ${claimType.label}.`, chip: 'Packet', object: 'Document' },
  ];
  if (difficulty !== 'light') events.push({ id: `${id}-EVT-C1`, time: `${reportedDate} - 10:20 AM`, label: 'Cross-source comparison added', detail: `Compare the ${scenario.channel} statement with ${scenario.transactionInfo}, payment ownership, and dated profile records.`, chip: 'Comparison', object: 'Record' });
  if (difficulty === 'deep') events.push({ id: `${id}-EVT-C2`, time: `${reportedDate} - 11:35 AM`, label: 'Additional evidence dependency recorded', detail: requestedDocuments.length ? `${requestedDocuments.map((item) => item.name).join(' and ')} remain requested while the available records are reviewed.` : `The ${scenario.subtype} timing must be reconciled across transaction, profile, and document records.`, chip: 'Dependency', object: 'Document' });
  return events;
}
