import {useState, useEffect, useCallback, useMemo} from 'react';
import {Eye, EyeOff, RefreshCw, CheckCircle2, ChevronRight, UserCheck, Check, AlertCircle, AlertTriangle, Image as ImageIcon} from 'lucide-react';
import {toPng} from 'html-to-image';
import ReturnedWinningsTab from './ReturnedWinningsTab';
import SettlementAgreementTab from './SettlementAgreementTab';
import MessengerTab from './MessengerTab';
import FloatingMessengerChat from './FloatingMessengerChat';
import AgentMascotAvatar from './AgentMascotAvatar';
import AgentVerificationChatbot from './AgentVerificationChatbot';
import { MessengerProvider } from './context/MessengerContext';
import Login from './Login'; // <--- Import ang iyong Login component
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import ConfirmReturnModal from './ConfirmReturnModal';
import TicketQrModal from './TicketQrModal';
import IncidentReportModal from './IncidentReportModal';
import {formatDrawTime, getLocalDateString, parseToDateString} from './utils/dateFormatting';
import {getTicketAgeInDays, isIncidentReportEligible} from './utils/ticketAge';

import {supabase} from './supabaseClient';

const CONFIG = {
  mandaue_unclaimed: {
    baseUrl: "https://stl-mandaue-api.com",
    token: "Bearer 2860|OCyU72t1DzxdBeSjj3izVKCIcCwHkqNbwjRlxHp5",
    isClaim: 0
  }
};

const PERSISTED_USER_KEY = 'stl-mandaue-current-user';

