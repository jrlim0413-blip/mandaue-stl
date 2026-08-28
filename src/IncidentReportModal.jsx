import {AlertTriangle, FileText, Printer, X} from 'lucide-react';
import {formatDrawTime} from './utils/dateFormatting';
import {getTicketAgeInDays, getTicketDate} from './utils/ticketAge';
import {openIncidentReportPrint} from './utils/incidentReportPrint';

export default function IncidentReportModal({ticket, onClose}) {
  if (!ticket) return null;

  const transId = ticket.computedTransId || ticket.transactionId || ticket.transId || ticket.receipt_no || ticket.ticket_no || 'N/A';
  const ticketDate = getTicketDate(ticket);
  const ageInDays = getTicketAgeInDays(ticket);
  const reportNumber = `IR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(transId).replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:static print:min-h-screen print:items-start print:bg-white print:p-0">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border-2 border-[#002B66] bg-white shadow-2xl print:max-w-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b-2 border-[#FFD700] bg-[#002B66] px-5 py-4 text-white print:bg-white print:text-[#002B66]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FFD700] p-2 text-[#002B66]"><FileText size={20} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 print:text-slate-500">STL Mandaue Operations</p>
              <h2 className="text-sm font-black uppercase tracking-wider">Incident Report Issuance</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-blue-200 hover:text-white print:hidden" aria-label="Close incident report"><X size={19} /></button>
        </div>

        <div className="space-y-4 p-5 text-xs text-slate-800">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="font-semibold leading-relaxed">This ticket has remained unclaimed for <strong>{ageInDays} days</strong> and is eligible for incident report issuance.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2">
            <div><span className="font-bold uppercase text-slate-500">Report No.</span><p className="mt-1 font-mono font-black text-[#002B66]">{reportNumber}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Date Issued</span><p className="mt-1 font-mono font-bold">{new Date().toLocaleDateString('en-US')}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Transaction ID</span><p className="mt-1 font-mono font-black text-[#002B66]">{transId}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Ticket Date</span><p className="mt-1 font-mono font-bold">{ticketDate || 'N/A'}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Teller / Outlet</span><p className="mt-1 font-bold uppercase">{ticket.fullName || ticket.outlet || ticket.username || 'N/A'}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Draw Schedule</span><p className="mt-1 font-mono font-bold">{formatDrawTime(ticket.drawTime || ticket.draw, ticket.drawDate || ticket.created_at)}</p></div>
            <div><span className="font-bold uppercase text-slate-500">Bet Combination</span><p className="mt-1 font-mono font-bold">{ticket.betNo || ticket.CombiNo || 'N/A'} ({ticket.betCode || (ticket.rambolito ? 'RS3' : 'TS3')})</p></div>
            <div><span className="font-bold uppercase text-slate-500">Win Liability</span><p className="mt-1 font-mono font-black text-emerald-700">₱{parseFloat(ticket.winAmount ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</p></div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4"><p className="font-bold uppercase tracking-wider text-[#002B66]">Incident Details</p><p className="mt-2 leading-relaxed text-slate-600">The listed winning ticket remains unclaimed beyond the prescribed three-day period. This report is issued for monitoring, verification, and appropriate operational follow-up.</p></div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 print:hidden">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">Close</button>
          <button type="button" onClick={() => openIncidentReportPrint(ticket)} className="flex items-center gap-2 rounded-lg bg-[#002B66] px-4 py-2 text-xs font-black text-white shadow-md hover:bg-blue-900"><Printer size={14} /> Open Print Preview</button>
        </div>
      </div>
    </div>
  );
}
