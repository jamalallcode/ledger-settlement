import React, { useState, useRef, useEffect } from 'react';
import { 
  Mail, X, FileText, Calendar, Hash, Banknote, BookOpen, 
  Inbox, Computer, User, CheckCircle2, Layout, Sparkles, 
  ListOrdered, ArrowRightCircle, ShieldCheck, AlertCircle, Trash, Search, ChevronDown, Check, Plus, CalendarRange
} from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';
import { getCycleForDate } from '../utils/cycleHelper';

interface CorrespondenceEntryModuleProps {
  onBackToMenu: () => void;
  isLayoutEditable?: boolean;
}

const CorrespondenceEntryModule: React.FC<CorrespondenceEntryModuleProps> = ({ onBackToMenu, isLayoutEditable }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [calculatedCycle, setCalculatedCycle] = useState<string>('');
  
  const [formData, setFormData] = useState({
    description: '',
    paraType: 'এসএফআই',
    letterType: 'বিএসআর',
    letterNo: '',
    letterDate: '',
    totalParas: '',
    totalAmount: '',
    diaryNo: '',
    diaryDate: '',
    receiptDate: '',
    digitalFileNo: '',
    presentationDate: '',
    sentParaCount: '',
    receiverName: '',
    receivedDate: '',
    isOnline: 'না'
  });

  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [receiverSuggestions, setReceiverSuggestions] = useState<string[]>([]);
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const receiverRef = useRef<HTMLDivElement>(null);

  // Load receiver names from localStorage on component mount
  useEffect(() => {
    const savedNames = localStorage.getItem('ledger_correspondence_receivers');
    if (savedNames) {
      setReceiverSuggestions(JSON.parse(savedNames));
    }
  }, []);

  // Calculate Cycle automatically when diaryDate changes
  useEffect(() => {
    if (formData.diaryDate) {
      try {
        const cycle = getCycleForDate(new Date(formData.diaryDate));
        setCalculatedCycle(toBengaliDigits(cycle.label));
      } catch (e) {
        setCalculatedCycle('');
      }
    } else {
      setCalculatedCycle('');
    }
  }, [formData.diaryDate]);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (receiverRef.current && !receiverRef.current.contains(event.target as Node)) {
        setShowReceiverDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNumericInput = (field: string, val: string) => {
    const bDigits = toBengaliDigits(val);
    setRawInputs(prev => ({ ...prev, [field]: bDigits }));
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save receiver name if it's new
    if (formData.receiverName.trim()) {
      const updatedNames = Array.from(new Set([formData.receiverName.trim(), ...receiverSuggestions]));
      setReceiverSuggestions(updatedNames);
      localStorage.setItem('ledger_correspondence_receivers', JSON.stringify(updatedNames));
    }

    setIsSuccess(true);
    
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setTimeout(() => {
      onBackToMenu();
    }, 2800);
  };

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    return (
      <span onClick={handleCopy} title="Click to copy ID" className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}>
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  const colWrapper = "p-5 rounded-2xl border bg-white transition-all hover:shadow-lg relative min-w-0";
  const inputCls = "w-full h-[52px] px-4 border border-slate-200 rounded-xl font-bold bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 shadow-sm transition-all text-[14px]";
  const labelCls = "block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-2";
  const numBadge = "inline-flex items-center justify-center w-5 h-5 bg-slate-900 text-white rounded-md text-[10px] font-black shadow-sm shrink-0";

  return (
    <div id="form-container-correspondence" className="bg-white p-4 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-landing-premium max-w-7xl mx-auto overflow-x-hidden relative">
      <IDBadge id="view-correspondence-form" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-slate-100 gap-4 relative">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={onBackToMenu}
            className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200 shrink-0">
            <Mail size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">প্রাপ্ত চিঠিপত্র ডাটা এন্ট্রি</h3>
            <p className="text-slate-500 font-bold text-sm">নতুন চিঠিপত্র এবং ডায়েরি এন্ট্রির জন্য এই ফরমটি ব্যবহার করুন</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isSuccess} className="space-y-8 border-none p-0 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Field 1 */}
            <div className={`${colWrapper} border-emerald-100 lg:col-span-2`}>
              <IDBadge id="corr-field-1" />
              <label className={labelCls}><span className={numBadge}>১</span> <FileText size={14} className="text-emerald-600" /> পত্রের বিবরণ নিরীক্ষা সালসহ:</label>
              <input 
                type="text" required className={inputCls} 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="বিবরণ লিখুন..."
              />
            </div>

            {/* Field 2 - Renamed to শাখার ধরণ */}
            <div className={`${colWrapper} border-blue-100`}>
              <IDBadge id="corr-field-2" />
              <label className={labelCls}><span className={numBadge}>২</span> <ShieldCheck size={14} className="text-blue-600" /> শাখার ধরণ:</label>
              <select 
                className={inputCls} value={formData.paraType}
                onChange={e => setFormData({...formData, paraType: e.target.value})}
              >
                <option value="এসএফআই">এসএফআই (SFI)</option>
                <option value="নন এসএফআই">নন এসএফআই (NON-SFI)</option>
              </select>
            </div>

            {/* New Field - ৩. পত্রের ধরণ */}
            <div className={`${colWrapper} border-indigo-100`}>
              <IDBadge id="corr-field-letter-type" />
              <label className={labelCls}><span className={numBadge}>৩</span> <FileText size={14} className="text-indigo-600" /> পত্রের ধরণ:</label>
              <select 
                className={inputCls} value={formData.letterType}
                onChange={e => setFormData({...formData, letterType: e.target.value})}
              >
                <option value="বিএসআর">বিএসআর (BSR)</option>
                <option value="দ্বিপক্ষীয় সভা">দ্বিপক্ষীয় সভা</option>
                <option value="ত্রিপক্ষীয় সভা">ত্রিপক্ষীয় সভা</option>
              </select>
            </div>

            {/* Field 4 - Letter No & Date (Previous 3) */}
            <div className={`${colWrapper} border-amber-100`}>
              <IDBadge id="corr-field-3" />
              <label className={labelCls}><span className={numBadge}>৪</span> <Hash size={14} className="text-amber-600" /> পত্র নং ও তারিখ:</label>
              <div className="flex items-center w-full h-[52px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-50 transition-all shadow-sm">
                <input 
                  type="text" placeholder="নং" 
                  className="flex-[2] min-w-0 h-full px-3 bg-transparent border-none font-bold outline-none text-[14px]" 
                  value={formData.letterNo} 
                  onChange={e => setFormData({...formData, letterNo: toBengaliDigits(e.target.value)})} 
                />
                <div className="w-[1.5px] h-6 bg-slate-200 shrink-0"></div>
                <input 
                  type="date" 
                  className="flex-[3] min-w-0 h-full px-2 bg-transparent border-none font-bold outline-none text-[13px] text-slate-700" 
                  value={formData.letterDate} 
                  onChange={e => setFormData({...formData, letterDate: e.target.value})} 
                />
              </div>
            </div>

            {/* Field 5 - Total Paras (Previous 4) */}
            <div className={`${colWrapper} border-purple-100`}>
              <IDBadge id="corr-field-4" />
              <label className={labelCls}><span className={numBadge}>৫</span> <ListOrdered size={14} className="text-purple-600" /> প্রেরিত মোট অনুচ্ছেদ সংখ্যা:</label>
              <input 
                type="text" className={inputCls} 
                value={rawInputs.totalParas || ''} onChange={e => handleNumericInput('totalParas', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field 6 - Total Amount (Previous 5) */}
            <div className={`${colWrapper} border-rose-100`}>
              <IDBadge id="corr-field-5" />
              <label className={labelCls}><span className={numBadge}>৬</span> <Banknote size={14} className="text-rose-600" /> মোট জড়িত টাকা:</label>
              <input 
                type="text" className={inputCls} 
                value={rawInputs.totalAmount || ''} onChange={e => handleNumericInput('totalAmount', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field 7 - Diary No & Date (Previous 6) */}
            <div className={`${colWrapper} border-emerald-100`}>
              <IDBadge id="corr-field-6" />
              <label className={labelCls}><span className={numBadge}>৭</span> <BookOpen size={14} className="text-emerald-600" /> ডায়েরি নং ও তারিখ:</label>
              <div className="space-y-2">
                <div className="flex items-center w-full h-[52px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50 transition-all shadow-sm">
                  <input 
                    type="text" placeholder="নং" 
                    className="flex-[2] min-w-0 h-full px-3 bg-transparent border-none font-bold outline-none text-[14px]" 
                    value={formData.diaryNo} 
                    onChange={e => setFormData({...formData, diaryNo: toBengaliDigits(e.target.value)})} 
                  />
                  <div className="w-[1.5px] h-6 bg-slate-200 shrink-0"></div>
                  <input 
                    type="date" 
                    className="flex-[3] min-w-0 h-full px-2 bg-transparent border-none font-bold outline-none text-[13px] text-slate-700" 
                    value={formData.diaryDate} 
                    onChange={e => setFormData({...formData, diaryDate: e.target.value})} 
                  />
                </div>
                {calculatedCycle && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 w-fit animate-in slide-in-from-top-1 duration-300">
                    <CalendarRange size={12} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">সাইকেল: {calculatedCycle}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Field 8 - Receipt Date (Previous 7) */}
            <div className={`${colWrapper} border-sky-100`}>
              <IDBadge id="corr-field-7" />
              <label className={labelCls}><span className={numBadge}>৮</span> <Inbox size={14} className="text-sky-600" /> শাখায় প্রাপ্তির তারিখ:</label>
              <input 
                type="date" className={inputCls} 
                value={formData.receiptDate} onChange={e => setFormData({...formData, receiptDate: e.target.value})}
              />
            </div>

            {/* Field 9 - Digital File No (Previous 8) */}
            <div className={`${colWrapper} border-indigo-100`}>
              <IDBadge id="corr-field-8" />
              <label className={labelCls}><span className={numBadge}>৯</span> <Computer size={14} className="text-indigo-600" /> ডিজিটাল নথি নং-:</label>
              <input 
                type="text" className={inputCls} 
                value={formData.digitalFileNo} onChange={e => setFormData({...formData, digitalFileNo: toBengaliDigits(e.target.value)})}
                placeholder="নথি নং লিখুন"
              />
            </div>

            {/* Field 10 - Presentation Date (Previous 9) */}
            <div className={`${colWrapper} border-orange-100`}>
              <IDBadge id="corr-field-9" />
              <label className={labelCls}><span className={numBadge}>১০</span> <Calendar size={14} className="text-orange-600" /> উপস্থাপনের তারিখ:</label>
              <input 
                type="date" className={inputCls} 
                value={formData.presentationDate} onChange={e => setFormData({...formData, presentationDate: e.target.value})}
              />
            </div>

            {/* Field 11 - Sent Para Count (Previous 10) */}
            <div className={`${colWrapper} border-teal-100`}>
              <IDBadge id="corr-field-10" />
              <label className={labelCls}><span className={numBadge}>১১</span> <ListOrdered size={14} className="text-teal-600" /> প্রেরিত অনুচ্ছেদ সংখ্যা:</label>
              <input 
                type="text" className={inputCls} 
                value={rawInputs.sentParaCount || ''} onChange={e => handleNumericInput('sentParaCount', e.target.value)}
                placeholder="০"
              />
            </div>

            {/* Field 12 - Receiver Name (Previous 11) */}
            <div className={`${colWrapper} border-slate-200`} ref={receiverRef}>
              <IDBadge id="corr-field-11" />
              <label className={labelCls}><span className={numBadge}>১২</span> <User size={14} className="text-slate-600" /> গৃহীতার নাম:</label>
              <div className="relative group">
                <input 
                  type="text" 
                  className={inputCls} 
                  value={formData.receiverName} 
                  onFocus={() => setShowReceiverDropdown(true)}
                  onChange={e => setFormData({...formData, receiverName: e.target.value})}
                  placeholder="নাম লিখুন বা তালিকা থেকে বাছুন"
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setShowReceiverDropdown(!showReceiverDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <ChevronDown size={18} className={`transition-transform duration-300 ${showReceiverDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showReceiverDropdown && receiverSuggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> পূর্ববর্তী নামসমূহ</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto no-scrollbar py-2">
                      {receiverSuggestions
                        .filter(name => name.toLowerCase().includes(formData.receiverName.toLowerCase()))
                        .map((name, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setFormData({...formData, receiverName: name});
                            setShowReceiverDropdown(false);
                          }}
                          className={`px-5 py-3 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${formData.receiverName === name ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-slate-700 font-bold'}`}
                        >
                          <span className="text-[13px]">{name}</span>
                          {formData.receiverName === name && <Check size={14} strokeWidth={3} className="animate-in zoom-in duration-300" />}
                        </div>
                      ))}
                      {receiverSuggestions.filter(name => name.toLowerCase().includes(formData.receiverName.toLowerCase())).length === 0 && (
                        <div className="px-5 py-6 text-center text-slate-400 font-bold text-xs italic">
                           কোনো নাম পাওয়া যায়নি
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Field 13 - Received Date (Previous 12) */}
            <div className={`${colWrapper} border-blue-100`}>
              <IDBadge id="corr-field-12" />
              <label className={labelCls}><span className={numBadge}>১৩</span> <Calendar size={14} className="text-blue-600" /> গ্রহণের তারিখ:</label>
              <input 
                type="date" className={inputCls} 
                value={formData.receivedDate} onChange={e => setFormData({...formData, receivedDate: e.target.value})}
              />
            </div>

            {/* Field 14 - Is Online (Previous 13) */}
            <div className={`${colWrapper} border-emerald-100`}>
              <IDBadge id="corr-field-13" />
              <label className={labelCls}><span className={numBadge}>১৪</span> <Computer size={14} className="text-emerald-600" /> অনলাইনে প্রাপ্তি:</label>
              <div className="flex gap-4 h-[52px] items-center px-2">
                <button 
                  type="button" onClick={() => setFormData({...formData, isOnline: 'হ্যাঁ'})}
                  className={`flex-1 h-full rounded-xl font-black text-sm transition-all border-2 ${formData.isOnline === 'হ্যাঁ' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >হ্যাঁ</button>
                <button 
                  type="button" onClick={() => setFormData({...formData, isOnline: 'না'})}
                  className={`flex-1 h-full rounded-xl font-black text-sm transition-all border-2 ${formData.isOnline === 'না' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                >না</button>
              </div>
            </div>

          </div>
        </fieldset>

        {/* Action Buttons */}
        <div className="pt-10 border-t border-slate-100 relative" ref={bottomRef}>
          {isSuccess ? (
            <div className="w-full py-10 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[3rem] flex flex-col items-center justify-center gap-5 animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-100/50">
               <div className="relative">
                  <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg animate-in spin-in-12 duration-700 border-4 border-white">
                     <CheckCircle2 size={48} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-emerald-100">
                     <Sparkles size={18} className="text-amber-500" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <h4 className="text-3xl font-black text-emerald-950 tracking-tight">চিঠিপত্র তথ্য সফলভাবে সংরক্ষিত হয়েছে</h4>
                  <p className="text-[15px] font-bold text-emerald-700 uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> আপনার ডাটাবেজে এন্ট্রিটি যুক্ত করা হয়েছে
                  </p>
               </div>
               <div className="flex flex-col items-center gap-3 mt-2">
                  <div className="h-1.5 w-64 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                     <div className="h-full bg-emerald-600 animate-progress-loading-premium"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter animate-pulse">অনুগ্রহ করে অপেক্ষা করুন... হোম পেজে রিডাইরেক্ট হচ্ছে</span>
               </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
               <button 
                  type="button" onClick={onBackToMenu}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-lg border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
               >বাতিল করুন</button>
               <button 
                  type="submit"
                  className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                 <CheckCircle2 size={24} /> তথ্য সংরক্ষণ করুন
               </button>
            </div>
          )}
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progress-loading-premium {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-loading-premium {
          animation: progress-loading-premium 2.8s linear forwards;
        }
      `}} />
    </div>
  );
};

export default CorrespondenceEntryModule;
