import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Plus, Trash2, ShieldAlert, CheckCircle2, XCircle, 
  RefreshCw, Copy, Smartphone, Laptop, Sparkles, UserCheck, AlertTriangle 
} from 'lucide-react';
import { 
  AccessCodeItem, getAccessCodes, saveAccessCodes 
} from '../utils/pinManager';
import { toBengaliDigits } from '../utils/numberUtils';

export const AccessCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNameInput, setUserNameInput] = useState('');
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const data = await getAccessCodes();
    setCodes(data);
    setLoading(false);
  };

  const generateRandomCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = 'AUDIT-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomCodeInput(result);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = (customCodeInput || '').trim().toUpperCase();
    const finalName = (userNameInput || '').trim() || 'সাধারণ ব্যবহারকারী';

    if (!finalCode) {
      setStatusMessage({ type: 'error', text: 'দয়া করে একটি অ্যাক্সেস কোড লিখুন বা জেনারেট করুন।' });
      return;
    }

    if (codes.some(c => c.code.toUpperCase() === finalCode)) {
      setStatusMessage({ type: 'error', text: 'এই অ্যাক্সেস কোডটি ইতোমধ্যে বিদ্যমান! অনুগ্রহ করে ভিন্ন কোড ব্যবহার করুন।' });
      return;
    }

    const newCodeItem: AccessCodeItem = {
      id: 'code-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      code: finalCode,
      userName: finalName,
      createdAt: new Date().toISOString(),
      status: 'active',
      devices: []
    };

    const updated = [newCodeItem, ...codes];
    setCodes(updated);
    await saveAccessCodes(updated);

    setUserNameInput('');
    setCustomCodeInput('');
    setStatusMessage({ type: 'success', text: `সাফল্যের সাথে অ্যাক্সেস কোড "${finalCode}" তৈরি করা হয়েছে!` });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = codes.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'active' ? ('revoked' as const) : ('active' as const) };
      }
      return c;
    });
    setCodes(updated);
    await saveAccessCodes(updated);
  };

  const handleResetDevices = async (id: string) => {
    if (!confirm('আপনি কি এই কোডটির ডিভাইস রেজিস্ট্রি শূন্য (0) করতে চান? এরপর ব্যবহারকারী নতুন ২টি ডিভাইসে এটি পুনরায় যুক্ত করতে পারবেন।')) {
      return;
    }
    const updated = codes.map(c => {
      if (c.id === id) {
        return { ...c, devices: [] };
      }
      return c;
    });
    setCodes(updated);
    await saveAccessCodes(updated);
    setStatusMessage({ type: 'success', text: 'ডিভাইস রেজিস্ট্রি শূন্য করা হয়েছে!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('আপনি কি সত্যিই এই অ্যাক্সেস কোডটি চিরতরে মুছে ফেলতে চান?')) {
      return;
    }
    const updated = codes.filter(c => c.id !== id);
    setCodes(updated);
    await saveAccessCodes(updated);
    setStatusMessage({ type: 'success', text: 'অ্যাক্সেস কোড সফলভাবে মুছে ফেলা হয়েছে।' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopy = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
          <KeyRound size={160} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black tracking-wider uppercase">
            <Sparkles size={14} /> ডিভাইস-বাউন্ড পিন নিরাপত্তা
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            অ্যাক্সেস কোড ও ডিভাইস সিকিউরিটি প্যানেল
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            এখানে জেনারেট করা প্রতিটি কোড **সর্বোচ্চ ২টি ডিভাইসে (যেমন: ফোন ও পিসি)** স্বয়ংক্রিয়ভাবে লক হয়ে যাবে। ৩য় কোনো ব্যক্তি এই কোড দিলে প্রবেশ করতে পারবে না।
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <XCircle size={18} className="text-rose-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Code Generation Box */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
            <Plus className="text-indigo-600" size={18} />
            <span>নতুন অ্যাক্সেস কোড তৈরি করুন</span>
          </div>
          <button
            type="button"
            onClick={generateRandomCode}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200"
          >
            <Sparkles size={13} />
            <span>অটো-জেনারেট করুন</span>
          </button>
        </div>

        <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ব্যবহারকারীর নাম / পদবী (নোট):
            </label>
            <input
              type="text"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              placeholder="যেমন: জনাব আব্দুল করিম (অডিটর)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              অ্যাক্সেস কোড (PIN):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                placeholder="যেমন: AUDIT-2026"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-indigo-700 outline-none focus:bg-white focus:border-indigo-500 uppercase tracking-wider transition-all"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              <span>কোড সাবমিট করুন</span>
            </button>
          </div>
        </form>
      </div>

      {/* Access Codes List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
            <KeyRound size={18} className="text-indigo-600" />
            <span>বিদ্যমান অ্যাক্সেস কোডসমূহ ({toBengaliDigits(codes.length.toString())} টি)</span>
          </div>
          <button
            onClick={loadCodes}
            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            লোড হচ্ছে...
          </div>
        ) : codes.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-2">
            <KeyRound size={32} className="mx-auto text-slate-300" />
            <p>এখনো কোনো অ্যাক্সেস কোড তৈরি করা হয়নি। উপরের ফরম থেকে নতুন কোড যোগ করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-black border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">অ্যাক্সেস কোড</th>
                  <th className="p-3.5">ব্যবহারকারীর নাম</th>
                  <th className="p-3.5 text-center">ব্যবহৃত ডিভাইস</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {codes.map((c) => {
                  const devCount = Array.isArray(c.devices) ? c.devices.length : 0;
                  const isFull = devCount >= 2;
                  const isRevoked = c.status === 'revoked';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg text-xs tracking-wider">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.code)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-all"
                            title="কপি করুন"
                          >
                            {copiedCode === c.code ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-800">
                        {c.userName}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
                          isFull 
                            ? 'bg-rose-100 text-rose-800 border-rose-200' 
                            : devCount === 1 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          <Smartphone size={13} />
                          <span>{toBengaliDigits(devCount.toString())}/২ ডিভাইস</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isRevoked 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isRevoked ? 'বাতিলকৃত (Revoked)' : 'সক্রিয় (Active)'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right pr-4 space-x-2">
                        <button
                          onClick={() => handleResetDevices(c.id)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-all"
                          title="ডিভাইস লিমিট রিসেট (ফ্রি) করুন"
                        >
                          ডিভাইস রিসেট
                        </button>

                        <button
                          onClick={() => handleToggleStatus(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isRevoked
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isRevoked ? 'পুনরায় সক্রিয়' : 'বাতিল (Revoke)'}
                        </button>

                        <button
                          onClick={() => handleDeleteCode(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
