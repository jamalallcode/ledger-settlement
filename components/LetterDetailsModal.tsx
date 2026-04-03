
import React from 'react';
import { X, FileText, Calendar, Hash, User } from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';
import ReceiverAvatar from './ReceiverAvatar';

interface LetterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  letters: any[];
}

const LetterDetailsModal: React.FC<LetterDetailsModalProps> = ({ isOpen, onClose, title, letters }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[4000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-500 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 px-8 py-5 flex items-center justify-between shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-[18px] tracking-tight">{title}</h3>
              <p className="text-slate-500 text-[12px] font-bold uppercase tracking-widest">চিঠিপত্রের বিস্তারিত তালিকা</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 border border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 grow bg-white flex flex-col min-h-0">
          <div className="relative overflow-auto custom-scrollbar border border-slate-200 rounded-xl shadow-sm flex-1">
            <table className="min-w-full border-separate border-spacing-0 table-fixed">
              <colgroup>
                <col className="w-[80px]" />
                <col className="w-[335px]" />
                <col className="w-[180px]" />
                <col className="w-[180px]" />
                <col className="w-[160px]" />
              </colgroup>
              <thead className="sticky top-0 z-30">
                <tr>
                  <th className="sticky top-0 z-30 border-b border-slate-200 p-4 text-center text-[13px] font-black text-slate-700 uppercase tracking-tighter bg-slate-100">ক্রমিক</th>
                  <th className="sticky top-0 z-30 border-b border-slate-200 p-4 text-left text-[13px] font-black text-slate-700 uppercase tracking-tighter bg-slate-100">চিঠির নাম/বিবরণ</th>
                  <th className="sticky top-0 z-30 border-b border-slate-200 p-4 text-center text-[13px] font-black text-slate-700 uppercase tracking-tighter bg-slate-100">স্মারক নং ও তারিখ</th>
                  <th className="sticky top-0 z-30 border-b border-slate-200 p-4 text-center text-[13px] font-black text-slate-700 uppercase tracking-tighter bg-slate-100">ডায়েরি নং ও তারিখ</th>
                  <th className="sticky top-0 z-30 border-b border-slate-200 p-4 text-center text-[13px] font-black text-slate-700 uppercase tracking-tighter bg-slate-100">বর্তমান অবস্থান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {letters.map((letter, idx) => (
                  <tr key={letter.id || idx} className="no-hover-row group hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-center text-[13px] font-bold text-slate-500 border-r border-slate-100">
                      {toBengaliDigits(idx + 1)}
                    </td>
                    <td className="p-4 text-left text-[13px] font-bold text-slate-800">
                      <div className="flex flex-col gap-2">
                        <span className="leading-relaxed">{letter.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-black uppercase tracking-wider">
                            {letter.letterType}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-black uppercase tracking-wider">
                            {letter.paraType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-[13px] font-bold text-slate-700 border-x border-slate-100">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-900">
                          <Hash size={14} className="text-slate-400" />
                          <span>{letter.letterNo}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[12px]">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{formatDateBN(letter.letterDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-[13px] font-bold text-slate-700 border-x border-slate-100">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-900">
                          <Hash size={14} className="text-slate-400" />
                          <span>{letter.diaryNo}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[12px]">
                          <Calendar size={14} className="text-slate-400" />
                          <span>{formatDateBN(letter.diaryDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center text-[13px] font-bold text-slate-700">
                      <div className="flex items-center justify-center gap-2">
                        <ReceiverAvatar name={letter.presentedToName || 'অডিটর'} size="xs" />
                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black shadow-sm border ${
                          (letter.presentedToName || '').includes('অডিটর') ? 'bg-red-50 text-red-600 border-red-100' :
                          (letter.presentedToName || '').includes('এএন্ডএও') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          (letter.presentedToName || '').includes('উপপরিচালক') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {letter.presentedToName || 'অডিটর'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {letters.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <FileText size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold italic text-lg">কোনো তথ্য পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 px-8 py-5 flex justify-between items-center shrink-0 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <div className="text-[14px] font-bold text-slate-600">
              মোট চিঠিপত্র: <span className="text-slate-900 font-black ml-1">{toBengaliDigits(letters.length)} টি</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[13px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default LetterDetailsModal;
