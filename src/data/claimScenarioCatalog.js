function entry(subtype, title, statement, amount, transactionInfo, correctDetermination, truth, options = {}) {
  return {
    subtype,
    title,
    statement,
    amount,
    transactionInfo,
    correctDetermination,
    truth,
    ...options,
  };
}

const scenarioCatalog = {
  'account-takeover': [
    entry('credential stuffing', 'Credential stuffing and transfer review', 'I received login alerts overnight and do not recognize the purchase that followed.', '$1,286.40', 'Electronics marketplace purchase - card not present - training card ending 2641', 'Support Customer Claim', 'Reused credentials were tested from a new device before an unauthorized purchase.', { priority: 'High' }),
    entry('phishing', 'New wallet and account access review', 'I received a message about my account, signed in, and later saw activity I do not recognize.', '$742.18', 'Digital marketplace purchase - card not present - training card ending 2209', 'Support Customer Claim', 'A look-alike sign-in page captured credentials and was followed by new wallet activity.', { id: 'ato-phishing-wallet', priority: 'High' }),
    entry('OTP phishing', 'One-time-code and payee review', 'A caller asked me to read back a code, and a new payee appeared shortly afterward.', '$2,180.00', 'External transfer - newly added payee - training account ending 1176', 'Support Customer Claim', 'The customer disclosed an OTP that was used to add a new payee and release a transfer.', { priority: 'High' }),
    entry('vishing', 'Phone impersonation and account-control review', 'Someone claiming to be the bank called about fraud and told me to move money to protect it.', '$3,420.00', 'Customer-initiated transfer - new destination - training account ending 6830', 'Escalate Investigation', 'The customer authorized the payment under deception, requiring an escalation rather than an automatic unauthorized-activity outcome.', { priority: 'High' }),
    entry('SIM swap', 'SIM change and mobile access review', 'My phone lost service before I received alerts about account changes and a transfer.', '$4,075.00', 'Mobile transfer - new external destination - training account ending 9422', 'Support Customer Claim', 'A carrier SIM change preceded password recovery, profile control, and money movement.', { priority: 'Critical' }),
    entry('remote access malware', 'Remote access and payment-session review', 'A caller asked me to install support software and then moved through my account while the screen was shared.', '$6,240.00', 'Online transfer - remote access session - training account ending 1442', 'Escalate Investigation', 'Remote access software was present during a customer-authenticated session and the payment authorization requires a coached-transfer review.', { priority: 'Critical' }),
    entry('help desk reset abuse', 'Help desk recovery and profile-control review', 'I did not contact support, but my password and phone were reset through the help desk.', '$3,860.00', 'External transfer - help desk reset sequence - training account ending 5381', 'Support Customer Claim', 'An impersonator bypassed recovery controls before changing contact details and releasing a transfer.', { priority: 'Critical' }),
    entry('session hijack', 'Session and profile access review', 'I noticed a card transaction after checking my account from my regular phone.', '$486.22', 'Online retail purchase - card not present - training card ending 5106', 'Insufficient Evidence', 'The known device and session contain mixed signals, and the packet lacks enough proof to attribute the purchase.', { id: 'ato-session-control', priority: 'High' }),
    entry('profile change before transfer', 'Profile-control change and transfer review', 'My phone and email were changed shortly before money left the account.', '$5,120.00', 'Online transfer - profile change sequence - training account ending 4802', 'Support Customer Claim', 'A new session changed recovery details immediately before adding and paying a new destination.', { priority: 'Critical' }),
    entry('new payee/external account add', 'New external payee and transfer review', 'I do not recognize the new external account or the transfer sent to it.', '$2,975.00', 'External transfer - newly added destination - training account ending 3076', 'Support Customer Claim', 'The destination was first seen during an unfamiliar session and had no prior customer relationship.', { priority: 'High' }),
    entry('wallet enrollment after takeover', 'Post-takeover wallet enrollment review', 'A wallet was added after my password was reset, and I do not recognize the purchases.', '$1,046.80', 'Digital wallet purchases - new token enrollment - training card ending 8193', 'Support Customer Claim', 'Unfamiliar recovery activity preceded a new wallet token and rapid purchases.', { priority: 'Critical' }),
  ],
  'fraud-chargeback': [
    entry('lost card', 'Lost card and point-of-sale review', 'I lost my card during the afternoon and do not recognize the store purchase made later.', '$286.47', 'Urban Market purchase - contactless POS - training card ending 3702', 'Support Customer Claim', 'The purchase occurred after the documented loss and before the card was blocked.', { priority: 'High' }),
    entry('stolen card', 'Stolen card and chip activity review', 'My wallet was stolen, but I do not recognize the chip purchase made that evening.', '$914.36', 'Harbor Electronics purchase - EMV chip - training card ending 6184', 'Insufficient Evidence', 'The chip record is strong authorization evidence, but PIN and card-possession timing remain unresolved.', { priority: 'High' }),
    entry('never received card', 'Card delivery and activation review', 'I never received the replacement card and did not activate or use it.', '$438.19', 'Parkline Department Store - contactless POS - training card ending 0268', 'Support Customer Claim', 'Carrier and activation records do not connect the card to the cardholder before the disputed purchase.', { priority: 'High' }),
    entry('counterfeit/skimming', 'Counterfeit card and magnetic-stripe review', 'I still had my card when cash withdrawals and store purchases appeared in another city.', '$1,120.00', 'ATM and retail activity - magnetic stripe - training card ending 5527', 'Support Customer Claim', 'Fallback magnetic-stripe activity occurred far from the cardholder while the physical card remained in possession.', { priority: 'Critical' }),
    entry('CNP fraud', 'Unrecognized online card purchase', 'I do not recognize this online purchase and still have my physical card.', '$328.64', 'Northstar Digital Market - card not present - training card ending 4410', 'Support Customer Claim', 'The order used a new device, mismatched delivery details, and no established merchant account.', { id: 'fcb-cnp-purchase', priority: 'High' }),
    entry('digital wallet token fraud', 'Digital wallet card activity review', 'I saw a card transaction after an alert about a wallet I did not add.', '$512.09', 'Metro Mobile Wallet Merchant - tokenized card payment - training card ending 7734', 'Do Not Support Customer Claim', 'The wallet token was provisioned on the known phone and a chip purchase by the same cardholder occurred during the claimed fraud window.', { id: 'fcb-wallet-token', priority: 'High' }),
    entry('ATM/POS fraud', 'ATM cash and PIN review', 'I do not recognize the cash withdrawal and still have my debit card.', '$680.00', 'Training Federal ATM - chip and PIN - training card ending 9043', 'Do Not Support Customer Claim', 'The ATM used the chip and correct PIN near the cardholder home immediately after a recognized balance inquiry.', { priority: 'High' }),
    entry('unauthorized online purchase', 'Online authorization and fulfillment review', 'I did not make this online order and do not know the shipping address.', '$764.28', 'BrightCart Online - ecommerce purchase - training card ending 1935', 'Partial Credit', 'One item was delivered to the customer address while a second shipment went to an unrelated address.', { priority: 'High' }),
  ],
  'non-fraud-chargeback': [
    entry('incorrect amount', 'Incorrect merchant amount review', 'My receipt shows a smaller total than the amount posted to my card.', '$486.20', 'Cedar Table Restaurant - card present - training card ending 1018', 'Support Customer Claim', 'The signed receipt and authorization record support a lower amount than the posted transaction.'),
    entry('duplicate billing', 'Duplicate merchant billing review', 'I believe I was billed twice for the same purchase.', '$214.89', 'Cedar Square Outfitters - two posted card payments - training card ending 7712', 'Support Customer Claim', 'Two settled transactions share the same order, amount, and fulfillment record.', { id: 'ncb-duplicate-billing' }),
    entry('refund not received', 'Promised refund review', 'The merchant confirmed a refund, but it has not appeared on my account.', '$342.70', 'Riverbend Home Goods - refund pending - training card ending 2274', 'Support Customer Claim', 'The merchant issued a credit confirmation but no matching network credit posted by the expected date.'),
    entry('canceled service billed', 'Recurring billing after cancellation', 'I canceled the service and continued to see the same charge on my statement.', '$189.44', 'StreamBox Premium - recurring card payment - training card ending 8841', 'Insufficient Evidence', 'Recurring billing continued, but the customer and merchant records show different cancellation dates.', { id: 'ncb-recurring-cancellation' }),
    entry('item not as described', 'Merchandise quality and return review', 'The product was materially different from the listing, and the merchant declined my return.', '$629.95', 'Juniper Tech Outlet - ecommerce purchase - training card ending 4530', 'Partial Credit', 'The listing mismatch is documented, but the customer retained one component of the order.'),
    entry('services not rendered', 'Unprovided service review', 'I paid a deposit, but the scheduled service was never performed.', '$1,450.00', 'Lakeside Event Services - card payment - training card ending 6649', 'Support Customer Claim', 'The appointment was canceled by the merchant and no rescheduled service or credit was provided.', { priority: 'High' }),
    entry('return credit not posted', 'Return tracking and credit review', 'Tracking shows the return arrived, but I have not received the merchant credit.', '$278.16', 'Northline Apparel - returned merchandise - training card ending 8420', 'Support Customer Claim', 'Carrier delivery and warehouse intake records show the returned item was received.'),
    entry('subscription terms dispute', 'Subscription enrollment and terms review', 'I did not understand that the trial would convert to an annual subscription.', '$119.99', 'Planwell Learning - annual subscription - training card ending 3916', 'Do Not Support Customer Claim', 'Checkout and reminder records show the renewal price and cancellation window were disclosed and acknowledged.'),
  ],
  'first-party-fraud': [
    entry('friendly fraud', 'Recognized household purchase dispute', 'I do not remember making this purchase and want it removed.', '$384.52', 'Oakline Games - digital purchase - training card ending 0087', 'Do Not Support Customer Claim', 'The purchase was made from the established household device and the digital content was used.'),
    entry('household member use', 'Household authorized-user review', 'No one in my household was supposed to use my saved card for this order.', '$246.18', 'Family Market Online - saved card purchase - training card ending 6215', 'Do Not Support Customer Claim', 'An established authorized user placed the order and it was delivered to the account address.'),
    entry('digital goods used', 'Digital goods activation review', 'I did not receive anything for this charge.', '$159.00', 'ArcadeCloud Digital - digital goods - training card ending 1054', 'Do Not Support Customer Claim', 'The digital license was activated and used from the customer device before the dispute.'),
    entry('delivery proof conflicts with claim', 'Delivery and prior claim review', 'I did not receive the item and want the transaction reviewed.', '$638.40', 'Cedar Parcel Market - shipped order - training card ending 9088', 'Do Not Support Customer Claim', 'Carrier GPS, delivery photo, and signature connect the parcel to the customer address.', { id: 'fpf-delivery-review' }),
    entry('repeated non-receipt pattern', 'Repeated non-receipt pattern review', 'Several recent packages did not reach me even though the merchants marked them delivered.', '$872.33', 'Multiple online merchants - delivery disputes - training card ending 2148', 'Escalate Investigation', 'The repeated pattern requires secondary review, but individual delivery records are mixed.'),
    entry('refund/return abuse', 'Refund and retained merchandise review', 'I returned the order and should not still be charged.', '$517.64', 'Northstar Home - return request - training card ending 7341', 'Do Not Support Customer Claim', 'Only an empty parcel was received while account activity shows continued product use.'),
    entry('dispute after usage', 'Service usage after dispute review', 'I canceled because the service did not work for me.', '$229.00', 'FitTrack Annual - subscription service - training card ending 4473', 'Insufficient Evidence', 'Usage continued for part of the disputed period, but later access ended before the full billed term.'),
  ],
  'payroll-direct-deposit': [
    entry('spoofed employee email', 'Spoofed employee payroll request', 'Payroll received an email that looked like mine, but I did not request a new deposit account.', '$2,860.00', 'Payroll destination update - email request - training destination ending 0042', 'Hold', 'A look-alike sender requested a new destination that could not be verified with the employee.', { priority: 'High' }),
    entry('compromised employee email', 'Compromised mailbox payroll change', 'A real email thread from my account included a bank change I did not send.', '$3,140.00', 'Payroll destination update - compromised mailbox - training destination ending 7036', 'Hold', 'Mailbox access and forwarding activity preceded a payroll destination change.', { priority: 'Critical' }),
    entry('fake new-hire payroll setup', 'New-hire payroll profile review', 'A newly added employee is scheduled for payroll, but the manager cannot confirm the hiring packet.', '$1,980.00', 'New employee payroll setup - first pay cycle - training destination ending 1174', 'Hold', 'The employee record, manager approval, and identity documents do not connect across sources.', { priority: 'High' }),
    entry('payroll admin portal compromise', 'Payroll portal access review', 'A destination was changed through the payroll portal outside our normal processing window.', '$4,620.00', 'Payroll portal change - off-hours session - training destination ending 6098', 'Hold', 'A new device and IP performed the change after administrator credentials were reused.', { priority: 'Critical' }),
    entry('existing employee destination changed', 'Employee direct deposit change review', 'I received a notice that my pay destination changed, but I did not submit a new form.', '$2,860.00', 'Payroll destination update - employee direct deposit - training destination ending 0042', 'Hold', 'The destination is new, ownership does not match, and the employee denied the change.', { id: 'pay-direct-deposit-change', priority: 'High' }),
    entry('payroll card diversion', 'Payroll card destination review', 'My wages were sent to a payroll card I did not request.', '$1,742.00', 'Payroll card enrollment - first use - training card ending 2851', 'Hold', 'The payroll card enrollment lacks employee consent and used an unrelated contact channel.', { priority: 'High' }),
    entry('ghost employee payroll', 'Ghost employee roster review', 'A payroll entry appears for someone our department does not recognize.', '$6,800.00', 'Payroll roster entry - repeated payments - training destination ending 4017', 'Escalate Investigation', 'The employee lacks manager, HR, timekeeping, and identity support across multiple pay periods.', { priority: 'Critical' }),
  ],
  'email-bec': [
    entry('vendor bank change', 'Vendor payment instruction review', 'The payment instruction looked like it came from our vendor, but the destination details were different.', '$8,450.00', 'Vendor payment instruction - external destination update - training destination ending 8412', 'Hold', 'The requested destination is new and the trusted vendor contact denied the change.', { id: 'bec-vendor-change', priority: 'High' }),
    entry('look-alike domain', 'Look-alike vendor domain review', 'The invoice email looked normal, but the sender domain has one character changed.', '$14,860.00', 'Vendor invoice instruction - new beneficiary - training destination ending 4832', 'Hold', 'A newly registered look-alike domain supplied replacement payment instructions.', { priority: 'Critical' }),
    entry('mailbox compromise', 'Vendor mailbox compromise review', 'The message came from the vendor mailbox, but the vendor says the new bank details are not theirs.', '$28,450.00', 'Vendor payment instruction - mailbox thread - training destination ending 6620', 'Hold', 'Mailbox access and forwarding rules were used to alter an established invoice thread.', { priority: 'Critical' }),
    entry('CEO urgent payment', 'Executive urgent-payment review', 'An executive asked for an urgent confidential payment outside our regular approval process.', '$42,600.00', 'Executive payment request - urgent wire - training destination ending 8804', 'Hold', 'The message used executive impersonation and bypassed the approved payment workflow.', { priority: 'Critical' }),
    entry('invoice diversion', 'Invoice beneficiary diversion review', 'The invoice details changed just before payment, and the vendor cannot confirm the account.', '$19,735.00', 'Invoice payment - changed beneficiary - training destination ending 9061', 'Hold', 'A valid invoice was altered to route payment to an unrelated beneficiary.', { priority: 'Critical' }),
    entry('reply-to mismatch', 'Reply-to and sender comparison', 'The display name and sender looked familiar, but replies were going to a different address.', '$7,920.00', 'Supplier payment instruction - reply-to mismatch - training destination ending 3507', 'More Information Needed', 'The reply-to mismatch is material, but trusted callback and beneficiary ownership records are still pending.', { priority: 'High' }),
    entry('mailbox rule forwarding', 'Mailbox forwarding rule review', 'A payment conversation was copied to an address our team does not recognize.', '$11,280.00', 'Accounts payable email - forwarding rule - training destination ending 1279', 'Hold', 'A hidden forwarding rule exposed and redirected the payment conversation.', { priority: 'High' }),
    entry('beneficiary change before payment', 'Confirmed beneficiary change review', 'The vendor sent updated payment details and our team completed the standard callback.', '$16,250.00', 'Vendor beneficiary update - verified callback - training destination ending 7743', 'Release', 'The established vendor contact, ownership record, and approval trail confirm the new beneficiary.', { priority: 'High' }),
  ],
  'credit-risk': [
    entry('credit line increase', 'Consumer line-increase review', 'I requested a higher line after my income increased and supplied updated documents.', '$7,500.00', 'Credit line increase - existing consumer account - training account ending 3011', 'Support Credit Request', 'Verified income, stable payment history, and acceptable utilization support the request.', { family: 'Existing consumer account review' }),
    entry('income inflation', 'Stated and verified income review', 'My application lists my expected annual income based on recent contract work.', '$12,000.00', 'Consumer credit application - stated income review - training application ending 4806', 'More Information Needed', 'Deposits do not yet support the stated annual income, and current contract documentation is missing.', { family: 'New consumer application' }),
    entry('first-payment default concern', 'First-payment-default review', 'I opened the account recently and need time to make the first scheduled payment.', '$4,200.00', 'New credit account - first payment missed - training account ending 7726', 'Refer to Fraud Review', 'Identity, payment account, and rapid utilization records indicate possible intentional application abuse.', { family: 'New consumer application', priority: 'High' }),
    entry('repayment stress', 'Existing consumer account review', 'I am asking to keep the account available while my recent payment situation changes.', '$4,800.00', 'Existing credit account review - utilization and payment history - training account ending 3011', 'Refer to Collections or Hardship', 'Income disruption and rising obligations explain repayment stress without establishing fraud.', { id: 'cr-existing-consumer', family: 'Existing consumer account review' }),
    entry('bust-out concern', 'Existing business exposure review', 'The business requests continued access while revenue and payment activity are reviewed.', '$22,500.00', 'Business credit exposure review - payment and revenue packet - training line ending 8840', 'Reduce Exposure', 'Rapid line utilization, declining deposits, and missed payments support reducing exposure.', { id: 'cr-existing-business', family: 'Existing business account review', priority: 'High' }),
    entry('synthetic identity concern', 'Thin-file synthetic identity review', 'I submitted the application with the identity and address records available to me.', '$9,800.00', 'Consumer credit application - thin identity file - training application ending 1940', 'Refer to Fraud Review', 'The identity elements exist separately but do not form a consistent person across independent sources.', { family: 'New consumer application', priority: 'High' }),
    entry('fake application', 'Unsupported application review', 'I applied online and uploaded the documents requested by the application.', '$15,000.00', 'Consumer credit application - document review - training application ending 6285', 'Do Not Support Credit Request', 'Submitted income and identity documents conflict with source records.', { family: 'New consumer application', priority: 'High' }),
    entry('loan stacking', 'Concurrent credit inquiry review', 'I applied with several lenders while comparing financing options.', '$18,500.00', 'Consumer lending request - recent inquiry cluster - training application ending 9054', 'Escalate Senior Review', 'Multiple new obligations may materially change repayment capacity and require senior review.', { family: 'New consumer application', priority: 'High' }),
    entry('business revenue mismatch', 'New business credit application review', 'Our business is applying for a credit line to support operating expenses.', '$18,000.00', 'Business credit request - stated revenue packet - training business account ending 7280', 'More Information Needed', 'Bank deposits and tax support do not yet reconcile to stated annual revenue.', { id: 'cr-new-business', family: 'New business application', priority: 'High' }),
    entry('first-party credit abuse', 'Rapid line-usage intent review', 'I recently opened the account and requested access to the available credit line.', '$2,400.00', 'Credit line usage request - payment setup packet - training destination token', 'Refer to Fraud Review', 'The new account shows rapid utilization, unsupported identity changes, and an unrelated payment destination.', { family: 'New consumer application', priority: 'High' }),
  ],
  'business-loan-bust-out': [
    entry('sleeper LLC sudden draw', 'Dormant business sudden-draw review', 'The business is drawing on its line to fund a newly awarded operating contract.', '$48,000.00', 'Business credit draw - dormant account history - training line ending 1842', 'Hold Pending Verification', 'A long-dormant entity requested a large draw without current revenue or contract support.', { priority: 'Critical' }),
    entry('rapid credit line stacking', 'Business line-stacking review', 'We applied for several facilities to expand inventory before our busy season.', '$76,500.00', 'Business credit applications - concurrent facilities - training business ending 5210', 'Escalate to Credit Risk', 'Multiple recent facilities materially increase total exposure beyond documented cash flow.', { priority: 'Critical' }),
    entry('synthetic owner identity', 'Beneficial-owner identity review', 'The listed owner supplied identification and signed the business application.', '$35,000.00', 'Business loan application - owner verification - training business ending 3608', 'Refer to Fraud Review', 'Owner identity elements do not connect across registration, address, phone, and public-record sources.', { priority: 'Critical' }),
    entry('revenue mismatch', 'Business revenue reconciliation', 'Our seasonal revenue is higher than the recent bank statement period suggests.', '$29,500.00', 'Business loan request - revenue verification - training business ending 2713', 'Request Documents', 'The stated revenue may be seasonal, but tax and contract support is still missing.', { priority: 'High' }),
    entry('large draws after limit increase', 'Business credit draw and revenue review', 'The business needs access to its approved line for a seasonal operating expense.', '$31,200.00', 'Business credit draw - line increase history - training business line ending 6180', 'Approve With Restrictions', 'Operating records support a legitimate need, but recent payment volatility supports restricted availability.', { id: 'blo-sudden-draw', priority: 'High' }),
    entry('business legitimacy mismatch', 'Business operating-footprint review', 'Our company operates remotely and uses a registered-agent address.', '$24,000.00', 'Business credit application - operating footprint - training business ending 8049', 'Deny Application', 'Registration exists, but the website, customers, banking, invoices, and stated operations cannot be independently supported.', { priority: 'High' }),
    entry('tradeline piggyback business application', 'Business tradeline ownership review', 'The application includes established trade references supplied by our finance consultant.', '$41,000.00', 'Business loan application - tradeline review - training business ending 1153', 'Refer to Fraud Review', 'The trade references belong to unrelated businesses and were added shortly before the application.', { priority: 'High' }),
  ],
  'application-verification': [
    entry('ID mismatch', 'Identity-document field review', 'The application used my current information, but one document may still show an older name.', '$0.00', 'New application - identity document comparison - no transaction in scope', 'Request additional identity or address documentation', 'The document difference may be explainable, but supporting name-change documentation is missing.'),
    entry('address cannot be verified', 'Application identity and address review', 'I submitted the application using my current contact information and address.', '$0.00', 'New application profile - identity and address packet - no transaction in scope', 'Unable to verify with current records', 'The stated address is not supported by documents, public records, or contact history.', { id: 'avr-address-device' }),
    entry('thin identity profile', 'Thin identity profile review', 'I recently established credit and have limited records under my name.', '$0.00', 'New application - limited identity history - no transaction in scope', 'Hold pending verification', 'The identity is plausible but lacks enough independent history for completion.'),
    entry('new email and new device', 'New contact and device application review', 'I created a new email and applied from a replacement phone.', '$0.00', 'New application - new email and device - no transaction in scope', 'Request additional identity or address documentation', 'Both contact and device are new, requiring another independent identity source.'),
    entry('selfie/liveness mismatch', 'Selfie and liveness review', 'The selfie check had trouble reading my face and identification.', '$0.00', 'New application - selfie and liveness packet - no transaction in scope', 'Route for identity verification review', 'The liveness result and document portrait cannot be reconciled automatically.', { priority: 'High' }),
    entry('phone ownership mismatch', 'Phone ownership verification', 'The phone number on my application is part of a family mobile plan.', '$0.00', 'New application - phone ownership packet - no transaction in scope', 'Hold pending verification', 'The phone owner differs, but an authorized family relationship may explain the mismatch.'),
    entry('synthetic identity concern', 'Synthetic identity application review', 'I supplied all requested identity details through the online application.', '$0.00', 'New application - identity cluster review - no transaction in scope', 'Route for secondary fraud review', 'The SSN token, address, phone, and credit history do not form a consistent identity.', { priority: 'Critical' }),
    entry('stolen identity application', 'Victim identity application review', 'I did not submit this application and only learned about it from an alert.', '$0.00', 'New application - victim notification - no transaction in scope', 'Route for secondary fraud review', 'The real identity holder denied applying and the device and contact details are unrelated.', { priority: 'Critical' }),
  ],
  'ach-wire-check': [
    entry('ACH unauthorized return', 'ACH authorization and return review', 'I do not recognize the debit and did not authorize this company to withdraw funds.', '$1,264.80', 'ACH debit - originator review - training account ending 2064', 'Support Customer Claim', 'No valid authorization or prior relationship supports the ACH debit.', { priority: 'High' }),
    entry('wire beneficiary change', 'Wire beneficiary change review', 'Our team received a request to send the payment to a different beneficiary account.', '$12,750.00', 'Wire payment instruction - beneficiary destination update - training destination ending 0917', 'Escalate Investigation', 'The beneficiary changed outside the established process and trusted callback is incomplete.', { id: 'awc-wire-beneficiary', priority: 'High' }),
    entry('check alteration', 'Altered check image review', 'The payee and amount on the posted check do not match the check I issued.', '$6,420.00', 'Business check - payee and amount alteration - training account ending 4470', 'Support Customer Claim', 'Front and back images show alteration inconsistent with the issued-check record.', { priority: 'High' }),
    entry('check endorsement concern', 'Check endorsement and deposit review', 'The intended payee says the check was never received or deposited by them.', '$3,890.00', 'Business check - endorsement review - training account ending 7801', 'Insufficient Evidence', 'The endorsement is unclear and deposit-account ownership records remain pending.', { priority: 'High' }),
    entry('payment recovery review', 'Payment recall and recoverability review', 'We released the payment before learning the instruction may have been false.', '$24,600.00', 'Wire payment - recall request - training destination ending 3218', 'Escalate Investigation', 'The payment requires immediate recall and beneficiary coordination while authorization facts are reviewed.', { priority: 'Critical' }),
  ],
};

