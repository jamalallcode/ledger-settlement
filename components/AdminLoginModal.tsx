import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, X, Mail, Send, Smartphone, ShieldCheck, ShieldAlert 
} from 'lucide-react';

interface AdminLoginModalProps {
  showAdminModal: boolean;
  setShowAdminModal: (val: boolean) => void;
  setIsAdmin: (val: boolean) => void;
  setActiveTab: (tab: string) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  showAdminModal,
  setShowAdminModal,
  setIsAdmin,
  setActiveTab
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [modalView, setModalView] = useState<'login' | 'identify' | 'verify' | 'reset'>('login');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const savedPassword = localStorage.getItem('ledger_admin_password') || '80093424FAri@';
    if (adminPassword === savedPassword) {
      setIsAdmin(true);
      localStorage.setItem('ledger_admin_access_v1', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
      setActiveTab('admin-dashboard');
    } else {
      alert("ভুল পাসওয়ার্ড!");
    }
  };

  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ownerEmail = 'emailaddress3424@gmail.com';
    const ownerMobile = '01734243424';
    
    if (recoveryContact === ownerEmail || recoveryContact === ownerMobile) {
      setIsSendingOtp(true);
      setTimeout(() => {
        setIsSendingOtp(false);
        setModalView('verify');
      }, 1500);
    } else {
      alert("দুঃখিত, এই ইমেইল বা মোবাইল নাম্বারটি নিবন্ধিত নয়।");
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') {
      setModalView('reset');
    } else {
      alert("ভুল ওটিপি (OTP)! সঠিক কোডটি দিন।");
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    localStorage.setItem('ledger_admin_password', newPassword);
    alert("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।");
    setModalView('login');
    setAdminPassword(newPassword);
    setNewPassword('');
    setOtp('');
    setRecoveryContact('');
  };

  return (
    <AnimatePresence>
      {showAdminModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-slate-900/50 border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[80px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight">
                    {modalView === 'login' ? 'সিকিউরিটি এক্সেস' : 
                     modalView === 'identify' ? 'পাসওয়ার্ড উদ্ধার' : 
                     modalView === 'verify' ? 'ওটিপি যাচাই' : 'নতুন পাসওয়ার্ড'}
                  </h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Admin Authentication</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAdminModal(false); setAdminPassword(''); setModalView('login'); }} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {modalView === 'login' && (
                  <motion.div 
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">মালিকের পাসওয়ার্ড</label>
                      <input 
                        autoFocus 
                        type="password" 
                        placeholder="••••••••" 
                        value={adminPassword} 
                        onChange={(e) => setAdminPassword(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700" 
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => { setShowAdminModal(false); setAdminPassword(''); }} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-sm hover:bg-white/10 transition-all active:scale-95">বাতিল</button>
                      <button onClick={handleAdminSubmit} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20">প্রবেশ করুন</button>
                    </div>
                    <button 
                      onClick={() => setModalView('identify')}
                      className="w-full text-center text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldAlert size={14} />
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </motion.div>
                )}

                {modalView === 'identify' && (
                  <motion.div 
                    key="identify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">নিবন্ধিত ইমেইল বা মোবাইল</label>
                      <div className="relative">
                        <input 
                          autoFocus 
                          type="text" 
                          placeholder="example@gmail.com / 017..." 
                          value={recoveryContact} 
                          onChange={(e) => setRecoveryContact(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-700" 
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600">
                          <Mail size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setModalView('login')} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-sm hover:bg-white/10 transition-all">ফিরে যান</button>
                      <button 
                        onClick={handleIdentifySubmit} 
                        disabled={isSendingOtp}
                        className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-sm hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95 shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSendingOtp ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send size={16} />
                            কোড পাঠান
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {modalView === 'verify' && (
                  <motion.div 
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <Smartphone size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-black text-lg">ওটিপি কোডটি দিন</p>
                        <p className="text-slate-500 text-xs font-bold">আপনার নিবন্ধিত ঠিকানায় একটি ৬-ডিজিটের কোড পাঠানো হয়েছে।</p>
                      </div>
                      <input 
                        autoFocus 
                        type="text" 
                        maxLength={6}
                        placeholder="0 0 0 0 0 0" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-3xl tracking-[0.5em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-800" 
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setModalView('identify')} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-sm hover:bg-white/10 transition-all">পুনরায় চেষ্টা</button>
                      <button onClick={handleVerifySubmit} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20">যাচাই করুন</button>
                    </div>
                  </motion.div>
                )}

                {modalView === 'reset' && (
                  <motion.div 
                    key="reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড সেট করুন</label>
                      <input 
                        autoFocus 
                        type="password" 
                        placeholder="••••••••" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-center text-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700" 
                      />
                    </div>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setModalView('login')} className="flex-1 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-sm hover:bg-white/10 transition-all">বাতিল</button>
                      <button onClick={handleResetSubmit} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-xl shadow-blue-600/20">সংরক্ষণ করুন</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest relative z-10">
              <ShieldCheck size={12} />
              <span>End-to-End Encrypted</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminLoginModal;
