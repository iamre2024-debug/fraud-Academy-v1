import { getFinancialRecords } from './caseToolData.js';
import { getCustomer360Dossier } from './customer360Dossier.js';

export function normalizeLinkIdentifier(value) {
  return String(value ?? '').trim().toLowerCase();
}

function uniqueIdentifiers(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.type}:${normalizeLinkIdentifier(item.value)}`;
    if (!item.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getLinkIdentifiersForCase(activeCase) {
  const payment = getFinancialRecords(activeCase).paymentVerification ?? [];
  return uniqueIdentifiers([
    {
      type: 'phone',
      label: 'Phone Number',
      value: activeCase.customer?.contact?.phone,
      source: 'Customer 360',
      first: activeCase.customer?.relationshipSince,
      last: activeCase.reportedDate ?? activeCase.opened,
      scope: 'profile',
    },
    {
      type: 'email',
      label: 'Email',
      value: activeCase.customer?.contact?.email,
      source: 'Customer 360',
      first: activeCase.customer?.relationshipSince,
      last: activeCase.reportedDate ?? activeCase.opened,
      scope: 'profile',
    },
    {
      type: 'training',
      label: 'Training ID',
      value: activeCase.trainingId,
      source: 'Identity Intelligence',
      first: activeCase.customer?.relationshipSince,
      last: activeCase.reportedDate ?? activeCase.opened,
      scope: 'profile',
    },
    ...(activeCase.loginHistory ?? []).flatMap((item) => [
      {
        type: 'device',
        label: 'Device ID',
        value: item.deviceId ?? item.device,
        source: 'Device Intelligence',
        first: item.time,
        last: item.time,
        sourceRecordId: item.id,
        scope: 'profile',
      },
      {
        type: 'ip',
        label: 'IP Address',
        value: item.ip,
        source: 'IP Intelligence',
        first: item.time,
        last: item.time,
        sourceRecordId: item.id,
        scope: 'profile',
      },
    ]),
    ...payment.flatMap((item) => {
      const linkageText = [
        item.accountId,
        item.productId,
        item.object,
        item.destinationId,
        ...(item.relatedRecords ?? []),
      ].filter(Boolean).join(' ');
      const common = {
        source: 'Payment Verification',
        first: item.firstSeen ?? item.lastSeen,
        last: item.lastSeen ?? item.firstSeen,
        sourceRecordId: item.id,
        accountId: item.accountId ?? item.productId ?? '',
        linkageText,
        scope: 'payment-record',
      };
      return [
        { ...common, type: 'bank', label: 'Bank Code', value: item.bankCode },
        { ...common, type: 'destination', label: 'Destination ID', value: item.destinationId },
      ];
    }),
  ]);
}

function accountForMatch(products, match) {
  if (match.scope !== 'payment-record') return null;
  const explicitAccountId = normalizeLinkIdentifier(match.accountId);
  if (explicitAccountId) {
    const explicit = products.find((product) => normalizeLinkIdentifier(product.id) === explicitAccountId);
    if (explicit) return explicit;
  }
  const linkageText = normalizeLinkIdentifier(match.linkageText);
  return products.find((product) => {
    const productId = normalizeLinkIdentifier(product.id);
    return productId && linkageText.includes(productId);
  }) ?? null;
}

export function getLinkedRelationships(cases, type, value, currentCaseId) {
  const needle = normalizeLinkIdentifier(value);
  if (!needle) return [];

  const relationships = cases.flatMap((caseItem) => {
    const match = getLinkIdentifiersForCase(caseItem)
      .find((item) => item.type === type && normalizeLinkIdentifier(item.value) === needle);
    if (!match) return [];

    const dossier = getCustomer360Dossier(caseItem);
    const account = accountForMatch(dossier.products, match);
    const name = caseItem.profile?.business ?? caseItem.person;
    const common = {
      caseId: caseItem.id,
      name,
      firstUse: match.first ?? 'Not supplied',
      lastUse: match.last ?? 'Not supplied',
      source: match.source,
      sourceRecordId: match.sourceRecordId ?? '',
    };

    if (account) {
      return [{
        ...common,
        id: `${caseItem.id}:${account.id}:${type}:${needle}`,
        scope: 'account',
        accountId: account.id,
        product: account.product,
        standing: account.standing,
        status: account.status,
        relationship: caseItem.id === currentCaseId
          ? `Current case account linked by the ${match.source} record`
          : `Account-level ${match.label.toLowerCase()} link recorded in ${match.source}`,
      }];
    }

    return [{
      ...common,
      id: `${caseItem.id}:profile:${type}:${needle}`,
      scope: 'profile',
      accountId: '',
      product: 'Case / profile record',
      standing: 'No account-level standing asserted',
      status: 'Profile match',
      relationship: caseItem.id === currentCaseId
        ? `Current case profile contains this ${match.label.toLowerCase()}`
        : `Case/profile-level ${match.label.toLowerCase()} match; no specific account is linked`,
    }];
  });

  return relationships.map((relationship, index) => ({
    ...relationship,
    primary: index === 0,
  }));
}
