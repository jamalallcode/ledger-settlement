
import React, { useState, useRef, useEffect } from 'react';
import { GroupOption } from '../types.ts';
import { ChevronDown, X, PlusCircle, Check } from 'lucide-react';

interface SearchableSelectProps {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  groups: GroupOption[];
  placeholder?: string;
  required?: boolean;
  isLayoutEditable?: boolean;
  badgeId?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, value, onChange, groups, placeholder = "নির্বাচন করুন", required, isLayoutEditable = false, badgeId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(value || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const allOptions = groups.flatMap(g => g.options);
  
  const filteredOptions = allOptions
    .filter(opt => {
      if (!searchTerm || searchTerm === value) return true;
      return opt.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!searchTerm || searchTerm === value) return 0;
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const sLower = searchTerm.toLowerCase();
      
      const aStarts = aLower.startsWith(sLower);
      const bStarts = bLower.startsWith(sLower);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aLower.localeCompare(bLower);
    });

  const exactMatch = allOptions.some(o => o.toLowerCase() === searchTerm.toLowerCase());

  const isFilled = value && value.toString().trim() !== '' && value !== '০' && value.toString() !== '0';

  const triggerStyle = `w-full h-[48px] px-4 border-2 rounded-xl outline-none transition-all duration-300 flex items-center justify-between cursor-pointer shadow-sm ${
    isOpen 
      ? 'border-blue-500 ring-4 ring-blue-50 bg-white' 
      : (isFilled ? 'border-emerald-500 bg-white hover:border-emerald-600' : 'border-red-500 bg-white hover:border-red-600')
  }`;

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
      <span 
        onClick={handleCopy}
        title="Click to copy ID"
        className={`absolute -top-3 left-2 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 z-[9999] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}
      >
        {copied ? 'COPIED!' : `#${id}`}
      </span>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {badgeId && <IDBadge id={badgeId} />}
      <label className="block text-[13px] font-black text-slate-700 mb-2 flex items-center gap-1.5">{label}</label>
      
      <div 
        className={triggerStyle}
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none focus:ring-0 text-[14px] font-bold text-slate-900 placeholder-slate-400 outline-none p-0"
            placeholder="টাইপ করে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm && !exactMatch) {
                onChange(searchTerm);
                setIsOpen(false);
              }
              if (e.key === 'Escape') setIsOpen(false);
            }}
          />
        ) : (
          <span className={`text-[14px] truncate ${value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}`}>
            {value || placeholder}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2">
          {isOpen && searchTerm && (
            <X 
              size={14} 
              className="text-slate-300 hover:text-slate-500 cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }} 
            />
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[200] w-full mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
          <div className="max-h-72 overflow-y-auto py-3 no-scrollbar">
            {searchTerm && !exactMatch && (
              <div 
                className="px-4 py-3 mx-2 mb-2 rounded-xl cursor-pointer bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-all group"
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3 text-blue-600 font-black text-xs">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <PlusCircle size={14} />
                  </div>
                  <span>নতুন হিসেবে যোগ করুন: "{searchTerm}"</span>
                </div>
              </div>
            )}

            {filteredOptions.length > 0 ? filteredOptions.map((option, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer text-[14px] font-black transition-all group ${
                  value === option 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                <span>{option}</span>
                {value === option && <Check size={16} className="text-white animate-in zoom-in duration-300" />}
              </div>
            )) : (
              <div className="p-8 text-center space-y-2">
                <div className="flex justify-center"><X size={24} className="text-slate-200" /></div>
                <p className="text-slate-400 text-xs font-black italic">কিছু পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
