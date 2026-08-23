import { useState, useRef, useEffect } from 'react';
import { LogIn, User, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Lamp Interactive States
  const [isPulling, setIsPulling] = useState(false);
  const [isLit, setIsLit] = useState(false);

  // Eye tracking coordinates for the lampshade
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const lampRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!lampRef.current) return;
      const rect = lampRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / 25;
      const deltaY = (e.clientY - centerY) / 25;

      const maxOffset = 4;
      setEyeOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, deltaX)),
        y: Math.max(-maxOffset, Math.min(maxOffset, deltaY)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePullCord = () => {
    setIsPulling(true);
    setTimeout(() => {
      setIsPulling(false);
      setIsLit((prev) => !prev);
    }, 350);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .maybeSingle();

      if (error || !data) {
        throw new Error('Invalid username or password.');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden select-none ${isLit ? 'bg-[#0f111a]' : 'bg-[#050608]'}`}>
      
      {/* Background Ambient Warm Glow */}
      <div className={`absolute w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-700 pointer-events-none ${isLit ? 'bg-amber-500/20' : 'bg-amber-500/5'}`} />

      {/* Main Two-Column Card */}
      <div className="bg-slate-900/85 backdrop-blur-3xl rounded-[2.5rem] max-w-4xl w-full shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800 relative z-10">
        
        {/* --- LEFT COLUMN: Aesthetic Table Lamp with Wooden Stand & Fabric Shade --- */}
        <div className={`p-8 sm:p-12 flex flex-col justify-between items-center text-center relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/80 transition-colors duration-700 ${isLit ? 'bg-gradient-to-b from-[#1c1926] to-[#121019]' : 'bg-[#0b0c12]'}`}>
          
          <div className="w-full" />

          {/* Lamp Container */}
          <div className="flex flex-col items-center relative group my-auto" ref={lampRef}>
            
            {/* Fabric Lampshade */}
            <div className={`w-44 h-28 bg-gradient-to-b from-[#e6d5b8] to-[#c4ad8d] rounded-t-lg rounded-b-[2rem] border-2 border-[#b59e7a] shadow-2xl flex flex-col items-center justify-center relative transition-all duration-500 ${isLit ? 'shadow-[0_0_40px_rgba(251,191,36,0.45)] brightness-110 scale-105' : 'brightness-75 opacity-90'} bg-[radial-gradient(#d6c29e_1px,transparent_1px)] [background-size:8px_8px]`}>
              
              {/* Lampshade Top & Bottom Trim Lines */}
              <div className="absolute top-0 w-36 h-1 bg-[#8c7453] rounded-full" />
              <div className="absolute bottom-0 w-44 h-1.5 bg-[#8c7453] rounded-b-[2rem]" />

              {/* Cursor-Tracking Eyes Container */}
              <div className="flex items-center gap-6 mt-1">
                {/* Left Eye */}
                <div className="w-5 h-5 bg-slate-950 rounded-full flex items-center justify-center p-0.5 shadow-inner">
                  <div 
                    className="w-2 h-2 bg-white rounded-full transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
                  />
                </div>
                {/* Right Eye */}
                <div className="w-5 h-5 bg-slate-950 rounded-full flex items-center justify-center p-0.5 shadow-inner">
                  <div 
                    className="w-2 h-2 bg-white rounded-full transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
                  />
                </div>
              </div>

              {/* Cute Smile */}
              <div className="w-5 h-2 border-b-2 border-slate-950 rounded-full mt-2" />

              {/* Rosy Cheeks */}
              <div className="absolute bottom-4 left-6 w-3.5 h-1.5 bg-rose-400/50 rounded-full blur-[1px]" />
              <div className="absolute bottom-4 right-6 w-3.5 h-1.5 bg-rose-400/50 rounded-full blur-[1px]" />
            </div>

            {/* Glowing Bulb Effect inside the shade */}
            <div className={`absolute top-14 w-10 h-10 rounded-full transition-all duration-500 pointer-events-none ${isLit ? 'bg-amber-200 blur-md opacity-90 shadow-[0_0_30px_#fbbf24]' : 'opacity-0'}`} />

            {/* Wooden Stand Stem */}
            <div className="w-5 h-28 bg-gradient-to-r from-[#8a5a2e] via-[#b87d4b] to-[#70451f] rounded-b-md shadow-inner relative flex items-center justify-center border-x border-[#593315]">
              <div className="w-full h-full opacity-20 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]" />
            </div>

            {/* Wooden Base Platform */}
            <div className="w-24 h-5 bg-gradient-to-b from-[#b87d4b] to-[#6e421d] rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.6)] border border-[#593315] relative flex items-center justify-center" />

            {/* Pull Cord directly attached to the right side bottom rim of the lampshade */}
            <div 
              onClick={handlePullCord}
              className="absolute right-3 top-20 flex flex-col items-center cursor-pointer group/cord z-20"
              title="Click to pull cord"
            >
              {/* String hanging right from the lampshade rim */}
              <div className={`w-0.5 bg-amber-200/90 transition-all duration-200 ${isPulling ? 'h-24' : 'h-16 group-hover/cord:h-18'}`} />
              
              {/* Pull Handle Bead */}
              <div className={`w-3.5 h-5 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full border border-amber-200 shadow-md transition-transform duration-200 ${isPulling ? 'translate-y-6 scale-y-125' : 'group-hover/cord:translate-y-1'}`} />
            </div>

          </div>

          {/* Description Text */}
          <div className="space-y-1.5 mt-4">
            <h2 className="text-sm font-black text-white tracking-widest uppercase">Lucky Betplay Portal</h2>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              {isLit ? "Light is active! You may now sign in on the right panel. ✨" : "Click or pull the lamp cord to turn on the light! 💡"}
            </p>
          </div>

          <div className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20 mt-3">
            {isLit ? "💡 Status: Powered On" : "💤 Status: Powered Off"}
          </div>

        </div>

        {/* --- RIGHT COLUMN: Login Form --- */}
        <div className={`p-8 sm:p-12 flex flex-col justify-between transition-all duration-500 bg-slate-950/60 ${isLit ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none filter blur-[1px]'}`}>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <Sparkles size={11} /> Secure Access
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Sign In</h1>
              <p className="text-xs text-slate-400 font-medium">Enter your credentials to access your account.</p>
            </div>

            {/* ERROR MESSAGE ALERT */}
            {errorMessage && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-300 px-4 py-3 rounded-2xl text-xs font-semibold text-center shadow-lg">
                {errorMessage}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-2">
                  <User size={13} className="text-amber-400" /> Username
                </label>
                <input 
                  type="text" 
                  required
                  disabled={!isLit}
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-4 py-3.5 rounded-2xl font-medium text-white placeholder-slate-600 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all shadow-inner disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center gap-2">
                  <Lock size={13} className="text-amber-400" /> Password
                </label>
                <input 
                  type="password" 
                  required
                  disabled={!isLit}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-4 py-3.5 rounded-2xl font-medium text-white placeholder-slate-600 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all shadow-inner disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isLit}
                className="w-full mt-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(251,191,36,0.25)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* FOOTER */}
          <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Secure Session</span>
            </span>
            {isLit && (
              <button 
                type="button" 
                onClick={() => setIsLit(false)} 
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Turn Off Light ✕
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
