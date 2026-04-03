import React, { useState, useEffect } from 'react';
import { X, KeyRound, AlertCircle, CheckCircle2, Fingerprint } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  
  const [storedPassword, setStoredPassword] = useState('80093424LEdg@');
  const [storedRecoveryQuestion, setStoredRecoveryQuestion] = useState('আপনার প্রিয় রং কি?');
  const [storedRecoveryAnswer, setStoredRecoveryAnswer] = useState('সাদা');

  useEffect(() => {
    const savedPass = localStorage.getItem('ledger_admin_password_v1');
    const savedQuestion = localStorage.getItem('ledger_admin_recovery_q_v1');
    const savedAnswer = localStorage.getItem('ledger_admin_recovery_a_v1');
    
    if (savedPass) setStoredPassword(savedPass);
    if (savedQuestion) setStoredRecoveryQuestion(savedQuestion);
    if (savedAnswer) setStoredRecoveryAnswer(savedAnswer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNewQuestion(storedRecoveryQuestion);
      setNewAnswer(storedRecoveryAnswer);
    }
  }, [isOpen, storedRecoveryQuestion, storedRecoveryAnswer]);

  const saveAdminSettings = (pass: string, q: string, a: string) => {
    localStorage.setItem('ledger_admin_password_v1', pass);
    localStorage.setItem('ledger_admin_recovery_q_v1', q);
    localStorage.setItem('ledger_admin_recovery_a_v1', a);
    setStoredPassword(pass);
    setStoredRecoveryQuestion(q);
    setStoredRecoveryAnswer(a);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 3) {
      alert("পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে।");
      return;
    }
    if (trimmedPassword !== confirmPassword.trim()) {
      alert("পাসওয়ার্ড দুটি মিলেনি!");
      return;
    }
    
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert("অনুগ্রহ করে নিরাপত্তা প্রশ্ন এবং উত্তর প্রদান করুন।");
      return;
    }
    
    saveAdminSettings(trimmedPassword, newQuestion.trim(), newAnswer.trim());
    alert("পাসওয়ার্ড এবং নিরাপত্তা সেটিংস সফলভাবে পরিবর্তন করা হয়েছে।");
    onClose();
    setNewPassword('');
    setConfirmPassword('');
    setNewQuestion('');
    setNewAnswer('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500 relative overflow-y-auto max-h-[90vh] group no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-slate-900 font-black text-lg tracking-tight">পাসওয়ার্ড পরিবর্তন</h3>
                <p className="text-blue-600/60 text-[9px] font-black uppercase tracking-[0.2em]">Security Settings</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড</label>
                <input 
                  type="password" 
                  placeholder="নতুন পাসওয়ার্ড দিন" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                <input 
                  type="password" 
                  placeholder="আবার পাসওয়ার্ড দিন" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                />
              </div>
              
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <AlertCircle size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">নিরাপত্তা প্রশ্ন (পাসওয়ার্ড উদ্ধারের জন্য)</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">নিরাপত্তা প্রশ্ন</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: আপনার প্রিয় রং কি?" 
                    value={newQuestion} 
                    onChange={(e) => setNewQuestion(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">আপনার উত্তর</label>
                  <input 
                    type="text" 
                    placeholder="উত্তর দিন" 
                    value={newAnswer} 
                    onChange={(e) => setNewAnswer(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95"
              >
                বাতিল
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;