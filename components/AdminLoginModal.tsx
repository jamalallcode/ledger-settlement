import React, { useState, useEffect } from 'react';
import { Fingerprint, X, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storedPassword, setStoredPassword] = useState('80093424JAma@');

  useEffect(() => {
    const savedPass = localStorage.getItem('ledger_admin_password_v1');
    if (savedPass) {
      setStoredPassword(savedPass);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputEmail = adminEmailInput.trim().toLowerCase();
    const inputPassword = adminPassword.trim();
    
    const isValidEmail = (inputEmail === 'jamaluddinkh3424@gmail.com' || inputEmail === 'websitetogather@gmail.com');
    const isValidPass = (inputPassword === '80093424JAma@' || inputPassword === '80093424LEdg@' || inputPassword === storedPassword);

    if (isValidEmail && isValidPass) {
      localStorage.setItem('ledger_admin_access_v1', 'true');
      localStorage.setItem('ledger_admin_email_v1', inputEmail);
      localStorage.setItem('ledger_login_timestamp', Date.now().toString());
      setAdminPassword('');
      setAdminEmailInput('');
      setShowPassword(false);
      onSuccess();
    } else {
      alert("ভুল জিমেইল আইডি অথবা পাসওয়ার্ড!");
    }
  };

  const handleClose = () => {
    setAdminPassword('');
    setAdminEmailInput('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.7)] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 relative overflow-y-auto max-h-[90vh] no-scrollbar">
        {/* Decorative Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10 shrink-0">
                <Fingerprint size={20} />
              </div>
              <div>
                <h3 className="text-white font-black text-lg tracking-tight">সিকিউরিটি এক্সেস</h3>
                <p className="text-blue-400/80 text-[9.5px] font-black uppercase tracking-[0.2em]">Administrator Portal</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1 text-left">
              <label className="text-slate-300 text-[11px] font-black pl-1 block uppercase tracking-wider">
                জিমেইল আইডি (Gmail ID)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </div>
                <input 
                  autoFocus 
                  type="email" 
                  placeholder="example@gmail.com" 
                  value={adminEmailInput} 
                  onChange={(e) => setAdminEmailInput(e.target.value)} 
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 block" 
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1 text-left">
              <label className="text-slate-300 text-[11px] font-black pl-1 block uppercase tracking-wider">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white font-bold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500 block" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[10.5px] font-black text-red-200/90 leading-normal">
                নিরাপত্তা সতর্কীকরণ: অনুমোদিত জিমেইল আইডি ও সঠিক পাসওয়ার্ড দিয়ে নিরাপদভাবে প্রবেশ করুন।
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleClose} 
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all active:scale-95 border border-slate-700 cursor-pointer"
              >
                বাতিল
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-xs hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-lg shadow-blue-600/25 ring-2 ring-blue-500/20 cursor-pointer"
              >
                নিরাপদভাবে প্রবেশ করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
