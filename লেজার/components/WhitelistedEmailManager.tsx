import React, { useState, useEffect } from 'react';
import { 
  Mail, Plus, Trash2, CheckCircle2, XCircle, 
  RefreshCw, Copy, Sparkles, ShieldCheck, Search
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toBengaliDigits } from '../utils/numberUtils';

export const WhitelistedEmailManager: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadWhitelistedEmails();
  }, []);

  const loadWhitelistedEmails = async () => {
    setLoading(true);

    // 1. Try fetching from server API
    try {
      const res = await fetch('/api/admin/whitelisted-emails?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.emails)) {
          setEmails(data.emails);
          localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(data.emails));
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load whitelisted emails from API:', e);
    }

    // 2. Try Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'whitelisted_emails_list')
          .maybeSingle();

        if (!error && data && Array.isArray(data.value)) {
          setEmails(data.value);
          localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(data.value));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch whitelisted_emails_list from Supabase:', err);
      }
    }

    // 3. Fallback to LocalStorage
    try {
      const saved = localStorage.getItem('audit_doc_whitelisted_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setEmails(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setEmails(['websitetogather@gmail.com']);
    setLoading(false);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (newEmailInput || '').trim().toLowerCase();

    if (!cleanEmail) {
      setStatusMessage({ type: 'error', text: 'দয়া করে একটি সঠিক জিমেইল আইডি লিখুন।' });
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatusMessage({ type: 'error', text: 'ইমেইলের বিন্যাস সঠিক নয়! যেমন: name@gmail.com' });
      return;
    }

    if (emails.some(e => e.toLowerCase() === cleanEmail)) {
      setStatusMessage({ type: 'error', text: 'এই জিমেইল আইডিটি ইতোমধ্যেই অনুমোদিত তালিকায় রয়েছে!' });
      return;
    }

    const updated = [cleanEmail, ...emails];
    setEmails(updated);
    setNewEmailInput('');

    // Save to server API
    try {
      await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addEmail: cleanEmail })
      });
    } catch (e) {}

    // Save to LocalStorage
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(updated));

    // Save to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('app_settings')
          .upsert({ key: 'whitelisted_emails_list', value: updated }, { onConflict: 'key' });
      } catch (err) {}
    }

    setStatusMessage({ type: 'success', text: `সাফল্যের সাথে জিমেইল আইডি "${cleanEmail}" অনুমোদন করা হয়েছে!` });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!confirm(`আপনি কি সত্যিই "${emailToRemove}" জিমেইল আইডিটির অনুমোদন বাতিল করতে চান?`)) {
      return;
    }

    const updated = emails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase());
    setEmails(updated);

    // Save to server API
    try {
      await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeEmail: emailToRemove })
      });
    } catch (e) {}

    // Save to LocalStorage
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(updated));

    // Save to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('app_settings')
          .upsert({ key: 'whitelisted_emails_list', value: updated }, { onConflict: 'key' });
      } catch (err) {}
    }

    setStatusMessage({ type: 'success', text: `"${emailToRemove}" আইডিটির অনুমোদন বাতিল করা হয়েছে।` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopy = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(emailStr);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredEmails = emails.filter(e => 
    e.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
          <Mail size={160} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-black tracking-wider uppercase">
            <ShieldCheck size={14} /> জিমেইল আইডি অনুমোদন প্যানেল
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            অনুমোদিত জিমেইল আইডি ব্যবস্থাপনা
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            এখানে এডমিন যেসব জিমেইল আইডি ইনপুট দিয়ে অনুমোদন দিবেন, ব্যবহারকারী অডিট ক্রাইটেরিয়া অংশে গিয়ে কেবল ঐ জিমেইল আইডি ইনপুট দিলেই অডিট ক্রাইটেরিয়ার সকল নথি উন্মুক্তভাবে দেখতে পাবেন।
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

      {/* Add New Email Box */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
            <Plus className="text-emerald-600" size={18} />
            <span>নতুন জিমেইল আইডি অনুমোদন দিন</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            এডমিন এক্সেস পাওয়ার সুবিধা
          </span>
        </div>

        <form onSubmit={handleAddEmail} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 mb-1">
              ব্যবহারকারীর জিমেইল আইডি (Gmail ID):
            </label>
            <input
              type="email"
              required
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="যেমন: auditor.user@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>আইডি অনুমোদন দিন</span>
            </button>
          </div>
        </form>
      </div>

      {/* Whitelisted Emails List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
            <Mail size={18} className="text-emerald-600" />
            <span>অনুমোদিত জিমেইল তালিকাসমূহ ({toBengaliDigits(emails.length.toString())} টি)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="খুঁজুন..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 w-44"
              />
            </div>

            <button
              onClick={loadWhitelistedEmails}
              className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            লোড হচ্ছে...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-2">
            <Mail size={32} className="mx-auto text-slate-300" />
            <p>কোনো জিমেইল আইডি পাওয়া যায়নি। উপরের ফরম থেকে জিমেইল আইডি যুক্ত করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-black border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">অনুমোদিত জিমেইল আইডি</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5 text-right pr-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEmails.map((email, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs">
                          {email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(email)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-all cursor-pointer"
                          title="কপি করুন"
                        >
                          {copiedEmail === email ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} /> অনুমোদিত (Whitelisted)
                      </span>
                    </td>

                    <td className="p-3.5 text-right pr-4">
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer"
                        title="অনুমোদন বাতিল করুন"
                      >
                        <Trash2 size={14} />
                        <span>বাতিল করুন</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
