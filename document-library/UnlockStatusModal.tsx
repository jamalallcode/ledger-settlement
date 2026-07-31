import React, { useState } from 'react';
import { 
  Lock, Unlock, ShieldCheck, Sparkles, Plus, CheckCircle2, 
  Clock, AlertCircle, CreditCard, ChevronRight, X, User, Gift, Zap, MessageSquare, Mail, Search, Edit2, Check
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface UnlockStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed: boolean;
  isAdmin?: boolean;
  whitelistedEmails: string[];
  currentUserEmail: string;
  onVerifyGmail: (email: string) => boolean;
  onActivateSubscription: (trxId: string, phone: string) => void;
  onSetDemoState?: (state: { isSubscribed: boolean; isAdmin: boolean; demoEmail?: string }) => void;
  whatsappNumber?: string;
  paymentNumber?: string;
  onUpdatePaymentNumber?: (num: string) => void;
}

export const UnlockStatusModal: React.FC<UnlockStatusModalProps> = ({
  isOpen,
  onClose,
  isSubscribed,
  isAdmin = false,
  whitelistedEmails = [],
  currentUserEmail = '',
  onVerifyGmail,
  onActivateSubscription,
  onSetDemoState,
  whatsappNumber = '01712-345678',
  paymentNumber = '01712-345678',
  onUpdatePaymentNumber
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'demo'>('whatsapp');

  // Email check state
  const [checkEmail, setCheckEmail] = useState(currentUserEmail);
  const [checkStatus, setCheckStatus] = useState<'none' | 'success' | 'failed'>('none');

  if (!isOpen) return null;

  const isWhitelisted = whitelistedEmails.some(e => e.toLowerCase() === currentUserEmail.toLowerCase());
  const isFullyUnlocked = isAdmin || isSubscribed || isWhitelisted;

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail.trim()) return;
    const isMatched = onVerifyGmail(checkEmail.trim());
    if (isMatched) {
      setCheckStatus('success');
    } else {
      setCheckStatus('failed');
    }
  };

  const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
  const formattedWaNum = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
  const whatsappMessage = encodeURIComponent("নমস্কার, আমি অডিট ডকুমেন্ট লাইব্রেরির জন্য একটি নতুন সার্কুলার/ডকুমেন্ট পাঠাচ্ছি।\n\nআমার জিমেইল আইডি:");
  const whatsappUrl = `https://wa.me/${formattedWaNum}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-16 md:pt-20 pb-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <ShieldCheck size={180} />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/10 shadow-lg flex items-center justify-center shrink-0"
            title="বন্ধ করুন"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles size={14} /> এক্সেস ব্যবস্থাপনা ও আনলক
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              অডিট ডকুমেন্ট লাইব্রেরি আনলক করুন
            </h2>
            
            <p className="text-slate-300 text-sm font-medium max-w-lg leading-relaxed">
              WhatsApp এ সার্কুলার/ডকুমেন্ট ও আপনার Gmail আইডি পাঠিয়ে সম্পূর্ণ বিনামূল্যে ৬ মাসের জন্য লাইব্রেরির পূর্ণাঙ্গ এক্সেস উপভোগ করুন।
            </p>

            {/* Current Status Box */}
            <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isFullyUnlocked ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'}`}>
                  {isFullyUnlocked ? <Unlock size={22} /> : <Lock size={22} />}
                </div>
                <div>
                  <div className="text-xs text-slate-300 font-bold">আপনার বর্তমান স্ট্যাটাস:</div>
                  <div className="text-base font-black text-white">
                    {isAdmin ? (
                      <span className="text-blue-300">অ্যাডমিন (সকল ফাইল উন্মুক্ত)</span>
                    ) : isFullyUnlocked ? (
                      <span className="text-emerald-400">নিবন্ধিত কন্ট্রিবিউটর (৬ মাস ফ্রি এক্সেস সক্রিয়)</span>
                    ) : (
                      <span className="text-amber-300">সীমিত এক্সেস (লকড)</span>
                    )}
                  </div>
                </div>
              </div>

              {currentUserEmail && (
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-block font-mono">
                    {currentUserEmail}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-3.5 px-4 font-black text-xs md:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'whatsapp' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <MessageSquare size={16} className="text-emerald-600" /> WhatsApp কন্ট্রিবিউশন (ফ্রি আনলক)
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-3.5 px-4 font-black text-xs flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'demo' ? 'border-slate-800 text-slate-900 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
          >
            <Zap size={14} /> টেস্ট ডেমো
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8 space-y-6">

          {/* TAB 1: WHATSAPP CONTRIBUTION */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* How it works info banner */}
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  নতুন সার্কুলার পাঠান ও ৬ মাসের ফ্রি এক্সেস নিন (মেয়াদভিত্তিক কন্ট্রিবিউশন)
                </div>
                <p className="text-slate-700 text-xs md:text-sm font-medium leading-relaxed">
                  লাইব্রেরিকে সর্বদা হালনাগাদ রাখতে এবং মানসম্মত নথির প্রবাহ বজায় রাখতে এই কন্ট্রিবিউশন পদ্ধতি নির্ধারণ করা হয়েছে। আপনার সংগৃহীত অডিট নির্দেশিকা বা নতুন সরকারি সার্কুলারটি আপনার <strong>জিমেইল একাউন্ট (Gmail ID)</strong> সহ WhatsApp এ পাঠিয়ে দিন।
                </p>
                <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                  <div className="font-black text-slate-900">📌 মেয়াদভিত্তিক এক্সেস নীতি:</div>
                  <ul className="space-y-1.5 pl-1 font-medium">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>১টি নথি কন্ট্রিবিউট = ৬ মাসের ফ্রি এক্সেস:</strong> আপনার পাঠানো নতুন সার্কুলার/ডকুমেন্টটি যুক্ত হওয়ার সাথে সাথে আপনার Gmail আইডি ৬ মাসের জন্য আনলক হয়ে যাবে।</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>মেয়াদ নবায়ন:</strong> ৬ মাস অতিক্রান্ত হলে পরবর্তীতে যেকোনো সময় আরেকটি নতুন নথি কন্ট্রিবিউট করে পুনরায় পরবর্তী ৬ মাসের জন্য আনলক বাড়াতে পারবেন।</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Direct WhatsApp Action Button */}
              <div className="space-y-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
                >
                  <MessageSquare size={20} /> WhatsApp এ ডকুমেন্ট ও Gmail পাঠান
                </a>
                <p className="text-[11px] text-center font-bold text-slate-400">
                  WhatsApp নম্বর: <span className="text-emerald-600 font-mono font-black">{whatsappNumber}</span>
                </p>
              </div>

              <div className="h-px bg-slate-100 w-full my-2"></div>

              {/* Verify Gmail Form */}
              <form onSubmit={handleVerifySubmit} className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Mail size={14} className="text-blue-600" /> আপনার নিবন্ধিত জিমেইল আইডি (Gmail) দিয়ে এক্সেস যাচাই করুন:
                </label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    required
                    placeholder="আপনার জিমেইল লিখুন (যেমন: user@gmail.com)"
                    value={checkEmail}
                    onChange={e => {
                      setCheckEmail(e.target.value);
                      setCheckStatus('none');
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all shrink-0 cursor-pointer"
                  >
                    যাচাই করুন
                  </button>
                </div>

                {checkStatus === 'success' && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    আপনার জিমেইল আইডি সফলভাবে অনুমোদিত হয়েছে! সব ডকুমেন্ট আনলক করা হয়েছে।
                  </div>
                )}

                {checkStatus === 'failed' && (
                  <div className="p-3 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-2 border border-amber-200 animate-in fade-in">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    এই জিমেইল আইডিটি এখনো তালিকাভুক্ত হয়নি। অনুগ্রহ করে WhatsApp এ আপনার ডকুমেন্ট ও Gmail আইডি পাঠান।
                  </div>
                )}
              </form>

            </div>
          )}

          {/* TAB 2: DEMO SIMULATOR */}
          {activeTab === 'demo' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-bold text-amber-800 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  পরীক্ষা করার সুবিধার্থে এখান থেকে তাৎক্ষণিকভাবে বিভিন্ন ইউজার রোল ও এক্সেস মোড ট্রাই করতে পারেন।
                </span>
              </div>

              {onSetDemoState && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => onSetDemoState({ isSubscribed: false, isAdmin: false, demoEmail: '' })}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left font-bold text-xs transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-black text-slate-900 flex items-center gap-2">
                      <Lock size={14} className="text-amber-500" /> সাধারণ ভিজিটর (অনুমোদন ছাড়া)
                    </div>
                    <div className="text-slate-500 text-[11px]">লাইব্রেরি ফাইল লকড দেখাবে</div>
                  </button>

                  <button
                    onClick={() => onSetDemoState({ isSubscribed: false, isAdmin: false, demoEmail: 'user@gmail.com' })}
                    className="p-4 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-left font-bold text-xs transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-black text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600" /> Whitelisted Gmail (ফ্রি আনলকড)
                    </div>
                    <div className="text-slate-500 text-[11px]">user@gmail.com দিয়ে আনলকড</div>
                  </button>

                  <button
                    onClick={() => onSetDemoState({ isSubscribed: false, isAdmin: true })}
                    className="p-4 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-xl text-left font-bold text-xs transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-black text-blue-900 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-blue-600" /> অ্যাডমিন মোড
                    </div>
                    <div className="text-slate-500 text-[11px]">ফাইল যোগ ও Gmail রেজিস্টার করার সুবিধা</div>
                  </button>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-black transition-all cursor-pointer"
                >
                  উইন্ডো বন্ধ করুন
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
