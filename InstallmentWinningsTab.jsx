import { useState, Fragment } from 'react';
import { CreditCard, PlusCircle, CheckCircle2, AlertCircle, UserCheck, History, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function InstallmentWinningsTab({ groupedData, isLoadingApi, onUpdateInstallment }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenPayment = (item) => {
    setSelectedRecord(item);
    setPaymentAmount('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleOpenHistory = (item) => {
    setSelectedRecord(item);
    setIsHistoryModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!selectedRecord || !paymentAmount) return;
    setIsSaving(true);
    try {
      const currentPaid = parseFloat(selectedRecord.totalPaid || 0);
      const newPayment = parseFloat(paymentAmount);
      const totalWin = parseFloat(selectedRecord.winAmount || 0);
      const updatedPaid = currentPaid + newPayment;
      const newStatus = updatedPaid >= totalWin ? 'Fully Paid' : 'Active Installment';

      const paymentHistory = selectedRecord.paymentHistory || [];
      const newHistoryEntry = {
        amount: newPayment,
        date: new Date().toISOString(),
        notes: paymentNotes || 'Standard installment payment'
      };

      const { error } = await supabase
        .from('returned_winnings')
        .update({ 
          totalPaid: updatedPaid, 
          installmentStatus: newStatus,
          paymentHistory: [...paymentHistory, newHistoryEntry]
        })
        .eq('transactionId', selectedRecord.transactionId);

      if (error) throw error;
      
      if (onUpdateInstallment) {
        onUpdateInstallment();
      }
      setIsPaymentModalOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      alert(`Error saving payment: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mx-auto w-full max-w-6xl">
      {/* Header Banner */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#002B66]/5 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#002B66] text-[#FFD700] rounded-lg shadow-xs">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="font-black text-[#002B66] text-xs uppercase tracking-wider">Installment Winnings Amortization Ledger</h3>
            <p className="text-[11px] text-slate-500 font-medium">Official tracking of unreturned winnings under structured staggered payment terms.</p>
          </div>
        </div>
        <div className="bg-[#002B66] text-[#FFD700] text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest font-mono shadow-2xs">
          Secure Portal
        </div>
      </div>
      
      {/* Table Section */}
      <div className="overflow-x-auto flex justify-center p-3">
        <table className="w-full text-left border-collapse shadow-xs rounded-lg overflow-hidden border border-slate-200">
          <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
            {isLoadingApi ? (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">Synchronizing financial records...</td></tr>
            ) : !Object.keys(groupedData).length ? (
              <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">No active installment liabilities registered.</td></tr>
            ) : (
              Object.entries(groupedData).map(([userKey, items]) => {
                const groupTotalWin = items.reduce((sum, item) => sum + parseFloat(item.winAmount ?? 0), 0);
                const groupTotalPaid = items.reduce((sum, item) => sum + parseFloat(item.totalPaid ?? 0), 0);
                const groupBalance = groupTotalWin - groupTotalPaid;

                return (
                  <Fragment key={userKey}>
                    {/* Supervisor / Account Group Header */}
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td colSpan="7" className="px-4 py-2.5 font-black text-[#002B66] text-xs uppercase tracking-wider font-mono flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-[#002B66]" />
                          <span>Account / Supervisor: {userKey}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-sans font-bold">
                          Balance: <span className="text-rose-700 font-mono">₱{groupBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Table Columns Header */}
                    <tr className="bg-[#002B66] text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="px-3.5 py-2.5 border-r border-blue-950">Teller / Outlet</th>
                      <th className="px-3.5 py-2.5 border-r border-blue-950">Trans. ID</th>
                      <th className="px-3.5 py-2.5 border-r border-blue-950 text-right">Total Liability</th>
                      <th className="px-3.5 py-2.5 border-r border-blue-950 text-right">Total Paid</th>
                      <th className="px-3.5 py-2.5 border-r border-blue-950 text-right">Balance Due</th>
                      <th className="px-3.5 py-2.5 border-r border-blue-950 text-center">Status</th>
                      <th className="px-3.5 py-2.5 text-center">Actions</th>
                    </tr>

                    {items.map((item, index) => {
                      const transId = item.transactionId || `REC-${index + 1}`;
                      const displayAccountName = item.fullName || item.outlet || item.username || 'N/A';
                      const winAmt = parseFloat(item.winAmount ?? 0);
                      const paidAmt = parseFloat(item.totalPaid ?? 0);
                      const balance = winAmt - paidAmt;
                      const status = item.installmentStatus || (paidAmt >= winAmt ? 'Fully Paid' : 'Active Installment');

                      return (
                        <tr
                          key={index}
                          className="transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-amber-50/60 border-b border-slate-100"
                        >
                          <td className="px-3.5 py-2.5 border-r border-slate-200 font-bold text-slate-800 uppercase text-xs">{displayAccountName}</td>
                          <td className="px-3.5 py-2.5 border-r border-slate-200 font-mono text-[#002B66] font-extrabold text-xs">
                            <span>{transId}</span>
                          </td>
                          <td className="px-3.5 py-2.5 border-r border-slate-200 text-right font-mono font-bold text-slate-900 text-xs">
                            ₱{winAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 border-r border-slate-200 text-right font-mono font-bold text-emerald-700 text-xs">
                            ₱{paidAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 border-r border-slate-200 text-right font-mono font-extrabold text-rose-700 text-xs">
                            ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3.5 py-2.5 border-r border-slate-200 text-center font-bold text-[10px]">
                            <span className={`px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${status === 'Fully Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenPayment(item)}
                              disabled={status === 'Fully Paid'}
                              className="bg-[#002B66] hover:bg-blue-900 disabled:opacity-40 text-[#FFD700] px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs transition-transform active:scale-95 inline-flex items-center gap-1"
                              title="Record Payment"
                            >
                              <PlusCircle size={12} />
                              <span>Collect</span>
                            </button>
                            <button
                              onClick={() => handleOpenHistory(item)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-xs transition-colors inline-flex items-center gap-1"
                              title="View Payment Logs"
                            >
                              <History size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Collect Payment Modal */}
      {isPaymentModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002B66] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700]">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs">
                <CreditCard size={16} className="text-[#FFD700]" />
                <span>Record Amortization Payment</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 font-mono">
                <div className="flex justify-between"><span className="text-slate-500 font-sans">Transaction ID:</span> <span className="font-bold text-[#002B66]">{selectedRecord.transactionId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-sans">Total Liability:</span> <span>₱{parseFloat(selectedRecord.winAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 font-sans">Current Balance:</span> <span className="text-rose-700 font-bold">₱{(parseFloat(selectedRecord.winAmount || 0) - parseFloat(selectedRecord.totalPaid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#002B66] uppercase tracking-wider text-[11px]">Payment Amount (₱)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-extrabold text-[#002B66] uppercase tracking-wider text-[11px]">Official Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly installment payment #1"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66]"
                />
              </div>
            </div>
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end gap-2.5">
              <button onClick={() => setIsPaymentModalOpen(false)} disabled={isSaving} className="px-4 py-2 rounded-lg border border-slate-300 font-extrabold text-slate-700 hover:bg-slate-200 uppercase text-xs cursor-pointer transition-colors">
                Cancel
              </button>
              <button onClick={handleSavePayment} disabled={isSaving} className="px-5 py-2 rounded-lg bg-[#002B66] hover:bg-blue-900 text-white font-black uppercase text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50">
                <span>{isSaving ? "Saving..." : "Post Payment"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History / Logs Modal */}
      {isHistoryModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#002B66] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#002B66] text-white px-5 py-3.5 flex justify-between items-center border-b-2 border-[#FFD700]">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs">
                <History size={16} className="text-[#FFD700]" />
                <span>Amortization Payment History</span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs max-h-96 overflow-y-auto">
              <div className="font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                <p className="font-bold text-[#002B66]">Trans ID: {selectedRecord.transactionId}</p>
                <p>Account: {selectedRecord.fullName || selectedRecord.outlet || selectedRecord.username}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-extrabold text-[#002B66] uppercase tracking-wider text-[11px]">Transaction Logs:</h4>
                {!selectedRecord.paymentHistory || selectedRecord.paymentHistory.length === 0 ? (
                  <p className="text-slate-500 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">No payment records logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRecord.paymentHistory.map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono">
                        <div>
                          <p className="font-bold text-emerald-700 text-xs">+ ₱{parseFloat(log.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-slate-500 font-sans">{log.notes}</p>
                        </div>
                        <div className="text-[10px] text-slate-400 text-right">
                          {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 rounded-lg bg-[#002B66] text-white font-black uppercase text-xs cursor-pointer shadow-sm">
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}