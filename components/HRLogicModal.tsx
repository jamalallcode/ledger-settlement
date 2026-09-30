import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface HRLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle?: string;
  selectedMinistry?: string;
  cyclePeriod?: {
    rangeLine1: string;
    rangeLine2: string;
    prevRangeLine1: string;
    prevRangeLine2: string;
    currRangeLine1: string;
    currRangeLine2: string;
  };
}

export const HRLogicModal: React.FC<HRLogicModalProps> = ({
  isOpen,
  onClose,
  reportTitle = 'ষাণ্মাসিক রিটার্ন',
  selectedMinistry = '',
  cyclePeriod
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleAppGoBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('app:goback', handleAppGoBack);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app:goback', handleAppGoBack);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-300 overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <Calculator className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                সংখ্যা বসানোর লজিক ও হিসাবের সূত্রাবলি
              </h2>
              <p className="text-[11px] text-blue-200">
                {reportTitle} {selectedMinistry ? `• ${selectedMinistry}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-[12px] leading-relaxed">
          {/* Section 1: Cycle Period */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl">
            <h3 className="font-bold text-blue-900 text-[13px] flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
              ১. ৬ মাস ভিত্তিক সময়কাল নির্ধারণের লজিক:
            </h3>
            <p className="text-slate-700 mb-2">
              সরকারি বিধি অনুযায়ী এটি মাসিক নয়, বরং <strong>৬ মাস ভিত্তিক (ষাণ্মাসিক)</strong> চক্র অনুযায়ী প্রস্তুতকৃত:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-blue-200 shadow-2xs">
                <span className="text-slate-500 font-medium block">প্রারম্ভিক জের (কলাম ৩-৪)</span>
                <span className="font-extrabold text-slate-900 block mt-0.5">
                  {cyclePeriod?.prevRangeLine1 || '১৫/০১/২০২৬ পর্যন্ত'}
                </span>
                <span className="text-[10px] text-slate-600">
                  “{cyclePeriod?.prevRangeLine2 || 'ডিসেম্বর/২৫ পর্যন্ত'}”
                </span>
              </div>
              <div className="p-2 bg-blue-600 text-white rounded-lg border border-blue-700 shadow-2xs">
                <span className="text-blue-100 font-medium block">আলোচ্য ষাণ্মাসিক (কলাম ৫-৮)</span>
                <span className="font-extrabold text-white block mt-0.5">
                  {cyclePeriod?.rangeLine1 || '১৬/০১/২০২৬ হতে ১৫/০৬/২০২৬'}
                </span>
                <span className="text-[10px] text-blue-100 font-bold">
                  “{cyclePeriod?.rangeLine2 || 'জানুয়ারি/২৬ হতে জুন/২৬'}”
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-blue-200 shadow-2xs">
                <span className="text-slate-500 font-medium block">সমাপনী অনিষ্পন্ন (কলাম ৯-১০)</span>
                <span className="font-extrabold text-slate-900 block mt-0.5">
                  {cyclePeriod?.currRangeLine1 || '১৫/০৬/২০২৬ পর্যন্ত অনিষ্পন্ন'}
                </span>
                <span className="text-[10px] text-slate-600">
                  “{cyclePeriod?.currRangeLine2 || 'জুন/২৬ পর্যন্ত'}”
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Columns & Mathematical Formulas */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={15} className="text-slate-700" />
              ২. কলামভিত্তিক তথ্যের বিন্যাস ও গাণিতিক সূত্র:
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-3 bg-white hover:bg-slate-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ১ ও ২
                </span>
                <div>
                  <span className="font-bold text-slate-900">ক্রমিক নং ও আপত্তির শ্রেণীবিন্যাস:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    সরকারি অডিট ডিরেক্টরেটের নির্ধারিত ৭টি প্রমিত ক্যাটাগরি (চুরি, আত্মসাৎ, ঘাটতি, অপচয়, বিধি বহির্ভূত পরিশোধ, সরকারি অর্থ আদায়ে ব্যর্থতা, অন্যান্য অনিয়ম)।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white hover:bg-slate-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ৩ ও ৪
                </span>
                <div>
                  <span className="font-bold text-slate-900">প্রারম্ভিক জের (পূর্ববর্তী ৬ মাস পর্যন্ত অবশিষ্ট):</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    <strong>কলাম ৩:</strong> পূর্ববর্তী ষাণ্মাসিক পর্যন্ত অনিষ্পন্ন আপত্তির প্রারম্ভিক সংখ্যা।<br/>
                    <strong>কলাম ৪:</strong> উক্ত আপত্তিসমূহে জড়িত মোট টাকার পরিমাণ (কোটি টাকায়)।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white hover:bg-slate-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ৫ ও ৬
                </span>
                <div>
                  <span className="font-bold text-slate-900">আলোচ্য ৬ মাসে নতুন উত্থাপিত আপত্তি:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    <strong>কলাম ৫:</strong> সংশ্লিষ্ট ৬ মাসে মন্ত্রণালয়ের আওতাধীন সংস্থাসমূহে নিরীক্ষাকালে নতুন উত্থাপিত আপত্তির সংখ্যা।<br/>
                    <strong>কলাম ৬:</strong> উত্থাপিত আপত্তিসমূহে জড়িত মোট টাকার পরিমাণ (কোটি টাকায়)।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white hover:bg-slate-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ৭ ও ৮
                </span>
                <div>
                  <span className="font-bold text-slate-900">আলোচ্য ৬ মাসে নিষ্পত্তি / আদায়:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    <strong>কলাম ৭:</strong> দ্বিপক্ষীয়/ত্রিপক্ষীয় সভা বা জবাব পর্যালোচনার মাধ্যমে নিষ্পন্ন আপত্তির সংখ্যা।<br/>
                    <strong>কলাম ৮:</strong> নিষ্পত্তির মাধ্যমে আদায় বা সমন্বিত মোট টাকার পরিমাণ (কোটি টাকায়)।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 hover:bg-blue-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ৯
                </span>
                <div>
                  <span className="font-extrabold text-blue-950">ষাণ্মাসিক শেষে অনিষ্পন্ন আপত্তির সংখ্যা:</span>
                  <div className="inline-block mt-1 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-indigo-900 text-[11.5px]">
                    সূত্র: কলাম ৯ = (কলাম ৩ + কলাম ৫) - কলাম ৭
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    (প্রারম্ভিক জের সংখ্যা + নতুন উত্থাপিত সংখ্যা) হতে নিষ্পন্ন সংখ্যা বিয়োগ।
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 hover:bg-blue-50 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-black text-[11px] shrink-0 mt-0.5">
                  কলাম ১০
                </span>
                <div>
                  <span className="font-extrabold text-blue-950">ষাণ্মাসিক শেষে জড়িত টাকার পরিমাণ (কোটি টাকায়):</span>
                  <div className="inline-block mt-1 px-2.5 py-1 bg-white border border-indigo-200 rounded-lg font-mono font-bold text-indigo-900 text-[11.5px]">
                    সূত্র: কলাম ১০ = (কলাম ৪ + কলাম ৬) - কলাম ৮
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    (প্রারম্ভিক জড়িত টাকা + নতুন উত্থাপিত টাকা) হতে নিষ্পত্তিকৃত টাকা বিয়োগ।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Data Source & Grand Total */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-[12.5px] flex items-center gap-1.5">
              <HelpCircle size={15} className="text-slate-600" />
              ৩. সংখ্যাগুলোর উৎস ও ফুটার 'মোট' (Grand Total) হিসাব:
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11.5px]">
              <li>
                <strong>ডাটার উৎস:</strong> আপনার সংযুক্ত অফিশিয়াল ষাণ্মাসিক রিটার্ন ফরম্যাটের ছবি হতে বাস্তব নমুনা পরিসংখ্যান (যেমন: বিধি বহির্ভূত পরিশোধ, বকেয়া অনাদায়, সমন্বয়হীনতা ও অন্যান্য অনিয়ম) স্থাপন করা হয়েছে।
              </li>
              <li>
                <strong>স্বয়ংক্রিয় গণনালজিক:</strong> কলাম ৯ ও ১০-এ কোনো সংখ্যা সরাসরি বসানো হয়নি; বরং প্রতিটি সারিতে এবং সর্বনিম্নে 'মোট' সারিতে স্বয়ংক্রিয় গাণিতিক সূত্রের মাধ্যমে নির্ভুলভাবে হিসাব বের করা হয়েছে।
              </li>
              <li>
                <strong>ক্রস-ভ্যালিডেশন (Cross-Footing):</strong> 'মোট' সারিতে উলম্ব কলামের সমষ্টি এবং আনুভূমিক সূত্রের হিসাব (Horizontal Formula) উভয়ে শতভাগ সমান ও নির্ভুল।
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm text-[12px]"
          >
            বুঝেছি ও বন্ধ করুন
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HRLogicModal;
