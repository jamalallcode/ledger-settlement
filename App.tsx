import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SettlementForm from './components/SettlementForm';
import SettlementTable from './components/SettlementTable';
import CorrespondenceTable from './components/CorrespondenceTable';
import ReturnView from './components/ReturnView';
import LandingPage from './components/LandingPage';
import VotingSystem from './components/VotingSystem';
import DocumentArchive from './components/DocumentArchive';
import { SettlementEntry, GroupOption, CumulativeStats } from './types';
import { getCurrentCycle } from './utils/cycleHelper';
import { toBengaliDigits } from './utils/numberUtils';
import { supabase } from './lib/supabase';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, BellRing, Sparkles, Mail, ClipboardList, ArrowRightCircle, ChevronLeft } from 'lucide-react';

const STORAGE_KEY = 'ledger_settlement_v10_stable';
const CORR_STORAGE_KEY = 'ledger_correspondence_v1';
const PREV_STATS_KEY = 'ledger_prev_stats_v1';
const LOCK_MODE_KEY = 'ledger_lock_mode_status';
const ADMIN_MODE_KEY = 'ledger_admin_access_v1';
const OFFLINE_QUEUE_KEY = 'ledger_offline_sync_queue_v1';

const generateId = () => {
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<SettlementEntry[]>([]);
  const [correspondenceEntries, setCorrespondenceEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('landing'); 
  const [resetKey, setResetKey] = useState(0); 
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isLayoutEditable, setIsLayoutEditable] = useState(false);
  const [isLockedMode, setIsLockedMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterFilters, setShowRegisterFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Register Selection State
  const [registerSubModule, setRegisterSubModule] = useState<'settlement' | 'correspondence' | null>(null);
  
  const [prevStats, setPrevStats] = useState<CumulativeStats>({
    inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0,
    entitiesSFI: {},
    entitiesNonSFI: {}
  });

  const mainScrollRef = useRef<HTMLElement>(null);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) setResetKey(prev => prev + 1);
    else { setActiveTab(tab); setResetKey(0); }
    setShowPendingOnly(false);
    // Reset submodule selection when clicking register in sidebar
    if (tab === 'register') setRegisterSubModule(null);
  };

  // --- AUTO SYNC LOGIC ---
  const syncOfflineData = async () => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline entries...`);
    const successfulSyncs: string[] = [];

    for (const entry of queue) {
      try {
        const { error } = await supabase.from('settlement_entries').upsert({ id: entry.id, content: entry });
        if (!error) {
          successfulSyncs.push(entry.id);
        }
      } catch (err) {
        console.error("Sync failed for entry:", entry.id, err);
      }
    }

    const remainingQueue = queue.filter((entry: any) => !successfulSyncs.includes(entry.id));
    if (remainingQueue.length === 0) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log("All offline data synced successfully.");
    } else {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check on load
    if (navigator.onLine) syncOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // STRICT AUTO-ADMIN DETECTION
  useEffect(() => {
    const handleAdminSync = (email?: string) => {
      if (email === 'websitetogather@gmail.com') {
        setIsAdmin(true);
        localStorage.setItem(ADMIN_MODE_KEY, 'true');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAdminSync(session?.user?.email);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAdminSync(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, resetKey]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const savedPrev = localStorage.getItem(PREV_STATS_KEY);
        if (savedPrev) setPrevStats(JSON.parse(savedPrev));
        const savedLock = localStorage.getItem(LOCK_MODE_KEY);
        if (savedLock !== null) setIsLockedMode(JSON.parse(savedLock));
        
        const savedAdmin = localStorage.getItem(ADMIN_MODE_KEY);
        if (savedAdmin === 'true') setIsAdmin(true);

        const { data, error } = await supabase.from('settlement_entries').select('*');
        if (!error && data) {
          const processedEntries: SettlementEntry[] = [];
          const corrEntries: any[] = [];
          
          data.forEach((row: any) => {
            if (!row || !row.id) return;
            
            // Safe content parsing
            let content = row.content;
            if (typeof content === 'string') {
              try { content = JSON.parse(content); } catch (e) { return; }
            }
            if (!content) return;

            if (row.id === 'system_metadata_prev_stats') {
              setPrevStats(content);
              localStorage.setItem(PREV_STATS_KEY, JSON.stringify(content));
            } else if (row.id.startsWith('id-')) {
              // Distinguish between entry types
              if (content.type === 'correspondence') {
                corrEntries.push(content);
              } else {
                processedEntries.push(content);
              }
            }
          });
          
          setEntries(processedEntries);
          setCorrespondenceEntries(corrEntries);
        }
      } catch (e) { console.error('Data error:', e); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const syncPrevStats = async () => {
      if (Object.keys(prevStats.entitiesSFI).length > 0) {
        if (navigator.onLine) {
          await supabase.from('settlement_entries').upsert({ 
            id: 'system_metadata_prev_stats', 
            content: prevStats 
          });
        }
        localStorage.setItem(PREV_STATS_KEY, JSON.stringify(prevStats));
      }
    };
    syncPrevStats();
  }, [prevStats]);

  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const cycleLabelBengali = useMemo(() => toBengaliDigits(cycleInfo.label), [cycleInfo.label]);

  const handleAddOrUpdateEntry = async (data: any) => {
    // If data comes from Correspondence Module, it will have a specific structure
    const isCorrespondence = data.description !== undefined;

    if (editingEntry && !isAdmin) {
      alert("দুঃখিত, শুধুমাত্র এডমিন তথ্য এডিট করতে পারেন।");
      return;
    }

    const status = editingEntry 
      ? (editingEntry.approvalStatus || 'approved') 
      : (isAdmin ? 'approved' : 'pending');

    let entryToSync: any;

    if (editingEntry) {
      entryToSync = { ...editingEntry, ...data, approvalStatus: status };
      if (isCorrespondence) {
        setCorrespondenceEntries(prev => prev.map(e => e.id === editingEntry.id ? entryToSync : e));
      } else {
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? entryToSync : e));
      }
      setEditingEntry(null);
    } else {
      const newId = generateId();
      entryToSync = { 
        ...data, 
        id: newId, 
        type: isCorrespondence ? 'correspondence' : 'settlement',
        sl: isCorrespondence ? correspondenceEntries.length + 1 : entries.length + 1, 
        createdAt: new Date().toISOString(),
        approvalStatus: status
      };
      
      if (isCorrespondence) {
        setCorrespondenceEntries(prev => [entryToSync, ...prev]);
      } else {
        setEntries(prev => [...prev, entryToSync]);
      }
    }
    
    // OFFLINE HANDLING
    if (!navigator.onLine) {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...queue, entryToSync]));
      alert("ইন্টারনেট সংযোগ নেই। তথ্যটি আপনার ডিভাইসে (Offline Queue) জমা রাখা হয়েছে এবং ইন্টারনেট সংযোগ পাওয়ার সাথে সাথে এটি স্বয়ংক্রিয়ভাবে মূল ডাটাবেজে সংরক্ষিত হবে।");
    } else {
      await supabase.from('settlement_entries').upsert({ id: entryToSync.id, content: entryToSync });
    }
    
    // REDIRECTS STRICTLY REMOVED AS PER USER REQUEST
    // The component state now handles the success view properly.
  };

  const handleViewRegister = (module: 'settlement' | 'correspondence') => {
    setActiveTab('register');
    setRegisterSubModule(module);
  };

  const handleApproveEntry = async (id: string) => {
    const entry = [...entries, ...correspondenceEntries].find(e => e.id === id);
    if (!entry) return;
    
    const updatedEntry = { ...entry, approvalStatus: 'approved' as const };
    
    if (entry.type === 'correspondence') {
      setCorrespondenceEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    } else {
      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    }

    if (navigator.onLine) {
      await supabase.from('settlement_entries').upsert({ id: updatedEntry.id, content: updatedEntry });
    } else {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...queue, updatedEntry]));
    }
  };

  const handleRejectEntry = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি প্রত্যাখ্যান করতে চান? এটি মুছে ফেলা হবে।")) return;
    
    setEntries(prev => prev.filter(e => e.id !== id));
    setCorrespondenceEntries(prev => prev.filter(e => e.id !== id));
    
    if (navigator.onLine) {
      await supabase.from('settlement_entries').delete().eq('id', id);
    } else {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.filter((e: any) => e.id !== id)));
    }
  };

  const handleDelete = async (id: string, paraId?: string) => {
    if (!isAdmin) {
      alert("দুঃখিত, শুধুমাত্র এডমিন তথ্য মুছে ফেলতে পারেন।");
      return;
    }

    if (paraId) {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      const remainingParas = entry.paragraphs.filter(p => p.id !== paraId);
      const mRaisedCountRaw = entry.manualRaisedCount?.toString().trim() || "";
      const hasRaisedData = (mRaisedCountRaw !== "" && mRaisedCountRaw !== "0" && mRaisedCountRaw !== "০") || 
                            (entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== 0);
      
      if (remainingParas.length === 0 && !hasRaisedData) {
        setEntries(prev => prev.filter(e => e.id !== id));
        if (navigator.onLine) {
          await supabase.from('settlement_entries').delete().eq('id', id);
        } else {
          const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.filter((e: any) => e.id !== id)));
        }
      } else {
        const updatedEntry = { ...entry, paragraphs: remainingParas };
        setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
        if (navigator.onLine) {
          await supabase.from('settlement_entries').upsert({ id: id, content: updatedEntry });
        } else {
          const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...queue, updatedEntry]));
        }
      }
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
      setCorrespondenceEntries(prev => prev.filter(e => e.id !== id));
      if (navigator.onLine) {
        await supabase.from('settlement_entries').delete().eq('id', id);
      } else {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.filter((e: any) => e.id !== id)));
      }
    }
  };

  const approvedEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'approved' || !e.approvalStatus), [entries]);
  const approvedCorrespondence = useMemo(() => correspondenceEntries.filter(e => e.approvalStatus === 'approved' || !e.approvalStatus), [correspondenceEntries]);
  
  const pendingEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'pending'), [entries]);
  const pendingCorrespondence = useMemo(() => correspondenceEntries.filter(e => e.approvalStatus === 'pending'), [correspondenceEntries]);
  
  const totalPendingCount = pendingEntries.length + pendingCorrespondence.length;

  const IDBadge = ({ id }: { id: string }) => {
    const [copied, setCopied] = useState(false);
    if (!isLayoutEditable) return null;
    const handleCopy = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div onClick={handleCopy} className="absolute top-0 left-0 -translate-y-full z-[9995] pointer-events-auto no-print">
        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-black text-[9px] bg-black text-white border border-white/30 shadow-2xl transition-all duration-300 hover:scale-150 hover:bg-blue-600 hover:z-[99999] active:scale-95 cursor-copy origin-bottom-left ${copied ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30 !scale-125' : ''}`}>
          {copied ? <><CheckCircle2 size={10} /> COPIED</> : `#${id}`}
        </span>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden font-['Hind_Siliguri']">
      {isLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[1000] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-slate-700 text-sm animate-pulse tracking-widest">সিস্টেম লোড হচ্ছে...</p>
        </div>
      )}

      {isSidebarOpen && (
        <Sidebar 
          activeTab={activeTab} setActiveTab={handleTabChange} 
          onToggleVisibility={() => setIsSidebarOpen(false)}
          isLockedMode={isLockedMode} setIsLockedMode={setIsLockedMode}
          isLayoutEditable={isLayoutEditable} isAdmin={isAdmin} setIsAdmin={setIsAdmin}
          pendingCount={totalPendingCount}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar 
          activeTab={activeTab} setActiveTab={handleTabChange} onDemoLoad={() => {}}
          isLockedMode={isLockedMode} setIsLockedMode={setIsLockedMode}
          isLayoutEditable={isLayoutEditable} setIsLayoutEditable={setIsLayoutEditable}
          onExportSystem={() => {}} onImportSystem={() => {}}
          isAdmin={isAdmin} setIsAdmin={setIsAdmin} cycleLabel={cycleLabelBengali}
          showRegisterFilters={showRegisterFilters} setShowRegisterFilters={setShowRegisterFilters}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen}
          pendingEntries={[...pendingEntries, ...pendingCorrespondence]}
          onApprove={handleApproveEntry}
          onReject={handleRejectEntry}
          setShowPendingOnly={setShowPendingOnly}
        />

        <main ref={mainScrollRef} className="flex-1 overflow-auto bg-white relative scroll-smooth">
          <div className="p-4 md:p-8 max-w-full mx-auto w-full flex flex-col">
            <div className="animate-in fade-in duration-500 flex-1">
              
              {activeTab === 'landing' && (
                <LandingPage 
                  entries={approvedEntries} 
                  setActiveTab={handleTabChange} 
                  cycleLabel={cycleLabelBengali} 
                  isLockedMode={isLockedMode} 
                  isLayoutEditable={isLayoutEditable} 
                  isAdmin={isAdmin}
                  pendingCount={totalPendingCount}
                  onShowPending={() => { setActiveTab('register'); setShowPendingOnly(true); }}
                />
              )}
              
              {activeTab === 'entry' && <SettlementForm key={`entry-reset-${resetKey}`} onAdd={handleAddOrUpdateEntry} onViewRegister={handleViewRegister} nextSl={entries.length + 1} branchSuggestions={[]} initialEntry={editingEntry} onCancel={() => { setEditingEntry(null); setActiveTab('register'); }} isLayoutEditable={isLayoutEditable} isAdmin={isAdmin} />}
              
              {activeTab === 'register' && (
                <div className="space-y-6 relative">
                  {showPendingOnly ? (
                    <div className="space-y-8 animate-in fade-in duration-700">
                      <div className="flex items-center justify-between no-print mb-4">
                        <button 
                          onClick={() => setShowPendingOnly(false)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-2 font-black text-[11px] border border-slate-200"
                        >
                          <ChevronLeft size={16} /> মূল রেজিস্টারে ফিরুন
                        </button>
                      </div>

                      {(pendingEntries.length > 0 || pendingCorrespondence.length > 0) ? (
                        <div className="bg-amber-50/50 border-2 border-dashed border-amber-200 p-8 rounded-[2.5rem] text-center space-y-3">
                           <h3 className="text-xl font-black text-amber-900">অপেক্ষমাণ এন্ট্রি মডোরেশন</h3>
                           <p className="text-sm font-bold text-amber-700">নিচের এন্ট্রিগুলো যাচাই করে অনুমোদন দিন। অনুমোদন না পাওয়া পর্যন্ত এগুলো রিপোর্ট বা রেজিস্টারে আসবে না।</p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-200 p-10 rounded-[3rem] text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-1000">
                           <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 animate-in spin-in-1 duration-1000">
                              <CheckCircle2 size={36} strokeWidth={2.5} />
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-2xl font-black text-emerald-900 flex items-center justify-center gap-3">
                                <Sparkles size={20} className="text-amber-400" /> সকল তথ্য সফলভাবে মডোরেশন করা হয়েছে!
                              </h3>
                              <p className="text-sm font-bold text-emerald-700">বর্তমানে আপনার ইনবক্সে কোনো এন্ট্রি অনুমোদনের অপেক্ষায় নেই।</p>
                           </div>
                           <button 
                             onClick={() => setShowPendingOnly(false)}
                             className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-xl active:scale-95 border-b-4 border-emerald-800"
                           >
                             মূল রেজিস্টারে ফিরে যান
                           </button>
                        </div>
                      )}
                      
                      {pendingCorrespondence.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl w-fit font-black text-sm border border-emerald-100">
                            <Mail size={16} /> প্রাপ্ত চিঠিপত্র অপেক্ষমাণ
                          </div>
                          <CorrespondenceTable 
                            entries={pendingCorrespondence} 
                            onBack={() => {}}
                            isAdmin={isAdmin}
                            isLayoutEditable={isLayoutEditable}
                            onEdit={e => { setEditingEntry(e); setActiveTab('entry'); }}
                            onDelete={handleDelete}
                            onApprove={handleApproveEntry}
                            onReject={handleRejectEntry}
                          />
                        </div>
                      )}

                      {pendingEntries.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl w-fit font-black text-sm border border-blue-100">
                            <ClipboardList size={16} /> মীমাংসা রেজিস্টার অপেক্ষমাণ
                          </div>
                          <SettlementTable 
                            key={`pending-list`} 
                            entries={pendingEntries} 
                            onDelete={handleDelete} 
                            onEdit={e => { setEditingEntry(e); setActiveTab('entry'); }} 
                            isLayoutEditable={isLayoutEditable} 
                            showFilters={false} 
                            setShowFilters={setShowRegisterFilters}
                            isAdminView={true}
                            onApprove={handleApproveEntry}
                            onReject={handleRejectEntry}
                            isAdmin={isAdmin}
                          />
                        </div>
                      )}
                    </div>
                  ) : !registerSubModule ? (
                    <div id="section-register-choice" className="w-full py-2 animate-in slide-in-from-left-10 duration-700 relative">
                      <IDBadge id="section-register-choice" />
                      <div className="space-y-5 max-w-4xl text-left">
                        {/* Option 1: Incoming Correspondence Register */}
                        <div 
                          onClick={() => setRegisterSubModule('correspondence')}
                          className="group relative flex items-center h-[82px] w-full bg-slate-900 rounded-[1.25rem] shadow-lg hover:shadow-2xl hover:translate-x-1.5 transition-all duration-500 cursor-pointer overflow-hidden border border-white/10 animate-in slide-in-from-left-4 fill-mode-forwards"
                        >
                          <IDBadge id="reg-opt-correspondence" />
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                          <div className="flex items-center justify-center pl-7">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-500">
                              <Mail size={24} className="text-emerald-500 group-hover:text-white" />
                            </div>
                          </div>
                          <div className="flex flex-col justify-center pl-8 flex-1">
                            <h3 className="text-[20px] font-black text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">১. প্রাপ্ত চিঠিপত্র সংক্রান্ত রেজিস্টার</h3>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-0.5 group-hover:text-slate-300 transition-colors">প্রাপ্ত সকল চিঠিপত্র এবং ডায়েরি এন্ট্রির পরিসংখ্যান দেখুন।</p>
                          </div>
                          <div className="pr-10 opacity-30 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            <ArrowRightCircle size={22} className="text-white" />
                          </div>
                        </div>

                        {/* Option 2: Settlement Register */}
                        <div 
                          onClick={() => setRegisterSubModule('settlement')}
                          className="group relative flex items-center h-[82px] w-full bg-slate-900 rounded-[1.25rem] shadow-lg hover:shadow-2xl hover:translate-x-1.5 transition-all duration-500 cursor-pointer overflow-hidden border border-white/10 animate-in slide-in-from-left-4 fill-mode-forwards delay-100"
                        >
                          <IDBadge id="reg-opt-settlement" />
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                          <div className="flex items-center justify-center pl-7">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500">
                              <ClipboardList size={24} className="text-blue-500 group-hover:text-white" />
                            </div>
                          </div>
                          <div className="flex flex-col justify-center pl-8 flex-1">
                            <h3 className="text-[20px] font-black text-white tracking-tight leading-tight group-hover:text-blue-400 transition-colors">২. মীমাংসা রেজিস্টার</h3>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mt-0.5 group-hover:text-slate-300 transition-colors">অডিট আপত্তি নিষ্পত্তি সংক্রান্ত বিস্তারিত রিপোর্ট এবং তথ্য।</p>
                          </div>
                          <div className="pr-10 opacity-30 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                            <ArrowRightCircle size={22} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : registerSubModule === 'settlement' ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 no-print mb-2">
                        <button 
                          onClick={() => setRegisterSubModule(null)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-2 font-black text-[11px] border border-slate-200"
                        >
                          <ChevronLeft size={16} /> মেনুতে ফিরুন
                        </button>
                      </div>

                      <SettlementTable 
                        key={`register-reset-${resetKey}`} 
                        entries={approvedEntries} 
                        onDelete={handleDelete} 
                        onEdit={e => { setEditingEntry(e); setActiveTab('entry'); }} 
                        isLayoutEditable={isLayoutEditable} 
                        showFilters={showRegisterFilters} 
                        setShowFilters={setShowRegisterFilters} 
                        isAdmin={isAdmin}
                      />
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-700">
                      <CorrespondenceTable 
                        entries={approvedCorrespondence} 
                        onBack={() => setRegisterSubModule(null)} 
                        isLayoutEditable={isLayoutEditable}
                        isAdmin={isAdmin}
                        onEdit={e => { setEditingEntry(e); setActiveTab('entry'); }}
                        onDelete={handleDelete}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'return' && <ReturnView key={`return-reset-${resetKey}`} entries={approvedEntries} correspondenceEntries={approvedCorrespondence} cycleLabel={cycleLabelBengali} prevStats={prevStats} setPrevStats={setPrevStats} isLayoutEditable={isLayoutEditable} isAdmin={isAdmin} />}
              
              {activeTab === 'archive' && <DocumentArchive isAdmin={isAdmin} />}

              {activeTab === 'voting' && <VotingSystem isAdmin={isAdmin} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
