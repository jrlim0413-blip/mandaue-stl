import { useState, useMemo, Fragment } from 'react';
import { UserCheck, CreditCard, Clock, CheckCircle, Download, Search, AlertCircle, Plus, ChevronRight } from 'lucide-react';

export default function InstallmentWinningsTab({
  groupedData = {},
  filteredData = [],
  rawApiData = [],
  isLoadingApi = false,
  formatDrawTime,
  onUpdateInstallment
}) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const displayList = useMemo(() => {
    if (!searchTerm) return filteredData;
    const q = searchTerm.toLowerCase();
    return filteredData.filter(item => 
      (item.username || '').toLowerCase().includes(q) ||
      (item.fullName || item.outlet || '').toLowerCase().includes(q) ||
      (item.transactionId || item.transId || '').toLowerCase().includes(q) ||
      (item.betNo || '').toLowerCase().includes(q)
    );
  }, [filteredData, searchTerm]);

  const exportToCSV = () => {
    if (!displayList.length) return alert("Walang data na pwedeng i-download.");
    const headers = ["Username", "Teller / Outlet", "Transaction ID", "Draw", "Bet No", "Bet Code", "Total Win", "Installment Paid", "Remaining Balance", "Status"];
    const rows = displayList.map(item => {
      const transId = item.transactionId || item.transId || 'N/A';
      const totalWin = parseFloat(item.winAmount ?? 0);
      const paid = parseFloat(item.paidAmount ?? 0);
      const remaining = Math.max(0, totalWin - paid);
      const status = remaining <= 0 ? "FULLY PAID" : paid > 0 ? "PARTIAL / ONGOING" : "PENDING INSTALLMENT";

      return [
        `"${item.username || 'N/A'}"`,
        `"${item.fullName || item.outlet || 'N/A'}"`,
        `"${transId}"`,
        `"${formatDrawTime ? formatDrawTime(item.drawTime || item.drawDate) : item.drawTime || 'N/A'}"`,
        `"${item.betNo || 'N/A'}"`,
        `"${item.betCode || 'RS3'}"`,
        totalWin.toFixed(2),
        paid.toFixed(2),
        remaining.toFixed(2),
        `"${status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Installment_Winnings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
      {/* Top Controls */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-[#002B66]" />
          <h3 className="font-extrabold text-[#002B66] text-xs uppercase tracking-wider">Installment Winnings Management</h3>
          <span className="bg-blue-100 text-[#002B66] text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
            {displayList.length} Active Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search installment ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#002B66]"
            />
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002B66] hover:bg-blue-900 text-[#FFD700] text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#002B66] text-white text-[11px] font-black uppercase tracking-wider border-b border-blue-950">
              <th className="px-4 py-2.5 border-r border-blue-900">Teller / Outlet</th>
              <th className="px-4 py-2.5 border-r border-blue-900">Trans. ID</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-center">Draw</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-center">Bet No.</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-right">Total Win</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-right">Paid to Date</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-right">Remaining Balance</th>
              <th className="px-4 py-2.5 border-r border-blue-900 text-center">Status</th>
              <th className="px-4 py-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700">
            {Object.keys(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([username, items]) => {
                const totalGroupWin = items.reduce((s, i) => s + parseFloat(i.winAmount ?? 0), 0);
                const totalGroupPaid = items.reduce((s, i) => s + parseFloat(i.paidAmount ?? 0), 0);
                const totalGroupRemaining = totalGroupWin - totalGroupPaid;

                return (
                  <Fragment key={username}>
                    <tr className="bg-slate-100/90 border-y border-slate-200">
                      <td colSpan="9" className="px-4 py-2 font-bold text-[#002B66] text-xs uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={14} className="text-[#002B66]" />
                          <span>USER / SUPERVISOR ACCOUNT: @{username}</span>
                        </div>
                      </td>
                    </tr>

                    {items.map((item, i) => {
                      const transId = item.transactionId || item.transId || `REC-${i + 1}`;
                      const totalWin = parseFloat(item.winAmount ?? 0);
                      const paid = parseFloat(item.paidAmount ?? 0);
                      const remaining = Math.max(0, totalWin - paid);
                      const isComplete = remaining <= 0;

                      return (
                        <tr key={item.id || transId || i} className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-amber-50/50">
                          <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800 uppercase">{item.fullName || item.outlet || 'N/A'}</td>
                          <td className="px-4 py-2 border-r border-slate-200 font-mono font-extrabold text-[#002B66]">{transId}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-center font-mono text-[11px]">{formatDrawTime ? formatDrawTime(item.drawTime || item.drawDate) : 'N/A'}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">{item.betNo || 'N/A'}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">₱{totalWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-right font-mono font-bold text-blue-700">₱{paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-right font-mono font-bold text-emerald-700">₱{remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 border-r border-slate-200 text-center">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                                <CheckCircle size={10} /> FULLY PAID
                              </span>
                            ) : paid > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                                <Clock size={10} /> PARTIAL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-300">
                                <Clock size={10} /> UNPAID
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => setSelectedRecord(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold bg-[#002B66] hover:bg-blue-900 text-[#FFD700] rounded-lg transition-all cursor-pointer shadow-2xs"
                            >
                              <span>Manage</span>
                              <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="bg-slate-100 font-bold border-b border-slate-200 text-xs">
                      <td colSpan="4" className="px-4 py-1.5 text-right uppercase text-slate-600">SUBTOTAL:</td>
                      <td className="px-4 py-1.5 text-right font-mono text-[#002B66] border-r border-slate-200">₱{totalGroupWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-blue-800 border-r border-slate-200">₱{totalGroupPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-emerald-800" colSpan="3">₱{totalGroupRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                  {isLoadingApi ? "Loading installment ledger..." : "No installment records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center font-medium">
        <span>Showing {displayList.length} records</span>
      </div>
    </div>
  );
}
