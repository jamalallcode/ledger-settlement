import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, User, Plus, Trash2, Search, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface PendingDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  whitelistedEmails: string[];
  onAddWhitelistedEmail: (email: string) => void;
  onRemoveWhitelistedEmail: (email: string) => void;
  whatsappNumber?: string;
}

export const PendingDocsModal: React.FC<PendingDocsModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  whitelistedEmails = [],
  onAddWhitelistedEmail,
  onRemoveWhitelistedEmail,
  whatsappNumber = '8801712345678'
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    onAddWhitelistedEmail(newEmail.trim());
    setNewEmail('');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const filteredEmails = whitelistedEmails.filter(email =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-16 md:pt-20 pb-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Gmail এক্সেস ও কন্ট্রিবিউটর রেজিস্টার (Whitelisted Emails)
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                WhatsApp এ সার্কুলার পাঠানো ব্যবহারকারীদের জিমেইল আইডি যোগ ও পরিচালনা করুন
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0 border border-white/10"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Admin Add Email Form */}
          {isAdmin ? (
            <form onSubmit={handleAddSubmit} className="space-y-3 bg-blue-50/70 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wider">
                <Plus size={16} className="text-blue-600" /> নতুন অনুমোদিত জিমেইল আইডি (Gmail ID) যুক্ত করুন:
              </div>
              <p className="text-xs text-slate-600">
                ব্যবহারকারী WhatsApp এ ডকুমেন্ট পাঠানোর পর যাচাই শেষে তার জিমেইল আইডিটি এখানে যোগ করুন।
              </p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    required
                    placeholder="যেমন: contributor@gmail.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl font-bold text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Plus size={16} /> রেজিস্টার করুন
                </button>
              </div>

              {addedSuccess && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  জিমেইল আইডিটি সফলভাবে এক্সেস তালিকায় যুক্ত করা হয়েছে!
                </div>
              )}
            </form>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 font-medium space-y-1">
              <div className="font-black flex items-center gap-1.5 text-emerald-950">
                <MessageSquare size={16} className="text-emerald-600" /> WhatsApp এ আপনার Gmail আইডি ও সার্কুলার দিন
              </div>
              <p>
                আপনার জিমেইল আইডি তালিকায় অন্তর্ভুক্ত করতে WhatsApp নম্বরে (<span className="font-bold font-mono text-emerald-800">{whatsappNumber}</span>) ফাইল সহ মেসেজ পাঠান।
              </p>
            </div>
          )}

          {/* Search Bar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs font-black text-slate-700">
              মোট নিবন্ধিত জিমেইল: <span className="text-blue-600">{toBengaliDigits(whitelistedEmails.length)}</span> টি
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="খুঁজুন (Search email)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 w-full sm:w-60"
              />
            </div>
          </div>

          {/* List of Whitelisted Emails */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {filteredEmails.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Mail size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">কোনো তালিকাভুক্ত জিমেইল আইডি পাওয়া যায়নি</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div 
                  key={email}
                  className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 font-mono">{email}</div>
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> আজীবন ফ্রি এক্সেস সক্রিয়
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`আপনি কি "${email}" এর এক্সেস বাতিল করতে চান?`)) {
                          onRemoveWhitelistedEmail(email);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="এক্সেস বাতিল করুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
