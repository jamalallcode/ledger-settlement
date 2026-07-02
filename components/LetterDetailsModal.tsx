
import React from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, Hash, User } from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';

interface LetterDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  letters: any[];
  isEmbedded?: boolean;
}

const LetterDetailsModal: React.FC<LetterDetailsModalProps> = ({ isOpen, onClose, title, letters, isEmbedded = false }) => {
  if (!isOpen) return null;

  const content = (
    <div className={`bg-white w-full h-full flex flex-col overflow-hidden ${isEmbedded ? 'rounded-3xl shadow-2xl border border-slate-100' : ''}`}>
      {/* Header */}
      <div className={`bg-slate-50 flex items-center justify-between shrink-0 border-b border-slate-200 ${isEmbedded ? 'px-4 py-3' : 'px-8 py-5'}`}>
        <div className="flex items-center gap-4">
          <div className={`${isEmbedded ? 'w-9 h-9 rounded-xl' : 'w-12 h-12 rounded-2xl'} bg-blue-600/10 flex items-center justify-center border border-blue-600/20`}>
            <FileText size={isEmbedded ? 18 : 24} className="text-blue-600" />
          </div>
          <div>
            <h3 className={`text-slate-900 font-black tracking-tight ${isEmbedded ? 'text-[15px]' : 'text-[18px]'}`}>{title}</h3>
            <p className="text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">চিঠিপত্রের বিস্তারিত তালিকা</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`${isEmbedded ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} flex items-center justify-center bg-white text-slate-400 border border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-sm`}
        >
          <X size={isEmbedded ? 16 : 20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-0 grow bg-white flex flex-col min-h-0">
        <div className="relative overflow-auto custom-scrollbar flex-1">
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <colgroup>
              <col style={{ width: isEmbedded ? '6%' : '90px' }} />
              <col style={{ width: isEmbedded ? '39%' : '335px' }} />
              <col style={{ width: isEmbedded ? '19%' : '180px' }} />
              <col style={{ width: isEmbedded ? '19%' : '180px' }} />
              <col style={{ width: isEmbedded ? '17%' : '160px' }} />
            </colgroup>
            <thead className="sticky top-0 z-30">
              <tr>
                <th className={`sticky top-0 z-30 border-b border-slate-200 text-center font-black text-slate-700 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-2 px-1 text-[11px]' : 'py-4 pl-8 pr-4 text-[13px]'
                }`}>ক্রমিক</th>
                <th className={`sticky top-0 z-30 border-b border-slate-200 text-left font-black text-slate-700 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                }`}>চিঠির নাম/বিবরণ</th>
                <th className={`sticky top-0 z-30 border-b border-slate-200 text-center font-black text-slate-700 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                }`}>স্মারক নং ও তারিখ</th>
                <th className={`sticky top-0 z-30 border-b border-slate-200 text-center font-black text-slate-700 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                }`}>ডায়েরি নং ও তারিখ</th>
                <th className={`sticky top-0 z-30 border-b border-slate-200 text-center font-black text-slate-700 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-2 px-1 text-[11px]' : 'py-4 pr-8 pl-4 text-[13px]'
                }`}>বর্তমান অবস্থান</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {letters.map((letter, idx) => (
                <tr key={letter.id || idx} className="no-hover-row group hover:bg-slate-50/80 transition-colors">
                  <td className={`text-center font-bold text-slate-500 border-r border-slate-100 ${
                    isEmbedded ? 'py-2 px-1 text-[11px]' : 'py-4 pl-8 pr-4 text-[13px]'
                  }`}>
                    {toBengaliDigits(idx + 1)}
                  </td>
                  <td className={`text-left font-bold text-slate-800 ${
                    isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                  }`}>
                    <div className="flex flex-col gap-1.5">
                      <span className="leading-relaxed">{letter.description}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`bg-blue-50 text-blue-600 border border-blue-100 rounded font-black uppercase tracking-wider ${
                          isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        }`}>
                          {letter.letterType}
                        </span>
                        <span className={`bg-emerald-50 text-emerald-600 border border-emerald-100 rounded font-black uppercase tracking-wider ${
                          isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        }`}>
                          {letter.paraType}
                        </span>
                        {letter.archiveNo && (
                          <span className={`bg-purple-50 text-purple-600 border border-purple-100 rounded font-black uppercase tracking-wider ${
                            isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                          }`}>
                            আর্কাইভ নং: {letter.archiveNo}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 border-x border-slate-100 ${
                    isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                  }`}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-slate-900">
                        <Hash size={isEmbedded ? 12 : 14} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{letter.letterNo}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-slate-500 ${isEmbedded ? 'text-[11px]' : 'text-[12px]'}`}>
                        <Calendar size={isEmbedded ? 12 : 14} className="text-slate-400 shrink-0" />
                        <span>{formatDateBN(letter.letterDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 border-x border-slate-100 ${
                    isEmbedded ? 'p-2 text-[11px]' : 'p-4 text-[13px]'
                  }`}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-slate-900">
                        <Hash size={isEmbedded ? 12 : 14} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[100px]">{letter.diaryNo}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-slate-500 ${isEmbedded ? 'text-[11px]' : 'text-[12px]'}`}>
                        <Calendar size={isEmbedded ? 12 : 14} className="text-slate-400 shrink-0" />
                        <span>{formatDateBN(letter.diaryDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 ${
                    isEmbedded ? 'py-2 px-1 text-[11px]' : 'py-4 pr-8 pl-4 text-[13px]'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {!isEmbedded && <User size={14} className="text-slate-400 shrink-0" />}
                      <span className={`rounded-lg font-black shadow-sm border ${
                        isEmbedded ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-[11px]'
                      } ${
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
      <div className={`bg-slate-50 flex justify-between items-center shrink-0 border-t border-slate-200 ${isEmbedded ? 'px-4 py-3' : 'px-8 py-5'}`}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          <div className={`${isEmbedded ? 'text-[12px]' : 'text-[14px]'} font-bold text-slate-600`}>
            মোট চিঠিপত্র: <span className="text-slate-900 font-black ml-1">{toBengaliDigits(letters.length)} টি</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95 ${
            isEmbedded ? 'px-4 py-1.5 text-[12px]' : 'px-8 py-2.5 text-[13px]'
          }`}
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return createPortal(
    <div className="fixed inset-0 bg-white z-[50000] flex flex-col animate-in fade-in duration-300">
      {content}
    </div>,
    document.body
  );
};

export default LetterDetailsModal;
