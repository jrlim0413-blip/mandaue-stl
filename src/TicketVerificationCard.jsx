import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Building2,
  User,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { TICKET_STATUS } from './utils/ticketVerificationBot';

export default function TicketVerificationCard({
  ticket,
  onOpenQrModal,
  onCopyTransId
}) {
  const [isCopied, setIsCopied] = useState(false);

  if (!ticket) return null;

  const currentStatus = ticket.status || TICKET_STATUS.UNCLAIMED;
  const isUnclaimed = currentStatus === TICKET_STATUS.UNCLAIMED;
  const isClaimed = currentStatus === TICKET_STATUS.CLAIMED;
  const isReturned = currentStatus === TICKET_STATUS.RETURNED;

  const transId = ticket.transactionId || ticket.transId || '081628-N/A';
  const betNo = ticket.betNo || ticket.CombiNo || '---';
  const betCode = ticket.betCode || 'TS3';
  const drawTime = ticket.drawTime || '5:00 PM';
  const drawDate = ticket.drawDate || 'Today';
  const betAmt = parseFloat(ticket.betAmount || 0);
  const winAmt = parseFloat(ticket.winAmount || 0);
  const outlet = ticket.outlet || ticket.fullName || 'Subangdaku #01';
  const teller = ticket.teller || ticket.username || 'Teller Staff';

  const handleCopy = (e) => {
    e?.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(transId);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onCopyTransId) onCopyTransId(transId);
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl border-2 border-slate-200/90 shadow-lg overflow-hidden my-2.5 transition-all text-slate-800 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Status Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between font-mono text-xs ${
        isUnclaimed
          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
          : isClaimed
            ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white'
            : isReturned
              ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white'
              : 'bg-slate-700 text-white'
      }`}>
        <div className="flex items-center gap-1.5 font-sans font-black tracking-wider uppercase text-[11px]">
          {isUnclaimed && <Sparkles size={14} className="text-[#FFD700] animate-pulse" />}
          {isClaimed && <CheckCircle2 size={14} className="text-cyan-300" />}
          {isReturned && <Clock size={14} className="text-amber-200" />}
          <span>
            {isUnclaimed
              ? '🟢 STATUS: UNCLAIMED'
              : isClaimed
                ? '🔵 STATUS: CLAIMED & PAID'
                : isReturned
                  ? '🟠 STATUS: RETURNED TO HQ'
                  : 'STATUS: VALIDATION RESULT'}
          </span>
        </div>
        <span className="text-[10px] bg-black/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          {betCode}
        </span>
      </div>

      {/* Ticket Body with Receipt Design */}
      <div className="p-4 space-y-3 bg-slate-50/40">
        
        {/* Trans ID Row */}
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider font-sans">Transaction Barcode / ID</span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-[#002B66]">{transId}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              isCopied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Copy Transaction ID"
          >
            {isCopied ? <Check size={12} /> : <Copy size={12} />}
            <span>{isCopied ? 'Copied!' : 'Copy ID'}</span>
          </button>
        </div>

        {/* 2x2 Ticket Details Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Bet Combination</span>
            <span className="text-base font-black text-slate-900 tracking-wider">{betNo}</span>
            <span className="text-[10px] text-slate-500 font-sans block">({betCode})</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Draw Schedule</span>
            <span className="text-xs font-extrabold text-[#002B66] block">{drawTime}</span>
            <span className="text-[10px] text-slate-500 font-sans block">{drawDate}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[9px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Bet Amount</span>
            <span className="text-xs font-bold text-slate-700">
              ₱{betAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
            <span className="text-[9px] font-sans font-extrabold text-emerald-800 uppercase tracking-wider block">Winning Prize</span>
            <span className="text-sm sm:text-base font-black text-emerald-700">
              ₱{winAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Branch / Teller Details */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 size={13} className="text-blue-600 shrink-0" />
            <span className="font-bold truncate">{outlet}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-500">
            <User size={12} />
            <span className="truncate">{teller}</span>
          </div>
        </div>

        {/* Verification Status & Audit Guidance */}
        {isUnclaimed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold block text-emerald-800">Verified: UNCLAIMED (Active Winning Record)</span>
              <span className="text-emerald-700">
                This winning ticket is active and eligible for payout at the authorized cashier / teller terminal.
              </span>
            </div>
          </div>
        )}

        {isClaimed && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 flex items-start gap-2">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold block text-blue-800">Verified: CLAIMED & PAID OUT</span>
              <span className="text-blue-700">
                Prize payout has already been claimed and recorded in the system ledger ({ticket.claimedBy || 'Cashier Desk'}).
              </span>
            </div>
          </div>
        )}

        {isReturned && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold block text-amber-800">Verified: RETURNED TO HQ</span>
              <span className="text-amber-700">
                {ticket.remarks || 'This ticket was officially returned/remitted to Mandaue Headquarters.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Footer Tear Pattern */}
      <div className="h-2 bg-slate-100 border-t border-dashed border-slate-300 flex justify-around items-center px-2">
        <span className="text-[8px] font-mono text-slate-400 font-bold tracking-widest uppercase">
          LUCKY BETPLAY CORP • AUDIT VERIFICATION SLIP
        </span>
      </div>
    </div>
  );
}
