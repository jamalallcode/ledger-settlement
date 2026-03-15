import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showAdminModal: boolean;
  setShowAdminModal: (val: boolean) => void;
  setIsAdmin: (val: boolean) => void;
  setActiveTab: (val: string) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  showAdminModal,
  setShowAdminModal,
  setIsAdmin,
  setActiveTab
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '8009JAma@') {
      onSuccess();
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} className="text-blue-600" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">অ্যাডমিন এক্সেস</h3>
                <p className="text-slate-500 font-bold text-sm">সিস্টেমের গুরুত্বপূর্ণ পরিবর্তন করতে পাসওয়ার্ড প্রদান করুন।</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound size={18} className={error ? 'text-red-500' : 'text-slate-400'} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-lg transition-all outline-none ${error ? 'border-red-500 bg-red-50 animate-shake' : 'border-slate-100 focus:border-blue-500 focus:bg-white'}`}
                    autoFocus
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/20"
                >
                  এক্সেস ভেরিফাই করুন <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                <Fingerprint size={16} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Admin Authentication</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminModal;
