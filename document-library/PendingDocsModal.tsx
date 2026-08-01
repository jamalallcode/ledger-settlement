import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, User, Plus, Trash2, 
  Search, Mail, MessageSquare, AlertCircle, Users, 
  Clock, Smartphone, Calendar, UserCheck, RefreshCw, 
  Sparkles, Lock, Unlock, ShieldAlert, Download
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { getInitialVisitorLogs, recordVisitorLog, clearAllVisitorLogs, VisitorLog } from './visitorTracker';

interface PendingDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  whitelistedEmails: string[];
  onAddWhitelistedEmail: (email: string) => void;
  onRemoveWhitelistedEmail: (email: string) => void;
  whatsappNumber?: string;
  onUpdateWhatsappNumber?: (num: string) => void;
}

export const PendingDocsModal: React.FC<PendingDocsModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  whitelistedEmails = [],
  onAddWhitelistedEmail,
  onRemoveWhitelistedEmail,
  whatsappNumber = '01789-539494',
  onUpdateWhatsappNumber
}) => {
  const [activeTab, setActiveTab] = useState<'visitor_log' | 'whitelisted'>('visitor_log');
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'last_3_days' | 'last_7_days' | 'last_30_days'>('last_30_days');
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [newVisitorInput, setNewVisitorInput] = useState('');
  const [isEditingWaNum, setIsEditingWaNum] = useState(false);
  const [tempWaNum, setTempWaNum] = useState(whatsappNumber);

  useEffect(() => {
    setTempWaNum(whatsappNumber);
  }, [whatsappNumber]);

  useEffect(() => {
    if (isOpen) {
      setVisitorLogs(getInitialVisitorLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    onAddWhitelistedEmail(newEmail.trim());
    setNewEmail('');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleQuickWhitelistVisitor = (identifier: string) => {
    onAddWhitelistedEmail(identifier);
    const updatedLogs = recordVisitorLog(identifier, true);
    setVisitorLogs(updatedLogs);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleAddManualVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitorInput.trim()) return;
    const isW = whitelistedEmails.some(e => e.toLowerCase() === newVisitorInput.trim().toLowerCase());
    const updated = recordVisitorLog(newVisitorInput.trim(), isW);
    setVisitorLogs(updated);
    setNewVisitorInput('');
  };

  const handleDeleteVisitorLog = (id: string) => {
    const updated = visitorLogs.filter(l => l.id !== id);
    setVisitorLogs(updated);
    localStorage.setItem('audit_doc_visitor_logs', JSON.stringify(updated));
  };

  const handleClearAllLogs = () => {
    if (confirm('আপনি কি সকল ভিজিটর লগ মুছে ফেলতে চান?')) {
      const cleared = clearAllVisitorLogs();
      setVisitorLogs(cleared);
    }
  };

  // Export Visitor logs to CSV
  const handleExportCSV = () => {
    if (filteredVisitorLogs.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Identifier (Gmail/Phone),Date,Time,Visit Count,Status,Device\n";

    filteredVisitorLogs.forEach(log => {
      const isW = whitelistedEmails.some(we => we.toLowerCase() === log.identifier.toLowerCase());
      const status = isW ? "Whitelisted (All Unlocked)" : "Normal (First 5 Free)";
      csvContent += `"${log.identifier}","${log.dateStr}","${log.formattedTime}",${log.visitCount},"${status}","${log.deviceInfo}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `visitor_logs_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter visitor logs by date range & search
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  const threeDaysAgoTimestamp = now.getTime() - 3 * 24 * 60 * 60 * 1000;
  const sevenDaysAgoTimestamp = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoTimestamp = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const filteredVisitorLogs = visitorLogs.filter(log => {
    const matchesSearch = log.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (timeFilter === 'today') {
      return log.dateStr === todayStr;
    } else if (timeFilter === 'yesterday') {
      return log.dateStr === yesterdayStr;
    } else if (timeFilter === 'last_3_days') {
      return log.timestamp >= threeDaysAgoTimestamp;
    } else if (timeFilter === 'last_7_days') {
      return log.timestamp >= sevenDaysAgoTimestamp;
    } else if (timeFilter === 'last_30_days') {
      return log.timestamp >= thirtyDaysAgoTimestamp;
    }
    return true; // 'all'
  });

  const filteredWhitelistedEmails = whitelistedEmails.filter(email =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const last30DaysVisitorsCount = visitorLogs.filter(log => log.timestamp >= thirtyDaysAgoTimestamp).length;
  const todayVisitorsCount = visitorLogs.filter(log => log.dateStr === todayStr).length;

  return (
    <div className="fixed top-[45px] bottom-0 right-0 left-0 md:left-[126px] z-[9000] flex items-center justify-center p-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-full h-full bg-white rounded-none shadow-2xl border-0 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                ব্যবহারকারী ট্র্যাকার ও এক্সেস রেজিস্টার
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                বিগত ১ মাস/৩০ দিনের ভিজিটর তালিকা (Gmail/Mobile) ও অনুমোদিত হোয়াইটলিস্ট কন্ট্রোল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin WhatsApp number info */}
            {isAdmin && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-400" />
                <span className="text-slate-300">WhatsApp:</span>
                <span className="font-mono font-black text-emerald-300">{whatsappNumber}</span>
                <button
                  onClick={() => {
                    const newNum = prompt('নতুন এডমিন WhatsApp নম্বর লিখুন:', whatsappNumber);
                    if (newNum && newNum.trim()) {
                      onUpdateWhatsappNumber?.(newNum.trim());
                    }
                  }}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer transition-colors"
                  title="WhatsApp নম্বর এডিট করুন"
                >
                  এডিট
                </button>
              </div>
            )}

            <button 
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer shrink-0 border border-white/10"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 bg-slate-100/80 p-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('visitor_log')}
            className={`flex-1 py-3 px-4 font-black text-xs flex items-center justify-center gap-2 rounded-lg transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'visitor_log' 
                ? 'bg-white text-blue-900 shadow-sm border-slate-300' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'
            }`}
          >
            <Clock size={16} className="text-blue-600" />
            <span>বিগত ১ মাসের ভিজিটর লগ</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-mono font-black">
              {toBengaliDigits(last30DaysVisitorsCount)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whitelisted')}
            className={`flex-1 py-3 px-4 font-black text-xs flex items-center justify-center gap-2 rounded-lg transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'whitelisted' 
                ? 'bg-white text-emerald-900 shadow-sm border-slate-300' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'
            }`}
          >
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>অনুমোদিত জিমেইল তালিকা</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono font-black">
              {toBengaliDigits(whitelistedEmails.length)}
            </span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {addedSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-2 border border-emerald-200 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600" />
              সফলভাবে হোয়াইটলিস্টে যুক্ত করা হয়েছে! ব্যবহারকারী এখন সকল ডকুমেন্ট দেখতে পাবেন।
            </div>
          )}

          {/* TAB 1: VISITOR ACTIVITY LOG */}
          {activeTab === 'visitor_log' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={12} className="text-blue-600" /> আজ এসেছে
                  </div>
                  <div className="text-lg font-black text-blue-950 font-mono">
                    {toBengaliDigits(todayVisitorsCount)} জন
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Calendar size={12} className="text-purple-600" /> বিগত ১ মাস (৩০ দিন)
                  </div>
                  <div className="text-lg font-black text-purple-950 font-mono">
                    {toBengaliDigits(last30DaysVisitorsCount)} জন
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" /> অনুমোদিত
                  </div>
                  <div className="text-lg font-black text-emerald-950 font-mono">
                    {toBengaliDigits(visitorLogs.filter(l => whitelistedEmails.some(we => we.toLowerCase() === l.identifier.toLowerCase())).length)} জন
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <Lock size={12} className="text-amber-600" /> লকড/সাধারণ
                  </div>
                  <div className="text-lg font-black text-amber-950 font-mono">
                    {toBengaliDigits(visitorLogs.filter(l => !whitelistedEmails.some(we => we.toLowerCase() === l.identifier.toLowerCase())).length)} জন
                  </div>
                </div>
              </div>

              {/* Time Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                
                {/* Time filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black text-slate-500 mr-1 hidden md:inline">ফিল্টার:</span>
                  <button
                    onClick={() => setTimeFilter('last_30_days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_30_days' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ১ মাস (৩০ দিন)
                  </button>
                  <button
                    onClick={() => setTimeFilter('last_7_days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_7_days' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ৭ দিন
                  </button>
                  <button
                    onClick={() => setTimeFilter('last_3_days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_3_days' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ৩ দিন
                  </button>
                  <button
                    onClick={() => setTimeFilter('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    আজ
                  </button>
                  <button
                    onClick={() => setTimeFilter('yesterday')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'yesterday' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    গতকাল
                  </button>
                  <button
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${timeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    সকল সময়
                  </button>
                </div>

                {/* CSV Download & Search */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                    title="ভিজিটর তালিকা CSV ফাইল হিসেবে ডাউনলোড করুন"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">CSV ডাউনলোড</span>
                  </button>

                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Gmail বা ফোন খুঁজুন..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500 w-full sm:w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Add Manual Test Visitor Form */}
              {isAdmin && (
                <form onSubmit={handleAddManualVisitor} className="flex gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100 items-center">
                  <Mail size={16} className="text-blue-600 shrink-0 ml-1" />
                  <input 
                    type="text" 
                    placeholder="নতুন কোন ভিজিটর জিমেইল/মোবাইল নং ম্যানুয়ালি রেকর্ড করতে লিখুন..."
                    value={newVisitorInput}
                    onChange={e => setNewVisitorInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-black transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus size={14} /> এন্ট্রি যোগ
                  </button>
                </form>
              )}

              {/* Visitor Log Table / Cards */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {filteredVisitorLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-slate-200">
                    <Users size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">এই সময়সীমার মধ্যে কোনো ভিজিটর এন্ট্রি পাওয়া যায়নি</p>
                  </div>
                ) : (
                  filteredVisitorLogs.map((log) => {
                    const isCurrentlyWhitelisted = whitelistedEmails.some(
                      we => we.toLowerCase() === log.identifier.toLowerCase()
                    );

                    return (
                      <div 
                        key={log.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCurrentlyWhitelisted ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${isCurrentlyWhitelisted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                            {log.identifier.includes('@') ? <Mail size={18} /> : <Smartphone size={18} />}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-slate-900">{log.identifier}</span>
                              {isCurrentlyWhitelisted ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded-full text-[10px] flex items-center gap-1">
                                  <ShieldCheck size={11} /> অনুমোদিত (Whitelisted)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black rounded-full text-[10px] flex items-center gap-1">
                                  <Lock size={11} /> সাধারণ (প্রথম ৫টি উন্মুক্ত)
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 flex-wrap">
                              <span>📅 {log.formattedDate}</span>
                              <span>⏰ {log.formattedTime}</span>
                              <span className="text-slate-400">💻 {log.deviceInfo}</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                                {toBengaliDigits(log.visitCount)} বার প্রবেশ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Admin Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {!isCurrentlyWhitelisted ? (
                            <>
                              <a
                                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`প্রিয় ব্যবহারকারী, অডিট সার্কুলার পোর্টাল থেকে আপনার আইডি (${log.identifier}) অনুমোদন প্রসেস করতে যোগাযোগ করা হচ্ছে।`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                                title="WhatsApp এ দ্রুত মেসেজ পাঠান"
                              >
                                <MessageSquare size={14} />
                              </a>
                              <button
                                onClick={() => handleQuickWhitelistVisitor(log.identifier)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                title="১-ক্লিকে এই জিমেইল আইডিকে সকল নথির জন্য অনুমোদন দিন"
                              >
                                <CheckCircle2 size={14} />
                                <span>১-ক্লিকে অনুমোদন দিন</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                              <CheckCircle2 size={13} /> উন্মুক্ত
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteVisitorLog(log.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="লগ ডিলেট করুন"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WHITELISTED EMAILS MANAGEMENT */}
          {activeTab === 'whitelisted' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Admin Add Email Form */}
              {isAdmin ? (
                <form onSubmit={handleAddSubmit} className="space-y-3 bg-blue-50/70 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wider">
                    <Plus size={16} className="text-blue-600" /> নতুন অনুমোদিত জিমেইল আইডি (Gmail ID) যুক্ত করুন:
                  </div>
                  <p className="text-xs text-slate-600">
                    ব্যবহারকারী WhatsApp এ ডকুমেন্ট পাঠানোর পর বা ভিজিটর তালিকা দেখে তার জিমেইল আইডিটি এখানে যোগ করুন।
                  </p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input 
                        type="email" 
                        required
                        placeholder="যেমন: contributor@gmail.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 rounded-xl font-bold text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <Plus size={16} /> রেজিস্টার করুন
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 font-medium space-y-1">
                  <div className="font-black flex items-center gap-1.5 text-emerald-950">
                    <MessageSquare size={16} className="text-emerald-600" /> WhatsApp এ আপনার Gmail আইডি ও সার্কুলার দিন
                  </div>
                  <p>
                    আপনার জিমেইল আইডি তালিকায় অন্তর্ভুক্ত করতে WhatsApp নম্বরে (<span className="font-bold font-mono text-emerald-800">{whatsappNumber}</span>) ফাইল সহ মেসেজ পাঠান।
                  </p>
                </div>
              )}

              {/* Search Bar & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs font-black text-slate-700">
                  মোট অনুমোদিত জিমেইল: <span className="text-emerald-600">{toBengaliDigits(whitelistedEmails.length)}</span> টি
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="খুঁজুন (Search email)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 w-full sm:w-60"
                  />
                </div>
              </div>

              {/* List of Whitelisted Emails */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {filteredWhitelistedEmails.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Mail size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">কোনো তালিকাভুক্ত জিমেইল আইডি পাওয়া যায়নি</p>
                  </div>
                ) : (
                  filteredWhitelistedEmails.map((email) => (
                    <div 
                      key={email}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800 font-mono">{email}</div>
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> সকল নথি উন্মুক্ত (Whitelisted)
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`আপনি কি "${email}" এর এক্সেস বাতিল করতে চান?`)) {
                              onRemoveWhitelistedEmail(email);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="এক্সেস বাতিল করুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {isAdmin && activeTab === 'visitor_log' ? (
            <button
              onClick={handleClearAllLogs}
              className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={14} /> সকল লগ রিসেট করুন
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-900 transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