const claimDefaults = {
  'account-takeover': { channel: 'Digital fraud intake', entityRole: 'Consumer account holder', commonMistake: 'Treating a successful MFA event as proof the customer authorized later activity.' },
  'fraud-chargeback': { channel: 'Cardholder claim intake', entityRole: 'Cardholder', commonMistake: 'Treating authorization data as the same thing as customer participation or fulfillment.' },
  'non-fraud-chargeback': { channel: 'Card dispute intake', entityRole: 'Cardholder', commonMistake: 'Using a generic dispute reason instead of the evidence standard for the specific billing issue.' },
  'first-party-fraud': { channel: 'Claims review queue', entityRole: 'Cardholder', commonMistake: 'Assuming delivery or device evidence proves intent without comparing the full customer story.' },
  'payroll-direct-deposit': { channel: 'Employer payroll inquiry', entityRole: 'Employee', commonMistake: 'Calling an unverified number from the change request instead of using a trusted contact.' },
  'email-bec': { channel: 'Business payment-security queue', entityRole: 'Business payment contact', commonMistake: 'Trusting the display name or email thread without verifying the domain, mailbox, and beneficiary.' },
  'credit-risk': { channel: 'Credit review queue', entityRole: 'Credit applicant', commonMistake: 'Confusing inability to repay with fraud or relying on stated income without reconciliation.' },
  'business-loan-bust-out': { channel: 'Business credit monitoring', entityRole: 'Business owner', commonMistake: 'Reviewing registration alone without testing ownership, operations, revenue, and total exposure.' },
  'application-verification': { channel: 'Application verification queue', entityRole: 'Applicant', commonMistake: 'Treating a single identity match or mismatch as a complete verification decision.' },
  'ach-wire-check': { channel: 'Payments operations queue', entityRole: 'Business payment contact', commonMistake: 'Treating payment release as proof the instruction was valid or assuming recovery is guaranteed.' },
};

