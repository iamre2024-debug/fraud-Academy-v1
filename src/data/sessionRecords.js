const sessionDetailsById = {
  'SES-7781': {
    end: '10:57 AM', duration: '15 minutes', logoutStatus: 'Session timeout recorded',
    pagesViewed: ['Account overview', 'Profile email', 'Card controls'], securitySettings: ['Card controls viewed'],
    profileActions: ['PCH-1001 · Email viewed', 'PCH-1002 · Card controls viewed'], payeeTokenActivity: ['No payee or token change recorded'],
    moneyMovement: ['EVT-1014 · Card purchase posted after session activity'], sessionPath: ['10:42 AM · Face ID login', '10:47 AM · Profile and card controls viewed', '10:52 AM · Card purchase posted'],
    investigatorUse: 'Compare the recorded session sequence with the customer statement and transaction timing.',
  },
  'SES-7760': {
    end: '8:22 AM', duration: '9 minutes', logoutStatus: 'Normal logout recorded',
    pagesViewed: ['Account overview', 'Recent activity'], securitySettings: ['No security setting opened'],
    profileActions: ['No profile change recorded'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['8:13 AM · Password login', '8:17 AM · Balance and recent activity viewed', '8:22 AM · Normal logout'],
    investigatorUse: 'Use as a routine secondary-device session for comparison.',
  },
  'SES-7604': {
    end: '6:58 PM', duration: '7 minutes', logoutStatus: 'Normal logout recorded',
    pagesViewed: ['Account overview'], securitySettings: ['No security setting opened'], profileActions: ['No profile change recorded'],
    payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['6:51 PM · Face ID login', '6:54 PM · Account overview viewed', '6:58 PM · Normal logout'], investigatorUse: 'Use as prior known-device and location context.',
  },
  'SES-7421': {
    end: '7:28 PM', duration: '4 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Statement delivery settings'],
    securitySettings: ['No security setting opened'], profileActions: ['PCH-1004 · Statement delivery viewed'], payeeTokenActivity: ['No payee or token activity recorded'],
    moneyMovement: ['No money movement recorded'], sessionPath: ['7:24 PM · Face ID login', '7:25 PM · Statement delivery settings viewed', '7:28 PM · Normal logout'], investigatorUse: 'Use as longer-term normal mobile session context.',
  },
  'SES-7014': {
    end: '12:19 PM', duration: '6 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Savings transfer setup'],
    securitySettings: ['No security setting opened'], profileActions: ['PCH-1005 · Savings transfer setup viewed'], payeeTokenActivity: ['No payee or token activity recorded'],
    moneyMovement: ['No money movement recorded'], sessionPath: ['12:13 PM · Password login', '12:16 PM · Transfer setup viewed', '12:19 PM · Normal logout'], investigatorUse: 'Use as prior secondary-device context only.',
  },
  'SES-6602': {
    end: '9:53 AM', duration: '5 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Profile address'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-1006 · Address confirmation viewed'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['9:48 AM · Face ID login', '9:50 AM · Address confirmation viewed', '9:53 AM · Normal logout'], investigatorUse: 'Use as historical device and location context.',
  },
  'SES-4412': {
    end: '8:31 AM', duration: '12 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Dispute form', 'Merchant billing detail'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-2201 · Dispute form submitted'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['EVT-2201 · Merchant charge posted before session'],
    sessionPath: ['8:19 AM · Password login', '8:20 AM · Dispute form opened', '8:28 AM · Prior merchant charge located', '8:31 AM · Normal logout'], investigatorUse: 'Compare this session to the form contents and merchant history.',
  },
  'SES-4310': {
    end: '4:10 PM', duration: '8 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Billing statement'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-2202 · Statement viewed'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['4:02 PM · Biometric login', '4:05 PM · Billing statement viewed', '4:10 PM · Normal logout'], investigatorUse: 'Use as prior statement-review context.',
  },
  'SES-4201': {
    end: '11:21 AM', duration: '11 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Profile overview'], securitySettings: ['No security setting opened'], profileActions: ['No profile change recorded'],
    payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'], sessionPath: ['11:10 AM · Password login', '11:15 AM · Profile overview viewed', '11:21 AM · Normal logout'], investigatorUse: 'Use only as older secondary-device session context.',
  },
  'SES-4018': {
    end: '8:42 AM', duration: '6 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Billing statement'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-2204 · Merchant transaction viewed'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['EVT-2178 · Prior merchant charge viewed'],
    sessionPath: ['8:36 AM · Biometric login', '8:36 AM · Prior merchant charge viewed', '8:42 AM · Normal logout'], investigatorUse: 'Use to compare the earlier recurring billing activity.',
  },
  'SES-3880': {
    end: '9:16 AM', duration: '5 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Billing statement'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-2205 · Merchant transaction posted'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['EVT-2142 · Earlier merchant charge located'],
    sessionPath: ['9:11 AM · Biometric login', '9:12 AM · Earlier merchant charge located', '9:16 AM · Normal logout'], investigatorUse: 'Use as historical billing context only.',
  },
  'SES-9302': {
    end: '7:52 AM', duration: '9 minutes', logoutStatus: 'Session timeout recorded', pagesViewed: ['Profile review', 'Credit line overview'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-3302 · Limit usage request submitted'], payeeTokenActivity: ['No token change recorded in session'], moneyMovement: ['EVT-3308 · Limit usage request submitted before session'],
    sessionPath: ['7:43 AM · Password login', '7:43 AM · Profile review opened', '7:52 AM · Session timeout'], investigatorUse: 'Compare the early-account session with payment and identity records.',
  },
  'SES-9299': {
    end: '7:42 AM', duration: '6 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Payment method'], securitySettings: ['No security setting opened'],
    profileActions: ['PCH-3301 · Payment method added'], payeeTokenActivity: ['Bank Code and Destination ID tokenized'], moneyMovement: ['EVT-3302 · Payment method added before session'],
    sessionPath: ['7:36 AM · Password login', '7:36 AM · Payment method added', '7:42 AM · Normal logout'], investigatorUse: 'Use to place payment setup and account navigation in sequence.',
  },
  'SES-9100': {
    end: '5:31 PM', duration: '13 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Profile creation', 'Email verification'], securitySettings: ['Email code verified'],
    profileActions: ['PCH-3303 · Profile created', 'PCH-3304 · Email code verified'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['5:18 PM · Email code login', '5:18 PM · Profile created', '5:31 PM · Normal logout'], investigatorUse: 'Use as early-account setup context only.',
  },
  'SES-9094': {
    end: '5:15 PM', duration: '10 minutes', logoutStatus: 'Normal logout recorded', pagesViewed: ['Password setup', 'Profile creation'], securitySettings: ['Password setup recorded'],
    profileActions: ['PCH-3303 · Profile created'], payeeTokenActivity: ['No payee or token activity recorded'], moneyMovement: ['No money movement recorded'],
    sessionPath: ['5:05 PM · Password setup', '5:05 PM · Profile created', '5:15 PM · Normal logout'], investigatorUse: 'Use to establish the first known account session.',
  },
};

function defaultDetails(login) {
  return {
    end: 'Not recorded', duration: 'Not recorded', logoutStatus: 'Not recorded', pagesViewed: ['Not recorded'], securitySettings: ['Not recorded'],
    profileActions: ['No linked profile action recorded'], payeeTokenActivity: ['No linked payee or token activity recorded'], moneyMovement: ['No linked money movement recorded'],
    sessionPath: [`${login.time} · ${login.method} login`], investigatorUse: 'Compare this session with linked login, device, IP, and timeline records.',
  };
}

export function getSessionRecords(activeCase) {
  return (activeCase.loginHistory ?? []).map((login) => {
    const detail = sessionDetailsById[login.session] ?? defaultDetails(login);
    return {
      ...login,
      ...detail,
      start: login.time,
      relatedRecords: [login.id, login.deviceId ?? login.device, `IP-${login.ip}`, ...(detail.profileActions ?? []), ...(detail.moneyMovement ?? [])],
    };
  });
}
