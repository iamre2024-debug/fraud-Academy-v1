import { useEffect, useMemo, useState } from 'react';
import { getTransactionHistory } from '../data/businessPayrollWorkspace.js';

export default function TransactionHistoryWorkspace({ activeCase, pin, saveNote, markReviewed, reviewed, openTool, jumpDecision }) {
  const records = useMemo(() => getTransactionHistory(activeCase), [activeCase]);
  const [merchantSearch, setMerchantSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [account, setAccount] = useState('All accounts');
  const [channel, setChannel] = useState('All channels');
  const [direction, setDirection] = useState('All activity');
  const [selectedId, setSelectedId] = useState('');
  const accounts = ['All accounts', ...new Set(records.map((record) => record.instrument))];
  const channels = ['All channels', ...new Set(records.map((record) => record.channel))];
  const filteredRecords = records.filter((record) => {
    const date = new Date(record.posted);
    return (!merchantSearch || `${record.id} ${record.merchant} ${record.category} ${record.instrument}`.toLowerCase().includes(merchantSearch.toLowerCase()))
      && (account === 'All accounts' || record.instrument === account)
      && (channel === 'All channels' || record.channel === channel)
      && (direction === 'All activity' || record.direction === direction)
      && (!fromDate || date >= new Date(`${fromDate}T00:00:00`))
      && (!toDate || date <= new Date(`${toDate}T23:59:59`));
  });
  const activeRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? records[0];
  const total = filteredRecords.reduce((sum, record) => sum + record.amountValue, 0);

  useEffect(() => {
    setMerchantSearch('');
    setFromDate('');
    setToDate('');
    setAccount('All accounts');
    setChannel('All channels');
    setDirection('All activity');
    setSelectedId('');
  }, [activeCase.id]);

  function saveTransactionNote(message) {
    saveNote(`Transaction History: ${message}`, 'Transaction history');
  }

  return (
    <>
      <section className="transaction-history-findbar" aria-label="Transaction History filters">
        <div><p>Banking activity</p><h3>Case activity view. Filter merchant, date, account, amount context, channel, or debit and credit activity.</h3></div>
        <label><span>Merchant or transaction</span><input value={merchantSearch} onChange={(event) => setMerchantSearch(event.target.value)} placeholder="Merchant, transaction ID, category, or account" aria-label="Search Transaction History" /></label>
        <label><span>From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="Transaction History from date" /></label>
        <label><span>To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="Transaction History to date" /></label>
      </section>

      <section className="transaction-history-filter-row" aria-label="Transaction History quick filters">
        <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="Transaction channel filter">{channels.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={direction} onChange={(event) => setDirection(event.target.value)} aria-label="Transaction debit credit filter"><option>All activity</option><option>Debit</option><option>Non-monetary</option></select>
        <span>{filteredRecords.length} of {records.length} activity records shown</span>
      </section>

      <section className="transaction-history-summary" aria-label="Transaction History summary">
        <article><span>Activity window</span><strong>30 days</strong></article>
        <article><span>Records shown</span><strong>{filteredRecords.length}</strong></article>
        <article><span>Debit activity shown</span><strong>${total.toFixed(2)}</strong></article>
        <article><span>Accounts / cards</span><strong>{accounts.length - 1}</strong></article>
      </section>

      <div className="transaction-history-account-rail" aria-label="Transaction account and card rail">
        {accounts.map((item) => <button key={item} type="button" className={account === item ? 'active' : ''} onClick={() => setAccount(item)}>{item}</button>)}
      </div>

      {activeRecord ? <div className="transaction-history-workspace">
        <section className="transaction-history-list" aria-label="Transaction History activity feed">
          <header><p>Activity feed</p><h3>Choose a transaction to expand</h3></header>
          {filteredRecords.map((record) => <button key={record.id} type="button" className={record.id === activeRecord.id ? 'active' : ''} onClick={() => setSelectedId(record.id)} data-transaction-history-record={record.id}>
            <span>{record.posted} at {record.time}</span><strong>{record.merchant}</strong><small>{record.amount} | {record.channel} | {record.instrument}</small>
          </button>)}
          {!filteredRecords.length && <div className="investigation-tool-empty" role="status">No activity records match these filters.</div>}
        </section>

        <section className="transaction-history-detail" aria-label="Transaction detail drawer">
          <header><div><p>Transaction detail drawer</p><h3>{activeRecord.id} | {activeRecord.merchant}</h3><span>{activeRecord.posted} at {activeRecord.time}</span></div><button type="button" onClick={() => pin(activeRecord.id)}>Pin transaction</button></header>
          <dl>{[
            ['Amount', activeRecord.amount], ['Direction', activeRecord.direction], ['Account / card', activeRecord.instrument], ['Channel', activeRecord.channel], ['Category', activeRecord.category], ['Card entry mode', activeRecord.entryMode], ['Location', activeRecord.location], ['Status', activeRecord.status],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <article className="transaction-history-context"><span>Recorded context</span><p>{activeRecord.context}</p></article>
          <div className="transaction-history-actions"><button type="button" onClick={() => saveTransactionNote(`${activeRecord.id} reviewed with ${activeRecord.entryMode} and ${activeRecord.instrument}.`)}>Save transaction note</button><button type="button" onClick={() => openTool('Timeline')}>Open Timeline</button></div>
        </section>

        <aside className="transaction-history-evidence" aria-label="Transaction related evidence">
          <header><p>Related evidence</p><h3>Objects and documents</h3></header>
          <article><span>Related records</span><strong>{activeRecord.relatedRecords.join(' | ')}</strong></article>
          <article><span>Related documents</span><strong>{activeRecord.relatedDocuments.join(' | ') || 'No document linked in current packet'}</strong></article>
        </aside>
      </div> : <div className="investigation-tool-empty" role="status">No transaction records are available for this case.</div>}

      <nav className="investigation-tool-next-routes" aria-label="Transaction History next routes">
        {activeCase.availableTools?.includes('Merchant Intelligence') && <button type="button" onClick={() => openTool('Merchant Intelligence')}>Open Merchant Intelligence</button>}
        {activeCase.availableTools?.includes('Financial Investigation') && <button type="button" onClick={() => openTool('Financial Investigation')}>Open Financial Investigation</button>}
        {activeCase.availableTools?.includes('Payment Verification') && <button type="button" onClick={() => openTool('Payment Verification')}>Open Payment Verification</button>}
        <button type="button" onClick={jumpDecision}>Open Submit Decision</button>
      </nav>
      <footer className="investigation-tool-review-bar"><div><strong>Transaction History review</strong><span>Review the activity feed, transaction details, linked records, and documents before marking the tool reviewed.</span></div><button type="button" className={reviewed ? '' : 'investigation-tool-primary'} onClick={() => markReviewed('Transaction History')}>{reviewed ? '✓ Transaction History reviewed' : 'Mark Transaction History reviewed'}</button></footer>
    </>
  );
}

