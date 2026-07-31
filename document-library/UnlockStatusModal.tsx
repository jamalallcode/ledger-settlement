import React, { useState } from 'react';
import { 
  Lock, Unlock, ShieldCheck, Sparkles, Plus, CheckCircle2, 
  Clock, AlertCircle, CreditCard, ChevronRight, X, User, Gift, Zap, MessageSquare, Mail, Search
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
  whatsappNumber = '8801712345678'
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'subscribe' | 'demo'>('whatsapp');
  const [trxId, setTrxId] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

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

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim() || !phone.trim()) {
      alert('অনুগ্রহ করে আপনার মোবাইল নম্বর এবং ট্রানজেকশন আইডি (TrxID) প্রদান করুন।');
      return;
    }
    setIsSubmittingPay(true);
    setTimeout(() => {
      onActivateSubscription(trxId, phone);
      setIsSubmittingPay(false);
      setPaySuccess(true);
    }, 1000);
  };

  const whatsappMessage = encodeURIComponent("নমস্কার, আমি অডিট ডকুমেন্ট লাইব্রেরির জন্য একটি নতুন সার্কুলার/ডকুমেন্ট পাঠাচ্ছি।\n\nআমার জিমেইল আইডি:");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <ShieldCheck size={180} />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles size={14} /> এক্সেস ব্যবস্থাপনা ও সাবস্ক্রিপশন
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              অডিট ডকুমেন্ট লাইব্রেরি আনলক করুন
            </h2>
            
            <p className="text-slate-300 text-sm font-medium max-w-lg leading-relaxed">
              WhatsApp এ সার্কুলার ও Gmail পাঠিয়ে আজীবন ফ্রি এক্সেস নিন অথবা নামমাত্র ফি দিয়ে সাবস্ক্রিপশন সক্রিয় করুন।
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
                    ) : isSubscribed ? (
                      <span className="text-emerald-400">মাসিক সাবস্ক্রিপশন (সক্রিয়)</span>
                    ) : isWhitelisted ? (
                      <span className="text-emerald-400">নিবন্ধিত কন্ট্রিবিউটর (আজীবন ফ্রি আনলকড)</span>
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
            <MessageSquare size={16} className="text-emerald-600" /> WhatsApp কন্ট্রিবিউশন (ফ্রি)
          </button>
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`flex-1 py-3.5 px-4 font-black text-xs md:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'subscribe' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <CreditCard size={16} /> মাসিক সাবস্ক্রিপশন (৳১৯৯)
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
                  WhatsApp এ ফাইল পাঠান ও আজীবন ফ্রি এক্সেস নিন
                </div>
                <p className="text-slate-700 text-xs md:text-sm font-medium leading-relaxed">
                  আপনাকে কোনো ফাইল সরাসরি ওয়েবসাইটে আপলোড করার কষ্ট করতে হবে না। আপনার সংগৃহীত সরকারি সার্কুলার, অফিস আদেশ বা অডিট রেফারেন্স ডকুমেন্টটি আপনার <strong>জিমেইল একাউন্ট (Gmail ID)</strong> সহ আমাদের WhatsApp এ পাঠিয়ে দিন।
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-slate-600 space-y-1">
                  <div className="font-black text-slate-800">📌 কীভাবে কাজ করে:</div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 font-medium">
                    <li>WhatsApp নম্বরে ডকুমেন্ট ও আপনার Gmail আইডি পাঠান।</li>
                    <li>অ্যাডমিন যাচাই করবেন ডকুমেন্টটি পূর্বে লাইব্রেরিতে আছে কি না।</li>
                    <li>ডুপ্লিকেট না হলে অ্যাডমিন আপলোড করবেন এবং আপনার Gmail আইডিটি <strong>আজীবন ফ্রি এক্সেস</strong> প্রদান করবেন।</li>
                  </ol>
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
                  WhatsApp নম্বর: <span className="text-emerald-600 font-mono">01712-345678</span>
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
                    এই জিমেইল আইডিটি এখনো তালিকাভুক্ত হয়নি। অনুগ্রহ করে WhatsApp এ তথ্য পাঠান অথবা সাবস্ক্রিপশন সক্রিয় করুন।
                  </div>
                )}
              </form>

            </div>
          )}

          {/* TAB 2: SUBSCRIBE */}
          {activeTab === 'subscribe' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {paySuccess ? (
                <div className="text-center py-8 space-y-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-900">সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে!</h3>
                  <p className="text-emerald-700 text-sm font-medium">
                    আপনার ৩০ দিনের জন্য অডিট ডকুমেন্ট লাইব্রেরির সকল ফাইল আনলক করা হলো। ধন্যবাদ!
                  </p>
                  <button
                    onClick={() => {
                      setPaySuccess(false);
                      onClose();
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    লাইব্রেরি ব্রাউজ করুন
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">মাসিক প্রিমিয়াম পাস</span>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">৳ ১৯৯ / মাস</h3>
                      <p className="text-xs font-bold text-slate-500">কোনো ফাইল না পাঠিয়েই instant সকল ডকুমেন্ট এক্সেস করুন।</p>
                    </div>
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                      <CreditCard size={28} />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <form onSubmit={handleSubscribeSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider">পেমেন্ট মাধ্যম সিলেক্ট করুন:</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bkash')}
                          className={`p-3 rounded-xl border-2 font-black text-xs transition-all flex flex-col items-center gap-1 ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50/50 text-pink-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                        >
                          <span className="w-3 h-3 rounded-full bg-pink-600 inline-block"></span>
                          বিকাশ (bKash)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('nagad')}
                          className={`p-3 rounded-xl border-2 font-black text-xs transition-all flex flex-col items-center gap-1 ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50/50 text-orange-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                        >
                          <span className="w-3 h-3 rounded-full bg-orange-600 inline-block"></span>
                          নগদ (Nagad)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('rocket')}
                          className={`p-3 rounded-xl border-2 font-black text-xs transition-all flex flex-col items-center gap-1 ${paymentMethod === 'rocket' ? 'border-purple-500 bg-purple-50/50 text-purple-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                        >
                          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                          রকেট (Rocket)
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-bold text-slate-700">
                      <div className="flex items-center justify-between text-slate-900 font-black">
                        <span>সেন্ড মানি নম্বর (Personal):</span>
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-mono">01712-345678</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        * উল্লেখিত নম্বরে ১৯৯ টাকা সেন্ড মানি (Send Money) করে নিচে আপনার মোবাইল নম্বর ও প্রাপ্ত TrxID প্রদান করুন।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-600">আপনার মোবাইল নম্বর</label>
                        <input 
                          type="text" 
                          required
                          placeholder="017XXXXXXXX"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-600">ট্রানজেকশন আইডি (TrxID)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. 9J28XKLM"
                          value={trxId}
                          onChange={e => setTrxId(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingPay}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      {isSubmittingPay ? 'পেমেন্ট যাচাই করা হচ্ছে...' : 'সাবস্ক্রিপশন নিশ্চিত ও আনলক করুন'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* TAB 3: DEMO SIMULATOR */}
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
                    onClick={() => onSetDemoState({ isSubscribed: true, isAdmin: false })}
                    className="p-4 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-left font-bold text-xs transition-all space-y-1 cursor-pointer"
                  >
                    <div className="font-black text-indigo-900 flex items-center gap-2">
                      <CreditCard size={14} className="text-indigo-600" /> মাসিক সাবস্ক্রাইবার
                    </div>
                    <div className="text-slate-500 text-[11px]">৳১৯৯ সাবস্ক্রিপশন সক্রিয়</div>
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
