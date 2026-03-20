import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  if (!searchTerm.trim()) return <>{text}</>;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-bold border-b-2 border-yellow-400">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default HighlightText;
