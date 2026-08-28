import {AlertTriangle, Check, CheckCircle2, Copy, QrCode, Receipt, X} from 'lucide-react';

export default function ConfirmReturnModal({
  selectedTicket,
  isTransIdCopied,
  isQrOpened,
  isSaving,
  onClose,
  onOpenQrModal,
  onCopyTransId,
  onConfirmReturn,
  formatDrawTime
}) {
  const isTransferDisabled = isTransIdCopied || isQrOpened;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-[#002B66] text-white px-4 sm:px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700] shrink-0">
          <div className="flex items-center gap-2.5 font-black uppercase tracking-wider text-xs truncate">
            <Receipt size={18} className="text-[#FFD700] shrink-0" />
            <span className="truncate">Confirm Winnings Return Entry</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer shrink-0"><X size={18} /></button>
        </div>
        
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">
              Please review the ticket specifications below before transferring this record into the <span className="font-bold underline">Returned Winnings Audit Ledger</span>.
            </p>
          </div>

          {isTransferDisabled && (
            <div className="bg-amber-100/80 border-2 border-amber-400 text-amber-900 p-3 rounded-lg flex items-center gap-2.5 font-bold animate-in fade-in duration-200">
              <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
              <span>
                {isTransIdCopied && isQrOpened
                  ? "Transaction ID copied & QR Code opened. "
                  : isQrOpened
                  ? "QR Code modal opened. "
                  : "Transaction ID copied to clipboard. "}
                <u>Execute Transfer is disabled</u> for this ticket.
              </span>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Assigned Username:</span>
              <span className="font-bold text-[#002B66] truncate">{selectedTicket.username ? `@${selectedTicket.username}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Full Name / Outlet:</span>
              <span className="font-bold text-slate-800 truncate">{selectedTicket.fullName || selectedTicket.outlet || 'N/A'}</span>
            </div>
            <div 
              className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 p-1 -mx-1 rounded transition-all gap-2"
            >
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase flex items-center gap-1.5 shrink-0">
                <QrCode size={13} className="text-[#002B66]" />
                <span>Transaction ID:</span>
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  onClick={onOpenQrModal}
                  className="font-bold text-[#002B66] underline decoration-blue-300 hover:text-blue-700 font-mono truncate cursor-pointer"
                  title="Click to view QR Code"
                >
                  {selectedTicket.computedTransId}
                </span>
                <button
                  type="button"
                  onClick={onCopyTransId}
                  className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs cursor-pointer transition-all active:scale-95 shrink-0 ${
                    isTransIdCopied 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                      : "bg-[#002B66] hover:bg-blue-900 text-[#FFD700]"
                  }`}
                  title="Copy Transaction ID"
                >
                  {isTransIdCopied ? <Check size={11} /> : <Copy size={11} />}
                  <span>{isTransIdCopied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenQrModal}
                  className="bg-[#002B66] text-[#FFD700] hover:bg-blue-900 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                  title="Open QR Code Modal"
                >
                  <QrCode size={11} />
                  <span>QR</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Draw Schedule:</span>
              <span className="font-bold text-slate-800 truncate">{formatDrawTime(selectedTicket.drawTime || selectedTicket.draw, selectedTicket.drawDate)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Bet Combination:</span>
              <span className="font-bold text-slate-800 truncate">{selectedTicket.betNo || selectedTicket.CombiNo || 'N/A'} ({selectedTicket.betCode || (selectedTicket.rambolito ? 'RS3' : 'TS3')})</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Bet Amount:</span>
              <span className="font-bold text-slate-800 shrink-0">₱{parseFloat(selectedTicket.betAmount ?? selectedTicket.amount ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-0.5 gap-2">
              <span className="text-slate-500 font-sans text-[11px] font-bold uppercase shrink-0">Win Liability:</span>
              <span className="font-bold text-emerald-700 text-sm shrink-0">₱{parseFloat(selectedTicket.winAmount ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 px-4 sm:px-5 py-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={isSaving} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 font-extrabold text-slate-700 hover:bg-slate-200 cursor-pointer uppercase text-xs transition-colors">
            Cancel
          </button>
          <button 
            onClick={onConfirmReturn} 
            disabled={isSaving || isTransferDisabled} 
            className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
              isTransferDisabled
                ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300"
                : isSaving
                ? "bg-[#002B66] text-white opacity-50 cursor-wait"
                : "bg-[#002B66] hover:bg-blue-900 text-white cursor-pointer active:scale-95"
            }`}
            title={
              isTransferDisabled 
                ? `Transfer is disabled because ${isQrOpened ? "QR Code modal was opened" : "Transaction ID was copied"}` 
                : "Execute transfer to returned ledger"
            }
          >
            <Check size={14} className={isTransferDisabled ? "text-slate-400" : "text-[#FFD700]"} />
            <span>
              {isSaving 
                ? "Processing Transfer..." 
                : isTransferDisabled 
                ? `Transfer Disabled (${isQrOpened ? "QR Opened" : "ID Copied"})` 
                : "Execute Transfer"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}