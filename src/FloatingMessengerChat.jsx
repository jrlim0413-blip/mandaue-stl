import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  Smile,
  ThumbsUp,
  Image as ImageIcon,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useMessenger } from './context/MessengerContext';

const EMOJI_LIST = ['👍', '❤️', '🔥', '👏', '✅', '💰'];

export default function FloatingMessengerChat({
  currentUser = { username: 'staff', full_name: 'Current Staff', role: 'Staff' },
  onClose,
  onOpenFullMessenger
}) {
  const {
    cashier,
    messages,
    isTyping,
    sendMessage,
    clearUnread
  } = useMessenger();

  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized, isTyping, attachedImage]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setAttachedImage(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    sendMessage(inputText, attachedImage);
    setInputText('');
    setAttachedImage(null);
    setShowEmojiPicker(false);
  };

  const handleSendThumbsUp = () => {
    sendMessage('👍');
  };

  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className={`w-80 sm:w-88 bg-white rounded-t-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col pointer-events-auto transition-all duration-200 ${
        isMinimized ? 'h-12' : 'h-[460px]'
      }`}>
        
        {/* Floating Chat Header */}
        <div
          onClick={() => isMinimized && setIsMinimized(false)}
          className="h-12 bg-white border-b border-slate-200 px-3.5 flex items-center justify-between shadow-xs cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={cashier.avatar}
                alt={cashier.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-500"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                  {cashier.name}
                </h4>
                <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
              </div>
              <span className="text-[10px] text-emerald-600 font-bold leading-none block truncate">
                {isTyping ? 'Checking receipt...' : 'Authorized Claim Verifier'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenFullMessenger) onOpenFullMessenger();
              }}
              className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              title="Expand to Full Screen"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              <Minimize2 size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              className="p-1 rounded-lg hover:bg-slate-100 hover:text-rose-600 cursor-pointer"
              title="Close Chat"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F9FAFB]">
              {messages.map((msg) => {
                const isMe = msg.sender === 'currentUser';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Attached Image Thumbnail */}
                    {msg.image && (
                      <div className="mb-1 rounded-xl overflow-hidden border border-blue-200 shadow-xs max-w-[200px]">
                        <img src={msg.image} alt="Receipt" className="w-full object-cover max-h-36" />
                      </div>
                    )}

                    {/* Text Bubble */}
                    {msg.text && (
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? 'bg-[#0084FF] text-white rounded-br-xs'
                            : 'bg-[#F0F2F5] text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 font-semibold px-1 mt-0.5">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-[#F0F2F5] px-3 py-2 rounded-2xl rounded-bl-xs w-16">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attached Image Preview above input */}
            {attachedImage && (
              <div className="p-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={attachedImage} alt="Preview" className="w-8 h-8 rounded object-cover border border-blue-300 shrink-0" />
                  <span className="text-[10px] font-bold text-[#002B66] truncate">Receipt Attached</span>
                </div>
                <button onClick={() => setAttachedImage(null)} className="text-slate-400 hover:text-rose-600">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Quick Emoji Popover */}
            {showEmojiPicker && (
              <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-around">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-lg hover:scale-125 transition-transform cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-[#0084FF] hover:bg-blue-50 cursor-pointer shrink-0"
                title="Attach Receipt Photo"
              >
                <ImageIcon size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded-full text-[#0084FF] hover:bg-blue-50 cursor-pointer shrink-0"
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Aa (Type or attach receipt...)"
                className="flex-1 bg-[#F0F2F5] focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 px-3 py-1.5 rounded-full outline-none focus:ring-2 focus:ring-[#0084FF]/30 font-medium"
              />

              {inputText.trim().length > 0 || attachedImage ? (
                <button
                  type="submit"
                  className="w-7 h-7 rounded-full bg-[#0084FF] text-white flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                >
                  <Send size={13} className="translate-x-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendThumbsUp}
                  className="w-7 h-7 text-[#0084FF] hover:bg-blue-50 flex items-center justify-center rounded-full cursor-pointer shrink-0"
                >
                  <ThumbsUp size={16} />
                </button>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
