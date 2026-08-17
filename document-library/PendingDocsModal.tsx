import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, ShieldCheck, User, Plus, Trash2, 
  Search, Mail, MessageSquare, AlertCircle, Users, 
  Clock, Smartphone, Calendar, UserCheck, RefreshCw, 
  Sparkles, Lock, Unlock, ShieldAlert, Download,
  LayoutDashboard, History, FileText, Filter, ArrowRight
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { 
  getInitialVisitorLogs, recordVisitorLog, clearAllVisitorLogs, 
  isValidIdentifier, VisitorLog, getAuditLogs, recordAuditLog, 
  clearAuditLogs, AuditLogItem 
} from './visitorTracker';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'whitelisted' | 'visitor_log' | 'audit_history'>('overview');
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'last_3_days' | 'last_7_days' | 'last_30_days'>('last_30_days');
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [newVisitorInput, setNewVisitorInput] = useState('');
  const [tempWaNum, setTempWaNum] = useState(whatsappNumber);

  useEffect(() => {
    setTempWaNum(whatsappNumber);
  }, [whatsappNumber]);

  useEffect(() => {
    if (isOpen) {
      setVisitorLogs(getInitialVisitorLogs());
      setAuditLogs(getAuditLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const clean = newEmail.trim();
    if (!isValidIdentifier(clean)) {
      alert('অনুগ্রহ করে একটি সঠিক ও পূর্ণাঙ্গ ইমেইল অ্যাড্রেস লিখুন (যেমন: user@gmail.com)।');
      return;
    }
    onAddWhitelistedEmail(clean);
    recordAuditLog('WHITELIST_ADD', 'নতুন জিমেইল আইডি সরাসরি হোয়াইটলিস্টে যোগ করা হয়েছে', clean, 'Admin');
    setAuditLogs(getAuditLogs());
    setNewEmail('');
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleQuickWhitelistVisitor = (identifier: string) => {
    onAddWhitelistedEmail(identifier);
    const updatedLogs = recordVisitorLog(identifier, true);
    setVisitorLogs(updatedLogs);
    recordAuditLog('WHITELIST_ADD', 'ভিজিটর লগ থেকে ১-ক্লিকে জিমেইল অনুমোদন দেওয়া হয়েছে', identifier, 'Admin');
    setAuditLogs(getAuditLogs());
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleRemoveEmailWithAudit = (email: string) => {
    setTimeout(() => {
      if (confirm(`আপনি কি "${email}" এর এক্সেস বাতিল করতে চান?`)) {
        onRemoveWhitelistedEmail(email);
        recordAuditLog('WHITELIST_REMOVE', 'ব্যবহারকারীর হোয়াইটলিস্ট এক্সেস বাতিল করা হয়েছে', email, 'Admin');
        setAuditLogs(getAuditLogs());
      }
    }, 10);
  };

  const handleAddManualVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newVisitorInput.trim();
    if (!val || !isValidIdentifier(val)) {
      alert('অনুগ্রহ করে একটি সঠিক ইমেইল (যেমন: example@gmail.com) অথবা মোবাইল নম্বর দিন।');
      return;
    }
    const isW = whitelistedEmails.some(e => e.toLowerCase() === val.toLowerCase());
    const updated = recordVisitorLog(val, isW);
    setVisitorLogs(updated);
    recordAuditLog('MANUAL_VISITOR_ADD', 'ম্যানুয়াল ভিজিটর এন্ট্রি যোগ করা হয়েছে', val, 'Admin');
    setAuditLogs(getAuditLogs());
    setNewVisitorInput('');
  };

  const handleDeleteVisitorLog = (id: string) => {
    setTimeout(() => {
      const targetLog = visitorLogs.find(l => l.id === id);
      const updated = visitorLogs.filter(l => l.id !== id);
      setVisitorLogs(updated);
      localStorage.setItem('audit_doc_visitor_logs', JSON.stringify(updated));
      recordAuditLog('LOG_DELETE', 'ভিজিটর সাইন-ইন লগ মুছে ফেলা হয়েছে', targetLog?.identifier || id, 'Admin');
      setAuditLogs(getAuditLogs());
    }, 10);
  };

  const handleClearAllLogs = () => {
    setTimeout(() => {
      if (confirm('আপনি কি সকল ভিজিটর লগ মুছে ফেলতে চান?')) {
        const cleared = clearAllVisitorLogs();
        setVisitorLogs(cleared);
        recordAuditLog('LOGS_CLEAR', 'সকল ভিজিটর প্রবেশ লগ রিসেট করা হয়েছে', 'All Logs', 'Admin');
        setAuditLogs(getAuditLogs());
      }
    }, 10);
  };

  const handleClearAuditLogs = () => {
    setTimeout(() => {
      if (confirm('আপনি কি সকল অডিট হিস্ট্রি ইতিহাস মুছে ফেলতে চান?')) {
        const cleared = clearAuditLogs();
        setAuditLogs(cleared);
      }
    }, 10);
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

  const filteredAuditLogs = auditLogs.filter(log =>
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.targetIdentifier && log.targetIdentifier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const last30DaysVisitorsCount = visitorLogs.filter(log => log.timestamp >= thirtyDaysAgoTimestamp).length;
  const todayVisitorsCount = visitorLogs.filter(log => log.dateStr === todayStr).length;
  const unapprovedVisitors = visitorLogs.filter(log => !whitelistedEmails.some(we => we.toLowerCase() === log.identifier.toLowerCase()));
  const unapprovedVisitorsCount = unapprovedVisitors.length;

  return (
    <div className="fixed top-[45px] bottom-0 right-0 left-0 md:left-[126px] z-[9000] flex items-center justify-center p-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-full h-full bg-white rounded-none shadow-2xl border-0 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                অডিট ক্রাইটেরিয়া ও ব্যবহারকারী এক্সেস কন্ট্রোল
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                সিকিউরিটি ড্যাশবোর্ড, অনুমোদিত জিমেইল হোয়াইটলিস্ট, সাইন-ইন ট্র্যাকার ও অডিট চেঞ্জ হিস্ট্রি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin WhatsApp number info */}
            {isAdmin && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-400" />
                <span className="text-slate-300 hidden sm:inline">Admin WhatsApp:</span>
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

        {/* 4 Distinct Top Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 border-b border-slate-200 bg-slate-100/90 p-2.5 shrink-0">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'overview' 
                ? 'bg-white text-blue-950 shadow-md border-blue-200/80 ring-2 ring-blue-500/10' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 border-transparent'
            }`}
          >
            <LayoutDashboard size={16} className={activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'} />
            <span>📊 ওভারভিউ ড্যাশবোর্ড</span>
          </button>

          {/* TAB 2: ALLOWED USERS LIST */}
          <button
            type="button"
            onClick={() => setActiveTab('whitelisted')}
            className={`py-2.5 px-3 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'whitelisted' 
                ? 'bg-white text-emerald-950 shadow-md border-emerald-200/80 ring-2 ring-emerald-500/10' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 border-transparent'
            }`}
          >
            <ShieldCheck size={16} className={activeTab === 'whitelisted' ? 'text-emerald-600' : 'text-slate-400'} />
            <span>👥 অনুমোদিত ব্যবহারকারী</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'whitelisted' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              {toBengaliDigits(whitelistedEmails.length)}
            </span>
          </button>

          {/* TAB 3: VISITOR & SIGN-IN LOG */}
          <button
            type="button"
            onClick={() => setActiveTab('visitor_log')}
            className={`py-2.5 px-3 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'visitor_log' 
                ? 'bg-white text-blue-950 shadow-md border-blue-200/80 ring-2 ring-blue-500/10' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 border-transparent'
            }`}
          >
            <Clock size={16} className={activeTab === 'visitor_log' ? 'text-blue-600' : 'text-slate-400'} />
            <span>🕒 ভিজিটর ও সাইন-ইন লগ</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'visitor_log' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              {toBengaliDigits(last30DaysVisitorsCount)}
            </span>
          </button>

          {/* TAB 4: AUDIT LOG HISTORY */}
          <button
            type="button"
            onClick={() => setActiveTab('audit_history')}
            className={`py-2.5 px-3 font-black text-xs flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none focus:ring-0 border ${
              activeTab === 'audit_history' 
                ? 'bg-white text-purple-950 shadow-md border-purple-200/80 ring-2 ring-purple-500/10' 
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/70 border-transparent'
            }`}
          >
            <History size={16} className={activeTab === 'audit_history' ? 'text-purple-600' : 'text-slate-400'} />
            <span>📜 অডিট ও চেঞ্জ হিস্ট্রি</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              activeTab === 'audit_history' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
            }`}>
              {toBengaliDigits(auditLogs.length)}
            </span>
          </button>

        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {addedSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-2 border border-emerald-200 animate-in fade-in shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>সফলভাবে হোয়াইটলিস্টে যুক্ত করা হয়েছে! ব্যবহারকারী এখন সকল নথি উন্মুক্তভাবে দেখতে পাবেন।</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: OVERVIEW DASHBOARD SUMMARY */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* 4 Primary Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-emerald-50/30 to-white border border-emerald-200/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-600" /> মোট নিবন্ধিত ইউজার
                  </div>
                  <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                    {toBengaliDigits(whitelistedEmails.length)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold">সকল ফাইল দেখার এক্সেসপ্রাপ্ত</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50/90 via-blue-50/30 to-white border border-blue-200/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Clock size={15} className="text-blue-600" /> আজকের ভিজিটর
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                    {toBengaliDigits(todayVisitorsCount)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                  <p className="text-[10px] text-blue-700 font-semibold">আজকে নতুন ও পুরাতন সেশন</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50/90 via-purple-50/30 to-white border border-purple-200/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Users size={15} className="text-purple-600" /> এক্টিভ সেশন (৩০ দিন)
                  </div>
                  <div className="text-2xl font-black text-purple-950 font-mono tracking-tight">
                    {toBengaliDigits(last30DaysVisitorsCount)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                  <p className="text-[10px] text-purple-700 font-semibold">বিগত ১ মাসে ভিজিট করেছেন</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50/90 via-amber-50/30 to-white border border-amber-200/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Lock size={15} className="text-amber-600" /> অননুমোদিত/সাধারণ
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                    {toBengaliDigits(unapprovedVisitorsCount)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                  <p className="text-[10px] text-amber-700 font-semibold">প্রথম ৫টি ফাইল উন্মুক্ত</p>
                </div>
              </div>

              {/* Status & Control Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ShieldAlert size={16} className="text-blue-400" /> সিকিউরিটি পেনিট্রেশন ও ফিল্টার
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black rounded-full border border-emerald-500/30">
                      Active Shield
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    অডিট পোর্টাল ব্যবহারকারীদের স্বয়ংক্রিয়ভাবে ট্র্যাকিং করা হচ্ছে। অনুমোদিত জিমেইল গ্রাহকগণ কোনো সীমাবদ্ধতা ছাড়াই সকল সার্কুলার অ্যাক্সেস করতে পারছেন।
                  </p>
                  <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-800 text-slate-400">
                    <span>হোয়াটসঅ্যাপ সার্কুলার রিকোয়েস্ট:</span>
                    <span className="font-mono text-emerald-400 font-black">{whatsappNumber}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white border border-blue-200/80 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-blue-600" /> দ্রুত অ্যাকশন প্যানেল
                    </span>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('whitelisted')}
                      className="text-[11px] font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>তালিকা দেখুন</span> <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium">নতুন ব্যবহারকারীকে দ্রুত হোয়াইটলিস্টে অন্তর্ভুক্ত করতে ২ নম্বর ট্যাবে যান অথবা নিচে থেকে ১-ক্লিক অনুমোদন দিন।</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('whitelisted')}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all text-center cursor-pointer shadow-xs"
                    >
                      + নতুন জিমেইল যুক্ত করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('visitor_log')}
                      className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80 rounded-xl text-xs font-black transition-all text-center cursor-pointer"
                    >
                      সকল সাইন-ইন লগ
                    </button>
                  </div>
                </div>
              </div>

              {/* Unapproved Visitors Quick Approval Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lock size={15} className="text-amber-600" /> অনুমোদনের অপেক্ষায় থাকা সাম্প্রতিক সাইন-ইন ({toBengaliDigits(unapprovedVisitors.length)} জন)
                  </h4>
                  {unapprovedVisitors.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setActiveTab('visitor_log')}
                      className="text-xs font-black text-blue-600 hover:text-blue-800"
                    >
                      সকল দেখাও ({toBengaliDigits(visitorLogs.length)})
                    </button>
                  )}
                </div>

                {unapprovedVisitors.length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-center text-emerald-900 text-xs font-bold">
                    🎉 বর্তমানে কোনো অননুমোদিত ভিজিটর নেই! সব ব্যবহারকারী অনুমোদিত।
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unapprovedVisitors.slice(0, 4).map(v => (
                      <div key={v.id} className="p-3.5 bg-white border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
                        <div className="space-y-1 overflow-hidden">
                          <div className="text-xs font-mono font-black text-slate-900 truncate">{v.identifier}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {v.formattedDate} • {v.formattedTime} ({toBengaliDigits(v.visitCount)} বার)
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickWhitelistVisitor(v.identifier)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="অনুমোদন দিন"
                          >
                            <CheckCircle2 size={13} />
                            <span>এপ্রুভ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVisitorLog(v.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-100"
                            title="ভুল বা ভুয়া লগ মুছে ফেলুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 1: VISITOR ACTIVITY LOG */}
          {activeTab === 'visitor_log' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-white border border-blue-100/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <Clock size={13} className="text-blue-600" /> আজ এসেছে
                  </div>
                  <div className="text-xl font-black text-blue-950 font-mono tracking-tight">
                    {toBengaliDigits(todayVisitorsCount)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50/90 via-purple-50/40 to-white border border-purple-100/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-600" /> বিগত ১ মাস (৩০ দিন)
                  </div>
                  <div className="text-xl font-black text-purple-950 font-mono tracking-tight">
                    {toBengaliDigits(last30DaysVisitorsCount)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white border border-emerald-100/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" /> অনুমোদিত (Whitelisted)
                  </div>
                  <div className="text-xl font-black text-emerald-950 font-mono tracking-tight">
                    {toBengaliDigits(visitorLogs.filter(l => whitelistedEmails.some(we => we.toLowerCase() === l.identifier.toLowerCase())).length)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border border-amber-100/80 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-600" /> সাধারণ (Locked/New)
                  </div>
                  <div className="text-xl font-black text-amber-950 font-mono tracking-tight">
                    {toBengaliDigits(visitorLogs.filter(l => !whitelistedEmails.some(we => we.toLowerCase() === l.identifier.toLowerCase())).length)} <span className="text-xs font-sans text-slate-500 font-bold">জন</span>
                  </div>
                </div>
              </div>

              {/* Time Filters & Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                
                {/* Time filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black text-slate-500 mr-1 hidden md:inline-flex items-center gap-1">
                    <Filter size={12} className="text-slate-400" /> ফিল্টার:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('last_30_days')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_30_days' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ১ মাস (৩০ দিন)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('last_7_days')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_7_days' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ৭ দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('last_3_days')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'last_3_days' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    বিগত ৩ দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('today')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'today' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    আজ
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('yesterday')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'yesterday' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    গতকাল
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${timeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20' : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                  >
                    সকল সময়
                  </button>
                </div>

                {/* CSV Download & Search */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow shrink-0"
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
                      className="pl-9 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-full sm:w-52 transition-all"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Manual Test Visitor Form */}
              {isAdmin && (
                <form onSubmit={handleAddManualVisitor} className="flex gap-2.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 p-3.5 rounded-2xl border border-blue-100 items-center shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="নতুন কোন ভিজিটর জিমেইল/মোবাইল নং ম্যানুয়ালি রেকর্ড করতে লিখুন..."
                    value={newVisitorInput}
                    onChange={e => setNewVisitorInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-blue-200/80 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm hover:shadow"
                  >
                    <Plus size={15} /> <span>এন্ট্রি যোগ</span>
                  </button>
                </form>
              )}

              {/* Visitor Log Table / Cards */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredVisitorLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <Users size={36} className="mx-auto text-slate-300" />
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
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                          isCurrentlyWhitelisted 
                            ? 'bg-gradient-to-r from-emerald-50/60 via-emerald-50/20 to-white border-emerald-200/80 hover:border-emerald-300 shadow-2xs' 
                            : 'bg-white border-slate-200/90 hover:border-blue-300/80 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs ${
                            isCurrentlyWhitelisted 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200/50'
                          }`}>
                            {log.identifier.includes('@') ? <Mail size={18} /> : <Smartphone size={18} />}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs sm:text-sm text-slate-900 select-all">{log.identifier}</span>
                              {isCurrentlyWhitelisted ? (
                                <span className="px-2.5 py-0.5 bg-emerald-100/90 text-emerald-800 font-black rounded-full text-[10px] flex items-center gap-1 border border-emerald-200/60 shadow-xs">
                                  <ShieldCheck size={12} className="text-emerald-600" /> অনুমোদিত (Whitelisted)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 font-black rounded-full text-[10px] flex items-center gap-1 border border-amber-200/60">
                                  <Lock size={11} className="text-amber-700" /> সাধারণ (প্রথম ৫টি উন্মুক্ত)
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> {log.formattedDate}</span>
                              <span className="flex items-center gap-1"><Clock size={12} className="text-slate-400" /> {log.formattedTime}</span>
                              <span className="text-slate-400 flex items-center gap-1"><Smartphone size={12} className="text-slate-400" /> {log.deviceInfo}</span>
                              <span className="bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700">
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
                                className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer shadow-xs"
                                title="WhatsApp এ দ্রুত মেসেজ পাঠান"
                              >
                                <MessageSquare size={15} />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleQuickWhitelistVisitor(log.identifier)}
                                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer ring-2 ring-emerald-500/20 active:scale-95"
                                title="১-ক্লিকে এই জিমেইল আইডিকে সকল নথির জন্য অনুমোদন দিন"
                              >
                                <CheckCircle2 size={15} />
                                <span>১-ক্লিকে অনুমোদন দিন</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 px-3 py-1.5 bg-emerald-100/60 rounded-xl border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={14} className="text-emerald-600" /> অনুমোদনপ্রাপ্ত
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVisitorLog(log.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
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
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Admin Add Email Form */}
              {isAdmin ? (
                <form onSubmit={handleAddSubmit} className="space-y-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-slate-50 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase tracking-wider">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>নতুন অনুমোদিত জিমেইল আইডি (Gmail ID) যুক্ত করুন:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    ব্যবহারকারী WhatsApp এ অনুরোধ করার পর বা ভিজিটর তালিকা দেখে তার জিমেইল আইডিটি এখানে যোগ করুন।
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input 
                        type="email" 
                        required
                        placeholder="যেমন: contributor@gmail.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-200/80 rounded-xl font-bold text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer ring-2 ring-emerald-500/20 active:scale-95 shrink-0"
                    >
                      <Plus size={16} />
                      <span>রেজিস্টার করুন</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-slate-50 border border-emerald-200/80 p-4 rounded-2xl text-xs text-emerald-900 font-medium space-y-1.5 shadow-xs">
                  <div className="font-black flex items-center gap-2 text-emerald-950">
                    <MessageSquare size={16} className="text-emerald-600" />
                    <span>WhatsApp এ আপনার Gmail আইডি ও সার্কুলার তথ্য দিন</span>
                  </div>
                  <p className="leading-relaxed">
                    আপনার জিমেইল আইডি তালিকায় অন্তর্ভুক্ত করতে WhatsApp নম্বরে (<span className="font-bold font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">{whatsappNumber}</span>) ফাইল বা মেসেজ পাঠান।
                  </p>
                </div>
              )}

              {/* Search Bar & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <span>মোট অনুমোদিত জিমেইল:</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-black rounded-full text-xs border border-emerald-200/60">
                    {toBengaliDigits(whitelistedEmails.length)} টি
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="খুঁজুন (Search email)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 w-full sm:w-64 transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* List of Whitelisted Emails */}
              <div className="max-h-[320px] overflow-y-auto space-y-2 border border-slate-200/80 rounded-2xl p-3 bg-slate-50/50">
                {filteredWhitelistedEmails.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-white rounded-xl border border-slate-100">
                    <Mail size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">কোনো তালিকাভুক্ত জিমেইল আইডি পাওয়া যায়নি</p>
                  </div>
                ) : (
                  filteredWhitelistedEmails.map((email) => (
                    <div 
                      key={email}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-all shadow-xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200/50">
                          <User size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs sm:text-sm font-black text-slate-900 font-mono select-all">{email}</div>
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span>অনুমোদিত (সকল নথি উন্মুক্ত)</span>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmailWithAudit(email)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
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

          {/* ================================================================ */}
          {/* TAB 4: AUDIT LOG HISTORY & CHANGE RECORDS */}
          {/* ================================================================ */}
          {activeTab === 'audit_history' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <History size={16} className="text-purple-600" />
                  <span>অডিট সিস্টেমে সংরক্ষিত কার্যক্রম ইতিহাস:</span>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-mono font-black rounded-full text-xs">
                    {toBengaliDigits(auditLogs.length)} টি
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="হিস্ট্রি খুঁজুন..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 w-full sm:w-64 transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1">
                {filteredAuditLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <History size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">কোনো অডিট পরিবর্তন ইতিহাস রেকর্ড করা নেই</p>
                  </div>
                ) : (
                  filteredAuditLogs.map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-start justify-between gap-3 shadow-xs hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.actionType === 'WHITELIST_ADD' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : item.actionType === 'WHITELIST_REMOVE'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {item.actionType === 'WHITELIST_ADD' ? <CheckCircle2 size={16} /> : item.actionType === 'WHITELIST_REMOVE' ? <Trash2 size={16} /> : <FileText size={16} />}
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {item.description}
                          </div>
                          {item.targetIdentifier && (
                            <div className="text-xs font-mono font-black text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded-md inline-block border border-purple-100">
                              {item.targetIdentifier}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-3">
                            <span>📅 {item.formattedDate}</span>
                            <span>⏰ {item.formattedTime}</span>
                            <span>👤 দ্বারা: {item.performedBy}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono shrink-0 ${
                        item.actionType === 'WHITELIST_ADD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.actionType === 'WHITELIST_REMOVE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.actionType}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0 rounded-b-2xl">
          {isAdmin && activeTab === 'visitor_log' ? (
            <button
              type="button"
              onClick={handleClearAllLogs}
              className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-xl"
            >
              <Trash2 size={14} />
              <span>সকল ভিজিটর লগ রিসেট করুন</span>
            </button>
          ) : isAdmin && activeTab === 'audit_history' ? (
            <button
              type="button"
              onClick={handleClearAuditLogs}
              className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 rounded-xl"
            >
              <Trash2 size={14} />
              <span>সকল অডিট হিস্ট্রি রিসেট করুন</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
