import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

const NO_WRAP_PATTERN = /([kK][gG][\s\u00A0]*-[\s\u00A0]*[০-৯0-9]+|[০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{2,4}|[০-৯0-9]{4}[\/\-\.][০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{1,2})/g;
const EXACT_NO_WRAP_REGEX = /^([kK][gG][\s\u00A0]*-[\s\u00A0]*[০-৯0-9]+|[০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{2,4}|[০-৯0-9]{4}[\/\-\.][০-৯0-9]{1,2}[\/\-\.][০-৯0-9]{1,2})$/;

const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  if (!text) return null;

  const renderWithNoWrapTokens = (str: string, keyPrefix: string) => {
    const segments = str.split(NO_WRAP_PATTERN);
    if (segments.length === 1) return str;
    return segments.map((seg, idx) =>
      EXACT_NO_WRAP_REGEX.test(seg) ? (
        <span key={`${keyPrefix}-nw-${idx}`} className="whitespace-nowrap inline-block">
          {seg}
        </span>
      ) : (
        <React.Fragment key={`${keyPrefix}-t-${idx}`}>{seg}</React.Fragment>
      )
    );
  };

  if (!searchTerm.trim()) return <>{renderWithNoWrapTokens(text, 'plain')}</>;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 font-bold border-b-2 border-yellow-400">
            {renderWithNoWrapTokens(part, `m-${i}`)}
          </mark>
        ) : (
          <span key={i}>{renderWithNoWrapTokens(part, `s-${i}`)}</span>
        )
      )}
    </>
  );
};

export default HighlightText;