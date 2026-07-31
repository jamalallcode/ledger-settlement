import React, { useState } from 'react';
import { 
  Lock, Unlock, ShieldCheck, Sparkles, Plus, CheckCircle2, 
  Clock, AlertCircle, CreditCard, ChevronRight, X, User, Gift, Zap
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface UnlockStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedCount: number;
  pendingCount: number;
  isSubscribed: boolean;
  isAdmin?: boolean;
  onOpenUpload: () => void;
  onActivateSubscription: (trxId: string, phone: string) => void;
  onSetDemoState?: (state: { approvedCount: number; isSubscribed: boolean; isAdmin: boolean }) => void;
}

export const UnlockStatusModal: React.FC<UnlockStatusModalProps> = ({
  isOpen,
  onClose,
  approvedCount,
  pendingCount,
  isSubscribed,
  isAdmin = false,
  onOpenUpload,
  onActivateSubscription,
  onSetDemoState
}) => {
  const [activeTab, setActiveTab] = useState<'contribute' | 'subscribe' | 'demo'>('contribute');
  const [trxId, setTrxId] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  if (!isOpen) return null;

  const targetCount = 5;
  const isUnlockedByContribution = approvedCount >= targetCount;
  const isFullyUnlocked = isAdmin || isSubscribed || isUnlockedByContribution;
  const progressPercent = Math.min(100, Math.round((approvedCount / targetCount) * 100));

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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
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
              কনট্রিবিউট করে আজীবন ফ্রি এক্সেস পান অথবা নামমাত্র ফি দিয়ে সাবস্ক্রিপশন সক্রিয় করুন।
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
                      <span className="text-blue-300">অ্যাডমিন (সকল ফাইল আনলকড)</span>
                    ) : isSubscribed ? (
                      <span className="text-emerald-400">মাসিক সাবস্ক্রিপশন (সক্রিয়)</span>
                    ) : isUnlockedByContribution ? (
                      <span className="text-emerald-400">কন্ট্রিবিউটর (আজীবন ফ্রি আনলকড)</span>
                    ) : (
                      <span className="text-amber-300">সীমিত এক্সেস (লকড)</span>
                    )}
                  </div>
                </div>
              </div>

              {!isFullyUnlocked && (
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30 inline-block">
                    অগ্রগতি: {toBengaliDigits(approvedCount)}/{toBengaliDigits(targetCount)} টি
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('contribute')}
            className={`flex-1 py-3.5 px-4 font-black text-xs md:text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'contribute' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Gift size={16} /> ফ্রি কনট্রিবিউশন
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

          {/* TAB 1: CONTRIBUTE */}
          {activeTab === 'contribute' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
                  কন্ট্রিবিউটর এক্সেস নীতি (আজীবন ফ্রি)
                </div>
                <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed">
                  আপনি কমপক্ষে <strong>৫টি সরকারি সার্কুলার/অডিট গাইডলাইন</strong> ফাইল লাইব্রেরিতে আপলোড করলে এবং অ্যাডমিন কর্তৃক অনুমোদিত হলে আপনার জন্য অডিট লাইব্রেরির সব ফাইল <strong>আজীবন ১০০% ফ্রি</strong> আনলক হয়ে যাবে।
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-700">অনুমোদিত আপলোডের অগ্রগতি:</span>
                  <span className="text-blue-600">{toBengaliDigits(approvedCount)} / {toBengaliDigits(targetCount)} টি</span>
                </div>
                
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-1">
                  <span>০টি ফাইল</span>
                  <span>{pendingCount > 0 ? `অপেক্ষমান (Pending): ${toBengaliDigits(pendingCount)}টি` : 'অপেক্ষমান: ০টি'}</span>
                  <span>৫টি ফাইল (ফ্রি আনলক)</span>
                </div>
              </div>

              {/* Benefits list */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">কনট্রিবিউটরের সুবিধাসমূহ:</h4>
                <ul className="space-y-2 text-xs md:text-sm font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    সকল সরকারি সার্কুলার ও গ্যাজেট সরাসরি নতুন ট্যাবে ফুলস্ক্রিন রিড মোড।
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    সরাসরি হাই-স্পিড PDF ডাউনলোড সুবিধা।
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    অডিট নোটে ব্যবহারের জন্য ১-ক্লিকে অটোমেটিক সাইটেশন (Citation) কপি।
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpload();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Plus size={18} /> নতুন অডিট সার্কুলার/ডকুমেন্ট জমা দিন
                </button>
              </div>
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
                      <p className="text-xs font-bold text-slate-500">কোনো ফাইল আপলোড না করেই instant সকল ডকুমেন্ট এক্সেস করুন।</p>
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
                    onClick={() => onSetDemoState({ approvedCount: 0, isSubscribed: false, isAdmin: false })}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left font-bold text-xs transition-all space-y-1"
                  >
                    <div className="font-black text-slate-900 flex items-center gap-2">
                      <Lock size={14} className="text-amber-500" /> সাধারণ ইউজার (০টি ফাইল)
                    </div>
                    <div className="text-slate-500 text-[11px]">লাইব্রেরি ফাইল লকড দেখাবে</div>
                  </button>

                  <button
                    onClick={() => onSetDemoState({ approvedCount: 3, isSubscribed: false, isAdmin: false })}
                    className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-200 rounded-xl text-left font-bold text-xs transition-all space-y-1"
                  >
                    <div className="font-black text-blue-900 flex items-center gap-2">
                      <Clock size={14} className="text-blue-600" /> কন্ট্রিবিউটর (৩টি অনুমোদিত)
                    </div>
                    <div className="text-slate-500 text-[11px]">অগ্রগতি ৬০% দেখাবে</div>
                  </button>

                  <button
                    onClick={() => onSetDemoState({ approvedCount: 5, isSubscribed: false, isAdmin: false })}
                    className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-left font-bold text-xs transition-all space-y-1"
                  >
                    <div className="font-black text-emerald-900 flex items-center gap-2">
                      <Unlock size={14} className="text-emerald-600" /> আজীবন ফ্রি আনলক (৫টি ফাইল)
                    </div>
                    <div className="text-slate-500 text-[11px]">সকল ফিচার ফ্রি আনলকড</div>
                  </button>

                  <button
                    onClick={() => onSetDemoState({ approvedCount: 0, isSubscribed: true, isAdmin: false })}
                    className="p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-left font-bold text-xs transition-all space-y-1"
                  >
                    <div className="font-black text-indigo-900 flex items-center gap-2">
                      <CreditCard size={14} className="text-indigo-600" /> মাসিক সাবস্ক্রাইবার
                    </div>
                    <div className="text-slate-500 text-[11px]">৳১৯৯ সাবস্ক্রিপশন সক্রিয়</div>
                  </button>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-black transition-all"
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
