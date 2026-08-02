
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
    <div className={`bg-white w-full h-full flex flex-col overflow-hidden ${isEmbedded ? 'rounded-2xl shadow-2xl border border-slate-200' : ''}`}>
      {/* Header - Ultra compact */}
      <div className={`bg-slate-50 flex items-center justify-between shrink-0 border-b border-slate-200 ${isEmbedded ? 'px-3 py-1.5' : 'px-4 py-2'}`}>
        <div className="flex items-center gap-2">
          <div className={`${isEmbedded ? 'w-6 h-6 rounded-md' : 'w-7.5 h-7.5 rounded-lg'} bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shrink-0`}>
            <FileText size={isEmbedded ? 13 : 15} className="text-blue-600" />
          </div>
          <div>
            <h3 className={`text-slate-900 font-black tracking-tight leading-none ${isEmbedded ? 'text-[12.5px]' : 'text-[14px]'}`}>{title}</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider leading-none mt-0.5">চিঠিপত্রের বিস্তারিত তালিকা</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`${isEmbedded ? 'w-6 h-6 rounded-md' : 'w-7 h-7 rounded-lg'} flex items-center justify-center bg-white text-slate-400 border border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 shadow-2xs shrink-0`}
          title="বন্ধ করুন"
        >
          <X size={isEmbedded ? 13 : 15} />
        </button>
      </div>
      
      {/* Content Area - Maximize height for table */}
      <div className={`grow bg-white flex flex-col min-h-0 ${isEmbedded ? 'p-1.5 sm:p-2' : 'p-2 sm:p-3'}`}>
        <div className="relative overflow-auto custom-scrollbar flex-1 border border-slate-300 rounded-none bg-white">
          <table className="w-full border-separate border-spacing-0 table-fixed">
            <colgroup>
              <col style={{ width: isEmbedded ? '5%' : '50px' }} />
              <col style={{ width: isEmbedded ? '28%' : '250px' }} />
              <col style={{ width: isEmbedded ? '12%' : '120px' }} />
              <col style={{ width: isEmbedded ? '12%' : '120px' }} />
              <col style={{ width: isEmbedded ? '15%' : '150px' }} />
              <col style={{ width: isEmbedded ? '15%' : '150px' }} />
              <col style={{ width: isEmbedded ? '13%' : '120px' }} />
            </colgroup>
            <thead className="sticky top-0 z-30 bg-slate-100">
              {/* Row 1: Header names */}
              <tr>
                <th className={`border-b border-r border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>ক্রমিক</th>
                <th className={`border-b border-r border-slate-300 text-left font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-2 text-[11px]' : 'py-2 px-3 text-[12px]'
                }`}>চিঠির নাম/বিবরণ</th>
                <th className={`border-b border-r border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>শাখার নাম</th>
                <th className={`border-b border-r border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>চিঠির ধরন</th>
                <th className={`border-b border-r border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>স্মারক নং ও তারিখ</th>
                <th className={`border-b border-r border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>ডায়েরি নং ও তারিখ</th>
                <th className={`border-b border-slate-300 text-center font-black text-slate-800 uppercase tracking-tighter bg-slate-100 ${
                  isEmbedded ? 'py-1.5 px-1 text-[11px]' : 'py-2 px-2 text-[12px]'
                }`}>বর্তমান অবস্থান</th>
              </tr>
              {/* Row 2: Serial Numbers row (Solid background to avoid scroll bleed-through) */}
              <tr className="bg-slate-200">
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(১)</th>
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(২)</th>
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(৩)</th>
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(৪)</th>
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(৫)</th>
                <th className="border-b border-r border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(৬)</th>
                <th className="border-b border-slate-300 text-center font-black text-slate-600 py-0.5 text-[9.5px] sm:text-[10px] bg-slate-200">(৭)</th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {letters.map((letter, idx) => (
                <tr key={letter.id || idx} className="no-hover-row group hover:bg-blue-50/40 transition-colors">
                  <td className={`text-center font-extrabold text-slate-600 border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'py-2 px-1 text-[11px]' : 'py-2.5 px-2 text-[12px]'
                  }`}>
                    {toBengaliDigits(idx + 1)}
                  </td>
                  <td className={`text-left font-bold text-slate-800 border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'p-2 text-[11px]' : 'p-2.5 text-[12px]'
                  }`}>
                    <span className="leading-relaxed break-words">{letter.description}</span>
                  </td>
                  {/* Dedicated Branch Name Column (শাখার নাম) */}
                  <td className={`text-center font-bold border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'p-1 text-[10px]' : 'p-2 text-[11px]'
                  }`}>
                    {letter.paraType ? (
                      <span className={`bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-black uppercase tracking-wider inline-block ${
                        isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                      }`}>
                        {letter.paraType}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">-</span>
                    )}
                  </td>
                  {/* Dedicated Letter Type column (চিঠির ধরন) */}
                  <td className={`text-center font-bold border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'p-1 text-[10px]' : 'p-2 text-[11px]'
                  }`}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      {letter.letterType && (
                        <span className={`bg-blue-50 text-blue-700 border border-blue-200 rounded font-black uppercase tracking-wider ${
                          isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        }`}>
                          {letter.letterType}
                        </span>
                      )}
                      {letter.archiveNo && (
                        <span className={`bg-purple-50 text-purple-700 border border-purple-200 rounded font-black uppercase tracking-wider ${
                          isEmbedded ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        }`}>
                          আর্কাইভ: {letter.archiveNo}
                        </span>
                      )}
                      {!letter.letterType && !letter.archiveNo && (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'p-1.5 text-[10px]' : 'p-2 text-[12px]'
                  }`}>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-slate-900 font-extrabold">
                        <Hash size={isEmbedded ? 11 : 13} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[110px]">{letter.letterNo}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-slate-500 font-bold ${isEmbedded ? 'text-[10px]' : 'text-[11px]'}`}>
                        <Calendar size={isEmbedded ? 11 : 13} className="text-slate-400 shrink-0" />
                        <span>{formatDateBN(letter.letterDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 border-b border-r border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'p-1.5 text-[10px]' : 'p-2 text-[12px]'
                  }`}>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-slate-900 font-extrabold">
                        <Hash size={isEmbedded ? 11 : 13} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[110px]">{letter.diaryNo}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-slate-500 font-bold ${isEmbedded ? 'text-[10px]' : 'text-[11px]'}`}>
                        <Calendar size={isEmbedded ? 11 : 13} className="text-slate-400 shrink-0" />
                        <span>{formatDateBN(letter.diaryDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`text-center font-bold text-slate-700 border-b border-slate-200 group-last:border-b-0 ${
                    isEmbedded ? 'py-1.5 px-1 text-[10px]' : 'py-2 px-2 text-[11px]'
                  }`}>
                    <div className="flex items-center justify-center gap-1">
                      <span className={`rounded-md font-black shadow-2xs border ${
                        isEmbedded ? 'px-1.5 py-0.5 text-[9.5px]' : 'px-2.5 py-1 text-[10.5px]'
                      } ${
                        (letter.presentedToName || '').includes('অডিটর') ? 'bg-red-50 text-red-600 border-red-200' :
                        (letter.presentedToName || '').includes('এএন্ডএও') ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        (letter.presentedToName || '').includes('উপপরিচালক') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
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
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
              <FileText size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold italic text-sm">কোনো তথ্য পাওয়া যায়নি।</p>
          </div>
        )}
      </div>
      
      {/* Footer - Ultra compact */}
      <div className={`bg-slate-50 flex justify-between items-center shrink-0 border-t border-slate-200 ${isEmbedded ? 'px-3 py-1.5' : 'px-4 py-1.5'}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
          <div className={`${isEmbedded ? 'text-[11px]' : 'text-[12px]'} font-bold text-slate-600`}>
            মোট চিঠিপত্র: <span className="text-slate-900 font-black ml-1">{toBengaliDigits(letters.length)} টি</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`bg-slate-900 text-white rounded-md font-black hover:bg-slate-800 transition-all shadow-2xs active:scale-95 ${
            isEmbedded ? 'px-3 py-0.5 text-[11px]' : 'px-4 py-1 text-[12px]'
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
