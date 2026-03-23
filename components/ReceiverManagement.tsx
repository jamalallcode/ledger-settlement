import React, { useState, useEffect } from 'react';
import { User, Plus, FileEdit, Trash, X, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';

interface ReceiverManagementProps {
  isAdmin: boolean;
}

const ReceiverManagement: React.FC<ReceiverManagementProps> = ({ isAdmin }) => {
  const [paraType, setParaType] = useState<'এসএফআই' | 'নন-এসএফআই'>('এসএফআই');
  const [receivers, setReceivers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const key = paraType === 'এসএফআই' ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
    const initialList = paraType === 'এসএফআই' ? SFI_RECEIVERS : NONSFI_RECEIVERS;
    
    const saved = localStorage.getItem(key);
    if (saved) {
      setReceivers(JSON.parse(saved));
    } else {
      setReceivers(initialList);
      localStorage.setItem(key, JSON.stringify(initialList));
    }
  }, [paraType]);

  const saveToStorage = (newList: string[]) => {
    const key = paraType === 'এসএফআই' ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
    setReceivers(newList);
    localStorage.setItem(key, JSON.stringify(newList));
    // Also trigger a storage event for other components to sync
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddOrEdit = () => {
    if (!tempName.trim()) return;
    let newList = [...receivers];
    if (editingIdx !== null) {
      newList[editingIdx] = tempName.trim();
    } else {
      newList.push(tempName.trim());
    }
    saveToStorage(newList);
    setIsModalOpen(false);
    setTempName('');
    setEditingIdx(null);
  };

  const handleDelete = (index: number) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই নামটি মুছে ফেলতে চান?")) return;
    const newList = receivers.filter((_, i) => i !== index);
    saveToStorage(newList);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <ShieldCheck size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
        <p className="text-slate-500 font-bold">এই বিভাগটি শুধুমাত্র অ্যাডমিনদের জন্য।</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">প্রাপক ব্যবস্থাপনা</h2>
            <p className="text-slate-500 font-bold">এসএফআই ও নন-এসএফআই প্রাপকদের তালিকা নিয়ন্ত্রণ করুন</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingIdx(null);
            setTempName('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> নতুন যোগ করুন
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setParaType('এসএফআই')}
            className={`flex-1 py-5 font-black text-sm transition-all ${paraType === 'এসএফআই' ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            এসএফআই তালিকা
          </button>
          <button 
            onClick={() => setParaType('নন-এসএফআই')}
            className={`flex-1 py-5 font-black text-sm transition-all ${paraType === 'নন-এসএফআই' ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            নন-এসএফআই তালিকা
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receivers.map((name, idx) => (
              <div key={idx} className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[12px] font-black text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-slate-700">{name}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingIdx(idx);
                      setTempName(name);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <FileEdit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(idx)}
                    className="p-2 bg-white text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {receivers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="font-bold">কোন প্রাপক পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                    {editingIdx !== null ? <FileEdit size={24} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{editingIdx !== null ? 'নাম পরিবর্তন করুন' : 'নতুন প্রাপক যোগ'}</h4>
                    <p className="text-sm font-bold text-slate-500">{paraType} তালিকার জন্য</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">প্রাপকের নাম</label>
                  <input 
                    type="text"
                    autoFocus
                    className="w-full h-[58px] px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-lg"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="নাম লিখুন..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOrEdit()}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-[58px] bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleAddOrEdit}
                    disabled={!tempName.trim()}
                    className="flex-1 h-[58px] bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {editingIdx !== null ? 'আপডেট করুন' : 'যোগ করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverManagement;