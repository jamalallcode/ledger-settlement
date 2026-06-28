
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
  isAdmin?: boolean;
  showSearch?: boolean;
  allowCustom?: boolean;
  hideAddNew?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, value, onChange, groups, placeholder = "নির্বাচন করুন", required, isLayoutEditable = false, badgeId, isAdmin = false, showSearch = true,
  allowCustom = false, hideAddNew = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customAddedOptions, setCustomAddedOptions] = useState<string[]>([]);
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
      setSearchTerm('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } else {
      setSearchTerm('');
      setIsAddingCustom(false);
      setCustomValue('');
    }
  }, [isOpen]);

  const allOptions = [...groups.flatMap(g => g.options), ...customAddedOptions];
  
  const filteredOptions = allOptions
    .filter(opt => {
      if (!searchTerm) return true;
      return opt.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!searchTerm) return 0;
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
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-[14px] truncate ${value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {value && (
            <X 
              size={14} 
              className="text-slate-300 hover:text-slate-500 cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); onChange(''); }} 
            />
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[200] w-full md:w-[150%] md:min-w-[400px] left-0 mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border-t-4 border-t-blue-600">
          
          {/* Search container inside the dropdown itself */}
          {showSearch && (
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-sans"
                placeholder="টাইপ করে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (allowCustom && searchTerm.trim()) {
                      onChange(searchTerm.trim());
                      setIsOpen(false);
                    }
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto py-3 no-scrollbar">
            {allowCustom && searchTerm.trim() && !allOptions.some(o => o.toLowerCase() === searchTerm.trim().toLowerCase()) && (
              <div
                className="flex items-center justify-between px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer text-[14px] font-black transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 animate-in fade-in duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(searchTerm.trim());
                  setIsOpen(false);
                }}
              >
                <span>"{searchTerm.trim()}" ব্যবহার করুন</span>
                <PlusCircle size={16} className="text-emerald-600 shrink-0" />
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
              !allowCustom && (
                <div className="p-8 text-center space-y-2">
                  <div className="flex justify-center"><X size={24} className="text-slate-200" /></div>
                  <p className="text-slate-400 text-xs font-black italic">কিছু পাওয়া যায়নি</p>
                </div>
              )
            )}
          </div>

          {isAdmin && !hideAddNew && (
            <div className="border-t border-slate-100 bg-slate-50">
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAddingCustom(true);
                    setCustomValue('');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-bold text-xs transition-all duration-200"
                >
                  <PlusCircle size={14} className="text-emerald-500" />
                  <span>নতুন যুক্ত করুন</span>
                </button>
              ) : (
                <div className="p-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    placeholder="নতুন নাম লিখুন..."
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustom(false)}
                      className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold transition-all"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={!customValue.trim()}
                      onClick={() => {
                        const trimmed = customValue.trim();
                        if (trimmed) {
                          setCustomAddedOptions(prev => [...prev, trimmed]);
                          onChange(trimmed);
                          setIsOpen(false);
                          setIsAddingCustom(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-md text-[10px] font-bold transition-all"
                    >
                      সংরক্ষণ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;