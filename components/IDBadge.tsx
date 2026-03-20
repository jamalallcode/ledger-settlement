import React, { useState } from 'react';

interface IDBadgeProps {
  id: string;
  isLayoutEditable?: boolean;
}

const IDBadge: React.FC<IDBadgeProps> = ({ id, isLayoutEditable = false }) => {
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
      className={`absolute -top-3 left-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded border border-white/30 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? 'ring-2 ring-emerald-500 bg-emerald-600' : ''}`}
    >
      {copied ? 'COPIED!' : `#${id}`}
    </span>
  );
};

export default IDBadge;
