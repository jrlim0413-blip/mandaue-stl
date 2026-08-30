import React, { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Menu,
  MessageCircle,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smile,
  ThumbsUp,
  Ticket,
  X,
  Users,
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import DatePicker from './DatePicker';
import { useMessenger } from './context/MessengerContext';

export default function DashboardHeader({
  activeTab,
  loading,
  fromDate,
  toDate,
  searchQuery,
  totals,
  currentUser,
  onOpenSidebar,
  onSync,
  onFromDateChange,
  onToDateChange,
  onSearchChange,
  onOpenFullMessenger,
  onOpenFloatingChat
}) {
  const {
    cashier,
    messages,
    unreadCount
  } = useMessenger();

  const [showMessengerDropdown, setShowMessengerDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const messengerRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messengerRef.current && !messengerRef.current.contains(e.target)) {
        setShowMessengerDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title =
    activeTab === 'pending'
      ? 'Unclaimed Winnings Official Registry'
      : activeTab === 'returned'
        ? 'Returned Winnings Official Audit Trail'
        : activeTab === 'messenger'
          ? 'Official Claim & Verification Channel'
          : 'Settlement Agreements Management';

  const lastMessage = messages[messages.length - 1];

  // Demo Notifications for Dropdown
  const headerNotifications = [
    {
      id: 'n1',
      title: 'Ticket Claim Verified & Paid',
      desc: 'Maria Elena Santos verified Ticket #081628-OIIIRA0CN (₱5,000.00).',
      time: '10m ago',
      unread: true,
      type: 'success'
    },
    {
      id: 'n2',
      title: 'New Settlement Agreement',
      desc: 'Agreement draft generated for Bakilid Central (10 terms).',
      time: '1h ago',
      unread: true,
      type: 'info'
    },
    {
      id: 'n3',
      title: '30-Day Ticket Age Alert',
      desc: 'Ticket #081628-PL99420ZX reached 26 days unclaimed.',
      time: '3h ago',
      unread: false,
      type: 'warning'
    }
  ];

  return (
    <>
      <header className="relative bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 shadow-xs z-30 shrink-0 min-h-[70px]">
        
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 shrink-0 cursor-pointer"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-3 min-w-0 border-l-4 border-[#FFD700] pl-3">
            <div className="w-3 h-3 rounded-full bg-[#002B66] ring-4 ring-[#FFD700]/25 shrink-0"></div>
            <div className="min-w-0">
              <span className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] leading-none mb-1">
                Mandaue Operations
              </span>
              <h2 className="text-xs sm:text-sm md:text-base font-black text-[#002B66] uppercase tracking-wider truncate">
                {title}
              </h2>
            </div>
          </div>
        </div>

        {/* Right: Actions & Facebook-Style Messenger & Notification Icons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Synchronize Button */}
          <button
            onClick={onSync}
            disabled={loading}
            className="hidden sm:flex items-center gap-1.5 bg-[#002B66] hover:bg-blue-900 text-white px-3 py-2 rounded-xl text-xs font-extrabold tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="uppercase text-[11px]">Sync Ledger</span>
          </button>

          {/* ======================================================== */}
          {/* 1. FACEBOOK-STYLE MESSENGER ICON & DROPDOWN              */}
          {/* ======================================================== */}
          <div className="relative" ref={messengerRef}>
            <button
              onClick={() => {
                setShowMessengerDropdown(!showMessengerDropdown);
                setShowNotificationsDropdown(false);
              }}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showMessengerDropdown
                  ? 'bg-[#E7F3FF] text-[#0084FF] ring-2 ring-[#0084FF]/40'
                  : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-slate-700'
              }`}
              title="Official Claim & Verification Messenger"
            >
              {/* Facebook Messenger Icon */}
              <MessageCircle size={20} className="stroke-[2.2]" />
              
              {/* Unread Messenger Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Messenger Popover (FB Style) */}
            {showMessengerDropdown && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                
                {/* Popover Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">Claim Verification</h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-200">
                      1-on-1 Cashier Channel
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowMessengerDropdown(false);
                      if (onOpenFullMessenger) onOpenFullMessenger();
                    }}
                    className="text-xs font-bold text-[#0084FF] hover:underline cursor-pointer"
                  >
                    Open Full Chat
                  </button>
                </div>

                {/* 1-on-1 Cashier Row in Popover */}
                <div className="p-2">
                  <div
                    onClick={() => {
                      setShowMessengerDropdown(false);
                      if (onOpenFloatingChat) onOpenFloatingChat();
                      else if (onOpenFullMessenger) onOpenFullMessenger();
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F4F7] transition-colors cursor-pointer bg-blue-50/40 border border-blue-100"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={cashier.avatar}
                        alt={cashier.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {cashier.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{lastMessage?.timestamp || ''}</span>
                      </div>
                      
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider truncate mb-1">
                        Authorized Claim Cashier
                      </p>

                      <p className={`text-[11px] truncate ${unreadCount > 0 ? 'font-black text-slate-900' : 'font-medium text-slate-500'}`}>
                        {lastMessage ? (lastMessage.image ? '📷 [Attached Receipt Photo]' : (lastMessage.sender === 'currentUser' ? `You: ${lastMessage.text}` : lastMessage.text)) : 'No messages'}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF] shrink-0"></span>
                    )}
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowMessengerDropdown(false);
                      if (onOpenFullMessenger) onOpenFullMessenger();
                    }}
                    className="w-full py-1.5 text-xs font-bold text-[#0084FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Open Full Verification Screen ➔
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 2. FACEBOOK-STYLE NOTIFICATION BELL & DROPDOWN           */}
          {/* ======================================================== */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
                setShowMessengerDropdown(false);
              }}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showNotificationsDropdown
                  ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-400/40'
                  : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-slate-700'
              }`}
              title="Notifications"
            >
              <Bell size={19} className="stroke-[2.2]" />
              
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 bg-[#E41E3F] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                2
              </span>
            </button>

            {/* Notifications Popover */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                
                {/* Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">Notifications</h3>
                  <span className="text-xs font-bold text-slate-400">Mark all as read</span>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 p-1.5">
                  {headerNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 rounded-xl hover:bg-[#F2F4F7] transition-colors cursor-pointer ${
                        notif.unread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'success' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : notif.type === 'warning' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertTriangle size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#002B66] flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 leading-tight">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium leading-normal mt-0.5">
                          {notif.desc}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                          {notif.time}
                        </span>
                      </div>

                      {notif.unread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF] shrink-0 mt-1.5"></span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Initial / Avatar Badge */}
          <div className="w-9 h-9 rounded-full bg-[#002B66] text-[#FFD700] flex items-center justify-center font-black text-xs border border-blue-900 shadow-xs shrink-0 cursor-pointer" title={currentUser?.full_name || currentUser?.username}>
            👤
          </div>
        </div>
      </header>

      {/* Date Pickers and Search Bar for List Views */}
      {activeTab !== 'settlement' && activeTab !== 'messenger' && (
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3.5rem)] max-w-6xl mx-auto mt-2 bg-blue-50/70 p-4 sm:p-5 rounded-xl border border-blue-200 border-t-4 border-t-[#002B66] shadow-md ring-1 ring-blue-200/60 flex flex-col md:flex-row gap-4 justify-between items-center">
          {activeTab === 'pending' && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
              <DatePicker label="Date From:" value={fromDate} onChange={onFromDateChange} />
              <DatePicker label="Date To:" value={toDate} onChange={onToDateChange} />
            </div>
          )}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search username, trans ID, bet no..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 text-xs rounded-lg focus:ring-2 focus:ring-[#002B66]/20 focus:border-[#002B66] outline-none font-medium transition-all"
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {activeTab !== 'settlement' && activeTab !== 'messenger' && (
        <div className="w-[calc(100%-2rem)] sm:w-[calc(100%-2.5rem)] md:w-[calc(100%-3.5rem)] max-w-6xl mx-auto mt-4 mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            { label: 'Unclaimed Records', val: totals.count, Icon: FileText },
            {
              label: 'Total Bet Volume',
              val: `₱${totals.betAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              Icon: AlertTriangle
            },
            {
              label: 'Total Winning Liability',
              val: `₱${totals.winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              Icon: CheckCircle2
            }
          ].map(({ label, val, Icon }, i) => (
            <div
              key={i}
              className="bg-blue-50/70 p-4 sm:p-5 rounded-xl border border-blue-200 border-l-4 border-l-[#002B66] shadow-md ring-1 ring-blue-200/60 flex items-center justify-between transition-transform hover:-translate-y-0.5"
            >
              <div className="min-w-0 pr-2">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none truncate">
                  {label}
                </p>
                <p className="text-base sm:text-lg font-black font-mono mt-1.5 text-slate-900 leading-tight truncate">
                  {val}
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl border border-blue-200 bg-blue-100 text-[#002B66] shrink-0">
                <Icon size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}