import {useState,useEffect,useCallback,useMemo,Fragment} from 'react';
import {Eye,EyeOff,CalendarCheck,CreditCard,Menu,X,FileText,RefreshCw,Search,CheckCircle2,AlertTriangle,ArrowLeftRight,Landmark,ShieldCheck,ChevronRight,UserCheck,Receipt,Check,AlertCircle} from 'lucide-react';
import ReturnedWinningsTab from './ReturnedWinningsTab';
import InstallmentWinningsTab from './InstallmentWinningsTab';
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
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await fetchReturnedFromSupabase();
        await fetchData();
      }
    })();
    return () => { isMounted = false; };
  }, [fetchData, fetchReturnedFromSupabase]);

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
    if (activeTab === 'returned') return;
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
      supervisor: selectedTicket.fullName || selectedTicket.outlet || null,
      tellerId: selectedTicket.tellerId || null,
      drawId: selectedTicket.drawId || null,
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
      drawDate: selectedTicket.drawDate || null
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

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-[#002B66] selection:text-white">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-md shadow-2xl flex items-center gap-2.5 border-l-4 border-[#FFD700] text-xs font-semibold animate-bounce">
          <CheckCircle2 size={16} className="text-[#FFD700]" />
          <span>{toastMessage}</span>
        </div>
      )}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#002B66] text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out border-r border-blue-950 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          <div className="p-4 border-b border-blue-900/60 flex items-center justify-between bg-[#001D47]">
            <div className="flex items-center gap-3">
              <div className="bg-[#FFD700] p-2 rounded-lg text-[#002B66] shadow-md">
                <Landmark size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xs font-extrabold tracking-wider text-white uppercase leading-tight">Lucky Betplay Corporation </h1>
                <span className="text-[9px] text-[#FFD700] font-bold uppercase tracking-widest block mt-0.5">Unclaimed Winnings</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
          <div className="px-4 py-3 bg-blue-950/50 text-[10px] font-bold text-blue-300 uppercase tracking-wider border-b border-blue-900/40 flex items-center justify-between">
            <span>Navigation Modules</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <nav className="p-3 space-y-1.5">
            {[
              { id: 'pending', label: 'Unclaimed Winnings', Icon: CalendarCheck },
              { id: 'returned', label: 'Returned Winnings', Icon: ArrowLeftRight, badge: returnedData.length },
              { id: 'installment', label: 'Installment Winnings', Icon: CreditCard }
            ].map(({ id, label, Icon, badge }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === id ? 'bg-[#FFD700] text-[#002B66] shadow-lg font-black translate-x-1' : 'hover:bg-blue-950/60 text-blue-100 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3"><Icon size={16} />{label}</div>
                {badge > 0 && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-[#002B66] text-[#FFD700]' : 'bg-emerald-600 text-white shadow-xs'}`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-3.5 border-t border-blue-900/60 bg-[#001D47] flex items-center justify-between text-[10px] text-blue-200 font-bold">
          <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#FFD700]" /> Mandaue Operations</span>
          <span className="font-mono bg-blue-950 px-2 py-0.5 rounded border border-blue-800 text-blue-300">v3.2</span>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"><Menu size={18} /></button>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shadow-xs"></div>
              <h2 className="text-xs md:text-sm font-black text-[#002B66] uppercase tracking-wider">
                {activeTab === 'pending' ? 'Unclaimed Winnings Official Registry' : 'Returned Winnings Official Audit Trail'}
              </h2>
            </div>
          </div>
          <button
            onClick={() => { fetchReturnedFromSupabase(); fetchData(); }}
            disabled={loading}
            className="flex items-center gap-2 bg-[#002B66] hover:bg-blue-900 text-white px-3.5 py-2 rounded-lg text-xs font-extrabold tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline uppercase">Synchronize Ledger</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50 flex flex-col items-center">
          <div className="w-full max-w-6xl space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {[
                  { label: 'Date From:', val: fromDate, set: setFromDate },
                  { label: 'Date To:', val: toDate, set: setToDate }
                ].map(({ label, val, set }, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <label className="text-[11px] font-extrabold text-[#002B66] uppercase tracking-wider">{label}</label>
                    <input type="date" value={val} onChange={(e) => set(e.target.value)} className="bg-transparent text-slate-900 text-xs font-mono font-bold outline-none cursor-pointer" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Unclaimed Records', val: totals.count, Icon: FileText, border: 'border-l-4 border-l-[#002B66]', text: 'text-[#002B66]', bg: 'bg-blue-50' },
                { label: 'Total Bet Volume', val: `₱${totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: AlertTriangle, border: 'border-l-4 border-l-[#FFD700]', text: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Total Winning Liability', val: `₱${totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, Icon: CheckCircle2, border: 'border-l-4 border-l-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50' }
              ].map(({ label, val, Icon, border, text, bg }, i) => (
                <div key={i} className={`bg-white p-4 rounded-xl border border-slate-200 ${border} shadow-xs flex items-center justify-between transition-transform hover:-translate-y-0.5`}>
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none">{label}</p>
                    <p className="text-lg font-black font-mono mt-1.5 text-slate-900 leading-tight">{val}</p>
                  </div>
                  <div className={`p-3 rounded-xl border border-slate-100 ${bg} ${text}`}><Icon size={20} /></div>
                </div>
              ))}
            </div>
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}
            {activeTab === 'returned' ? (
              <ReturnedWinningsTab 
              groupedData={groupedData}
              filteredData={filteredData}
              rawApiData={data} 
              isLoadingApi={loading} 
              formatDrawTime={formatDrawTime} 
              onDeleteRecord={handleDeleteFromSupabase} />
            ): activeTab === 'installment' ? (
            <InstallmentWinningsTab 
              groupedData={groupedData} 
              filteredData={filteredData} 
              rawApiData={data} 
              isLoadingApi={loading} 
              formatDrawTime={formatDrawTime} 
              onUpdateInstallment={fetchReturnedFromSupabase} 
            />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mx-auto w-full">
                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-[#002B66]/5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-extrabold text-[#002B66] text-xs uppercase tracking-wider">Unclaimed Winnings Summary</h3>
                    <span className="text-[10px] font-bold bg-[#002B66] text-[#FFD700] px-2 py-0.5 rounded font-mono shadow-2xs">{activeDisplayDate}</span>
                  </div>
                  <button onClick={() => setShowDailyTable(!showDailyTable)} className="text-slate-500 hover:text-[#002B66] p-1 rounded-lg hover:bg-slate-200/50 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    {showDailyTable ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span>{showDailyTable ? "Hide Table" : "Show Table"}</span>
                  </button>
                </div>
                {showDailyTable && (
                  <div className="overflow-x-auto flex justify-center">
                    <table className="w-full max-w-5xl text-left border-collapse my-2 shadow-xs rounded-lg overflow-hidden">
                      <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                        {loading ? (
                          <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">Loading ledger data...</td></tr>
                        ) : !Object.keys(groupedData).length ? (
                          <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">No unclaimed records registered for the selected date.</td></tr>
                        ) : (
                          Object.entries(groupedData).map(([userKey, items]) => {
                            const groupBetTotal = items.reduce((sum, item) => sum + parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0), 0);
                            const groupWinTotal = items.reduce((sum, item) => sum + parseFloat(item.winAmount ?? 0), 0);
                            return (
                              <Fragment key={userKey}>
                                <tr className="bg-slate-100 border-t-2 border-slate-300">
                                  <td colSpan="7" className="px-4 py-2 font-black text-[#002B66] text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                                    <UserCheck size={14} className="text-[#002B66]" />
                                    <span>Supervisor / Outlet Account: {userKey}</span>
                                  </td>
                                </tr>
                                <tr className="bg-[#002B66] text-white text-[10px] font-black uppercase tracking-wider">
                                  <th className="px-3 py-2 border-r border-blue-950 w-1/4">Teller</th>
                                  <th className="px-3 py-2 border-r border-blue-950">Trans. ID</th>
                                  <th className="px-3 py-2 border-r border-blue-950">Draw</th>
                                  <th className="px-3 py-2 border-r border-blue-950 text-center">Bet No.</th>
                                  <th className="px-3 py-2 border-r border-blue-950 text-center">Bet Code</th>
                                  <th className="px-3 py-2 border-r border-blue-950 text-right">Bet Amount</th>
                                  <th className="px-3 py-2 text-right">Win Amount</th>
                                </tr>
                                {items.map((item, index) => {
                                  const transId = item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}`;
                                  const displayAccountName = item.fullName || item.outlet || item.username || 'N/A';
                                  const betNo = item.betNo || item.CombiNo || item.SoldOutCombiNo || 'N/A';
                                  const betCode = item.betCode || (item.rambolito ? 'RS3' : 'TS3');
                                  const drawFormatted = formatDrawTime(item.drawTime || item.draw, item.drawDate || item.created_at);
                                  return (
                                    <tr
                                      key={index}
                                      className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-amber-50/80 cursor-pointer group border-b border-slate-100"
                                      onClick={() => handleRowClick(item, index)}
                                      title="Click row to process return"
                                    >
                                      <td className="px-3 py-2 border-r border-slate-200 font-bold text-slate-800 uppercase text-xs">{displayAccountName}</td>
                                      <td className="px-3 py-2 border-r border-slate-200 font-mono text-[#002B66] font-extrabold text-xs group-hover:underline">
                                        <div className="flex items-center justify-between">
                                          <span>{transId}</span>
                                          <ChevronRight size={13} className="text-slate-400 group-hover:text-[#002B66] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 border-r border-slate-200 font-mono text-xs text-slate-700 font-semibold">{drawFormatted}</td>
                                      <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900 text-xs">{betNo}</td>
                                      <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700 text-xs">{betCode}</td>
                                      <td className="px-3 py-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 text-xs">
                                        {parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-3 py-2 text-right font-mono font-extrabold text-emerald-700 text-xs">
                                        {parseFloat(item.winAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-slate-100 font-black border-t border-slate-200 text-slate-900 text-xs font-mono">
                                  <td colSpan="5" className="px-3 py-2 text-right uppercase font-sans tracking-wider text-[11px] text-[#002B66] border-r border-slate-200">Subtotal :</td>
                                  <td className="px-3 py-2 text-right border-r border-slate-200">{groupBetTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                  <td className="px-3 py-2 text-right text-emerald-700 font-extrabold">{groupWinTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                </tr>
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                      {Boolean(Object.keys(groupedData).length) && (
                        <tfoot>
                          <tr className="bg-[#002B66] text-white font-black border-t-2 border-blue-950 text-xs font-mono">
                            <td colSpan="5" className="px-3 py-3 text-right uppercase font-sans tracking-wider text-xs text-[#FFD700]">Grand Total Liability :</td>
                            <td className="px-3 py-3 text-right border-r border-blue-900">₱{totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="px-3 py-3 text-right text-[#FFD700] font-extrabold text-sm">₱{totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002B66] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700]">
              <div className="flex items-center gap-2.5 font-black uppercase tracking-wider text-xs">
                <Receipt size={18} className="text-[#FFD700]" />
                <span>Confirm Winnings Return Entry</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">
                  Please review the ticket specifications below before transferring this record into the <span className="font-bold underline">Returned Winnings Audit Ledger</span>.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 font-mono text-xs">
                {[
                  { l: 'Assigned Username:', v: selectedTicket.username ? `@${selectedTicket.username}` : 'N/A', b: true, c: 'text-[#002B66]' },
                  { l: 'Full Name / Outlet:', v: selectedTicket.fullName || selectedTicket.outlet || 'N/A', b: true },
                  { l: 'Transaction ID:', v: selectedTicket.computedTransId, b: true, c: 'text-[#002B66]' },
                  { l: 'Draw Schedule:', v: formatDrawTime(selectedTicket.drawTime || selectedTicket.draw, selectedTicket.drawDate), b: true },
                  { l: 'Bet Combination:', v: `${selectedTicket.betNo || selectedTicket.CombiNo || 'N/A'} (${selectedTicket.betCode || (selectedTicket.rambolito ? 'RS3' : 'TS3')})`, b: true },
                  { l: 'Bet Amount:', v: `₱${parseFloat(selectedTicket.betAmount ?? selectedTicket.amount ?? 0).toFixed(2)}`, b: true },
                  { l: 'Win Liability:', v: `₱${parseFloat(selectedTicket.winAmount ?? 0).toFixed(2)}`, b: true, c: 'text-emerald-700 font-bold text-sm' }
                ].map(({ l, v, b, c }, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-200/60 pb-1.5 last:border-b-0">
                    <span className="text-slate-500 font-sans text-[11px] font-bold uppercase">{l}</span>
                    <span className={`${b ? 'font-bold' : ''} ${c || 'text-slate-800'}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-4 py-2 rounded-lg border border-slate-300 font-extrabold text-slate-700 hover:bg-slate-200 cursor-pointer uppercase text-xs transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmReturn} disabled={isSaving} className="px-5 py-2 rounded-lg bg-[#002B66] hover:bg-blue-900 text-white font-black cursor-pointer uppercase text-xs flex items-center gap-2 disabled:opacity-50 shadow-md transition-all active:scale-95">
                <Check size={14} className="text-[#FFD700]" />
                <span>{isSaving ? "Processing Transfer..." : "Execute Transfer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}