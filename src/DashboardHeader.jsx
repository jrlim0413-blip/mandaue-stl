import { AlertTriangle, CheckCircle2, FileText, Menu, RefreshCw, Search } from 'lucide-react';
import DatePicker from './DatePicker';

export default function DashboardHeader({
  activeTab,
  loading,
  fromDate,
  toDate,
  searchQuery,
  totals,
  onOpenSidebar,
  onSync,
  onFromDateChange,
  onToDateChange,
  onSearchChange
}) {
  const title = activeTab === 'pending'
    ? 'Unclaimed Winnings Official Registry'
    : activeTab === 'returned'
      ? 'Returned Winnings Official Audit Trail'
      : 'Settlement Agreements Management';

  return (
    <>
      <header className="relative bg-white border-b border-slate-200 px-5 sm:px-7 lg:px-10 py-4 flex items-center justify-between gap-4 shadow-sm z-10 shrink-0 min-h-[72px]">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 shrink-0 cursor-pointer"><Menu size={18} /></button>
          <div className="flex items-center gap-3 min-w-0 border-l-4 border-[#FFD700] pl-3">
            <div className="w-3 h-3 rounded-full bg-[#002B66] ring-4 ring-[#FFD700]/25 shrink-0"></div>
            <div className="min-w-0">
              <span className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] leading-none mb-1">Mandaue Operations</span>
              <h2 className="text-sm md:text-base font-black text-[#002B66] uppercase tracking-wider truncate">{title}</h2>
            </div>
          </div>
        </div>
        <button onClick={onSync} disabled={loading} className="flex items-center gap-2 bg-[#002B66] hover:bg-blue-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline uppercase">Synchronize Ledger</span>
        </button>
      </header>

      {activeTab !== 'settlement' && (
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3.5rem)] max-w-6xl mx-auto mt-2 bg-blue-50/70 p-4 sm:p-5 rounded-xl border border-blue-200 border-t-4 border-t-[#002B66] shadow-md ring-1 ring-blue-200/60 flex flex-col md:flex-row gap-4 justify-between items-center">
          {activeTab === 'pending' && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
              <DatePicker label="Date From:" value={fromDate} onChange={onFromDateChange} />
              <DatePicker label="Date To:" value={toDate} onChange={onToDateChange} />
            </div>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search username, trans ID, bet no..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-xs rounded-lg focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] outline-none font-medium transition-all" />
          </div>
        </div>
      )}

      {activeTab !== 'settlement' && (
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3.5rem)] max-w-6xl mx-auto mt-4 mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            { label: 'Unclaimed Records', val: totals.count, Icon: FileText },
            { label: 'Total Bet Volume', val: `₱${totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: AlertTriangle },
            { label: 'Total Winning Liability', val: `₱${totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: CheckCircle2 }
          ].map(({ label, val, Icon }, i) => (
            <div key={i} className="bg-blue-50/70 p-4 sm:p-5 rounded-xl border border-blue-200 border-l-4 border-l-[#002B66] shadow-md ring-1 ring-blue-200/60 flex items-center justify-between transition-transform hover:-translate-y-0.5">
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none truncate">{label}</p>
                <p className="text-base sm:text-lg font-black font-mono mt-1.5 text-slate-900 leading-tight truncate">{val}</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl border border-blue-200 bg-blue-100 text-[#002B66] shrink-0"><Icon size={20} /></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}