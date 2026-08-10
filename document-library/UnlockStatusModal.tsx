import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lock, Unlock, ShieldCheck, Sparkles, Plus, CheckCircle2, 
  Clock, AlertCircle, CreditCard, ChevronRight, X, User, Gift, Zap, MessageSquare, Mail, Search, Edit2, Check, FileSearch, HelpCircle, FileText
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface UnlockStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed: boolean;
  isAdmin?: boolean;
  whitelistedEmails: string[];
  currentUserEmail: string;
  sessionUserEmail?: string;
  onVerifyGmail: (email: string) => boolean | Promise<boolean>;
  onActivateSubscription: (trxId: string, phone: string) => void;
  onSetDemoState?: (state: { isSubscribed: boolean; isAdmin: boolean; demoEmail?: string }) => void;
  whatsappNumber?: string;
  paymentNumber?: string;
  onUpdatePaymentNumber?: (num: string) => void;
  existingDocuments?: any[];
  initialTab?: 'whatsapp' | 'dupcheck';
}

export const UnlockStatusModal: React.FC<UnlockStatusModalProps> = ({
  isOpen,
  onClose,
  isSubscribed,
  isAdmin = false,
  whitelistedEmails = [],
  currentUserEmail = '',
  sessionUserEmail = '',
  onVerifyGmail,
  onActivateSubscription,
  onSetDemoState,
  whatsappNumber,
  paymentNumber,
  onUpdatePaymentNumber,
  existingDocuments = [],
  initialTab = 'whatsapp'
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'dupcheck'>(initialTab === 'dupcheck' ? 'dupcheck' : 'whatsapp');

  const activeWaNum = whatsappNumber || paymentNumber || '01789-539494';
  const [isEditingWaNum, setIsEditingWaNum] = useState(false);
  const [tempWaNum, setTempWaNum] = useState(activeWaNum);

  useEffect(() => {
    setTempWaNum(activeWaNum);
  }, [activeWaNum]);

  // Sync activeTab if initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Email check state
  const [checkEmail, setCheckEmail] = useState(currentUserEmail);
  const [checkStatus, setCheckStatus] = useState<'none' | 'success' | 'failed'>('none');

  // Duplicate Checker State
  const [dupQuery, setDupQuery] = useState('');
  const [hasSearchedDup, setHasSearchedDup] = useState(false);

  // Duplicate matching logic
  const normalizeStr = (str: string) => {
    if (!str) return '';
    const bengaliToEngDigits = (s: string) => s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
    return bengaliToEngDigits(str.toLowerCase().trim());
  };

  const matchedDuplicateDocs = useMemo(() => {
    if (!dupQuery.trim()) return [];
    const q = normalizeStr(dupQuery);
    const words = q.split(/\s+/).filter(w => w.length > 1);

    return existingDocuments.filter((doc: any) => {
      const titleNorm = normalizeStr(doc.title || '');
      const memoNorm = normalizeStr(doc.memoNo || '');
      const authNorm = normalizeStr(doc.authority || '');
      const idNorm = normalizeStr(doc.archiveId || '');
      const descNorm = normalizeStr(doc.description || '');

      // Direct exact or substring match in memo or title
      if (memoNorm && q.length >= 2 && memoNorm.includes(q)) return true;
      if (titleNorm && q.length >= 2 && titleNorm.includes(q)) return true;
      if (idNorm && q.length >= 2 && idNorm.includes(q)) return true;

      // Multi-word phrase matching
      if (words.length > 0) {
        const matchCount = words.filter(w => 
          titleNorm.includes(w) || memoNorm.includes(w) || authNorm.includes(w) || descNorm.includes(w)
        ).length;
        if (words.length === 1 && matchCount >= 1) return true;
        if (words.length > 1 && matchCount >= Math.min(2, words.length)) return true;
      }

      return false;
    });
  }, [dupQuery, existingDocuments]);

  if (!isOpen) return null;

  const sessEmail = (sessionUserEmail || '').trim().toLowerCase();
  const currEmail = (currentUserEmail || '').trim().toLowerCase();
  const isWhitelisted = Boolean(
    currEmail &&
    (sessEmail ? currEmail === sessEmail : false) &&
    whitelistedEmails.some(e => e.toLowerCase() === currEmail)
  );
  const isFullyUnlocked = isAdmin || isSubscribed || isWhitelisted;

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail.trim()) return;
    const isMatched = await onVerifyGmail(checkEmail.trim());
    if (isMatched) {
      setCheckStatus('success');
    } else {
      setCheckStatus('failed');
    }
  };

  const cleanNum = (activeWaNum || '').replace(/[^0-9]/g, '');
  const formattedWaNum = cleanNum.startsWith('88') ? cleanNum : `88${cleanNum}`;
  const whatsappMessage = encodeURIComponent("নমস্কার, আমি অডিট ডকুমেন্ট লাইব্রেরির জন্য নতুন সার্কুলার/ডকুমেন্ট পাঠাচ্ছি।\n\nআমার জিমেইল আইডি:");
  const whatsappUrl = `https://wa.me/${formattedWaNum}?text=${whatsappMessage}`;

  const customWaMessage = encodeURIComponent(
    `নমস্কার, আমি অডিট লাইব্রেরিতে একটি নতুন নথি কন্ট্রিবিউট করতে চাই।\n\n` +
    `নথির বিবরণ/স্মারক নং: ${dupQuery.trim()}\n` +
    `আমার জিমেইল আইডি: ${currentUserEmail || ''}`
  );
  const customWaUrl = `https://wa.me/${formattedWaNum}?text=${customWaMessage}`;

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

              <div className="text-right flex flex-col items-end gap-1">
                {currEmail ? (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 font-mono">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    {currEmail}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-flex items-center gap-1.5">
                    ইমেইল যাচাইকরণ
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-3.5 px-4 font-black text-xs md:text-sm flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'whatsapp' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <MessageSquare size={16} className="text-emerald-600" /> WhatsApp কন্ট্রিবিউশন
          </button>
          <button
            onClick={() => setActiveTab('dupcheck')}
            className={`py-3.5 px-4 font-black text-xs md:text-sm flex items-center justify-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'dupcheck' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <FileSearch size={16} className="text-blue-600" /> 🔍 ডুপ্লিকেট চেকার
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
                  ২টি সার্কুলার পাঠান ও ৬ মাসের ফ্রি এক্সেস নিন (মেয়াদভিত্তিক কন্ট্রিবিউশন)
                </div>
                <p className="text-slate-700 text-xs md:text-sm font-medium leading-relaxed">
                  লাইব্রেরিকে সর্বদা হালনাগাদ রাখতে এবং মানসম্মত নথির সমৃদ্ধি বজায় রাখতে এই নীতি নির্ধারণ করা হয়েছে। আপনার সংগৃহীত অডিট নির্দেশিকা বা নতুন/পুরাতন প্রয়োজনীয় ২টি সরকারি সার্কুলার আপনার <strong>জিমেইল একাউন্ট (Gmail ID)</strong> সহ WhatsApp এ পাঠিয়ে দিন।
                </p>
                <div className="bg-white/80 p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                  <div className="font-black text-slate-900">📌 মেয়াদভিত্তিক এক্সেস নীতি:</div>
                  <ul className="space-y-1.5 pl-1 font-medium">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>২টি সার্কুলার/ডকুমেন্ট কন্ট্রিবিউট = ৬ মাসের ফ্রি এক্সেস:</strong> আপনার পাঠানো নতুন বা প্রয়োজনীয় ২টি সার্কুলার/ডকুমেন্ট যুক্ত হওয়ার সাথে সাথে আপনার Gmail আইডি ৬ মাসের জন্য আনলক হয়ে যাবে।</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>মেয়াদ নবায়ন:</strong> ৬ মাস অতিক্রান্ত হলে পরবর্তীতে যেকোনো সময় আরো ২টি প্রয়োজনীয় সার্কুলার কন্ট্রিবিউট করে পুনরায় পরবর্তী ৬ মাসের জন্য আনলক নবায়ন করা যাবে।</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quick Duplicate Checker Link Banner */}
              <div 
                onClick={() => setActiveTab('dupcheck')}
                className="p-3.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs font-bold text-blue-900 transition-all cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileSearch size={18} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>পাঠানোর আগে আপনার সার্কুলারটি লাইব্রেরিতে আছে কিনা ডুপ্লিকেট চেক করতে চান?</span>
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-black shrink-0 group-hover:bg-blue-700 transition-colors flex items-center gap-1">
                  চেক করুন <ChevronRight size={12} />
                </span>
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
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[11px] text-center font-bold text-slate-400">
                    WhatsApp নম্বর (এডমিন): <span className="text-emerald-600 font-mono font-black">{activeWaNum}</span>
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsEditingWaNum(!isEditingWaNum)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1 cursor-pointer"
                      title="এডমিন: WhatsApp নম্বর এডিট করুন"
                    >
                      <Edit2 size={12} /> {isEditingWaNum ? 'বাতিল' : 'এডিট'}
                    </button>
                  )}
                </div>

                {isAdmin && isEditingWaNum && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                    <div className="text-xs font-black text-blue-900 flex items-center justify-between">
                      <span>এডমিন: নতুন WhatsApp নম্বর সেট করুন:</span>
                      <button type="button" onClick={() => setIsEditingWaNum(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempWaNum}
                        onChange={e => setTempWaNum(e.target.value)}
                        placeholder="যেমন: 01712-345678"
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempWaNum.trim()) {
                            onUpdatePaymentNumber?.(tempWaNum.trim());
                            setIsEditingWaNum(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} /> সেভ করুন
                      </button>
                    </div>
                  </div>
                )}
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

          {/* TAB 2: DUPLICATE CHECKER TOOL */}
          {activeTab === 'dupcheck' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                  <FileSearch size={20} className="text-blue-600" />
                  ডকুমেন্ট ডুপ্লিকেট চেকার (নথি যাচাইকরণ)
                </div>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  আপনার কাছে থাকা সার্কুলার বা অফিস আদেশটি অডিট লাইব্রেরিতে পূর্বে থেকে সংরক্ষিত আছে কিনা তা পাঠানোর আগেই স্বয়ংক্রিয়ভাবে নিচে টাইপ করে পরীক্ষা করে নিন।
                </p>
              </div>

              {/* Duplicate Search Input Box */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  নথির শিরোনাম, স্মারক নম্বর (Memo No) বা বিষয়বস্তু লিখুন:
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                  <input 
                    type="text" 
                    value={dupQuery}
                    onChange={(e) => {
                      setDupQuery(e.target.value);
                      setHasSearchedDup(true);
                    }}
                    placeholder="যেমন: ০৭.০০.০০০০..., পেনশন নির্দেশিকা, সিএজি আদেশ..."
                    className="w-full pl-11 pr-24 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs md:text-sm outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                  />
                  {dupQuery && (
                    <button 
                      onClick={() => {
                        setDupQuery('');
                        setHasSearchedDup(false);
                      }}
                      className="absolute right-3 px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md transition-colors"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>

                {/* Sample Search Tag Chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-slate-500">
                  <span className="text-slate-400">ট্রাই করুন:</span>
                  {['পেনশন', 'সার্কুলার', 'গেজেট', 'অর্থ বিভাগ', 'ভাতা'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setDupQuery(tag);
                        setHasSearchedDup(true);
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results Display */}
              {dupQuery.trim().length > 0 ? (
                matchedDuplicateDocs.length > 0 ? (
                  /* Duplicate Found Alert */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5 text-rose-900">
                      <div className="flex items-center gap-2 font-black text-sm text-rose-700">
                        <AlertCircle size={18} className="shrink-0" />
                        ডকুমেন্টটি ইতিমধ্যে লাইব্রেরিতে বিদ্যমান! ({toBengaliDigits(matchedDuplicateDocs.length)} টি মিল পাওয়া গেছে)
                      </div>
                      <p className="text-xs font-medium text-rose-800 leading-relaxed">
                        সতর্কতা: আপনার সার্চের স্মারক নম্বর/শিরোনামের সাথে মিল রেখে লাইব্রেরিতে নথি পাওয়া গেছে। এই নথিটি পুনরায় পাঠানোর প্রয়োজন নেই। অনুগ্রহ করে আপনার সংগ্রহের অন্য কোনো ভিন্ন সার্কুলার/নথি পাঠান।
                      </p>
                    </div>

                    {/* List of Matched Duplicate Documents */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {matchedDuplicateDocs.map((doc: any, idx: number) => (
                        <div key={doc.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-black text-slate-900 text-xs md:text-sm">{doc.title}</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-black shrink-0">
                              {doc.category || 'সার্কুলার'}
                            </span>
                          </div>
                          {doc.memoNo && (
                            <div className="text-slate-600 font-mono text-[11px]">
                              স্মারক নম্বর: <span className="font-bold text-blue-700">{doc.memoNo}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span>{doc.authority || 'সরকারি কর্তৃপক্ষ'}</span>
                            <span>{doc.docDate || 'তারিখ নথিভুক্ত'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Unique / No Duplicate Found */
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-emerald-950 text-sm md:text-base">
                          নতুন ও ইউনিক নথি! লাইব্রেরিতে খুঁজে পাওয়া যায়নি
                        </h4>
                        <p className="text-emerald-800 text-xs font-medium leading-relaxed">
                          অভিনন্দন! আপনার টাইপকৃত স্মারক নম্বর/শিরোনামের কোনো নথি বর্তমানে সংরক্ষণাগারে নিবন্ধিত নেই। এটি একটি সম্পূর্ণ নতুন সার্কুলার হতে পারে।
                        </p>
                      </div>
                    </div>

                    <a
                      href={customWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs md:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <MessageSquare size={18} /> WhatsApp এ সরাসরি এই নতুন ফাইলটি পাঠান
                    </a>
                  </div>
                )
              ) : (
                /* Initial Prompt State */
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <FileSearch size={24} />
                  </div>
                  <h4 className="font-black text-slate-800 text-sm">ডুপ্লিকেট নথি অনুসন্ধান টিপস</h4>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    উপরে আপনার সংগৃহীত সার্কুলারের স্মারক নম্বর (যেমন: ০৭.০০.০০০০) অথবা শিরোনামের কয়েকটি শব্দ লিখে যাচাই করুন।
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

