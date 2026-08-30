import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  Camera,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { AgentAvatarSvg } from './assets/agentAvatar';
import TicketVerificationCard from './TicketVerificationCard';
import {
  generateBotVerificationReply,
  findTicketInSystem,
  parseReceiptImageOCR,
  TICKET_STATUS
} from './utils/ticketVerificationBot';
import { processReceiptVerification } from './utils/receiptScanner';

export default function AgentVerificationChatbot({
  isOpen,
  onClose,
  rawApiData = [],
  unclaimedList = [],
  claimedList = [],
  returnedList = [],
  currentUser = { username: 'staff', full_name: 'Current Staff', role: 'Staff' },
  onOpenQrModal,
  onCopyTransId
}) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Hello. I am Agent Maria, the STL Ticket Verification Assistant. Enter a Transaction ID or upload a receipt photo to verify its claim status.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages.length, isTyping, isScanningImage]);

  // Handle User Sending a Message
  const handleSend = (textToSend = inputText, imageFile = attachedImage) => {
    const trimmed = textToSend.trim();
    if (!trimmed && !imageFile) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      image: imageFile,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedImage(null);
    setIsTyping(true);

    // If an image was sent, scan physical barcode using BarcodeDetector / Canvas
    if (imageFile) {
      setIsScanningImage(true);
      
      processReceiptVerification(imageFile, imageFile.name || '', {
        rawApiData,
        unclaimedList,
        claimedList,
        returnedList
      }).then(scanResult => {
        setIsScanningImage(false);
        setIsTyping(false);

        if (scanResult.status === 'MATCH_FOUND' && scanResult.ticket) {
          const isClaimedStatus = scanResult.ticket.status === TICKET_STATUS.CLAIMED;
          const isReturnedStatus = scanResult.ticket.status === TICKET_STATUS.RETURNED;
          
          const botReply = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            type: 'ticket_result',
            ticket: scanResult.ticket,
            text: isClaimedStatus
              ? `Barcode scanned (\`${scanResult.detectedCode}\`). Status: **CLAIMED & PAID**.`
              : isReturnedStatus
                ? `Barcode scanned (\`${scanResult.detectedCode}\`). Status: **RETURNED TO HQ**.`
                : `Barcode scanned (\`${scanResult.detectedCode}\`). Status: **UNCLAIMED** (Eligible for payout).`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          };
          setMessages(prev => [...prev, botReply]);
        } else if (scanResult.detectedCode && !scanResult.ticket) {
          const botReply = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            type: 'text',
            text: `Barcode detected (\`${scanResult.detectedCode}\`), but no matching winning record was found in the database. Please verify the Transaction ID.`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          };
          setMessages(prev => [...prev, botReply]);
        } else {
          const botReply = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            type: 'text',
            text: `Could not clearly read the barcode from this photo. Please type the Transaction ID printed on the receipt (e.g. \`081628-...\`) to verify.`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          };
          setMessages(prev => [...prev, botReply]);
        }
      }).catch(() => {
        setIsScanningImage(false);
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          type: 'text',
          text: `Please type the Transaction ID printed on the receipt to verify.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
      });
      return;
    }

    // Process Text Query against Live API Data (Unclaimed + Claimed + Returned)
    setTimeout(() => {
      setIsTyping(false);
      const replyData = generateBotVerificationReply(trimmed, {
        rawApiData,
        unclaimedList,
        claimedList,
        returnedList
      });

      const botReply = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        type: replyData.type,
        ticket: replyData.ticket,
        text: replyData.message,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      };

      setMessages(prev => [...prev, botReply]);
    }, 700);
  };

  // Handle File Input Change (Image Upload)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target.result;
      handleSend('Attached receipt image for verification.', dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clear Chat History
  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Chat history cleared. Enter a Transaction ID or upload a receipt photo to verify.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 md:p-6 pointer-events-none">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Floating Chatbot Card */}
      <div
        className={`w-full ${
          isExpanded ? 'sm:w-[540px] md:w-[600px] h-full sm:h-[92vh]' : 'sm:w-[420px] md:w-[450px] h-[85vh] sm:h-[650px]'
        } bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-[#002B66] overflow-hidden flex flex-col pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-4 fade-in`}
      >
        
        {/* Chatbot Header */}
        <div className="bg-gradient-to-r from-[#002B66] via-[#003882] to-[#001F4D] text-white px-4 py-3.5 flex items-center justify-between shadow-md border-b-2 border-[#FFD700] select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#002B66] to-[#001433] p-0.5 border border-[#FFD700] shadow-sm">
              <AgentAvatarSvg className="w-full h-full" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm tracking-wide truncate text-white">Agent Maria</h3>
                <span className="text-[9px] bg-[#FFD700] text-[#002B66] font-black px-1.5 py-0.2 rounded uppercase">VERIFIER BOT</span>
              </div>
              <p className="text-[11px] text-blue-200 truncate flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span>STL Mandaue Receipt & Ticket Auditor</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 text-slate-300">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Clear Chat History"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:block p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'Shrink Window' : 'Expand Window'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
              title="Close Verification Bot"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* OCR Scanning Radar Overlay */}
        {isScanningImage && (
          <div className="bg-blue-950 text-white p-3 border-b border-blue-800 flex items-center gap-3 relative overflow-hidden animate-in fade-in duration-200">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent animate-pulse"></div>
            <div className="w-9 h-9 rounded-lg bg-blue-900 flex items-center justify-center shrink-0 border border-cyan-400">
              <Camera size={18} className="text-cyan-300 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#FFD700] uppercase tracking-wider text-[10px]">Scanning Physical Receipt...</span>
                <span className="text-cyan-300 font-mono text-[10px]">Laser OCR 99.6%</span>
              </div>
              <p className="text-[11px] text-blue-200 truncate">Verifying barcode against Live Master Ledger...</p>
            </div>
          </div>
        )}

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-1 duration-150`}
              >
                {/* Bot Avatar Icon */}
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-[#002B66] p-0.5 shrink-0 border border-[#FFD700] shadow-sm self-end">
                    <AgentAvatarSvg className="w-full h-full" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[85%] sm:max-w-[80%]`}>
                  
                  {/* Sender Name & Timestamp */}
                  <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">
                    {isBot ? 'Agent Maria (STL Verifier)' : currentUser.full_name || 'You'} • {msg.timestamp}
                  </span>

                  {/* Attached Image Thumbnail */}
                  {msg.image && (
                    <div className="mb-2 rounded-xl overflow-hidden border-2 border-[#002B66] shadow-md max-w-[200px]">
                      <img src={msg.image} alt="Receipt" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.text && (
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isBot
                          ? 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          : 'bg-[#002B66] text-white rounded-br-xs font-medium'
                      }`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Pure Verification Ticket Card */}
                  {msg.type === 'ticket_result' && msg.ticket && (
                    <TicketVerificationCard
                      ticket={msg.ticket}
                      onOpenQrModal={onOpenQrModal}
                      onCopyTransId={onCopyTransId}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-500 animate-in fade-in duration-200">
              <div className="w-7 h-7 rounded-full bg-[#002B66] p-0.5 shrink-0 border border-[#FFD700]">
                <AgentAvatarSvg className="w-full h-full" />
              </div>
              <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600">Verifying...</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#002B66] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#002B66] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#002B66] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          
          {/* Image Attachment Preview */}
          {attachedImage && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img src={attachedImage} alt="Receipt preview" className="w-10 h-10 object-cover rounded-lg border border-blue-300" />
                <span className="text-xs font-bold text-blue-900 truncate">Receipt Photo Attached</span>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Camera / Photo Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#002B66] transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-slate-200"
              title="Upload / Scan Physical Receipt Photo"
            >
              <Camera size={18} />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type Transaction ID (e.g. 081628-OIIIRA0CN)..."
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#002B66] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 outline-none transition-all shadow-inner"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedImage}
              className="p-2.5 bg-[#002B66] hover:bg-blue-900 active:scale-95 disabled:opacity-40 text-[#FFD700] rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center shrink-0"
              title="Send Query"
            >
              <Send size={16} />
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10px] text-slate-400 font-semibold">
            Official Verification Bot • Lucky Betplay Corporation (STL Mandaue)
          </p>
        </div>
      </div>
    </div>
  );
}