function slug(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function lifecycleFor(claimType, spec) {
  if (claimType.id === 'credit-risk') return /existing/i.test(spec.family ?? '') ? 'account monitoring' : 'onboarding';
  if (claimType.id === 'business-loan-bust-out') return /draw|exposure|stacking/i.test(spec.subtype) ? 'account monitoring' : 'onboarding';
  return claimType.taxonomy.lifecycleStage;
}

function toolkitFor(claimType, spec) {
  if (claimType.id === 'fraud-chargeback' && /lost card|stolen card|never received|counterfeit|ATM\/POS/i.test(spec.subtype)) {
    return claimType.availableTools.filter((tool) => !['Login History', 'Session History', 'Device Intelligence'].includes(tool));
  }
  return [...claimType.availableTools];
}

function buildScenario(claimType, spec, existingScenario) {
  const defaults = claimDefaults[claimType.id];
  const scenarioId = spec.id ?? existingScenario?.id ?? `${claimType.prefix.toLowerCase()}-${slug(spec.subtype)}`;
  const priority = spec.priority ?? existingScenario?.priority ?? 'Medium';
  const businessLoanFamily = claimType.id === 'business-loan-bust-out'
    ? lifecycleFor(claimType, spec) === 'account monitoring' ? 'Existing business account review' : 'New business application'
    : undefined;
  const family = spec.family ?? existingScenario?.family ?? businessLoanFamily;
  const taxonomyTags = {
    ...claimType.taxonomy,
    lifecycleStage: lifecycleFor(claimType, spec),
    customerRole: /support customer|hold|route for secondary fraud/i.test(spec.correctDetermination) ? 'victim or at-risk party' : claimType.taxonomy.customerRole,
  };

  return {
    id: scenarioId,
    title: spec.title,
    subtype: spec.subtype,
    summary: `${spec.title}. The fictional packet contains both routine and exception evidence for an Evidence First review.`,
    statement: spec.statement,
    channel: spec.channel ?? existingScenario?.channel ?? defaults.channel,
    amount: spec.amount,
    transactionInfo: spec.transactionInfo,
    priority,
    family,
    entityRole: spec.entityRole ?? existingScenario?.entityRole ?? defaults.entityRole,
    plainEnglishMeaning: `${spec.title} asks the investigator to determine what the available records actually support without assuming the allegation is true or false.`,
    howItHappens: spec.truth,
    timelinePattern: `${spec.subtype} activity is distributed across intake, system, transaction, and document records rather than disclosed in one answer-bearing record.`,
    commonMistake: defaults.commonMistake,
    miniExample: spec.statement,
    expectedEvidence: [...claimType.evidenceAreas],
    toolkitTools: toolkitFor(claimType, spec),
    documents: [...claimType.documents],
    taxonomyTags,
    caseTruth: {
      classification: spec.truth,
      correctDetermination: spec.correctDetermination,
      acceptedDeterminations: [spec.correctDetermination],
      rationale: spec.truth,
      revealMode: 'post-submission',
    },
    debriefLogic: `After submission, compare the learner determination and cited evidence with the hidden ${spec.subtype} truth and explain any unsupported assumptions.`,
  };
}

export function expandClaimScenarios(claimType) {
  const specs = scenarioCatalog[claimType.id] ?? [];
  const existingBySubtype = new Map((claimType.scenarios ?? []).map((item) => [item.subtype, item]));
  const scenarios = specs.map((spec) => buildScenario(claimType, spec, existingBySubtype.get(spec.subtype)));
  const represented = new Set(scenarios.map((item) => item.subtype));
  const missingSubtypes = claimType.subtypes.filter((subtype) => !represented.has(subtype));

  if (missingSubtypes.length) {
    throw new Error(`${claimType.label} is missing scenario specifications for: ${missingSubtypes.join(', ')}`);
  }

  return { ...claimType, scenarios };
}

export function scenarioCatalogCounts() {
  return Object.fromEntries(Object.entries(scenarioCatalog).map(([claimTypeId, entries]) => [claimTypeId, entries.length]));
}
