// 3D Pixar/Disney style friendly customer support agent avatar for STL Receipt Verifier
export const AGENT_AVATAR_IMG = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80';

// High Quality SVG Character matching customer care agent with headset & microphone
export const AgentAvatarSvg = ({ className = "w-full h-full", isSpeaking = false }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#002B66" />
        <stop offset="100%" stopColor="#001433" />
      </linearGradient>
      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDDFCF" />
        <stop offset="100%" stopColor="#F5C6AA" />
      </linearGradient>
      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#63381B" />
        <stop offset="100%" stopColor="#3D210F" />
      </linearGradient>
      <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0052CC" />
        <stop offset="100%" stopColor="#002B66" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#FFD700" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Background Circle */}
    <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" stroke="#FFD700" strokeWidth="2.5" />

    {/* Hair Back */}
    <path d="M36 45 C30 65 35 90 48 95 C45 80 46 65 48 55 Z" fill="url(#hairGrad)" />
    <path d="M84 45 C90 65 85 90 72 95 C75 80 74 65 72 55 Z" fill="url(#hairGrad)" />

    {/* Torso / Shirt */}
    <path d="M30 115 C30 95 44 88 60 88 C76 88 90 95 90 115 Z" fill="url(#shirtGrad)" />
    {/* Collar */}
    <path d="M48 88 L60 98 L52 110 Z" fill="#EBF2FA" />
    <path d="M72 88 L60 98 L68 110 Z" fill="#EBF2FA" />
    {/* ID Badge */}
    <rect x="54" y="98" width="12" height="16" rx="2" fill="#FFFFFF" stroke="#002B66" strokeWidth="0.8" />
    <rect x="56" y="100" width="8" height="5" fill="#0052CC" />
    <line x1="56" y1="108" x2="62" y2="108" stroke="#FFD700" strokeWidth="1" />

    {/* Neck */}
    <rect x="52" y="74" width="16" height="18" rx="4" fill="url(#skinGrad)" />

    {/* Head */}
    <ellipse cx="60" cy="54" rx="24" ry="26" fill="url(#skinGrad)" />

    {/* Hair Top / Bangs */}
    <path d="M36 50 C36 30 50 22 60 22 C74 22 84 30 84 50 C80 34 70 28 60 28 C48 28 40 36 36 50 Z" fill="url(#hairGrad)" />
    <path d="M40 38 C50 34 68 36 78 46 C70 42 54 40 40 38 Z" fill="#4A2612" />

    {/* Eyes */}
    {/* Left Eye */}
    <ellipse cx="49" cy="52" rx="4" ry="5.5" fill="#FFFFFF" />
    <circle cx="49" cy="53" r="3.2" fill="#5A3825" />
    <circle cx="50" cy="53" r="2.2" fill="#1C110A" />
    <circle cx="50.5" cy="51.5" r="1.2" fill="#FFFFFF" />
    <path d="M44 46 C47 44 52 44 54 46" stroke="#3D210F" strokeWidth="1.6" strokeLinecap="round" />

    {/* Right Eye */}
    <ellipse cx="71" cy="52" rx="4" ry="5.5" fill="#FFFFFF" />
    <circle cx="71" cy="53" r="3.2" fill="#5A3825" />
    <circle cx="71" cy="53" r="2.2" fill="#1C110A" />
    <circle cx="72.5" cy="51.5" r="1.2" fill="#FFFFFF" />
    <path d="M66 46 C68 44 73 44 76 46" stroke="#3D210F" strokeWidth="1.6" strokeLinecap="round" />

    {/* Cute Blush */}
    <ellipse cx="44" cy="60" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.5" />
    <ellipse cx="76" cy="60" rx="3.5" ry="2" fill="#FF8A8A" opacity="0.5" />

    {/* Cute Smile */}
    <path d="M52 64 Q60 72 68 64" stroke="#A84332" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <path d="M54 65 Q60 70 66 65" fill="#FFFFFF" />

    {/* Headset Band */}
    <path d="M33 52 C33 26 87 26 87 52" stroke="#2D3748" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    {/* Left Earpiece */}
    <rect x="30" y="44" width="7" height="16" rx="3.5" fill="#1A202C" stroke="#718096" strokeWidth="1" />
    {/* Right Earpiece */}
    <rect x="83" y="44" width="7" height="16" rx="3.5" fill="#1A202C" stroke="#718096" strokeWidth="1" />
    {/* Headset Microphone Boom & Mic */}
    <path d="M34 56 C34 70 42 74 54 74" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="56" cy="74" r="3.2" fill="#E2E8F0" stroke="#2D3748" strokeWidth="1" />
    {/* Active mic light */}
    <circle cx="56" cy="74" r="1.2" fill="#10B981" />
  </svg>
);
