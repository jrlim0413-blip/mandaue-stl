import {useState, useEffect, useCallback, useMemo} from 'react';
import {Eye, EyeOff, CalendarCheck, Menu, X, FileText, RefreshCw, Search, CheckCircle2, AlertTriangle, ArrowLeftRight, Landmark, ShieldCheck, ChevronRight, UserCheck, Receipt, Check, AlertCircle, QrCode, LogOut, Copy} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ReturnedWinningsTab from './ReturnedWinningsTab';
import SettlementAgreementTab from './SettlementAgreementTab';
import Login from './Login'; // <--- Import ang iyong Login component

import {supabase} from './supabaseClient';

const CONFIG = {
  mandaue_unclaimed: {
    baseUrl: "https://stl-mandaue-api.com",
    token: "Bearer 2860|OCyU72t1DzxdBeSjj3izVKCIcCwHkqNbwjRlxHp5",
    isClaim: 0
  }
};

const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseToDateString = (dateVal) => {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      return dateVal.split('T')[0].split(' ')[0];
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  } catch {
    return null;
  }
  return null;
};

const formatDrawTime = (timeStr, drawDate) => {
  if (!timeStr && !drawDate) return 'N/A';
  let rawTime = String(timeStr || '').trim();

  if (/^\d{1,2}$/.test(rawTime)) {
    const hourNum = parseInt(rawTime, 10);
    if (hourNum === 0) rawTime = '12AM';
    else if (hourNum === 12) rawTime = '12PM';
    else if (hourNum > 12) rawTime = `${hourNum - 12}PM`;
    else rawTime = `${hourNum}AM`;
  } else if (rawTime.includes('T') || rawTime.includes(' ')) {
    const parts = rawTime.split(/[\sT]/);
    if (parts.length > 1) {
      const timePart = parts[1].split(':');
      if (timePart.length > 0) {
        const hourNum = parseInt(timePart[0], 10);
        if (!isNaN(hourNum)) {
          if (hourNum === 0) rawTime = '12AM';
          else if (hourNum === 12) rawTime = '12PM';
          else if (hourNum > 12) rawTime = `${hourNum - 12}PM`;
          else rawTime = `${hourNum}AM`;
        }
      }
    }
  }

  const formattedDate = parseToDateString(drawDate || timeStr);
  return formattedDate ? `${rawTime} ${formattedDate}`.trim() : rawTime || 'N/A';
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);

  // App Dashboard States
  const [activeTab, setActiveTab] = useState('pending');
  const todayStr = getLocalDateString();
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [returnedData, setReturnedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDailyTable, setShowDailyTable] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalTicket, setQrModalTicket] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedTransIds, setCopiedTransIds] = useState(() => new Set());

  const handleCopyTransId = (id) => {
    if (!id) return;
    const strId = String(id).trim();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(strId);
    }
    setCopiedTransIds(prev => new Set(prev).add(strId));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast(`Transaction ID ${strId} copied to clipboard.`);
  };

  const handleOpenQrModal = (ticket, e) => {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    if (!ticket) return;
    const computedId = ticket.computedTransId || ticket.transactionId || ticket.transId || ticket.receipt_no || ticket.ticket_no || 'N/A';
    setQrModalTicket({ ...ticket, computedTransId: computedId });
    setIsCopied(false);
    setIsQrModalOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchReturnedFromSupabase = useCallback(async () => {
    try {
      const { data: sData, error } = await supabase.from('returned_winnings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (sData) setReturnedData(sData);
    } catch (err) {
      console.error("Error fetching from Supabase:", err.message);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const cfg = CONFIG.mandaue_unclaimed;
      const targetEndDate = toDate ? new Date(toDate) : new Date();
      const pastDate = new Date(targetEndDate);
      pastDate.setDate(pastDate.getDate() - 60);
      const apiFromDate = getLocalDateString(pastDate);
      const apiToDate = getLocalDateString(targetEndDate);
      
      const res = await fetch(`${cfg.baseUrl}/api/accountant/UnclaimedReceipts?isClaim=${cfg.isClaim}&from=${apiFromDate}&to=${apiToDate}`, {
        method: 'GET',
        headers: {
          'Authorization': cfg.token,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const result = await res.json();
      const deepData = result?.data?.data || result?.data || result;
      setData(Array.isArray(deepData) ? deepData : deepData && typeof deepData === 'object' ? [deepData] : []);
    } catch (error) {
      setErrorMsg(error.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [toDate]);

  useEffect(() => {
    if (!currentUser) return; // Huwag mag-fetch kung hindi pa naka-login
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchReturnedFromSupabase();
        await fetchData();
      }
    })();
    return () => { isMounted = false; };
  }, [currentUser, fetchData, fetchReturnedFromSupabase]);

  const returnedTransIds = useMemo(() => new Set(returnedData.map(i => String(i.transactionId || '').trim().toLowerCase())), [returnedData]);

  const pendingFilteredData = useMemo(() => {
    return data.filter(i => {
      const isReturned = returnedTransIds.has(String(i.transactionId || i.transId || i.receipt_no || i.ticket_no || '').trim().toLowerCase());
      if (isReturned) return false;
      const itemDateVal = i.drawDate || i.drawTime || i.created_at || i.date;
      const itemDateStr = parseToDateString(itemDateVal);
      if (!itemDateStr) return true;
      if (fromDate && itemDateStr < fromDate) return false;
      if (toDate && itemDateStr > toDate) return false;
      return true;
    });
  }, [data, returnedTransIds, fromDate, toDate]);

  const currentList = activeTab === 'pending' ? pendingFilteredData : returnedData;

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter((item, i) =>
      (item.username || '').toLowerCase().includes(q) ||
      (item.fullName || item.outlet || '').toLowerCase().includes(q) ||
      (item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${i + 1}`).toLowerCase().includes(q) ||
      (item.betNo || item.CombiNo || '').toLowerCase().includes(q) ||
      (item.betCode || '').toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const groupedData = useMemo(() => {
    if (!Array.isArray(filteredData) || !filteredData.length) return {};
    return filteredData.reduce((acc, item) => {
      const userKey = (item.username || 'UNASSIGNED-USER').trim().toUpperCase();
      (acc[userKey] = acc[userKey] || []).push(item);
      return acc;
    }, {});
  }, [filteredData]);

  const totals = useMemo(() => {
    if (!Array.isArray(filteredData) || !filteredData.length) return { betAmount: 0, winAmount: 0, count: 0 };
    return filteredData.reduce((acc, item) => ({
      betAmount: acc.betAmount + parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0),
      winAmount: acc.winAmount + parseFloat(item.winAmount ?? 0),
      count: acc.count + 1
    }), { betAmount: 0, winAmount: 0, count: 0 });
  }, [filteredData]);

  const activeDisplayDate = useMemo(() => {
    if (!fromDate) return '';
    const parts = fromDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return fromDate;
  }, [fromDate]);

  const handleRowClick = (item, index) => {
    if (activeTab === 'returned' || activeTab === 'settlement') return;
    setSelectedTicket({ ...item, computedTransId: item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}` });
    setIsModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedTicket) return;
    setIsSaving(true);
    const payload = {
      apiId: selectedTicket.id || selectedTicket.apiId || null,
      transactionId: String(selectedTicket.computedTransId).trim(),
      username: selectedTicket.username || null,
      fullName: selectedTicket.fullName || selectedTicket.outlet || null,
      address: selectedTicket.address || null,
      location: selectedTicket.location || null,
      outlet: selectedTicket.outlet || null,
      supervisor: null,
      tellerId: selectedTicket.tellerId ? parseInt(selectedTicket.tellerId, 10) : null,
      drawId: selectedTicket.drawId ? parseInt(selectedTicket.drawId, 10) : null,
      betCode: selectedTicket.betCode || 'RS3',
      rambolito: selectedTicket.rambolito ?? 0,
      betNo: selectedTicket.betNo || 'N/A',
      betAmount: parseFloat(selectedTicket.betAmount ?? selectedTicket.amount ?? 0),
      winAmount: parseFloat(selectedTicket.winAmount ?? 0),
      type: selectedTicket.type ?? 0,
      status: selectedTicket.status ?? 1,
      isParent: selectedTicket.isParent || null,
      isSoldOut: selectedTicket.isSoldOut || null,
      isLowWin: selectedTicket.isLowWin || null,
      isVoid: selectedTicket.isVoid ?? 0,
      isClaim: selectedTicket.isClaim ?? 0,
      voidDate: selectedTicket.voidDate || null,
      isVoidByStaff: selectedTicket.isVoidByStaff ?? 0,
      reprintDate: selectedTicket.reprintDate || null,
      claimDate: selectedTicket.claimDate || null,
      isOffline: selectedTicket.isOffline || null,
      CombiNo: selectedTicket.CombiNo || null,
      SoldOutCombiNo: selectedTicket.SoldOutCombiNo || null,
      drawTime: selectedTicket.drawTime || selectedTicket.draw || 'N/A',
      drawDate: selectedTicket.drawDate || null,
      isUnderSettlement: false
    };
    try {
      const { data: insertedData, error } = await supabase.from('returned_winnings').insert([payload]).select();
      if (error) throw error;
      if (insertedData?.length) setReturnedData(prev => [insertedData[0], ...prev]);
      setData(prev => prev.filter(item => String(item.transactionId || item.transId || item.receipt_no || item.ticket_no || '').trim() !== String(selectedTicket.computedTransId).trim()));
      showToast("Successfully transferred ticket to Returned Winnings Ledger.");
    } catch (err) {
      alert(`Error saving to database: ${err.message}`);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
      setSelectedTicket(null);
    }
  };

  const handleDeleteFromSupabase = async (item) => {
    try {
      const { error } = await supabase.from('returned_winnings').delete().eq('transactionId', item.transactionId);
      if (error) throw error;
      setReturnedData(prev => prev.filter(r => r.transactionId !== item.transactionId));
      showToast("Record successfully removed from audit ledger.");
    } catch (err) {
      alert(`Failed to remove record: ${err.message}`);
    }
  };

  const handleSaveSettlementAgreement = async (agreementData) => {
    try {
      const targetTransactionId = agreementData.transactionId || agreementData.ticketId;
      const { error } = await supabase
        .from('returned_winnings')
        .update({ 
          isUnderSettlement: true,
          settlementTerms: agreementData 
        })
        .eq('transactionId', targetTransactionId);

      if (error) throw error;

      showToast("Settlement Agreement successfully saved!");
      await fetchReturnedFromSupabase();
    } catch (err) {
      console.error("Error saving settlement agreement:", err);
      alert(`Failed to save agreement: ${err.message}`);
    }
  };

  // Kung HINDI PA naka-login, i-render ang Login component gamit ang prop na onLoginSuccess
  if (!currentUser) {
    return <Login onLoginSuccess={(userData) => setCurrentUser(userData)} />;
  }

  // Kung NAKA-LOGIN na, i-render ang buong Dashboard
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-[#002B66] selection:text-white overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border-l-4 border-[#FFD700] text-xs font-semibold animate-bounce max-w-sm sm:max-w-md mx-auto">
          <CheckCircle2 size={16} className="text-[#FFD700] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Responsive Sidebar */}
{/* Responsive Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#002B66] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out border-r border-blue-950 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          {/* Top Header */}
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
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer shrink-0"><X size={18} /></button>
          </div>

          <div className="px-4 py-3 bg-blue-950/50 text-[10px] font-bold text-blue-300 uppercase tracking-wider border-b border-blue-900/40 flex items-center justify-between">
            <span>Navigation Modules</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {[
              { id: 'pending', label: 'Unclaimed Winnings', Icon: CalendarCheck },
              { id: 'returned', label: 'Returned Winnings', Icon: ArrowLeftRight, badge: returnedData.length },
              { id: 'settlement', label: 'Settlement Agreements', Icon: FileText },
            ].map(({ id, label, Icon, badge }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
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
        
        {/* Footer Profile & Logout Section */}
        <div className="p-4 border-t border-blue-900/60 bg-[#001D47] space-y-3">
          <div className="flex flex-col gap-1 bg-blue-950/60 p-2.5 rounded-xl border border-blue-900/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-white font-bold truncate">👤 {currentUser.full_name || currentUser.username}</span>
              <span className="text-[9px] bg-[#FFD700] text-[#002B66] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-blue-200 font-bold px-1">
            <span className="flex items-center gap-1.5 truncate"><ShieldCheck size={14} className="text-[#FFD700] shrink-0" /> <span className="truncate">Mandaue Ops</span></span>
            <button 
              onClick={() => setCurrentUser(null)}
              className="flex items-center gap-1 text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 font-bold text-[11px]"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-xs z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 shrink-0 cursor-pointer"><Menu size={18} /></button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shadow-xs shrink-0"></div>
              <h2 className="text-xs md:text-sm font-black text-[#002B66] uppercase tracking-wider truncate">
                {activeTab === 'pending' ? 'Unclaimed Winnings Official Registry' : activeTab === 'returned' ? 'Returned Winnings Official Audit Trail' : 'Settlement Agreements Management'}
              </h2>
            </div>
          </div>
          <button
            onClick={() => { fetchReturnedFromSupabase(); fetchData(); }}
            disabled={loading}
            className="flex items-center gap-2 bg-[#002B66] hover:bg-blue-900 text-white px-3.5 py-2 rounded-lg text-xs font-extrabold tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline uppercase">Synchronize Ledger</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 bg-slate-50 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-4">
            
            {activeTab !== 'settlement' && (
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                  {[
                    { label: 'Date From:', val: fromDate, set: setFromDate },
                    { label: 'Date To:', val: toDate, set: setToDate }
                  ].map(({ label, val, set }, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-1 sm:flex-initial">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-[#002B66] uppercase tracking-wider whitespace-nowrap">{label}</label>
                      <input type="date" value={val} onChange={(e) => set(e.target.value)} className="bg-transparent text-slate-900 text-xs font-mono font-bold outline-none cursor-pointer w-full sm:w-auto" />
                    </div>
                  ))}
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search username, trans ID, bet no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs rounded-lg focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] outline-none font-medium transition-all"
                  />
                </div>
              </div>
            )}

            {activeTab !== 'settlement' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: 'Unclaimed Records', val: totals.count, Icon: FileText, border: 'border-l-4 border-l-[#002B66]', text: 'text-[#002B66]', bg: 'bg-blue-50' },
                  { label: 'Total Bet Volume', val: `₱${totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: AlertTriangle, border: 'border-l-4 border-l-[#FFD700]', text: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Total Winning Liability', val: `₱${totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: CheckCircle2, border: 'border-l-4 border-l-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50' }
                ].map(({ label, val, Icon, border, text, bg }, i) => (
                  <div key={i} className={`bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 ${border} shadow-xs flex items-center justify-between transition-transform hover:-translate-y-0.5`}>
                    <div className="min-w-0 pr-2">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none truncate">{label}</p>
                      <p className="text-base sm:text-lg font-black font-mono mt-1.5 text-slate-900 leading-tight truncate">{val}</p>
                    </div>
                    <div className={`p-2.5 sm:p-3 rounded-xl border border-slate-100 shrink-0 ${bg}${text}`}><Icon size={20} /></div>
                  </div>
                ))}
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" /> <span className="break-words">{errorMsg}</span>
              </div>
            )}

            {activeTab === 'settlement' ? (
              <SettlementAgreementTab 
                filteredData={returnedData} 
                isLoadingApi={loading}
                onSaveAgreement={handleSaveSettlementAgreement}
              />
            ) : activeTab === 'returned' ? (
              <ReturnedWinningsTab 
                groupedData={groupedData}
                filteredData={filteredData}
                rawApiData={data} 
                isLoadingApi={loading} 
                formatDrawTime={formatDrawTime} 
                onDeleteRecord={handleDeleteFromSupabase} 
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mx-auto w-full">
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-[#002B66]/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h3 className="font-extrabold text-[#002B66] text-xs uppercase tracking-wider truncate">Unclaimed Winnings Summary</h3>
                    <span className="text-[10px] font-bold bg-[#002B66] text-[#FFD700] px-2 py-0.5 rounded font-mono shadow-2xs shrink-0">{activeDisplayDate}</span>
                  </div>
                  <button onClick={() => setShowDailyTable(!showDailyTable)} className="text-slate-500 hover:text-[#002B66] p-1 rounded-lg hover:bg-slate-200/50 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0">
                    {showDailyTable ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span className="hidden sm:inline">{showDailyTable ? "Hide Data" : "Show Data"}</span>
                  </button>
                </div>

                {showDailyTable && (
                  <div className="w-full p-2 sm:p-4 bg-slate-50/50">
                    {loading ? (
                      <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs bg-white rounded-xl border border-slate-200">Loading ledger data...</div>
                    ) : !Object.keys(groupedData).length ? (
                      <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs bg-white rounded-xl border border-slate-200">No unclaimed records registered for the selected date.</div>
                    ) : (
                      Object.entries(groupedData).map(([userKey, items]) => {
                        const groupBetTotal = items.reduce((sum, item) => sum + parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0), 0);
                        const groupWinTotal = items.reduce((sum, item) => sum + parseFloat(item.winAmount ?? 0), 0);
                        return (
                          <div key={userKey} className="mb-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 font-black text-[#002B66] text-xs uppercase tracking-wider font-mono flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <UserCheck size={14} className="text-[#002B66] shrink-0" />
                                <span className="truncate">Supervisor / Outlet: {userKey}</span>
                              </div>
                              <span className="text-[10px] bg-blue-100 text-[#002B66] px-2 py-0.5 rounded shrink-0">{items.length} items</span>
                            </div>

                            <div className="hidden md:block w-full overflow-x-auto">
                              <table className="w-full min-w-[750px] text-left border-collapse bg-white">
                                <thead>
                                  <tr className="bg-[#002B66] text-white text-[10px] font-black uppercase tracking-wider">
                                    <th className="px-3 py-2.5 border-r border-blue-950 w-[18%]">Teller</th>
                                    <th className="px-3 py-2.5 border-r border-blue-950 w-[20%]">Trans. ID</th>
                                    <th className="px-3 py-2.5 border-r border-blue-950 w-[18%]">Draw</th>
                                    <th className="px-3 py-2.5 border-r border-blue-950 text-center w-[12%]">Bet No.</th>
                                    <th className="px-3 py-2.5 border-r border-blue-950 text-center w-[10%]">Code</th>
                                    <th className="px-3 py-2.5 border-r border-blue-950 text-right w-[11%]">Bet Amount</th>
                                    <th className="px-3 py-2.5 text-right w-[11%]">Win Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                                  {items.map((item, index) => {
                                    const transId = item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}`;
                                    const displayAccountName = item.fullName || item.outlet || item.username || 'N/A';
                                    const betNo = item.betNo || item.CombiNo || item.SoldOutCombiNo || 'N/A';
                                    const betCode = item.betCode || (item.rambolito ? 'RS3' : 'TS3');
                                    const drawFormatted = formatDrawTime(item.drawTime || item.draw, item.drawDate || item.created_at);
                                    return (
                                      <tr
                                        key={index}
                                        className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-amber-50/85 cursor-pointer group border-b border-slate-100"
                                        onClick={() => handleRowClick(item, index)}
                                        title="Click row to process return"
                                      >
                                        <td className="px-3 py-3 border-r border-slate-200 font-bold text-slate-800 uppercase text-xs whitespace-nowrap">{displayAccountName}</td>
                                        <td className="px-3 py-3 border-r border-slate-200 font-mono text-[#002B66] font-extrabold text-xs group-hover:underline whitespace-nowrap">
                                          <div className="flex items-center justify-between gap-2">
                                            <span>{transId}</span>
                                            <ChevronRight size={13} className="text-slate-400 group-hover:text-[#002B66] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 border-r border-slate-200 font-mono text-xs text-slate-700 font-semibold whitespace-nowrap">{drawFormatted}</td>
                                        <td className="px-3 py-3 border-r border-slate-200 text-center font-mono font-bold text-slate-900 text-xs whitespace-nowrap">{betNo}</td>
                                        <td className="px-3 py-3 border-r border-slate-200 text-center font-mono font-bold text-slate-700 text-xs whitespace-nowrap">{betCode}</td>
                                        <td className="px-3 py-3 border-r border-slate-200 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                                          {parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-extrabold text-emerald-700 text-xs whitespace-nowrap">
                                          {parseFloat(item.winAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="block md:hidden p-3 space-y-2.5 bg-slate-50/50">
                              {items.map((item, index) => {
                                const transId = item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}`;
                                const displayAccountName = item.fullName || item.outlet || item.username || 'N/A';
                                const betNo = item.betNo || item.CombiNo || item.SoldOutCombiNo || 'N/A';
                                const betCode = item.betCode || (item.rambolito ? 'RS3' : 'TS3');
                                const drawFormatted = formatDrawTime(item.drawTime || item.draw, item.drawDate || item.created_at);

                                return (
                                  <div 
                                    key={index}
                                    onClick={() => handleRowClick(item, index)}
                                    className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs active:scale-[0.99] transition-all space-y-2.5 cursor-pointer relative overflow-hidden"
                                  >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#002B66]"></div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 pl-2">
                                      <div>
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Teller</span>
                                        <span className="text-xs font-black text-slate-800 uppercase">{displayAccountName}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Trans. ID</span>
                                        <span className="font-mono text-xs font-bold text-[#002B66]">{transId}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs pl-2 font-mono">
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Draw Schedule</span>
                                        <span className="font-semibold text-slate-800 text-[11px]">{drawFormatted}</span>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Bet & Code</span>
                                        <span className="font-bold text-slate-900">{betNo} <span className="text-slate-500 font-normal">({betCode})</span></span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 pl-2 border-t border-slate-100 font-mono">
                                      <div>
                                        <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Bet Amount</span>
                                        <span className="text-xs font-bold text-slate-700">
                                          ₱{parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[9px] font-sans font-bold text-slate-400 uppercase block">Win Liability</span>
                                        <span className="text-xs font-black text-emerald-700">
                                          ₱{parseFloat(item.winAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="bg-slate-100 px-4 py-2.5 font-black border-t border-slate-200 text-slate-900 text-xs font-mono flex items-center justify-between">
                              <span className="uppercase font-sans tracking-wider text-[11px] text-[#002B66]">Subtotal ({userKey}):</span>
                              <div className="flex items-center gap-4">
                                <span className="text-slate-700 font-bold">Bet: ₱{groupBetTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                <span className="text-emerald-700 font-extrabold">Win: ₱{groupWinTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {Boolean(Object.keys(groupedData).length) && (
                      <div className="bg-[#002B66] text-white font-black rounded-xl p-4 mt-4 border-2 border-blue-950 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
                        <span className="uppercase font-sans tracking-wider text-xs text-[#FFD700]">Grand Total Liability:</span>
                        <div className="flex items-center gap-4">
                          <span className="text-white">Bet: ₱{totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[#FFD700] text-sm">Win: ₱{totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedTicket && (() => {
        const isTransIdCopied = Boolean(
          copiedTransIds.has(String(selectedTicket.computedTransId || '').trim()) ||
          copiedTransIds.has(String(selectedTicket.transactionId || '').trim()) ||
          copiedTransIds.has(String(selectedTicket.transId || '').trim()) ||
          copiedTransIds.has(String(selectedTicket.receipt_no || '').trim()) ||
          copiedTransIds.has(String(selectedTicket.ticket_no || '').trim())
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-[#002B66] text-white px-4 sm:px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700] shrink-0">
                <div className="flex items-center gap-2.5 font-black uppercase tracking-wider text-xs truncate">
                  <Receipt size={18} className="text-[#FFD700] shrink-0" />
                  <span className="truncate">Confirm Winnings Return Entry</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer shrink-0"><X size={18} /></button>
              </div>
              
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto">
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    Please review the ticket specifications below before transferring this record into the <span className="font-bold underline">Returned Winnings Audit Ledger</span>.
                  </p>
                </div>

                {isTransIdCopied && (
                  <div className="bg-amber-100/80 border-2 border-amber-400 text-amber-900 p-3 rounded-lg flex items-center gap-2.5 font-bold animate-in fade-in duration-200">
                    <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    <span>Transaction ID copied to clipboard. <u>Execute Transfer is disabled</u> for this ticket.</span>
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
                        onClick={(e) => handleOpenQrModal(selectedTicket, e)}
                        className="font-bold text-[#002B66] underline decoration-blue-300 hover:text-blue-700 font-mono truncate cursor-pointer"
                        title="Click to view QR Code"
                      >
                        {selectedTicket.computedTransId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTransId(selectedTicket.computedTransId);
                        }}
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
                        onClick={(e) => handleOpenQrModal(selectedTicket, e)}
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
                <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 font-extrabold text-slate-700 hover:bg-slate-200 cursor-pointer uppercase text-xs transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmReturn} 
                  disabled={isSaving || isTransIdCopied} 
                  className={`w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    isTransIdCopied
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300"
                      : isSaving
                      ? "bg-[#002B66] text-white opacity-50 cursor-wait"
                      : "bg-[#002B66] hover:bg-blue-900 text-white cursor-pointer active:scale-95"
                  }`}
                  title={isTransIdCopied ? "Transfer is disabled because Transaction ID has been copied" : "Execute transfer to returned ledger"}
                >
                  <Check size={14} className={isTransIdCopied ? "text-slate-400" : "text-[#FFD700]"} />
                  <span>{isSaving ? "Processing Transfer..." : isTransIdCopied ? "Transfer Disabled (ID Copied)" : "Execute Transfer"}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dedicated Standalone Ticket QR Code Modal */}
      {isQrModalOpen && qrModalTicket && (() => {
        const isQrTicketCopied = Boolean(
          isCopied ||
          copiedTransIds.has(String(qrModalTicket.computedTransId || '').trim()) ||
          copiedTransIds.has(String(qrModalTicket.transactionId || '').trim())
        );

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
                  onClick={() => setIsQrModalOpen(false)} 
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
                    onClick={() => {
                      const id = qrModalTicket.computedTransId || qrModalTicket.transactionId;
                      handleCopyTransId(id);
                    }}
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
                  onClick={() => setIsQrModalOpen(false)} 
                  className="w-full bg-[#002B66] hover:bg-blue-900 text-white font-extrabold py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Close QR Code
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
