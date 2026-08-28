import {Check, Copy, QrCode, X} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';

export default function TicketQrModal({
  qrModalTicket,
  isQrTicketCopied,
  onClose,
  onCopyTransId,
  formatDrawTime
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-[#002B66] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#002B66] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700]">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs">
            <QrCode size={18} className="text-[#FFD700]" />
            <span>Ticket QR Code</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-300 hover:text-white cursor-pointer p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-slate-200 flex items-center justify-center">
            <QRCodeSVG 
              value={String(qrModalTicket.computedTransId || qrModalTicket.transactionId || '')} 
              size={190} 
              level="H" 
              includeMargin={true}
            />
          </div>

          {/* Transaction ID with Copy */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Transaction ID</p>
              <p className="font-mono text-xs md:text-sm font-black text-[#002B66]">{qrModalTicket.computedTransId || qrModalTicket.transactionId}</p>
            </div>
            <button
              onClick={onCopyTransId}
              className={`flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-all active:scale-95 ${
                isQrTicketCopied
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#002B66] hover:bg-blue-900 text-[#FFD700]"
              }`}
            >
              {isQrTicketCopied ? <Check size={13} /> : <Copy size={13} />}
              <span>{isQrTicketCopied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          {/* Summary */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-sans text-[11px] font-bold text-slate-500">Combination:</span>
              <span className="font-bold text-slate-900">{qrModalTicket.betNo || qrModalTicket.CombiNo || 'N/A'} ({qrModalTicket.betCode || (qrModalTicket.rambolito ? 'RS3' : 'TS3')})</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-sans text-[11px] font-bold text-slate-500">Win Liability:</span>
              <span className="font-bold text-emerald-700 font-sans text-sm">₱{parseFloat(qrModalTicket.winAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-sans text-[11px] font-bold text-slate-500">Draw Schedule:</span>
              <span className="font-semibold text-slate-700">{formatDrawTime(qrModalTicket.drawTime || qrModalTicket.draw, qrModalTicket.drawDate)}</span>
            </div>
          </div>

          {/* Scanner Notice */}
          <div className="bg-blue-50 border border-blue-200 text-[#002B66] rounded-xl p-3 text-center text-[11px] font-semibold leading-relaxed w-full">
            Point the <span className="font-black text-[#002B66] underline">STL Mandaue QR Scanner Mobile App</span> at this QR code to authenticate and execute payout.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose} 
            className="w-full bg-[#002B66] hover:bg-blue-900 text-white font-extrabold py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            Close QR Code
          </button>
        </div>
      </div>
    </div>
  );
}