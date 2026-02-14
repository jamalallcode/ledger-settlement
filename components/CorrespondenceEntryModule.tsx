import React from 'react';
import { Mail, X, ArrowRightCircle } from 'lucide-react';

interface CorrespondenceEntryModuleProps {
  onBackToMenu: () => void;
}

const CorrespondenceEntryModule: React.FC<CorrespondenceEntryModuleProps> = ({ onBackToMenu }) => {
  return (
    <div className="max-w-4xl mx-auto py-20 text-center space-y-8 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
        <Mail size={48} />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-slate-900">প্রাপ্ত চিঠিপত্র মডিউল</h2>
        <p className="text-slate-500 font-bold text-lg">এই মডিউলটি বর্তমানে ডেভলপমেন্ট পর্যায়ে আছে এবং শীঘ্রই উন্মুক্ত করা হবে।</p>
      </div>
      <button 
        onClick={onBackToMenu}
        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition-all flex items-center gap-2 mx-auto"
      >
        <X size={20} /> পিছনে ফিরে যান
      </button>
    </div>
  );
};

export default CorrespondenceEntryModule;
