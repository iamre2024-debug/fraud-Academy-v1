import { accessReportExportText } from '../data/accessHistoryReports.js';

export function downloadAccessReport(report) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([accessReportExportText(report)], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${report.id}.txt`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function statusTone(value = '') {
  const normalized = value.toLowerCase();
  if (/(^match$|open|good|answered|confirmed|available|active)/.test(normalized)) return 'good';
  if (/(partial|pending|callback|more information|manual|recorded|tokenized)/.test(normalized)) return 'warn';
  if (/(no match|not found|closed|frozen|nsf|unable|wrong|not confirmed|no answer)/.test(normalized)) return 'alert';
  return 'neutral';
}
