import { useState } from 'react';
import { FileText, Save, Printer } from 'lucide-react';

export default function SettlementAgreementTab({ filteredData = [], onSaveAgreement }) {
  // States para sa Editable Form
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Wala na scan ang cesibo, paso na at hindi na makita.');
  const [installmentsCount, setInstallmentsCount] = useState(10);

  // States para sa Editable Signatories
  const [hrManagerName, setHrManagerName] = useState('Authorized HR / Management');
  const [supervisorName, setSupervisorName] = useState('Sales Supervisor');
  
  // Custom installment schedule rows (array of objects)
  const [installments, setInstallments] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      dueDate: '',
      amountDue: '500.00',
      status: 'Pending'
    }))
  );

  // Hanapin ang napiling ticket mula sa filteredData (galing sa returned winnings)
  const selectedTicket = filteredData.find(
    (item) => (item.transactionId || item.transId || item.receipt_no) === selectedTicketId
  ) || filteredData[0] || {
    transactionId: '081628-OIIIRA0CN',
    drawDate: '2026-08-16',
    drawTime: '5:00 PM',
    betNo: '784',
    winAmount: 5000.00,
    username: 'sample_user',
    fullName: 'Sample Claimant'
  };

  // Helper function para gawing pormal at madaling basahin ang petsa (e.g., August 16, 2026)
  const formatTransactionDate = (dateString) => {
    if (!dateString) return 'August 16, 2026';
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return dateString; 
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handler kapag binago ang total number of installments
  const handleInstallmentCountChange = (count) => {
    const num = parseInt(count) || 1;
    setInstallmentsCount(num);
    const winAmt = parseFloat(selectedTicket.winAmount || 5000);
    const defaultAmount = (winAmt / num).toFixed(2);
    
    setInstallments(
      Array.from({ length: num }, (_, i) => ({
        id: i + 1,
        dueDate: '',
        amountDue: defaultAmount,
        status: 'Pending'
      }))
    );
  };

  // Handler para sa pag-update ng partikular na installment row
  const handleRowChange = (index, field, value) => {
    const updated = [...installments];
    updated[index][field] = value;
    setInstallments(updated);
  };

  const handleSave = () => {
    if (onSaveAgreement) {
      const totalAmountVal = installments.reduce((sum, item) => sum + parseFloat(item.amountDue || 0), 0);
      onSaveAgreement({
        ticketId: selectedTicket.transactionId || selectedTicket.transId || selectedTicket.receipt_no,
        ticket: selectedTicket,
        agreementDate,
        reason,
        installmentsCount,
        installments,
        signatories: {
          claimant: selectedTicket.fullName || selectedTicket.username || 'Claimant',
          hrManager: hrManagerName,
          supervisor: supervisorName
        },
        isUnderSettlement: true, // Flag para ma-update sa database ang status sa returned winnings
        settlementTerms: JSON.stringify({ reason, installments }),
        totalInstallmentAmount: totalAmountVal,
        settlementStatus: 'PENDING'
      });
    } else {
      console.warn('onSaveAgreement callback is not provided!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
      {/* Control Panel (Hidden when printing) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#002B66] text-[#FFD700] p-2 rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#002B66] uppercase tracking-wider">Settlement Agreement Generator</h3>
            <p className="text-[11px] text-slate-500 font-semibold">Customize and edit agreement terms before printing or saving.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Save size={14} />
            <span>Save Agreement</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#002B66] hover:bg-blue-900 text-[#FFD700] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Selector para sa Ticket mula sa Returned Winnings */}
      <div className="print:hidden bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs">
        <span className="font-bold text-[#002B66]">Select Returned/Unclaimed Ticket to Process:</span>
        <select
          value={selectedTicketId || (filteredData[0]?.transactionId || filteredData[0]?.transId || '')}
          onChange={(e) => setSelectedTicketId(e.target.value)}
          className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-mono font-bold text-slate-800 outline-none"
        >
          {filteredData.length > 0 ? (
            filteredData.map((item, idx) => {
              const tid = item.transactionId || item.transId || item.receipt_no || `TID-${idx}`;
              return (
                <option key={idx} value={tid}>
                  {tid} - {item.fullName || item.outlet || item.username || 'Claimant'} (₱{parseFloat(item.winAmount || 0).toLocaleString()})
                </option>
              );
            })
          ) : (
            <option value="">No returned tickets available (Using Sample)</option>
          )}
        </select>
      </div>

      {/* PRINTABLE DOCUMENT CONTAINER */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-md p-8 space-y-6 text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
        
        {/* HEADER WITH LOGOS */}
        <div className="flex justify-between items-center border-b-2 border-[#002B66] pb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/lbp.png" 
              alt="Lucky Betplay Logo" 
              className="w-12 h-12 object-contain rounded" 
            />
            <div>
              <h1 className="text-xs font-black text-[#002B66] tracking-wide">LUCKY BETPLAY CORPORATION</h1>
              <p className="text-[9px] text-slate-500 font-semibold">#257 BARLAPS, A.S. FORTUNA STREET, BAKILID, MANDAUE CITY, CEBU 6014</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="/stl.jpg" 
              alt="STL Logo" 
              className="w-10 h-10 object-contain rounded border border-slate-200 shadow-sm" 
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm font-black text-[#002B66] tracking-wider uppercase">SETTLEMENT AGREEMENT</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UNCLAIMED WINNING & PAYMENT SCHEDULE</p>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          This Settlement Agreement ("Agreement") is made on{' '}
          <input
            type="date"
            value={agreementDate}
            onChange={(e) => setAgreementDate(e.target.value)}
            className="border-b border-slate-400 px-1 font-bold text-slate-900 bg-slate-50 outline-none text-xs"
          />{' '}
          regarding the settlement of an unclaimed winning ticket described below.
        </p>

        {/* 1. DETAILS OF UNCLAIMED WINNING */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-[#002B66] uppercase border-l-4 border-[#002B66] pl-2">
            1. DETAILS OF UNCLAIMED WINNING
          </h3>
          <table className="w-full text-xs border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-600 bg-slate-50 w-1/3">Transaction ID</td>
                <td className="border border-slate-300 px-3 py-1.5 font-mono font-bold text-slate-900">
                  {selectedTicket.transactionId || selectedTicket.transId || selectedTicket.receipt_no || '081628-OIIIRA0CN'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-600 bg-slate-50">Transaction Date</td>
                <td className="border border-slate-300 px-3 py-1.5 font-mono text-slate-900">
                  {formatTransactionDate(selectedTicket.drawDate || selectedTicket.transactionDate || selectedTicket.created_at)}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-600 bg-slate-50">Winning Combination / Bet No.</td>
                <td className="border border-slate-300 px-3 py-1.5 font-mono font-bold text-slate-900">
                  {selectedTicket.betNo || selectedTicket.CombiNo || '784'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-600 bg-slate-50">Total Winning Amount</td>
                <td className="border border-slate-300 px-3 py-1.5 font-mono font-extrabold text-emerald-700">
                  PHP {parseFloat(selectedTicket.winAmount || 5000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. SUMMARY / REASON OF CLAIM (EDITABLE) */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-[#002B66] uppercase border-l-4 border-[#002B66] pl-2">
            2. SUMMARY / REASON OF CLAIM
          </h3>
          <div className="bg-amber-50 border border-amber-300 p-3 rounded text-xs space-y-1">
            <span className="font-black text-amber-900 uppercase">Reason:</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full bg-white border border-amber-300 p-2 text-xs font-medium rounded text-slate-800 outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Ilagay ang dahilan kung bakit na-settle..."
            />
            <p className="text-[10px] text-slate-500 italic">
              (The original ticket was lost/discarded, preventing standard automated terminal verification).
            </p>
          </div>
        </div>

        {/* 3. PAYMENT SCHEDULE & BREAKDOWN (EDITABLE) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-[#002B66] uppercase border-l-4 border-[#002B66] pl-2">
              3. PAYMENT SCHEDULE & BREAKDOWN
            </h3>
            <div className="print:hidden flex items-center gap-2 text-xs">
              <label className="font-bold text-slate-600">Installments Count:</label>
              <input
                type="number"
                min="1"
                max="24"
                value={installmentsCount}
                onChange={(e) => handleInstallmentCountChange(e.target.value)}
                className="w-16 border border-slate-300 px-2 py-1 rounded font-bold text-center outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-700">
            The total winning amount of <span className="font-bold">PHP {parseFloat(selectedTicket.winAmount || 5000).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> will be paid in <span className="font-bold">{installmentsCount} equal installments</span> scheduled accordingly below:
          </p>

          <table className="w-full text-xs border-collapse border border-slate-300 text-center">
            <thead>
              <tr className="bg-[#002B66] text-white font-black text-[11px]">
                <th className="border border-blue-950 p-2 w-16">Installment #</th>
                <th className="border border-blue-950 p-2">Due Date</th>
                <th className="border border-blue-950 p-2">Amount Due (PHP)</th>
                <th className="border border-blue-950 p-2">Status / Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {installments.map((inst, index) => (
                <tr key={inst.id} className="odd:bg-white even:bg-slate-50">
                  <td className="border border-slate-300 p-2 font-bold font-mono">{inst.id}</td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="date"
                      value={inst.dueDate}
                      onChange={(e) => handleRowChange(index, 'dueDate', e.target.value)}
                      className="w-full bg-transparent font-mono text-xs text-center outline-none cursor-pointer"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={inst.amountDue}
                      onChange={(e) => handleRowChange(index, 'amountDue', e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-center outline-none text-emerald-800"
                    />
                  </td>
                  <td className="border border-slate-300 p-1.5">
                    <input
                      type="text"
                      value={inst.status}
                      onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                      className="w-full bg-transparent text-center outline-none text-slate-600 text-[11px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. TERMS & ACKNOWLEDGMENT */}
        <div className="space-y-1 text-xs text-slate-700">
          <h3 className="text-xs font-black text-[#002B66] uppercase border-l-4 border-[#002B66] pl-2 mb-2">
            4. TERMS & ACKNOWLEDGMENT
          </h3>
          <p>1. Payments will be disbursed strictly according to the schedule above.</p>
          <p>
            2. Upon receipt of the final payment, the full winning amount of **PHP {parseFloat(selectedTicket.winAmount || 5000).toLocaleString('en-US', { minimumFractionDigits: 2 })}** shall be considered fully satisfied and settled.
          </p>
        </div>

        {/* 5. SIGNATURES (EDITABLE) */}
        <div className="space-y-4 pt-4 border-t border-slate-300">
          <h3 className="text-xs font-black text-[#002B66] uppercase border-l-4 border-[#002B66] pl-2">
            5. SIGNATURES
          </h3>
          <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
            {/* Claimant Signature */}
            <div className="space-y-8">
              <div className="border-b border-slate-900 pb-1 font-bold uppercase text-slate-900">
                {selectedTicket.fullName || selectedTicket.username || 'Claimant Name'}
              </div>
              <div className="text-[10px] font-extrabold uppercase text-slate-600">
                [ INDEPENDENT SALES REPRESENTATIVE ]<br />
                <span className="font-normal normal-case text-slate-500">Claimant / Signature over Printed Name</span><br />
                <span className="font-mono mt-1 block">Date: ________________________</span>
              </div>
            </div>

            {/* HR / Management Signature (Editable) */}
            <div className="space-y-8">
              <input
                type="text"
                value={hrManagerName}
                onChange={(e) => setHrManagerName(e.target.value)}
                className="w-full border-b border-slate-900 pb-1 font-bold uppercase text-slate-900 text-center bg-slate-50 outline-none"
                placeholder="Enter HR / Management Name"
              />
              <div className="text-[10px] font-extrabold uppercase text-slate-600">
                [ HUMAN RESOURCE ]<br />
                <span className="font-normal normal-case text-slate-500">Signature over Printed Name</span><br />
                <span className="font-mono mt-1 block">Date: ________________________</span>
              </div>
            </div>
          </div>

          {/* Supervisor Signature (Editable) */}
          <div className="w-1/2 mx-auto pt-6 text-center text-xs">
            <div className="space-y-8">
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full border-b border-slate-900 pb-1 font-bold uppercase text-slate-900 text-center bg-slate-50 outline-none"
                placeholder="Enter Supervisor Name"
              />
              <div className="text-[10px] font-extrabold uppercase text-slate-600">
                [ SALES SUPERVISOR ]<br />
                <span className="font-normal normal-case text-slate-500">Witness</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}