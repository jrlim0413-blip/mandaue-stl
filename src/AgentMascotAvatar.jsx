import React from 'react';
import { AgentAvatarSvg } from './assets/agentAvatar';

export default function AgentMascotAvatar({
  isOpen,
  onClick,
  unclaimedCount = 0
}) {
  return (
    <div className="fixed bottom-6 right-5 sm:right-7 z-40 flex flex-col items-end pointer-events-none select-none">
      
      {/* Main Mascot Floating Button */}
      <button
        onClick={onClick}
        className={`pointer-events-auto relative group flex items-center justify-center transition-all duration-300 transform active:scale-95 cursor-pointer ${
          isOpen
            ? 'scale-90 opacity-90'
            : 'hover:scale-105 hover:-translate-y-1'
        }`}
        title={isOpen ? 'Close Receipt Verifier' : 'Open STL Receipt Verification Bot'}
        aria-label="Open STL Receipt Verification Bot"
      >
        {/* Pulsing Outer Glow Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700] via-[#0052CC] to-[#002B66] blur-md opacity-70 group-hover:opacity-100 animate-pulse"></div>

        {/* Mascot Avatar Circular Container */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#002B66] to-[#001433] p-1 shadow-2xl border-2 border-[#FFD700] overflow-hidden flex items-center justify-center">
          <AgentAvatarSvg className="w-full h-full transform group-hover:scale-110 transition-transform duration-300" />

          {/* Active Online Indicator */}
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-md animate-pulse"></span>
        </div>

        {/* Unclaimed Alert Badge */}
        {unclaimedCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-lg animate-bounce">
            {unclaimedCount}
          </span>
        )}

        {/* Small Bottom Label Tag */}
        <div className="absolute -bottom-2 bg-[#002B66] text-[#FFD700] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#FFD700] shadow-md whitespace-nowrap">
          VERIFIER BOT
        </div>
      </button>
    </div>
  );
}
