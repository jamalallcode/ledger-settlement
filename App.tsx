
import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SettlementForm from './components/SettlementForm';
import SettlementTable from './components/SettlementTable';
import ReturnView from './components/ReturnView';
import LandingPage from './components/LandingPage';
import VotingSystem from './components/VotingSystem';
import { SettlementEntry, GroupOption, CumulativeStats } from './types';
import { getCurrentCycle } from './utils/cycleHelper';
import { toBengaliDigits } from './utils/numberUtils';
import { supabase } from './lib/supabase';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, BellRing, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'ledger_settlement_v10_stable';
const PREV_STATS_KEY = 'ledger_prev_stats_v1';
const LOCK_MODE_KEY = 'ledger_lock_mode_status';
const ADMIN_MODE_KEY = 'ledger_admin_access_v1';

const generateId = () => {
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<SettlementEntry[]>([]);
  const [activeTab, setActiveTab] = useState('landing'); 
  const [resetKey, setResetKey] = useState(0); 
  const [editingEntry, setEditingEntry] = useState<SettlementEntry | null>(null);
  const [isLayoutEditable, setIsLayoutEditable] = useState(false);
  const [isLockedMode, setIsLockedMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterFilters, setShowRegisterFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
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
  };

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
          const metaRow = data.find((row: any) => row.id === 'system_metadata_prev_stats');
          if (metaRow) {
            setPrevStats(metaRow.content);
            localStorage.setItem(PREV_STATS_KEY, JSON.stringify(metaRow.content));
          }

          const loadedEntries = data
            .filter((row: any) => row.id !== 'system_metadata_prev_stats')
            .map((row: any) => row.content);
          setEntries(loadedEntries);
        }
      } catch (e) { console.error('Data error:', e); } 
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const syncPrevStats = async () => {
      if (Object.keys(prevStats.entitiesSFI).length > 0) {
        await supabase.from('settlement_entries').upsert({ 
          id: 'system_metadata_prev_stats', 
          content: prevStats 
        });
        localStorage.setItem(PREV_STATS_KEY, JSON.stringify(prevStats));
      }
    };
    syncPrevStats();
  }, [prevStats]);

  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const cycleLabelBengali = useMemo(() => toBengaliDigits(cycleInfo.label), [cycleInfo.label]);

  const handleAddOrUpdateEntry = async (data: any) => {
    const status = editingEntry 
      ? (editingEntry.approvalStatus || 'approved') 
      : (isAdmin ? 'approved' : 'pending');

    if (editingEntry) {
      const entryToSync = { ...editingEntry, ...data, approvalStatus: status };
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? entryToSync : e));
      setEditingEntry(null);
      await supabase.from('settlement_entries').upsert({ id: entryToSync.id, content: entryToSync });
    } else {
      const newId = generateId();
      const newEntry: SettlementEntry = { 
        ...data, 
        id: newId, 
        sl: entries.length + 1, 
        createdAt: new Date().toISOString(),
        approvalStatus: status
      };
      
      setEntries(prev => [...prev, newEntry]);
      await supabase.from('settlement_entries').upsert({ id: newId, content: newEntry });
    }
    
    if (!isAdmin) setActiveTab('landing');
    else setActiveTab('register');
  };

  const handleApproveEntry = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    const updatedEntry = { ...entry, approvalStatus: 'approved' as const };
    setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    await supabase.from('settlement_entries').upsert({ id: updatedEntry.id, content: updatedEntry });
  };

  const handleRejectEntry = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই এন্ট্রিটি প্রত্যাখ্যান করতে চান? এটি মুছে ফেলা হবে।")) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('settlement_entries').delete().eq('id', id);
  };

  const handleDelete = async (id: string, paraId?: string) => {
    // Persistent Delete Logic - Refactored to handle database first/concurrently
    if (paraId) {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      const remainingParas = entry.paragraphs.filter(p => p.id !== paraId);
      const mRaisedCountRaw = entry.manualRaisedCount?.toString().trim() || "";
      const hasRaisedData = (mRaisedCountRaw !== "" && mRaisedCountRaw !== "0" && mRaisedCountRaw !== "০") || 
                            (entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== 0);
      
      if (remainingParas.length === 0 && !hasRaisedData) {
        // Local State Update
        setEntries(prev => prev.filter(e => e.id !== id));
        // Database Persistent Delete
        await supabase.from('settlement_entries').delete().eq('id', id);
      } else {
        const updatedEntry = { ...entry, paragraphs: remainingParas };
        // Local State Update
        setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
        // Database Persistent Upsert
        await supabase.from('settlement_entries').upsert({ id: id, content: updatedEntry });
      }
    } else {
      // Entire Entry Direct Delete
      setEntries(prev => prev.filter(e => e.id !== id));
      await supabase.from('settlement_entries').delete().eq('id', id);
    }
  };

  const approvedEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'approved' || !e.approvalStatus), [entries]);
  const pendingEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'pending'), [entries]);

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
          pendingCount={pendingEntries.length}
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
          pendingEntries={pendingEntries}
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
                  pendingCount={pendingEntries.length}
                  onShowPending={() => { setActiveTab('register'); setShowPendingOnly(true); }}
                />
              )}
              
              {activeTab === 'entry' && <SettlementForm key={`entry-reset-${resetKey}`} onAdd={handleAddOrUpdateEntry} nextSl={entries.length + 1} branchSuggestions={[]} initialEntry={editingEntry} onCancel={() => { setEditingEntry(null); setActiveTab('register'); }} isLayoutEditable={isLayoutEditable} isAdmin={isAdmin} />}
              
              {activeTab === 'register' && (
                <div className="space-y-6">
                  {isAdmin && (pendingEntries.length > 0 || showPendingOnly) && (
                    <div className="flex justify-end gap-2 no-print">
                      <button 
                        onClick={() => setShowPendingOnly(!showPendingOnly)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 border shadow-sm ${showPendingOnly ? 'bg-amber-600 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {showPendingOnly ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        {showPendingOnly ? 'মূল রেজিস্টারে ফিরুন' : `অপেক্ষমাণ তালিকা (${toBengaliDigits(pendingEntries.length)})`}
                      </button>
                    </div>
                  )}
                  
                  {showPendingOnly ? (
                    <div className="space-y-8 animate-in fade-in duration-700">
                       {pendingEntries.length > 0 ? (
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
                       
                       {pendingEntries.length > 0 && (
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
                         />
                       )}
                    </div>
                  ) : (
                    <SettlementTable 
                      key={`register-reset-${resetKey}`} 
                      entries={approvedEntries} 
                      onDelete={handleDelete} 
                      onEdit={e => { setEditingEntry(e); setActiveTab('entry'); }} 
                      isLayoutEditable={isLayoutEditable} 
                      showFilters={showRegisterFilters} 
                      setShowFilters={setShowRegisterFilters} 
                    />
                  )}
                </div>
              )}
              
              {activeTab === 'return' && <ReturnView key={`return-reset-${resetKey}`} entries={approvedEntries} cycleLabel={cycleLabelBengali} prevStats={prevStats} setPrevStats={setPrevStats} isLayoutEditable={isLayoutEditable} />}
              
              {activeTab === 'voting' && <VotingSystem isAdmin={isAdmin} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
