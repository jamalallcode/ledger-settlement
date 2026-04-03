import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SettlementForm from './components/SettlementForm';
import SettlementTable from './components/SettlementTable';
import CorrespondenceTable from './components/CorrespondenceTable';
import ReturnView from './components/ReturnView';
import LandingPage from './components/LandingPage';
import VotingSystem from './components/VotingSystem';
import DocumentArchive from './document-library/DocumentArchive';
import ReceiverManagement from './components/ReceiverManagement';
import AdminDashboard from './components/AdminDashboard';
import ChangePasswordModal from './components/ChangePasswordModal';
import AdminAnalytics from './subapps/admin_analytics/AdminAnalytics';
import { SettlementEntry, GroupOption, CumulativeStats, ModuleVisibility, CorrespondenceEntry, DynamicSetupConfig } from './types';
import { ReceiverProvider } from './src/contexts/ReceiverContext';
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
const DYNAMIC_SETUP_KEY = 'ledger_dynamic_setup_config_v1';

const generateId = () => {
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    console.log("App mounted, isAdmin:", isAdmin);
  }, [isAdmin]);

  const navigate = useNavigate();
  const [entries, setEntries] = useState<SettlementEntry[]>([]);
  const [correspondenceEntries, setCorrespondenceEntries] = useState<CorrespondenceEntry[]>([]);
  const [activeTab, setActiveTab] = useState('landing'); 
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); 
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [isLockedMode, setIsLockedMode] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterFilters, setShowRegisterFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [moduleVisibility, setModuleVisibility] = useState<ModuleVisibility>({
    entry: true,
    register: true,
    return: true,
    archive: true,
    voting: true,
    setup_receivers: true,
    initial_balance: true,
    change_pass: true,
    admin_analytics: true,
    audit_details: true,
  });
  
  // State for direct module entry from sidebar
  const [entryModule, setEntryModule] = useState<'settlement' | 'correspondence' | null>(null);
  
  // Register Selection State
  const [registerSubModule, setRegisterSubModule] = useState<'settlement' | 'correspondence' | null>(null);

  // New state for direct report selection from sidebar
  const [reportType, setReportType] = useState<string | null>(null);
  const [dynamicSetupConfig, setDynamicSetupConfig] = useState<DynamicSetupConfig>({
    enabled: false,
    startDate: '',
    endDate: ''
  });
  const [showAdminAlert, setShowAdminAlert] = useState(false);
  const [hasShownAlert, setHasShownAlert] = useState(false);

  const pendingEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'pending'), [entries]);
  const pendingCorrespondence = useMemo(() => correspondenceEntries.filter(e => e.approvalStatus === 'pending'), [correspondenceEntries]);
  const totalPendingCount = pendingEntries.length + pendingCorrespondence.length;
  
  const [allPrevStats, setAllPrevStats] = useState<Record<string, CumulativeStats>>({
    monthly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
    quarterly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
    halfYearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
    yearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} }
  });

  const currentPrevStats = useMemo(() => {
    if (reportType?.includes('ত্রৈমাসিক')) return allPrevStats.quarterly;
    if (reportType?.includes('ষাণ্মাসিক')) return allPrevStats.halfYearly;
    if (reportType?.includes('বাৎসরিক')) return allPrevStats.yearly;
    return allPrevStats.monthly;
  }, [allPrevStats, reportType]);

  const handleSetCurrentPrevStats = (stats: CumulativeStats) => {
    const type = reportType?.includes('ত্রৈমাসিক') ? 'quarterly' :
                 reportType?.includes('ষাণ্মাসিক') ? 'halfYearly' :
                 reportType?.includes('বাৎসরিক') ? 'yearly' : 'monthly';
    setAllPrevStats(prev => ({ ...prev, [type]: stats }));
  };

  const handleSetDynamicSetupConfig = (config: DynamicSetupConfig) => {
    console.log("App: Updating dynamic setup config:", config);
    setDynamicSetupConfig(config);
    localStorage.setItem(DYNAMIC_SETUP_KEY, JSON.stringify(config));
  };

  const mainScrollRef = useRef<HTMLElement>(null);

  const handleTabChange = (tab: string, subModule?: 'settlement' | 'correspondence', rType?: string, searchTerm?: string) => {
    console.log("handleTabChange called with tab:", tab, "subModule:", subModule, "rType:", rType, "searchTerm:", searchTerm);
    
    if (tab !== activeTab) {
      setPreviousTab(activeTab);
    }

    if (tab === activeTab && !subModule && !rType && !searchTerm) setResetKey(prev => prev + 1);
    else { 
      setActiveTab(tab); 
      setResetKey(0); 
    }
    
    // Handle Direct Entry Modules
    if (tab === 'entry') {
      setEntryModule(subModule || 'correspondence');
    } else {
      setEntryModule(null);
    }

    // Handle Direct Register Modules
    if (tab === 'register') {
      setRegisterSubModule(subModule || 'correspondence');
      if (searchTerm) {
        setHighlightSearch(searchTerm);
        setShowRegisterFilters(true);
      } else {
        setHighlightSearch(null);
      }
    } else {
      setRegisterSubModule(null);
      setHighlightSearch(null);
    }

    // Handle Direct Report Selection
    if (tab === 'return') {
      setReportType(rType || null);
    } else {
      setReportType(null);
    }

    setShowPendingOnly(false);
  };

  const [highlightSearch, setHighlightSearch] = useState<string | null>(null);

  const navigateToEntry = (id: string, type: 'settlement' | 'correspondence', searchNo?: string) => {
    setActiveTab('register');
    setRegisterSubModule(type);
    
    // Determine if the entry is pending or approved to set the correct view
    const isPending = entries.some(e => e.id === id && e.approvalStatus === 'pending') || 
                      correspondenceEntries.some(e => e.id === id && e.approvalStatus === 'pending');
    
    setShowPendingOnly(isPending);

    if (searchNo) {
      setHighlightSearch(searchNo);
      setShowRegisterFilters(true);
    }
    // Scroll to top first to ensure the table is visible
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

    // Load Dynamic Setup Config
    const savedDynamicConfig = localStorage.getItem(DYNAMIC_SETUP_KEY);
    if (savedDynamicConfig) {
      try {
        setDynamicSetupConfig(JSON.parse(savedDynamicConfig));
      } catch (e) {
        console.error("Error parsing dynamic setup config:", e);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // STRICT AUTO-ADMIN DETECTION
  useEffect(() => {
    const handleAdminSync = (email?: string) => {
      console.log("handleAdminSync called with email:", email);
      setUserEmail(email || null);
      const adminEmails = ['websitetogather@gmail.com', 'kamalismybrother@gmail.com', 'emailaddress3424@gmail.com', 'commercialauditkhulna@gmail.com'];
      if (email && adminEmails.includes(email)) {
        console.log("User is admin based on email");
        setIsAdmin(true);
        setIsLockedMode(false); // Auto-unlock for admin
        localStorage.setItem(ADMIN_MODE_KEY, 'true');
      } else {
        console.log("User is NOT admin based on email");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAdminSync(session?.user?.email);
      fetchSettings(); // Re-fetch settings on auth change
      console.log("Auth State Changed:", _event, session?.user?.email);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAdminSync(session?.user?.email);
    });

    // Sync Global Settings (Visibility)
    const fetchSettings = async () => {
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn("সুপাবেজ (Supabase) কনফিগার করা নেই। সেটিংস সিঙ্ক্রোনাইজেশন কাজ করবে না।");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');
        
        if (!error && data) {
          const newVisibility = { ...moduleVisibility };
          data.forEach((setting: any) => {
            const key = setting.key.replace('show_', '');
            if (key in newVisibility) {
              (newVisibility as any)[key] = setting.value;
            }
          });
          // Special case for legacy keys if needed, but we'll stick to the mapping
          setModuleVisibility(newVisibility);
          console.log("Fetched module visibility settings:", newVisibility);
        } else if (error) {
          console.error("Error fetching app_settings:", error);
        }
      } catch (err) {
        console.error("সেটিংস লোড করতে সমস্যা হয়েছে:", err);
      }
    };

    fetchSettings();

    const settingsSubscription = supabase
      .channel('app_settings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings'
      }, (payload: any) => {
        if (payload.new) {
          const key = payload.new.key.replace('show_', '');
          setModuleVisibility(prev => {
            if (key in prev) {
              return { ...prev, [key]: payload.new.value };
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      settingsSubscription.unsubscribe();
    };
  }, []);

  // Proactive Admin Notification Effect
  useEffect(() => {
    if (userEmail === 'websitetogather@gmail.com' && totalPendingCount > 0 && !hasShownAlert && !isLoading) {
      setShowAdminAlert(true);
      setHasShownAlert(true);
    }
  }, [userEmail, totalPendingCount, hasShownAlert, isLoading]);

  useEffect(() => {
    if (mainScrollRef.current) mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, resetKey, entryModule, registerSubModule, reportType]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("fetchData started");
        const savedPrev = localStorage.getItem(PREV_STATS_KEY);
        if (savedPrev) {
          const parsed = JSON.parse(savedPrev);
          if (parsed.monthly) {
            setAllPrevStats(parsed);
          } else {
            // Migration: put old data into monthly and initialize others
            const migrated = {
              monthly: parsed,
              quarterly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
              halfYearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
              yearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} }
            };
            setAllPrevStats(migrated);
          }
        }
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
              if (content.monthly) {
                setAllPrevStats(content);
                localStorage.setItem(PREV_STATS_KEY, JSON.stringify(content));
              } else {
                // Migration: put old data into monthly and initialize others
                const migrated = {
                  monthly: content,
                  quarterly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
                  halfYearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} },
                  yearly: { inv: 0, vRec: 0, vAdj: 0, iRec: 0, iAdj: 0, oRec: 0, oAdj: 0, entitiesSFI: {}, entitiesNonSFI: {} }
                };
                setAllPrevStats(migrated);
                localStorage.setItem(PREV_STATS_KEY, JSON.stringify(migrated));
              }
            } else if (!row.id.startsWith('doc_')) {
              // Distinguish between entry types - robust check
              const isCorrespondence = content.type === 'correspondence' || (content.description !== undefined && content.description !== null);
              
              // Ensure type and ID are set correctly in the content object for consistent handling
              const normalizedContent = {
                ...content,
                id: row.id, // Ensure ID matches the database row ID
                type: isCorrespondence ? 'correspondence' : 'settlement'
              };

              if (isCorrespondence) {
                corrEntries.push(normalizedContent);
              } else {
                processedEntries.push(normalizedContent);
              }
            }
          });
          
          console.log(`Fetched ${processedEntries.length} settlement and ${corrEntries.length} correspondence entries`);
          
          setEntries(processedEntries);
          setCorrespondenceEntries(corrEntries);
        }
      } catch (e) { console.error('Data error:', e); } 
      finally { 
        console.log("fetchData finally called");
        setIsLoading(false); 
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const syncPrevStats = async () => {
      if (Object.keys(allPrevStats.monthly.entitiesSFI).length > 0 || 
          Object.keys(allPrevStats.quarterly.entitiesSFI).length > 0 ||
          Object.keys(allPrevStats.halfYearly.entitiesSFI).length > 0 ||
          Object.keys(allPrevStats.yearly.entitiesSFI).length > 0) {
        if (navigator.onLine) {
          await supabase.from('settlement_entries').upsert({ 
            id: 'system_metadata_prev_stats', 
            content: allPrevStats 
          });
        }
        localStorage.setItem(PREV_STATS_KEY, JSON.stringify(allPrevStats));
      }
    };
    syncPrevStats();
  }, [allPrevStats]);

  const cycleInfo = useMemo(() => getCurrentCycle(), []);
  const cycleLabelBengali = useMemo(() => toBengaliDigits(cycleInfo.label), [cycleInfo.label]);

  const handleAddOrUpdateEntry = async (data: any) => {
    // If data comes from Correspondence Module, it will have a specific structure
    const isCorrespondence = data.description !== undefined && data.description !== null;

    if (editingEntry && !isAdmin) {
      alert("দুঃখিত, শুধুমাত্র এডমিন তথ্য এডিট করতে পারেন।");
      return;
    }

    const status = editingEntry 
      ? (editingEntry.approvalStatus || 'approved') 
      : (isAdmin ? 'approved' : 'pending');

    let entryToSync: any;

    if (editingEntry) {
      entryToSync = { 
        ...editingEntry, 
        ...data, 
        approvalStatus: status,
        type: isCorrespondence ? 'correspondence' : 'settlement'
      };
      
      // Remove from both lists first to handle potential type changes or misidentifications
      setEntries(prev => prev.filter(e => e.id !== editingEntry.id));
      setCorrespondenceEntries(prev => prev.filter(e => e.id !== editingEntry.id));
      
      // Add to the correct list
      if (isCorrespondence) {
        setCorrespondenceEntries(prev => [entryToSync, ...prev]);
      } else {
        setEntries(prev => [...prev, entryToSync]);
      }
      
      setEditingEntry(null);
    } else {
      const newId = generateId();
      entryToSync = { 
        ...data, 
        id: newId, 
        userEmail: userEmail,
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
  };

  // Specialized update handler for inline fields (date/person) to avoid jumping tabs
  const handleInlineUpdateEntry = async (updatedEntry: any) => {
    const isCorrespondence = updatedEntry.type === 'correspondence' || (updatedEntry.description !== undefined && updatedEntry.description !== null);
    
    if (isCorrespondence) {
      setCorrespondenceEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    } else {
      setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    }
    
    // Silent sync to DB
    if (navigator.onLine) {
      await supabase.from('settlement_entries').upsert({ id: updatedEntry.id, content: updatedEntry });
    } else {
      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...queue, updatedEntry]));
    }
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
      // For correspondence and other single-level entries
      setEntries(prev => prev.filter(e => e.id !== id));
      setCorrespondenceEntries(prev => prev.filter(e => e.id !== id));
      
      if (navigator.onLine) {
        // Correspondence entries are also stored in 'settlement_entries' table
        const { error } = await supabase.from('settlement_entries').delete().eq('id', id);
        if (error) {
          console.error("Error deleting entry:", error);
          alert("তথ্যটি মুছে ফেলতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        }
      } else {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.filter((e: any) => e.id !== id)));
      }
    }
  };

  const handleViewEntries = (name: string, type: 'settlement' | 'correspondence') => {
    setRegisterSubModule(type);
    setActiveTab('register');
    setHighlightSearch(name);
    setShowRegisterFilters(true);
  };

  const approvedEntries = useMemo(() => entries.filter(e => e.approvalStatus === 'approved' || !e.approvalStatus), [entries]);
  const approvedCorrespondence = useMemo(() => correspondenceEntries.filter(e => e.approvalStatus === 'approved' || !e.approvalStatus), [correspondenceEntries]);
  
  const branchSuggestions: GroupOption[] = useMemo(() => {
    const branches = new Set<string>();
    entries.forEach(e => {
      if (e.branchName) branches.add(e.branchName);
    });
    correspondenceEntries.forEach(e => {
      if (e.branchName) branches.add(e.branchName);
    });
    const sortedBranches = Array.from(branches).sort();
    return sortedBranches.length > 0 ? [{ label: 'পূর্বের শাখা তালিকা', options: sortedBranches }] : [];
  }, [entries, correspondenceEntries]);

  const handleLogout = async () => {
    if (window.confirm("আপনি কি এডমিন একাউন্ট থেকে লগআউট করতে চান?")) {
      setIsAdmin(false);
      localStorage.removeItem(ADMIN_MODE_KEY);
      await supabase.auth.signOut();
      setActiveTab('landing');
      setEntryModule(null);
      setRegisterSubModule(null);
      setReportType(null);
    }
  };

  const viewMode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode');
  }, []);

  const isDirectMode = viewMode === 'vote' || viewMode === 'poll';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-blue-600 animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-800 animate-pulse">সিস্টেম লোড হচ্ছে...</h2>
        <p className="mt-2 text-slate-500">অনুগ্রহ করে অপেক্ষা করুন</p>
      </div>
    );
  }

  // Direct Mode: Show only the VotingSystem without any other UI elements
  if (isDirectMode) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center font-bengali">
        <div className="w-full max-w-6xl">
          <VotingSystem isAdmin={false} initialTab={viewMode === 'poll' ? 'poll' : 'vote'} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-bengali">
      {isSidebarOpen && (
        <div className="no-print h-full relative z-[10000]">
          <Sidebar 
            activeTab={activeTab} setActiveTab={handleTabChange} 
            onToggleVisibility={() => setIsSidebarOpen(false)}
            isLockedMode={isLockedMode} setIsLockedMode={setIsLockedMode}
            isAdmin={isAdmin} setIsAdmin={setIsAdmin}
            onLogout={handleLogout}
            onOpenChangePassword={() => setShowChangePassword(true)}
            pendingCount={totalPendingCount}
            entryModule={entryModule}
            registerSubModule={registerSubModule}
            reportType={reportType}
            highlightSearch={highlightSearch}
            moduleVisibility={moduleVisibility}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="no-print">
          <Navbar 
            activeTab={activeTab} setActiveTab={handleTabChange} onDemoLoad={() => {}}
            isLockedMode={isLockedMode} setIsLockedMode={setIsLockedMode}
            onExportSystem={() => {}} onImportSystem={() => {}}
            isAdmin={isAdmin} setIsAdmin={setIsAdmin} cycleLabel={cycleLabelBengali}
            showRegisterFilters={showRegisterFilters} setShowRegisterFilters={setShowRegisterFilters}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen}
            pendingEntries={[...pendingEntries, ...pendingCorrespondence]}
            onApprove={handleApproveEntry}
            onReject={handleRejectEntry}
            setShowPendingOnly={setShowPendingOnly}
          />
        </div>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
          <div className="p-4 md:p-8 max-w-full mx-auto w-full flex flex-col">
            <div className="animate-in fade-in duration-500 flex-1">
              
              {activeTab === 'setup_receivers' && (
                <ReceiverManagement 
                  isAdmin={isAdmin} 
                  onViewEntries={handleViewEntries}
                  onBack={() => handleTabChange('dashboard')}
                />
              )}

          {activeTab === 'landing' && (
                <LandingPage 
                  entries={approvedEntries} 
                  setActiveTab={handleTabChange} 
                  cycleLabel={cycleLabelBengali} 
                  isLockedMode={isLockedMode} 
                  isAdmin={isAdmin}
                  pendingCount={totalPendingCount}
                  onShowPending={() => { handleTabChange('register'); setShowPendingOnly(true); }}
                  moduleVisibility={moduleVisibility}
                />
              )}
              
              {activeTab === 'entry' && (
                <SettlementForm 
                  key={`entry-reset-${resetKey}`} 
                  onAdd={handleAddOrUpdateEntry} 
                  onViewRegister={handleViewRegister} 
                  nextSl={entries.length + 1} 
                  branchSuggestions={branchSuggestions} 
                  initialEntry={editingEntry} 
                  onCancel={() => { 
                    setEditingEntry(null); 
                    setActiveTab(previousTab === 'dashboard' ? 'dashboard' : 'register'); 
                  }} 
                  isAdmin={isAdmin} 
                  userEmail={userEmail} 
                  preSelectedModule={entryModule} 
                  correspondenceEntries={correspondenceEntries} 
                  entries={entries} 
                  navigateToEntry={navigateToEntry} 
                  moduleVisibility={moduleVisibility} 
                />
              )}
              
              {activeTab === 'register' && (
                <div className="space-y-6 relative">
                  {showPendingOnly ? (
                    <div className="space-y-8 animate-in fade-in duration-700">
                      <div className="flex items-center justify-between no-print mb-4">
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
                            onEdit={e => { setEditingEntry(e); handleTabChange('entry'); }}
                            onInlineUpdate={handleInlineUpdateEntry}
                            onDelete={handleDelete}
                            onApprove={handleApproveEntry}
                            onReject={handleRejectEntry}
                            showFilters={showRegisterFilters}
                            setShowFilters={setShowRegisterFilters}
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
                            onEdit={e => { setEditingEntry(e); handleTabChange('entry'); }} 
                            showFilters={showRegisterFilters} 
                            setShowFilters={setShowRegisterFilters}
                            isAdminView={true}
                            onApprove={handleApproveEntry}
                            onReject={handleRejectEntry}
                            isAdmin={isAdmin}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-700">
                      {(registerSubModule === 'settlement') ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 no-print mb-2">
                          </div>

                          <SettlementTable 
                            key={`register-reset-${resetKey}`} 
                            entries={approvedEntries} 
                            onDelete={handleDelete} 
                            onEdit={e => { setEditingEntry(e); handleTabChange('entry'); }} 
                            showFilters={showRegisterFilters} 
                            setShowFilters={setShowRegisterFilters} 
                            isAdmin={isAdmin}
                            highlightSearch={highlightSearch}
                            onClearHighlight={() => setHighlightSearch(null)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 no-print mb-2">
                          </div>

                          <CorrespondenceTable 
                            entries={approvedCorrespondence} 
                            onBack={() => handleTabChange('landing')} 
                            isAdmin={isAdmin}
                            onEdit={e => { setEditingEntry(e); handleTabChange('entry'); }}
                            onInlineUpdate={handleInlineUpdateEntry}
                            onDelete={handleDelete}
                            showFilters={showRegisterFilters}
                            setShowFilters={setShowRegisterFilters}
                            highlightSearch={highlightSearch}
                            onClearHighlight={() => setHighlightSearch(null)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'return' && (
                <ReturnView 
                  key={`return-reset-${resetKey}`} 
                  entries={approvedEntries} 
                  correspondenceEntries={approvedCorrespondence} 
                  cycleLabel={cycleLabelBengali} 
                  prevStats={currentPrevStats} 
                  setPrevStats={handleSetCurrentPrevStats} 
                  isAdmin={isAdmin} 
                  selectedReportType={reportType} 
                  setSelectedReportType={setReportType}
                  showFilters={showRegisterFilters}
                  setShowFilters={setShowRegisterFilters}
                  dynamicSetupConfig={dynamicSetupConfig}
                  onUpdateDynamicSetupConfig={handleSetDynamicSetupConfig}
                  activeTab={activeTab}
                />
              )}
              
              {activeTab === 'archive' && <DocumentArchive isAdmin={isAdmin} />}

              {activeTab === 'voting' && <VotingSystem isAdmin={isAdmin} />}

              {activeTab === 'admin_analytics' && isAdmin && (
                <AdminAnalytics 
                  entries={entries} 
                  correspondenceEntries={correspondenceEntries} 
                  onBack={() => handleTabChange('dashboard')} 
                />
              )}

              {activeTab === 'dashboard' && (
                <AdminDashboard 
                  isAdmin={isAdmin}
                  entries={entries}
                  correspondenceEntries={correspondenceEntries}
                  pendingCount={totalPendingCount}
                  setActiveTab={handleTabChange}
                  onOpenChangePassword={() => setShowChangePassword(true)}
                  moduleVisibility={moduleVisibility}
                  setModuleVisibility={setModuleVisibility}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <ChangePasswordModal 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />

      {/* Admin Proactive Notification */}
      {showAdminAlert && (
        <div className="fixed top-24 right-6 z-[11000] animate-in slide-in-from-right-10 duration-500 no-print">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
                  <BellRing size={24} />
                </div>
                <div>
                  <h4 className="text-white font-black text-lg tracking-tight">নতুন এন্ট্রি পাওয়া গেছে!</h4>
                  <p className="text-amber-400/60 text-[9px] font-black uppercase tracking-[0.2em]">Pending Moderation</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm font-bold leading-relaxed">
                সম্মানিত এডমিন, সিস্টেমে <span className="text-amber-400 text-lg">{toBengaliDigits(totalPendingCount.toString())}টি</span> নতুন এন্ট্রি অনুমোদনের অপেক্ষায় আছে। দয়া করে যাচাই করুন।
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAdminAlert(false)}
                  className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-black text-xs hover:bg-white/10 transition-all border border-white/5"
                >
                  পরে দেখব
                </button>
                <button 
                  onClick={() => {
                    setShowAdminAlert(false);
                    handleTabChange('register');
                    setShowPendingOnly(true);
                  }}
                  className="flex-1 py-3 bg-amber-500 text-slate-900 rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                >
                  এখনই দেখুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;