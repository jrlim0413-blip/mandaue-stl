import {formatDrawTime} from './dateFormatting';
import {getTicketAgeInDays, getTicketDate} from './ticketAge';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

const reportValue = (label, value) => `<div class="field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || 'N/A')}</strong></div>`;
const controlValue = (label, value) => `<div class="control"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || 'N/A')}</strong></div>`;

export const openIncidentReportPrint = (ticket) => {
  const transId = ticket.computedTransId || ticket.transactionId || ticket.transId || ticket.receipt_no || ticket.ticket_no || 'N/A';
  const ticketDate = getTicketDate(ticket);
  const ageInDays = getTicketAgeInDays(ticket);
  const reportNumber = `IR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(transId).replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;
  const issuedDate = new Date().toLocaleDateString('en-US');
  const drawSchedule = formatDrawTime(ticket.drawTime || ticket.draw, ticket.drawDate || ticket.created_at);
  const betCombination = `${ticket.betNo || ticket.CombiNo || 'N/A'} (${ticket.betCode || (ticket.rambolito ? 'RS3' : 'TS3')})`;
  const reportWindow = window.open('', '_blank', 'width=900,height=900');

  if (!reportWindow) {
    window.print();
    return;
  }

  reportWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(reportNumber)}</title><style>
    :root { color: #172033; font-family: Arial, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e9eff7; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 14px 22px; background: #002b66; color: white; }
    .toolbar strong { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    .toolbar button { border: 0; border-radius: 6px; padding: 9px 14px; background: #ffd700; color: #002b66; font-weight: 800; cursor: pointer; }
    .paper { width: min(210mm, calc(100% - 32px)); min-height: 297mm; margin: 24px auto; padding: 18mm 17mm; background: white; box-shadow: 0 4px 20px #002b6626; }
    .letterhead { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 13px; border-bottom: 1px solid #94a3b8; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 72px; height: 54px; object-fit: contain; }
    .company { color: #002b66; font-size: 15px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .company-detail { margin-top: 4px; color: #334155; font-size: 10px; line-height: 1.4; }
    .stl-logo { width: 72px; height: 54px; object-fit: contain; }
    .classification { align-self: start; padding: 5px 9px; border: 1px solid #002b66; color: #002b66; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-align: center; text-transform: uppercase; }
    .heading { display: flex; justify-content: space-between; gap: 20px; padding: 23px 0 16px; border-bottom: 3px solid #002b66; }
    .eyebrow { margin: 0 0 6px; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 0; color: #002b66; font-size: 22px; letter-spacing: .04em; text-transform: uppercase; }
    .report-number { color: #002b66; font: 700 11px monospace; line-height: 1.45; text-align: right; }
    .document-control { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 16px; border: 1px solid #cbd5e1; }
    .control { padding: 8px 10px; border-right: 1px solid #cbd5e1; }
    .control:last-child { border-right: 0; }
    .control span { display: block; color: #64748b; font-size: 8px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .control strong { display: block; margin-top: 4px; color: #172033; font: 700 10px monospace; }
    .status { margin: 22px 0; padding: 12px 14px; border: 1px solid #fca5a5; border-left: 5px solid #dc2626; background: #fef2f2; color: #991b1b; font-size: 12px; line-height: 1.5; }
    .fields { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #cbd5e1; }
    .field { min-height: 62px; padding: 11px 13px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    .field:nth-child(even) { border-right: 0; }
    .field span { display: block; margin-bottom: 6px; color: #64748b; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .field strong { color: #172033; font-size: 12px; }
    .section-title { margin: 21px 0 9px; color: #002b66; font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
    .section { padding: 15px; border: 1px solid #cbd5e1; }
    .section p { margin: 0; color: #475569; font-size: 12px; line-height: 1.7; text-align: justify; }
    .certification { margin-top: 22px; padding: 15px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; font-size: 11px; line-height: 1.7; text-align: justify; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 38px; margin-top: 70px; }
    .signature { min-height: 54px; padding-top: 8px; border-top: 1px solid #172033; color: #475569; font-size: 10px; line-height: 1.45; text-transform: uppercase; }
    .footer { margin-top: 35px; padding-top: 9px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 8px; letter-spacing: .04em; text-align: center; text-transform: uppercase; }
    @media (max-width: 600px) { .toolbar { padding: 12px; } .paper { width: calc(100% - 16px); margin: 8px auto; padding: 24px 16px; } .letterhead, .heading, .fields, .signatures, .document-control { grid-template-columns: 1fr; display: grid; } .classification, .report-number { text-align: left; } .field, .field:nth-child(even) { border-right: 0; } .control { border-right: 0; border-bottom: 1px solid #cbd5e1; } .control:last-child { border-bottom: 0; } }
    @media print { @page { size: A4; margin: 0; } body { background: white; } .toolbar { display: none; } .paper { width: 210mm; min-height: 297mm; margin: 0; padding: 18mm; box-shadow: none; } }
  </style></head><body><div class="toolbar"><strong>Incident Report Print Preview</strong><button onclick="window.print()">Print Report</button></div><main class="paper">
    <header class="letterhead"><div class="brand"><img class="brand-logo" src="${window.location.origin}/lbp.png" alt="Lucky Betplay Corporation"><div><div class="company">Lucky Betplay Corporation</div><div class="company-detail">#257 Barlaps, A.S. Fortuna Street,<br>Bakilid, Mandaue City, Cebu 6014</div></div></div><div class="brand"><div class="classification">Confidential<br>Internal Use</div><img class="stl-logo" src="${window.location.origin}/stl.jpg" alt="STL"></div></header>
    <header class="heading"><div><p class="eyebrow">Compliance and Operations</p><h1>Incident Report Issuance</h1></div><div class="report-number">REPORT NO.<br>${escapeHtml(reportNumber)}<br><br>DATE ISSUED<br>${escapeHtml(issuedDate)}</div></header>
    <div class="document-control">${controlValue('Document Type', 'Operational Incident Report')}${controlValue('Classification', 'Internal Compliance Record')}${controlValue('Status', 'For Review and Appropriate Action')}</div>
    <div class="status">This ticket has remained unclaimed for <strong>${escapeHtml(ageInDays)} days</strong> and is eligible for incident report issuance.</div>
    <h2 class="section-title">I. Ticket Identification and Particulars</h2><section class="fields">${reportValue('Transaction ID', transId)}${reportValue('Ticket Date', ticketDate)}${reportValue('Teller / Outlet', ticket.fullName || ticket.outlet || ticket.username)}${reportValue('Draw Schedule', drawSchedule)}${reportValue('Bet Combination', betCombination)}${reportValue('Win Liability', `PHP ${parseFloat(ticket.winAmount ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`)}</section>
    <h2 class="section-title">II. Statement of Incident</h2><section class="section"><p>The listed winning ticket remains unclaimed beyond the prescribed three-day period. This report is issued for monitoring, verification, and appropriate operational follow-up.</p></section>
    <div class="certification"><strong>Certification and Disposition:</strong> This document records the operational finding based on the ticket information available at the time of issuance. It is submitted for review, verification, and determination of the appropriate succeeding action in accordance with applicable company procedures.</div>
    <div class="signatures"><div class="signature">Prepared / Issued By<br><br>Name and Signature</div><div class="signature">Received / Verified By<br><br>Name and Signature</div></div>
    <div class="footer">Lucky Betplay Corporation | STL Mandaue Operations Division | Controlled Internal Record</div>
  </main></body></html>`);
  reportWindow.document.close();
  reportWindow.focus();
};
