import { useState, useMemo, Fragment } from 'react';
import { UserCheck, CheckCircle, Trash2, Clock, AlertTriangle, X, Download } from 'lucide-react';

export default function ReturnedWinningsTab({ 
  groupedData = {}, 
  filteredData = [], 
  rawApiData = [], 
  isLoadingApi = false,
  formatDrawTime, 
  onDeleteRecord 
}) {
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const superClean = (val) => String(val || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Fast Lookup Map para sa O(1) Trans ID Verification
  const { activeApiTransIds, activeApiComposites, hasLoadedApi } = useMemo(() => {
    const transIds = new Set();
    const composites = new Set();
    const isAvailable = Array.isArray(rawApiData) && rawApiData.length > 0;

    if (isAvailable) {
      rawApiData.forEach(item => {
        [
          item.transactionId, item.transId, item.transaction_id, item.receipt_no, 
          item.ticket_no, item.trans_id, item.TransID, item.ref_no, item.ticketNo, 
          item.ticket_number, item.id, item.apiId
        ].forEach(id => id && transIds.add(superClean(id)));

        const betNo = superClean(item.betNo || item.bet_no || item.number || '');
        const winAmt = parseFloat(item.winAmount ?? item.win_amount ?? 0);
        if (betNo && winAmt > 0) composites.add(`${betNo}_${winAmt}`);
      });
    }

    return { 
      activeApiTransIds: transIds, 
      activeApiComposites: composites,
      hasLoadedApi: isAvailable 
    };
  }, [rawApiData]);

  const checkIsInSourceApi = (item, transId) => {
    if (isLoadingApi || !hasLoadedApi) {
      return true; 
    }

    const cleanTrans = superClean(transId);
    const cleanBet = superClean(item.betNo || '');
    const winAmt = parseFloat(item.winAmount ?? 0);

    const existsInApi = activeApiTransIds.has(cleanTrans) ||
                        (item.id && activeApiTransIds.has(superClean(item.id))) ||
                        (item.apiId && activeApiTransIds.has(superClean(item.apiId))) ||
                        activeApiComposites.has(`${cleanBet}_${winAmt}`);

    if (existsInApi) return true;

    if (item.created_at) {
      const createdTime = new Date(item.created_at).getTime();
      const now = new Date().getTime();
      if (!isNaN(createdTime) && (now - createdTime) < 10 * 60 * 1000) {
        return true; 
      }
    }

    return false;
  };

  // Compact timestamp format para magkasya sa isang linya (e.g., Aug 23, 2026, 9:36 PM)
  const formatTimestamp = (timestampStr) => {
    if (!timestampStr) return 'N/A';
    try {
      const d = new Date(timestampStr);
      if (isNaN(d.getTime())) return timestampStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestampStr;
    }
  };

  const confirmAndDelete = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteRecord) await onDeleteRecord(selectedForDelete);
    } catch (err) { 
      console.error("Delete failed:", err); 
    } finally { 
      setIsDeleting(false); 
      setSelectedForDelete(null); 
    }
  };

  const exportToCSV = () => {
    if (!filteredData?.length) return alert("Walang data na pwedeng i-download.");
    const headers = ["Username", "Teller / Outlet", "Transaction ID", "Draw Time", "Bet No", "Bet Code", "Bet Amount", "Win Amount", "Date Returned", "Status"];
    const rows = filteredData.map(item => {
      const transId = item.transactionId || 'N/A';
      const isStillInSourceApi = checkIsInSourceApi(item, transId);
      const isUnderSettlement = Boolean(item.isUnderSettlement);
      const timestampVal = item.updated_at || item.created_at || 'N/A';
      
      const status = isUnderSettlement 
        ? "UNDER SETTLEMENT" 
        : (isStillInSourceApi ? "RETURNED / UNCLAIMED" : "ALREADY CLAIMED");

      return [
        `"${item.username || 'N/A'}"`, `"${item.fullName || item.outlet || 'N/A'}"`, `"${transId}"`,
        `"${formatDrawTime ? formatDrawTime(item.drawTime || item.drawDate || 'N/A') : item.drawTime || 'N/A'}"`,
        `"${item.betNo || 'N/A'}"`, `"${item.betCode || 'RS3'}"`,
        parseFloat(item.betAmount ?? 0).toFixed(2), parseFloat(item.winAmount ?? 0).toFixed(2),
        `"${timestampVal}"`, `"${status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Returned_Winnings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
  <div className="bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden w-full">
    
    {/* DESKTOP VIEW: Table format (Makikita lang sa medium screens pataas) */}
    <div className="hidden md:block overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-[#003366] text-white text-[11px] font-bold uppercase tracking-wider border-b border-slate-300">
            {['Teller / Outlet', 'Trans. ID', 'Draw', 'Bet No.', 'Bet Code', 'Bet Amount', 'Win Amount', 'Date Returned', 'Status', 'Action'].map((h, i) => (
              <th key={h} className={`px-3 py-2.5 border-r border-blue-900 whitespace-nowrap ${i >= 2 && i <= 4 || i >= 8 ? 'text-center' : i >= 5 && i <= 6 ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700">
          {Object.keys(groupedData).length > 0 ? (
            Object.entries(groupedData).map(([username, items]) => {
              const subtotalBet = items.reduce((sum, i) => sum + parseFloat(i.betAmount ?? 0), 0);
              const subtotalWin = items.reduce((sum, i) => sum + parseFloat(i.winAmount ?? 0), 0);

              return (
                <Fragment key={username}>
                  <tr className="bg-slate-200/80 border-y border-slate-300">
                    <td colSpan="10" className="px-3 py-2 font-bold text-[#003366] text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-emerald-600 shrink-0" />
                        <span>USER / ACCOUNT: @{username}</span>
                      </div>
                    </td>
                  </tr>

                  {items.map((item, i) => {
                    const transId = item.transactionId || `REC-${i + 1}`;
                    const isStillInSourceApi = checkIsInSourceApi(item, transId);
                    const isClaimedInSourceSystem = !isStillInSourceApi;
                    const isUnderSettlement = Boolean(item.isUnderSettlement);
                    const recordTimestamp = item.updated_at || item.created_at;

                    return (
                      <tr key={item.id || item.apiId || transId || i} className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-slate-100/80">
                        <td className="px-3 py-2 border-r border-slate-200 font-semibold text-slate-800 uppercase whitespace-nowrap">{item.fullName || item.outlet || 'N/A'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 font-mono text-[#003366] font-semibold whitespace-nowrap">{transId}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-mono text-[11px] whitespace-nowrap">{formatDrawTime ? formatDrawTime(item.drawTime || item.drawDate || item.created_at || 'N/A') : 'N/A'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-800 whitespace-nowrap">{item.betNo || 'N/A'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-mono text-slate-600 whitespace-nowrap">{item.betCode || 'RS3'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 whitespace-nowrap">₱{parseFloat(item.betAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">₱{parseFloat(item.winAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-mono text-[10px] text-slate-600 whitespace-nowrap">
                          {formatTimestamp(recordTimestamp)}
                        </td>

                        <td className="px-3 py-2 border-r border-slate-200 text-center whitespace-nowrap">
                          {isUnderSettlement ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                              <Clock size={10} /> UNDER SETTLEMENT
                            </span>
                          ) : isClaimedInSourceSystem ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle size={10} /> ALREADY CLAIMED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-300">
                              <Clock size={10} /> RETURNED / UNCLAIMED
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {isClaimedInSourceSystem && !isUnderSettlement ? (
                            <button onClick={() => setSelectedForDelete({ ...item, computedTransId: transId })} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 hover:border-rose-600 rounded-xs transition-all cursor-pointer">
                              <Trash2 size={12} /> Delete
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">{isUnderSettlement ? 'Settled' : 'Active in API'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-emerald-50/80 font-bold border-b border-slate-300 text-xs">
                    <td colSpan="5" className="px-3 py-1.5 text-right uppercase text-slate-600">TOTAL RETURNED:</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[#003366] border-r border-slate-300 whitespace-nowrap">₱{subtotalBet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-emerald-800 border-r border-slate-300 whitespace-nowrap" colSpan="4">₱{subtotalWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </Fragment>
              );
            })
          ) : (
            <tr><td colSpan="10" className="px-3 py-12 text-center text-slate-500 font-semibold uppercase text-xs">No returned tickets found in database.</td></tr>
          )}
        </tbody>
      </table>
    </div>

    {/* MOBILE VIEW: Card Stack format (Makikita lang sa mobile phone) */}
    <div className="block md:hidden p-3 space-y-3 bg-slate-50">
      {Object.keys(groupedData).length > 0 ? (
        Object.entries(groupedData).map(([username, items]) => {
          const subtotalBet = items.reduce((sum, i) => sum + parseFloat(i.betAmount ?? 0), 0);
          const subtotalWin = items.reduce((sum, i) => sum + parseFloat(i.winAmount ?? 0), 0);

          return (
            <div key={username} className="space-y-2">
              {/* Group / User Header */}
              <div className="bg-slate-200 border border-slate-300 px-3 py-2 rounded-xs flex items-center justify-between text-xs font-bold text-[#003366] uppercase">
                <div className="flex items-center gap-1.5 truncate">
                  <UserCheck size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">@{username}</span>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-300 shrink-0">{items.length} items</span>
              </div>

              {/* Individual Item Cards */}
              {items.map((item, i) => {
                const transId = item.transactionId || `REC-${i + 1}`;
                const isStillInSourceApi = checkIsInSourceApi(item, transId);
                const isClaimedInSourceSystem = !isStillInSourceApi;
                const isUnderSettlement = Boolean(item.isUnderSettlement);
                const recordTimestamp = item.updated_at || item.created_at;

                return (
                  <div key={item.id || item.apiId || transId || i} className="bg-white border border-slate-300 rounded-xs p-3 space-y-2.5 shadow-2xs relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#003366]"></div>
                    
                    <div className="flex justify-between items-start gap-2 pl-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Teller / Outlet</span>
                        <span className="text-xs font-bold text-slate-800 uppercase">{item.fullName || item.outlet || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Trans. ID</span>
                        <span className="font-mono text-xs font-bold text-[#003366]">{transId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pl-2 font-mono">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Draw Schedule</span>
                        <span className="text-[11px] text-slate-700 font-semibold">{formatDrawTime ? formatDrawTime(item.drawTime || item.drawDate || item.created_at || 'N/A') : 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Bet & Code</span>
                        <span className="font-bold text-slate-900">{item.betNo || 'N/A'} <span className="text-slate-500 font-normal">({item.betCode || 'RS3'})</span></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-2 pt-1 font-mono border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Bet Amount</span>
                        <span className="font-bold text-slate-800">₱{parseFloat(item.betAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-sans font-bold text-slate-400 block uppercase">Win Liability</span>
                        <span className="font-extrabold text-emerald-700">₱{parseFloat(item.winAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-2 pt-2 border-t border-slate-100 text-[10px]">
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">Date Returned</span>
                        <span className="font-mono text-slate-600">{formatTimestamp(recordTimestamp)}</span>
                      </div>
                      <div>
                        {isUnderSettlement ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-300">
                            <Clock size={9} /> SETTLEMENT
                          </span>
                        ) : isClaimedInSourceSystem ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle size={9} /> CLAIMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[9px] px-2 py-0.5 rounded-full border border-blue-300">
                            <Clock size={9} /> UNCLAIMED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action button sa mobile card */}
                    <div className="flex items-center justify-between pl-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 italic">
                        {isClaimedInSourceSystem && !isUnderSettlement ? '' : (isUnderSettlement ? 'Settled record' : 'Active in API')}
                      </span>
                      {isClaimedInSourceSystem && !isUnderSettlement && (
                        <button onClick={() => setSelectedForDelete({ ...item, computedTransId: transId })} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-xs transition-all cursor-pointer">
                          <Trash2 size={13} /> Delete Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Group Subtotal for Mobile */}
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xs font-mono text-xs flex justify-between items-center font-bold">
                <span className="uppercase text-[11px] text-slate-600 font-sans">Subtotal (@{username}):</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#003366]">Bet: ₱{subtotalBet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-emerald-800">Win: ₱{subtotalWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center text-slate-500 font-semibold uppercase text-xs bg-white border border-slate-200 rounded-xs">No returned tickets found in database.</div>
      )}
    </div>

    <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 text-[11px] text-slate-500 flex justify-between items-center font-medium">
      <span>Showing {filteredData.length} records</span>
      <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xs cursor-pointer shadow-xs transition-colors">
        <Download size={14} /> Export CSV
      </button>
    </div>

    {selectedForDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white border-2 border-rose-600 rounded-xs shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-rose-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
              <AlertTriangle size={16} className="text-amber-300" />
              <span>Confirm Deletion</span>
            </div>
            <button onClick={() => setSelectedForDelete(null)} disabled={isDeleting} className="text-rose-100 hover:text-white cursor-pointer"><X size={18} /></button>
          </div>
          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-700">Nawala na ba ang ticket na ito sa Source System API? Sigurado ka bang gusto mo na itong burahin sa **Supabase Database Ledger**?</p>
            <div className="bg-rose-50 border border-rose-200 rounded-xs p-3 space-y-2 font-mono">
              <div className="flex justify-between border-b border-rose-200 pb-1"><span className="text-slate-500 font-sans">Trans ID:</span><span className="font-bold text-rose-900">{selectedForDelete.computedTransId}</span></div>
              <div className="flex justify-between border-b border-rose-200 pb-1"><span className="text-slate-500 font-sans">Username:</span><span className="font-bold text-slate-800">{selectedForDelete.username || 'N/A'}</span></div>
              <div className="flex justify-between border-b border-rose-200 pb-1"><span className="text-slate-500 font-sans">Win Amount:</span><span className="font-bold text-emerald-700 text-sm">₱{parseFloat(selectedForDelete.winAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
            <button onClick={() => setSelectedForDelete(null)} disabled={isDeleting} className="px-3.5 py-1.5 rounded-xs border border-slate-300 font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer uppercase text-[11px]">Cancel</button>
            <button onClick={confirmAndDelete} disabled={isDeleting} className="px-4 py-1.5 rounded-xs bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer uppercase text-[11px] flex items-center gap-1.5 disabled:opacity-50">
              <Trash2 size={13} />
              <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}