const getPersistedUser = () => {
  try {
    const savedUser = localStorage.getItem(PERSISTED_USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    localStorage.removeItem(PERSISTED_USER_KEY);
    return null;
  }
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(getPersistedUser);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem(PERSISTED_USER_KEY);
    setCurrentUser(null);
  };

  // App Dashboard States
  const [activeTab, setActiveTab] = useState('pending');
  const todayStr = getLocalDateString();
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [claimedData, setClaimedData] = useState([]);
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
  const [openedQrTransIds, setOpenedQrTransIds] = useState(() => new Set());
  const [isCapturingImage, setIsCapturingImage] = useState(null);
  const [copiedSupervisorKey, setCopiedSupervisorKey] = useState(null);
  const [incidentReportTicket, setIncidentReportTicket] = useState(null);
  const [floatingChatContactId, setFloatingChatContactId] = useState(null);
  const [isAgentBotOpen, setIsAgentBotOpen] = useState(false);

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

  const handleCopySupervisorImage = async (userKey) => {
    if (!userKey) return;
    setIsCapturingImage(userKey);
    try {
      const element = document.getElementById(`supervisor-table-capture-${userKey}`);
      if (!element) throw new Error("Supervisor table element not found");

      // Use toPng with explicit dimensions and pixelRatio
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!dataUrl) throw new Error("Could not generate image data");

      // Convert dataUrl to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      let copiedToClipboard = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedToClipboard = true;
        } catch (clipErr) {
          console.warn("ClipboardItem write failed, falling back to download:", clipErr);
        }
      }

      if (copiedToClipboard) {
        setCopiedSupervisorKey(userKey);
        setTimeout(() => setCopiedSupervisorKey(null), 2500);
        showToast(`Copied table image for Supervisor ${userKey} to clipboard!`);
      } else {
        const link = document.createElement('a');
        link.download = `Supervisor_${userKey}_Unclaimed_${getLocalDateString()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setCopiedSupervisorKey(userKey);
        setTimeout(() => setCopiedSupervisorKey(null), 2500);
        showToast(`Table image for Supervisor ${userKey} downloaded!`);
      }
    } catch (err) {
      console.error("Error capturing table image:", err);
      alert(`Unable to copy table image: ${err.message}`);
    } finally {
      setIsCapturingImage(null);
    }
  };

  const handleOpenQrModal = (ticket, e) => {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    if (!ticket) return;
    const computedId = ticket.computedTransId || ticket.transactionId || ticket.transId || ticket.receipt_no || ticket.ticket_no || 'N/A';
    const strId = String(computedId).trim();
    if (strId && strId !== 'N/A') {
      setOpenedQrTransIds(prev => new Set(prev).add(strId));
    }
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
      
      // Fetch Unclaimed Receipts (isClaim=0)
      const resUnclaimed = await fetch(`${cfg.baseUrl}/api/accountant/UnclaimedReceipts?isClaim=0&from=${apiFromDate}&to=${apiToDate}`, {
        method: 'GET',
        headers: {
          'Authorization': cfg.token,
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      });
      if (resUnclaimed.ok) {
        const result = await resUnclaimed.json();
        const deepData = result?.data?.data || result?.data || result;
        setData(Array.isArray(deepData) ? deepData : deepData && typeof deepData === 'object' ? [deepData] : []);
      }

      // Fetch Claimed Receipts (isClaim=1) for verification database
      try {
        const resClaimed = await fetch(`${cfg.baseUrl}/api/accountant/UnclaimedReceipts?isClaim=1&from=${apiFromDate}&to=${apiToDate}`, {
          method: 'GET',
          headers: {
            'Authorization': cfg.token,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          }
        });
        if (resClaimed.ok) {
          const resultClaimed = await resClaimed.json();
          const deepClaimed = resultClaimed?.data?.data || resultClaimed?.data || resultClaimed;
          setClaimedData(Array.isArray(deepClaimed) ? deepClaimed : deepClaimed && typeof deepClaimed === 'object' ? [deepClaimed] : []);
        }
      } catch (claimErr) {
        console.warn("Claimed receipts fetch error:", claimErr);
      }
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

  const handleIssueIncidentReport = (item, index, event) => {
    event.stopPropagation();
    const computedTransId = item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}`;
    setIncidentReportTicket({ ...item, computedTransId });
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
      const settlementTerms = agreementData.settlementTerms || JSON.stringify({
        reason: agreementData.reason,
        installments: agreementData.installments
      });
      const { error } = await supabase
        .from('returned_winnings')
        .update({ 
          isUnderSettlement: true,
          settlementTerms,
          settlementStatus: agreementData.settlementStatus || 'PENDING',
          totalInstallmentAmount: agreementData.totalInstallmentAmount || null
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
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Kung NAKA-LOGIN na, i-render ang buong Dashboard
  return (
    <MessengerProvider currentUser={currentUser}>
      <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-[#002B66] selection:text-white overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border-l-4 border-[#FFD700] text-xs font-semibold animate-bounce max-w-sm sm:max-w-md mx-auto print:hidden">
          <CheckCircle2 size={16} className="text-[#FFD700] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      <div className="print:hidden h-full shrink-0">
        <DashboardSidebar
          activeTab={activeTab}
          currentUser={currentUser}
          returnedCount={returnedData.length}
          isSidebarOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full print:hidden">
        <div className="print:hidden">
          <DashboardHeader
            activeTab={activeTab}
            loading={loading}
            fromDate={fromDate}
            toDate={toDate}
            searchQuery={searchQuery}
            totals={totals}
            currentUser={currentUser}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onSync={() => { fetchReturnedFromSupabase(); fetchData(); }}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onSearchChange={setSearchQuery}
            onOpenFullMessenger={() => setActiveTab('messenger')}
            onOpenFloatingChat={(contactId) => setFloatingChatContactId(contactId || 'cashier-main')}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-7 space-y-5 bg-slate-50 flex flex-col items-center print:overflow-visible print:bg-white print:p-0 print:space-y-0 print:block">
          <div className="w-full max-w-6xl space-y-5">
            
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" /> <span className="break-words">{errorMsg}</span>
              </div>
            )}

            {activeTab === 'messenger' ? (
              <MessengerTab
                currentUser={currentUser || { username: 'staff', full_name: 'Current Staff', role: 'Staff' }}
              />
            ) : activeTab === 'settlement' ? (
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
                <div className="px-4 py-4 sm:px-5 border-b border-slate-200 flex justify-between items-center bg-[#002B66]/5">
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
                  <div className="w-full p-3 sm:p-5 bg-slate-50/50">
                    {loading ? (
                      <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs bg-white rounded-xl border border-slate-200">Loading ledger data...</div>
                    ) : !Object.keys(groupedData).length ? (
                      <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs bg-white rounded-xl border border-slate-200">No unclaimed records registered for the selected date.</div>
                    ) : (
                      Object.entries(groupedData).map(([userKey, items]) => {
                        const groupBetTotal = items.reduce((sum, item) => sum + parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0), 0);
                        const groupWinTotal = items.reduce((sum, item) => sum + parseFloat(item.winAmount ?? 0), 0);
                        return (
                          <div key={userKey} id={`supervisor-card-${userKey}`} className="w-full mb-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 font-black text-[#002B66] text-xs uppercase tracking-wider font-mono flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-2 truncate">
                                <UserCheck size={14} className="text-[#002B66] shrink-0" />
                                <span className="truncate">Supervisor / Outlet: {userKey}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-blue-100 text-[#002B66] px-2 py-0.5 rounded shrink-0">{items.length} items</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopySupervisorImage(userKey);
                                  }}
                                  disabled={isCapturingImage === userKey}
                                  className="flex items-center gap-1.5 bg-[#002B66] hover:bg-blue-900 text-[#FFD700] text-[10px] font-black px-2.5 py-1 rounded-md shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                  title={`Copy ${userKey} table as image`}
                                >
                                  {isCapturingImage === userKey ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin" />
                                      <span>Capturing...</span>
                                    </>
                                  ) : copiedSupervisorKey === userKey ? (
                                    <>
                                      <Check size={12} className="text-emerald-400" />
                                      <span>Image Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon size={12} />
                                      <span>Copy Image</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Dedicated container for 100% pixel-perfect table image capture */}
                            <div 
                              id={`supervisor-table-capture-${userKey}`} 
                              style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '960px',
                                zIndex: -9999,
                                pointerEvents: 'none',
                                backgroundColor: '#ffffff',
                                padding: '16px'
                              }}
                            >
                              <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <UserCheck size={18} color="#002B66" />
                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#002B66', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      SUPERVISOR / OUTLET: {userKey}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '11px', fontWeight: 900, backgroundColor: '#e0f2fe', color: '#002B66', padding: '3px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                    {items.length} ITEMS
                                  </span>
                                </div>

                                {/* Table */}
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: '#ffffff' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#002B66', color: '#ffffff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', width: '20%' }}>TELLER</th>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', width: '20%' }}>TRANS. ID</th>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', width: '18%' }}>DRAW</th>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', textAlign: 'center', width: '10%' }}>BET NO.</th>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', textAlign: 'center', width: '10%' }}>CODE</th>
                                      <th style={{ padding: '10px 14px', borderRight: '1px solid #001f4d', textAlign: 'right', width: '11%' }}>BET AMOUNT</th>
                                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '11%' }}>WIN AMOUNT</th>
                                    </tr>
                                  </thead>
                                  <tbody style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                                    {items.map((item, index) => {
                                      const transId = item.transactionId || item.transId || item.receipt_no || item.ticket_no || `REC-${index + 1}`;
                                      const displayAccountName = item.fullName || item.outlet || item.username || 'N/A';
                                      const betNo = item.betNo || item.CombiNo || item.SoldOutCombiNo || 'N/A';
                                      const betCode = item.betCode || (item.rambolito ? 'RS3' : 'TS3');
                                      const drawFormatted = formatDrawTime(item.drawTime || item.draw, item.drawDate || item.created_at);
                                      const isEven = index % 2 === 1;
                                      return (
                                        <tr key={index} style={{ backgroundColor: isEven ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>{displayAccountName}</td>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#002B66', fontWeight: 900 }}>{transId}</td>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace', color: '#334155', fontWeight: 700 }}>{drawFormatted}</td>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, color: '#0f172a' }}>{betNo}</td>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>{betCode}</td>
                                          <td style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                                            {parseFloat(item.betAmount ?? item.amount ?? item.gross ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                          </td>
                                          <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#047857' }}>
                                            {parseFloat(item.winAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                {/* Footer Subtotal */}
                                <div style={{ backgroundColor: '#f8fafc', padding: '12px 18px', fontWeight: 900, borderTop: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#002B66', fontWeight: 900 }}>SUBTOTAL ({userKey}):</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <span style={{ color: '#334155', fontWeight: 800 }}>Bet: ₱{groupBetTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                    <span style={{ color: '#047857', fontWeight: 900, fontSize: '13px' }}>Win: ₱{groupWinTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="hidden md:block w-full overflow-x-auto">
                              <table className="w-full min-w-[900px] text-left border-collapse bg-white">
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
                                        className={`transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-amber-50/85 cursor-pointer group border-b border-slate-100 ${isIncidentReportEligible(item) ? 'bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-600' : ''}`}
                                        onClick={() => handleRowClick(item, index)}
                                        title="Click row to process return"
                                      >
                                        <td className="px-3 py-3 border-r border-slate-200 font-bold text-slate-800 uppercase text-xs whitespace-nowrap">
                                          <div className="flex items-center gap-2">
                                            <span>{displayAccountName}</span>
                                            {isIncidentReportEligible(item) && (
                                              <button type="button" onClick={(event) => handleIssueIncidentReport(item, index, event)} className="inline-flex items-center rounded-full bg-rose-100 p-1 text-rose-700 hover:bg-rose-600 hover:text-white cursor-pointer" title={`Issue incident report (${getTicketAgeInDays(item)} days old)`} aria-label="Issue incident report">
                                                <AlertTriangle size={12} />
                                              </button>
                                            )}
                                          </div>
                                        </td>
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

                            <div className="block md:hidden p-4 space-y-3 bg-slate-50/50">
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
                                    {isIncidentReportEligible(item) && (
                                      <button type="button" onClick={(event) => handleIssueIncidentReport(item, index, event)} className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-700 hover:bg-rose-600 hover:text-white cursor-pointer">
                                        <span className="inline-flex items-center gap-1.5"><AlertTriangle size={13} /> Issue Incident Report ({getTicketAgeInDays(item)} days)</span>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="bg-slate-100 px-4 py-3 font-black border-t border-slate-200 text-slate-900 text-xs font-mono flex items-center justify-between">
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
                      <div className="w-full bg-[#002B66] text-white font-black rounded-xl p-5 mt-5 border-2 border-blue-950 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
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

      {incidentReportTicket && (
        <IncidentReportModal
          ticket={incidentReportTicket}
          onClose={() => setIncidentReportTicket(null)}
        />
      )}

      {isModalOpen && selectedTicket && (
        <ConfirmReturnModal
          selectedTicket={selectedTicket}
          isTransIdCopied={Boolean(
            copiedTransIds.has(String(selectedTicket.computedTransId || '').trim()) ||
            copiedTransIds.has(String(selectedTicket.transactionId || '').trim()) ||
            copiedTransIds.has(String(selectedTicket.transId || '').trim()) ||
            copiedTransIds.has(String(selectedTicket.receipt_no || '').trim()) ||
            copiedTransIds.has(String(selectedTicket.ticket_no || '').trim())
          )}
          isQrOpened={Boolean(
            openedQrTransIds.has(String(selectedTicket.computedTransId || '').trim()) ||
            openedQrTransIds.has(String(selectedTicket.transactionId || '').trim()) ||
            openedQrTransIds.has(String(selectedTicket.transId || '').trim()) ||
            openedQrTransIds.has(String(selectedTicket.receipt_no || '').trim()) ||
            openedQrTransIds.has(String(selectedTicket.ticket_no || '').trim())
          )}
          isSaving={isSaving}
          onClose={() => setIsModalOpen(false)}
          onOpenQrModal={(event) => handleOpenQrModal(selectedTicket, event)}
          onCopyTransId={(event) => {
            if (event) event.stopPropagation();
            handleCopyTransId(selectedTicket.computedTransId);
          }}
          onConfirmReturn={handleConfirmReturn}
          formatDrawTime={formatDrawTime}
        />
      )}

      {isQrModalOpen && qrModalTicket && (
        <TicketQrModal
          qrModalTicket={qrModalTicket}
          isQrTicketCopied={Boolean(
            isCopied ||
            copiedTransIds.has(String(qrModalTicket.computedTransId || '').trim()) ||
            copiedTransIds.has(String(qrModalTicket.transactionId || '').trim())
          )}
          onClose={() => setIsQrModalOpen(false)}
          onCopyTransId={() => handleCopyTransId(qrModalTicket.computedTransId || qrModalTicket.transactionId)}
          formatDrawTime={formatDrawTime}
        />
      )}

      {/* Floating Facebook-Style Messenger Chat Popup */}
      {floatingChatContactId && (
        <FloatingMessengerChat
          contactId={floatingChatContactId}
          currentUser={currentUser}
          onClose={() => setFloatingChatContactId(null)}
          onOpenFullMessenger={() => {
            setFloatingChatContactId(null);
            setActiveTab('messenger');
          }}
        />
      )}

      {/* Floating Mascot Agent Character on the Right Side (Separate from Messenger) */}
      <AgentMascotAvatar
        isOpen={isAgentBotOpen}
        onClick={() => setIsAgentBotOpen(!isAgentBotOpen)}
        unclaimedCount={pendingFilteredData.length}
      />

      {/* Floating Dedicated Receipt & Ticket Verification Chatbot Window */}
      <AgentVerificationChatbot
        isOpen={isAgentBotOpen}
        onClose={() => setIsAgentBotOpen(false)}
        rawApiData={data}
        unclaimedList={pendingFilteredData}
        claimedList={claimedData}
        returnedList={returnedData}
        currentUser={currentUser || { username: 'staff', full_name: 'Current Staff', role: 'Staff' }}
        onOpenQrModal={(ticket) => handleOpenQrModal(ticket)}
        onIssueIncidentReport={(ticket) => setIncidentReportTicket(ticket)}
        onCopyTransId={(id) => handleCopyTransId(id)}
      />
    </div>
  </MessengerProvider>
  );
}
