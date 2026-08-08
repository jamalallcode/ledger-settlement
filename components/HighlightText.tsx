import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm?: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text }) => {
  return <>{text}</>;
};

export default HighlightText;