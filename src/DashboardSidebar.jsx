import { ArrowLeftRight, CalendarCheck, FileText, Landmark, LogOut, ShieldCheck, X } from 'lucide-react';

export default function DashboardSidebar({
  activeTab,
  currentUser,
  returnedCount,
  isSidebarOpen,
  onClose,
  onSelectTab,
  onLogout
}) {
  const navigationItems = [
    { id: 'pending', label: 'Unclaimed Winnings', Icon: CalendarCheck },
    { id: 'returned', label: 'Returned Winnings', Icon: ArrowLeftRight, badge: returnedCount },
    { id: 'settlement', label: 'Settlement Agreements', Icon: FileText },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 h-full bg-[#002B66] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out border-r border-blue-950 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="p-4 border-b border-blue-900/60 flex items-center justify-between bg-[#001D47]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-[#FFD700] p-2 rounded-lg text-[#002B66] shadow-md shrink-0">
                <Landmark size={20} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-extrabold tracking-wider text-white uppercase leading-snug break-words">Lucky Betplay Corporation</h1>
                <span className="text-[9px] text-[#FFD700] font-bold uppercase tracking-widest block mt-0.5">Unclaimed Winnings</span>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer shrink-0"><X size={18} /></button>
          </div>

          <div className="px-4 py-3 bg-blue-950/50 text-[10px] font-bold text-blue-300 uppercase tracking-wider border-b border-blue-900/40 flex items-center justify-between">
            <span>Navigation Modules</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <nav className="p-3 space-y-1.5">
            {navigationItems.map(({ id, label, Icon, badge }) => (
              <button
                key={id}
                onClick={() => onSelectTab(id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === id ? 'bg-[#FFD700] text-[#002B66] shadow-lg font-black lg:translate-x-1' : 'hover:bg-blue-950/60 text-blue-100 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0"><Icon size={16} className="shrink-0" /><span className="truncate">{label}</span></div>
                {badge > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${activeTab === id ? 'bg-[#002B66] text-[#FFD700]' : 'bg-emerald-600 text-white shadow-xs'}`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-blue-900/60 bg-[#001D47] space-y-3">
          <div className="flex flex-col gap-1 bg-blue-950/60 p-2.5 rounded-xl border border-blue-900/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-white font-bold truncate">👤 {currentUser.full_name || currentUser.username}</span>
              <span className="text-[9px] bg-[#FFD700] text-[#002B66] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-blue-200 font-bold px-1">
            <span className="flex items-center gap-1.5 truncate"><ShieldCheck size={14} className="text-[#FFD700] shrink-0" /> <span className="truncate">Mandaue Ops</span></span>
            <button onClick={onLogout} className="flex items-center gap-1 text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 font-bold text-[11px]" title="Sign Out">
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}