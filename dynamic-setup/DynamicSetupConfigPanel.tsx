import React, { useState } from 'react';
import { Calendar, Save, ToggleLeft, ToggleRight, Sparkles, AlertCircle, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { DynamicSetupConfig } from '../types';

interface DynamicSetupConfigPanelProps {
  config: DynamicSetupConfig;
  onSave: (config: DynamicSetupConfig) => void;
  onBack: () => void;
}

const DynamicSetupConfigPanel: React.FC<DynamicSetupConfigPanelProps> = ({ config, onSave, onBack }) => {
  const [tempConfig, setTempConfig] = useState<DynamicSetupConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  // Sync tempConfig with config prop when it changes from outside
  React.useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    console.log("Saving dynamic setup config:", tempConfig);
    onSave(tempConfig);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onBack();
    }, 1500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-slate-600 shadow-sm transition-all active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100/50">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">কাস্টম প্রারম্ভিক জের সেটাপ</h2>
            <p className="text-sm font-bold text-slate-500">রিপোর্টের সময়কাল এবং ম্যানুয়াল প্রারম্ভিক জের নির্ধারণ করুন</p>
          </div>
        </div>
        
        <button 
          onClick={() => setTempConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 shadow-md active:scale-95 ${tempConfig.enabled ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-500'}`}
        >
          {tempConfig.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          {tempConfig.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
            <Calendar size={16} className="text-blue-600" /> শুরুর তারিখ
          </label>
          <input 
            type="date" 
            value={tempConfig.startDate}
            onChange={(e) => setTempConfig(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 ml-1">
            <Calendar size={16} className="text-blue-600" /> শেষ তারিখ
          </label>
          <input 
            type="date" 
            value={tempConfig.endDate}
            onChange={(e) => setTempConfig(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex gap-4 items-start">
        <AlertCircle className="text-blue-600 shrink-0 mt-1" size={20} />
        <div className="space-y-1">
          <h4 className="text-sm font-black text-blue-900">কিভাবে কাজ করে?</h4>
          <p className="text-xs font-bold text-blue-700 leading-relaxed">
            ১. এখানে সময়কাল (শুরু ও শেষ তারিখ) নির্ধারণ করুন এবং 'সক্রিয়' বাটনে ক্লিক করে সেভ করুন।<br/>
            ২. এরপর 'প্রারম্ভিক জের সেটআপ' টেবিল থেকে ম্যানুয়ালি আপনার কাঙ্ক্ষিত জের ইনপুট দিন।<br/>
            ৩. এই সেটিংস সক্রিয় থাকলে, নির্ধারিত সময়কালের রিপোর্টের জন্য আপনার দেওয়া ম্যানুয়াল জের ব্যবহার করা হবে।
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={isSaved}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-2xl active:scale-95 group ${isSaved ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-blue-600'}`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={20} className="animate-bounce" />
              সেটিংস সংরক্ষিত হয়েছে
            </>
          ) : (
            <>
              <Save size={20} className="group-hover:scale-110 transition-transform" />
              সেটিংস সংরক্ষণ করুন
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DynamicSetupConfigPanel;
