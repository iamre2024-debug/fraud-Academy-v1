const loginDetailsById = {
  'LOG-1008': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Bank app / Mobile Safari webview', sessionDuration: '15 minutes recorded',
    sessionBehavior: 'Profile email and card controls viewed in this session.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-1001 · PCH-1002', moneyMovementLink: 'EVT-1014 · Card purchase posted after session activity', investigatorUse: 'Compare this session sequence with the customer statement and transaction timing.',
  },
  'LOG-1005': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile browser', browserSource: 'Chrome Mobile', sessionDuration: '9 minutes recorded',
    sessionBehavior: 'Balance review and routine account navigation recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'No profile change linked', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as a secondary-device comparison point before interpreting the disputed activity.',
  },
  'LOG-0998': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Bank app / Mobile Safari webview', sessionDuration: '7 minutes recorded',
    sessionBehavior: 'Routine account review recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'No profile change linked', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as prior access context for the known mobile device.',
  },
  'LOG-0981': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Bank app / Mobile Safari webview', sessionDuration: '4 minutes recorded',
    sessionBehavior: 'Statement delivery settings viewed; no change recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-1004', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as longer-term device and location context.',
  },
  'LOG-0954': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile browser', browserSource: 'Chrome Mobile', sessionDuration: '6 minutes recorded',
    sessionBehavior: 'Savings transfer setup viewed; no change recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-1005', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as prior secondary-device context only.',
  },
  'LOG-0928': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Bank app / Mobile Safari webview', sessionDuration: '5 minutes recorded',
    sessionBehavior: 'Address confirmation viewed; no update recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-1006', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as historical location and device context.',
  },
  'LOG-2204': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile app', browserSource: 'Mobile app / Chrome WebView', sessionDuration: '12 minutes recorded',
    sessionBehavior: 'Dispute form opened after the merchant charge posted.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-2201', moneyMovementLink: 'EVT-2201 · Merchant charge posted before login', investigatorUse: 'Compare session timing with the customer dispute form and merchant billing records.',
  },
  'LOG-2200': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Mobile app / Chrome WebView', sessionDuration: '8 minutes recorded',
    sessionBehavior: 'Statement viewed in the mobile app.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-2202', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use to establish prior statement-review context.',
  },
  'LOG-2191': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Desktop browser', browserSource: 'Chrome desktop', sessionDuration: '11 minutes recorded',
    sessionBehavior: 'Older profile activity recorded.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'No profile change linked', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use only as older secondary-device context.',
  },
  'LOG-2178': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Mobile app / Chrome WebView', sessionDuration: '6 minutes recorded',
    sessionBehavior: 'Prior merchant charge viewed in statement activity.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-2204', moneyMovementLink: 'EVT-2178 · Prior merchant charge viewed', investigatorUse: 'Use to compare the recurring billing history with the current claim.',
  },
  'LOG-2142': {
    mfaStatus: 'Biometric completed', authChannel: 'Mobile app', browserSource: 'Mobile app / Chrome WebView', sessionDuration: '5 minutes recorded',
    sessionBehavior: 'Earlier recurring billing record viewed.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-2205', moneyMovementLink: 'EVT-2142 · Earlier merchant charge located', investigatorUse: 'Use as historical billing context; it does not decide the claim.',
  },
  'LOG-3314': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile browser', browserSource: 'Mobile Safari', sessionDuration: '9 minutes recorded',
    sessionBehavior: 'Profile review opened after the limit usage request.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-3302', moneyMovementLink: 'EVT-3308 · Limit usage request submitted before login', investigatorUse: 'Compare the new-account sequence with payment and identity records.',
  },
  'LOG-3309': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile browser', browserSource: 'Mobile Safari', sessionDuration: '6 minutes recorded',
    sessionBehavior: 'Account navigation recorded after payment method setup.', passwordResetLink: 'No password reset recorded in case window', profileChangeLink: 'PCH-3301', moneyMovementLink: 'EVT-3302 · Payment method added before login', investigatorUse: 'Use to place payment setup and account navigation in order.',
  },
  'LOG-3301': {
    mfaStatus: 'Email code completed', authChannel: 'Email verification', browserSource: 'Mobile Safari', sessionDuration: '13 minutes recorded',
    sessionBehavior: 'New profile creation and email verification recorded.', passwordResetLink: 'Password setup followed in SES-9094', profileChangeLink: 'PCH-3303 · PCH-3304', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use as early-account setup context only.',
  },
  'LOG-3298': {
    mfaStatus: 'No additional MFA event recorded', authChannel: 'Mobile browser', browserSource: 'Mobile Safari', sessionDuration: '10 minutes recorded',
    sessionBehavior: 'Password setup recorded during new profile creation.', passwordResetLink: 'Password setup event', profileChangeLink: 'PCH-3303', moneyMovementLink: 'No money movement linked', investigatorUse: 'Use to establish the first known account session.',
  },
};

function defaultDetails(login) {
  return {
    mfaStatus: 'Not recorded in supplied login packet',
    authChannel: 'Recorded login channel',
    browserSource: login.device,
    sessionDuration: 'Not recorded',
    sessionBehavior: 'Compare this login with linked session and case activity.',
    passwordResetLink: 'No linked password reset recorded',
    profileChangeLink: 'No linked profile change recorded',
    moneyMovementLink: 'No linked money movement recorded',
    investigatorUse: 'Review this login as evidence with the linked device, IP, and timeline records.',
  };
}

export function getLoginRecords(activeCase) {
  return (activeCase.loginHistory ?? []).map((login) => {
    const detail = loginDetailsById[login.id] ?? defaultDetails(login);
    return {
      ...login,
      ...detail,
      riskContext: `${login.result} · ${login.location} · ${login.deviceId ?? login.device}`,
      relatedRecords: [login.session, login.deviceId ?? login.device, `IP-${login.ip}`, detail.profileChangeLink, detail.moneyMovementLink].filter(Boolean),
    };
  });
}
