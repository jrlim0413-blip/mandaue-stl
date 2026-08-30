import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Image as ImageIcon,
  Smile,
  ThumbsUp,
  Info,
  Paperclip,
  Check,
  CheckCheck,
  ShieldCheck,
  X,
  MessageCircle,
  Clock,
  User,
  Users,
  CheckCircle2,
  Lock,
  Download,
  Eye,
  Camera,
  FileCheck
} from 'lucide-react';
import { useMessenger } from './context/MessengerContext';

const EMOJI_LIST = ['👍', '❤️', '🔥', '👏', '✅', '💰', '🎯', '💯'];

// Quick Sample Receipts for 1-Click Verification Test
const SAMPLE_RECEIPTS = [
  {
    label: 'Winning Ticket (Bet: 784)',
    desc: '₱5,000.00 • 5:00 PM Draw',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Thermal STL Receipt',
    desc: 'Standard 3D Barcode Voucher',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
  },
  {
    label: 'Faded Receipt Sample',
    desc: 'Physical Voucher for Audit',
    url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80'
  }
];

export default function MessengerTab({
  currentUser = { username: 'current_user', full_name: 'Current Staff', role: 'Staff' }
}) {
  const {
    cashier,
    messages,
    isTyping,
    sendMessage,
    clearUnread
  } = useMessenger();

  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSampleReceipts, setShowSampleReceipts] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clear unread when viewing
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, attachedImage]);

  // Handle file input change (Local Image Upload)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAttachedImage(uploadEvent.target.result);
      setShowSampleReceipts(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send message with text & receipt image
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    sendMessage(inputText, attachedImage);
    setInputText('');
    setAttachedImage(null);
    setShowEmojiPicker(false);
    setShowSampleReceipts(false);
  };

  // Quick Thumbs Up
  const handleSendThumbsUp = () => {
    sendMessage('👍');
  };

  // Collect all sent receipts for audit gallery
  const receiptGallery = useMemo(() => {
    return messages.filter((m) => Boolean(m.image));
  }, [messages]);

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[580px] max-h-[860px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row select-none">
      
      {/* ============================================================ */}
      {/* MAIN 1-ON-1 CHAT WINDOW WITH AUTHORIZED CLAIM CASHIER        */}
      {/* ============================================================ */}
      <div className="flex-1 bg-[#F9FAFB] flex flex-col h-full min-w-0 relative">
        
        {/* Top Header (Authorized Cashier Status) */}
        <div className="h-18 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-xs shrink-0 z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={cashier.avatar}
                alt={cashier.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600/30"></span>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 truncate tracking-tight">{cashier.name}</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-600" />
                  <span>Authorized Claim Verifier</span>
                </span>
              </div>
              
              <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                {isTyping ? (
                  <span className="text-[#0084FF] font-bold flex items-center gap-1">
                    Checking receipt & typing
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-[#0084FF] animate-bounce"></span>
                      <span className="w-1 h-1 rounded-full bg-[#0084FF] animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 rounded-full bg-[#0084FF] animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Now • Master Terminal Console
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[#0084FF] hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ImageIcon size={15} />
              <span className="hidden sm:inline">Attach Receipt Photo</span>
            </button>

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showRightPanel
                  ? 'bg-blue-50 text-[#0084FF] border-blue-200'
                  : 'hover:bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Toggle Cashier Details & Receipt Gallery"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Banner: Official 1-on-1 Channel */}
          <div className="text-center py-5 space-y-2 bg-gradient-to-b from-blue-50/50 to-transparent p-4 rounded-2xl border border-blue-100/60 max-w-lg mx-auto">
            <div className="relative inline-block">
              <img
                src={cashier.avatar}
                alt={cashier.name}
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-white shadow-md ring-2 ring-emerald-500/50"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <h4 className="text-sm font-black text-slate-900">{cashier.name}</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
              Official 1-on-1 Verification Channel for <span className="font-bold text-[#002B66]">Lucky Betplay STL Mandaue</span>. I-attach lamang ang litrato ng winning receipt para sa agarang validation at pag-claim sa system.
            </p>
          </div>

          {/* Messages */}
          {messages.map((msg) => {
            const isMe = msg.sender === 'currentUser';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <img
                      src={cashier.avatar}
                      alt={cashier.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-1"
                    />
                  )}

                  <div className="space-y-1">
                    
                    {/* RECEIPT IMAGE ATTACHMENT BUBBLE */}
                    {msg.image && (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 shadow-md group cursor-pointer bg-slate-900" onClick={() => setLightboxImage(msg.image)}>
                        <img
                          src={msg.image}
                          alt="Attached Receipt"
                          className="max-w-xs sm:max-w-sm max-h-72 object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                          <Eye size={16} />
                          <span>Click to Inspect Full Receipt</span>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FileCheck size={12} className="text-emerald-400" />
                          <span>Attached Receipt Photo</span>
                        </div>
                      </div>
                    )}

                    {/* TEXT MESSAGE BUBBLE */}
                    {msg.text && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? 'bg-[#0084FF] text-white rounded-br-xs'
                            : 'bg-[#F0F2F5] text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className={`flex items-center gap-1 text-[10px] text-slate-400 px-1 font-semibold ${isMe ? 'pr-1' : 'pl-9'}`}>
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span title={msg.status}>
                      {msg.status === 'seen' ? (
                        <span className="text-[#0084FF] font-bold">Seen</span>
                      ) : (
                        <Check size={11} className="text-slate-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Bouncing Bubble */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <img
                src={cashier.avatar}
                alt={cashier.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-1"
              />
              <div className="bg-[#F0F2F5] px-4 py-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================ */}
        {/* CHAT INPUT & RECEIPT ATTACHMENT TOOLBAR                      */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 relative">
          
          {/* Hidden File Input for Device Photo Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* PREVIEW ATTACHED RECEIPT PHOTO BEFORE SENDING */}
          {attachedImage && (
            <div className="mb-3 p-2 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={attachedImage}
                  alt="Receipt Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-blue-300 shrink-0 shadow-xs"
                />
                <div className="min-w-0">
                  <span className="block text-xs font-black text-[#002B66] truncate">
                    Receipt Photo Attached
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Type an optional message and press Send
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                title="Remove attached photo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Quick Sample Receipts Menu */}
          {showSampleReceipts && (
            <div className="absolute bottom-18 left-4 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl z-30 w-72 space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-black uppercase text-[#002B66]">Attach Receipt</span>
                <button onClick={() => setShowSampleReceipts(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-2 rounded-xl bg-blue-50 text-[#0084FF] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Camera size={16} />
                <span>Upload from Device / Camera</span>
              </button>

              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">
                Or pick a quick sample:
              </span>

              <div className="space-y-1.5">
                {SAMPLE_RECEIPTS.map((rec, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setAttachedImage(rec.url);
                      setShowSampleReceipts(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    <img src={rec.url} alt={rec.label} className="w-8 h-8 rounded object-cover" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 leading-tight">{rec.label}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{rec.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-12 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xl flex items-center gap-1.5 z-30 animate-in fade-in slide-in-from-bottom-2">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="w-8 h-8 hover:bg-slate-100 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            
            {/* Attach Receipt Photo Button */}
            <button
              type="button"
              onClick={() => setShowSampleReceipts(!showSampleReceipts)}
              className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
                attachedImage ? 'bg-blue-100 text-[#0084FF]' : 'text-[#0084FF] hover:bg-blue-50'
              }`}
              title="Attach Receipt Photo for Claim Verification"
            >
              <ImageIcon size={20} />
            </button>

            {/* Quick Emoji Picker Toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full text-[#0084FF] hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
              title="Add Emoji"
            >
              <Smile size={20} />
            </button>

            {/* Text Input Box */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={attachedImage ? "Add notes about this receipt... (press Enter to send)" : "Aa (Type message or attach receipt...)"}
                className="w-full bg-[#F0F2F5] focus:bg-white text-xs text-slate-900 placeholder:text-slate-500 px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#0084FF]/30 focus:border-[#0084FF] transition-all font-medium"
              />
            </div>

            {/* Send Button or Thumbs Up */}
            {inputText.trim().length > 0 || attachedImage ? (
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[#0084FF] hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
                title="Send Message & Receipt"
              >
                <Send size={16} className="translate-x-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendThumbsUp}
                className="w-9 h-9 rounded-full text-[#0084FF] hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Send Thumbs Up"
              >
                <ThumbsUp size={20} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT SIDEBAR: AUTHORIZED CASHIER & RECEIPT GALLERY AUDIT    */}
      {/* ============================================================ */}
      {showRightPanel && (
        <div className="w-full md:w-72 lg:w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto">
          
          {/* Cashier Profile Card */}
          <div className="p-6 text-center border-b border-slate-100 space-y-3">
            <div className="relative inline-block">
              <img
                src={cashier.avatar}
                alt={cashier.name}
                className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-50"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20"></span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{cashier.name}</h3>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">
                {cashier.role}
              </p>
              <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">{cashier.station}</span>
            </div>
          </div>

          {/* Receipts Sent for Verification Gallery */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black text-[#002B66] uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#0084FF]" />
                <span>Sent Receipts Gallery</span>
              </h4>
              <span className="text-[10px] font-bold bg-blue-50 text-[#0084FF] px-2 py-0.5 rounded-full font-mono">
                {receiptGallery.length}
              </span>
            </div>

            {receiptGallery.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                No receipts attached yet. Attach a receipt photo in the chat bar to verify.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {receiptGallery.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setLightboxImage(msg.image)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 group cursor-pointer aspect-square bg-slate-900"
                  >
                    <img src={msg.image} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye size={16} />
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white font-mono px-1 rounded">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & Verification Credentials */}
          <div className="p-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Authority & Permissions</h4>
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-emerald-900 font-semibold border border-emerald-200">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>Authorized to Claim & Tag Payouts</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl text-slate-800 font-semibold border border-blue-200">
              <CheckCircle2 size={16} className="text-[#0084FF] shrink-0" />
              <span>Direct Link to PCSO Sales Server</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LIGHTBOX MODAL: FULL SIZE RECEIPT PHOTO INSPECTOR           */}
      {/* ============================================================ */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-full transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImage}
              alt="Inspected Receipt"
              className="max-w-full max-h-[82vh] rounded-xl object-contain mx-auto"
            />
            <div className="p-2 text-center text-xs text-slate-300 font-semibold">
              Official Physical Receipt Verification View
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
