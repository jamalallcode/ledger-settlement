import React, { useState, useEffect } from 'react';
import { User, Plus, FileEdit, Trash, X, ShieldCheck, Sparkles, AlertCircle, Loader2, FileText, Check } from 'lucide-react';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';
import { isSFI, isNonSFI, isAdminBranch, getBranchVariations } from '../utils/branchUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toBengaliDigits } from '../utils/numberUtils';

interface ReceiverManagementProps {
  isAdmin: boolean;
  onViewEntries?: (name: string, type: 'settlement' | 'correspondence') => void;
}

interface ReceiverProfile {
  id?: string;
  name: string;
  designation?: string;
  image?: string;
  para_type?: string;
  entryCount?: number;
  entryDetails?: any[];
  source?: 'database' | 'local' | 'correspondence' | 'unassigned';
  is_voter?: boolean;
}

const CORR_STORAGE_KEY = 'ledger_correspondence_v1';

const getCleanBranch = (type: string | null | undefined): string => {
  if (!type) return 'এসএফআই';
  if (type.includes('প্রশাসন') || type === 'ADMIN' || type === 'admin') return 'প্রশাসন';
  if (type.includes('নন') || type.toUpperCase().includes('NON')) return 'নন এসএফআই';
  return 'এসএফআই';
};

const ReceiverManagement: React.FC<ReceiverManagementProps> = ({ isAdmin, onViewEntries }) => {
  const [receiversList, setReceiversList] = useState<ReceiverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedParaType, setSelectedParaType] = useState<string>('এসএফআই');
  const [tempName, setTempName] = useState('');
  const [tempDesignation, setTempDesignation] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReceivers = async () => {
    setLoading(true);
    try {
      let finalReceivers: ReceiverProfile[] = [];
      const normalizeName = (name: string | null | undefined) => {
        if (!name) return '';
        return name
          .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[:ঃ।\.\-]/g, '')
          .normalize('NFC');
      };

      // 1. Fetch from database (Supabase)
      if (isSupabaseConfigured) {
        const { data: dbReceivers, error: dbError } = await supabase
          .from('receivers')
          .select('*')
          .order('name', { ascending: true });

        if (!dbError && dbReceivers) {
          finalReceivers = dbReceivers.map(r => ({ 
            ...r, 
            name: r.name ? r.name.trim() : '',
            source: 'database' 
          }));
        }
      }

      // 2. Fetch from local storages for all three branches
      const localKeys = [
        { key: 'ledger_correspondence_receivers_admin', branch: 'প্রশাসন' },
        { key: 'ledger_correspondence_receivers_sfi', branch: 'এসএফআই' },
        { key: 'ledger_correspondence_receivers_nonsfi', branch: 'নন এসএফআই' }
      ];

      localKeys.forEach(({ key, branch }) => {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const items = JSON.parse(saved);
            const existingIds = new Set(finalReceivers.map(r => r.id));
            const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name) + '_' + getCleanBranch(r.para_type)));

            items.forEach((li: any) => {
              const b = getCleanBranch(li.para_type || branch);
              const compositeKey = normalizeName(li.name) + '_' + b;
              if (!existingIds.has(li.id) && !existingNormalizedNames.has(compositeKey)) {
                finalReceivers.push({ 
                  ...li, 
                  para_type: b,
                  source: 'local' 
                });
                existingNormalizedNames.add(compositeKey);
              }
            });
          } catch (e) { 
            console.error('Error parsing local receivers:', e); 
          }
        }
      });

      // 3. Scan correspondence entries to find recipient names that are added on descriptions but not saved in database
      let correspondenceNamesByBranch: Record<string, string[]> = {
        'প্রশাসন': [],
        'এসএফআই': [],
        'নন এসএফআই': []
      };
      let entryCounts: Record<string, number> = {};
      let entryDetails: Record<string, any[]> = {};

      if (isSupabaseConfigured) {
        const { data: entries, error: entriesError } = await supabase
          .from('settlement_entries')
          .select('id, content');
        
        if (!entriesError && entries) {
          entries.forEach(row => {
            let content = row.content;
            if (typeof content === 'string') {
              try { content = JSON.parse(content); } catch (e) { return; }
            }
            if (!content) return;
            
            const isCorr = content.type === 'correspondence' || 
                          (content.description !== undefined && content.description !== null && content.description !== '');
            
            if (isCorr) {
              const b = getCleanBranch(content.paraType);
              if (content.receiverName && content.receiverName.trim()) {
                const originalName = content.receiverName.trim();
                const normalizedName = normalizeName(originalName);
                if (normalizedName) {
                  const compKey = `${normalizedName}_${b}`;
                  if (!entryCounts[compKey]) {
                    entryCounts[compKey] = 0;
                    entryDetails[compKey] = [];
                    if (!correspondenceNamesByBranch[b].some(cn => normalizeName(cn) === normalizedName)) {
                      correspondenceNamesByBranch[b].push(originalName);
                    }
                  }
                  entryCounts[compKey]++;
                  entryDetails[compKey].push({
                    id: row.id,
                    diaryNo: content.diaryNo,
                    diaryDate: content.diaryDate,
                    letterNo: content.letterNo
                  });
                }
              }
            }
          });
        }
      } else {
        const savedCorr = localStorage.getItem(CORR_STORAGE_KEY);
        if (savedCorr) {
          try {
            const entries = JSON.parse(savedCorr);
            entries.forEach((entry: any) => {
              const isCorr = entry.type === 'correspondence' || 
                            (entry.description !== undefined && entry.description !== null && entry.description !== '');
              
              if (isCorr) {
                const b = getCleanBranch(entry.paraType);
                if (entry.receiverName && entry.receiverName.trim()) {
                  const originalName = entry.receiverName.trim();
                  const normalizedName = normalizeName(originalName);
                  if (normalizedName) {
                    const compKey = `${normalizedName}_${b}`;
                    if (!entryCounts[compKey]) {
                      entryCounts[compKey] = 0;
                      entryDetails[compKey] = [];
                      if (!correspondenceNamesByBranch[b].some(cn => normalizeName(cn) === normalizedName)) {
                        correspondenceNamesByBranch[b].push(originalName);
                      }
                    }
                    entryCounts[compKey]++;
                    entryDetails[compKey].push({
                      id: entry.id,
                      diaryNo: entry.diaryNo,
                      diaryDate: entry.diaryDate,
                      letterNo: entry.letterNo
                    });
                  }
                }
              }
            });
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Merge correspondence receivers in
      const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name) + '_' + getCleanBranch(r.para_type)));
      
      const branches: Array<'প্রশাসন' | 'এসএফআই' | 'নন এসএফআই'> = ['প্রশাসন', 'এসএফআই', 'নন এসএফআই'];
      branches.forEach(b => {
        correspondenceNamesByBranch[b].forEach(name => {
          const originalName = name.trim();
          const normalizedName = normalizeName(originalName);
          const compKey = `${normalizedName}_${b}`;
          if (!existingNormalizedNames.has(compKey)) {
            finalReceivers.push({ 
              name: originalName, 
              para_type: b,
              designation: 'অডিটর',
              source: 'correspondence'
            });
            existingNormalizedNames.add(compKey);
          }
        });
      });

      // Map counts
      const receiversWithCounts = finalReceivers.map(r => {
        const b = getCleanBranch(r.para_type);
        const norm = normalizeName(r.name);
        const compKey = `${norm}_${b}`;
        return {
          ...r,
          para_type: b,
          entryCount: entryCounts[compKey] || 0,
          entryDetails: entryDetails[compKey] || []
        };
      }).filter(r => {
        if (r.source === 'database') return true;
        if (r.entryCount > 0) return true;
        return false;
      });

      receiversWithCounts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setReceiversList(receiversWithCounts);
    } catch (err) {
      console.error('Error fetching receivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivers();
  }, []);

  const openAddModal = (branch: string) => {
    setEditingId(null);
    setSelectedParaType(branch);
    setTempName('');
    setTempDesignation('');
    setTempImage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: ReceiverProfile) => {
    setEditingId(profile.id || profile.name);
    setSelectedParaType(getCleanBranch(profile.para_type));
    setTempName(profile.name);
    setTempDesignation(profile.designation || '');
    setTempImage(profile.image || null);
    setIsModalOpen(true);
  };

  const handleAddOrEdit = async () => {
    if (!tempName.trim()) return;
    setIsSaving(true);
    
    const profileData = {
      name: tempName.trim(),
      designation: tempDesignation.trim() || null,
      image: tempImage || null,
      para_type: selectedParaType
    };

    try {
      if (isSupabaseConfigured) {
        let error;
        if (editingId && !editingId.toString().startsWith('local-')) {
          const { error: updateError } = await supabase
            .from('receivers')
            .update(profileData)
            .eq('id', editingId);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('receivers')
            .insert([profileData]);
          error = insertError;
        }
        
        if (error) {
          console.error('Supabase save error:', error);
          if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            throw new Error('TABLE_MISSING');
          }
          throw error;
        }
        
        await fetchReceivers();
      } else {
        throw new Error('SUPABASE_NOT_CONFIGURED');
      }
      window.dispatchEvent(new Event('storage'));
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving receiver (falling back to LocalStorage):', err);
      
      try {
        const key = selectedParaType === 'প্রশাসন' ? 'ledger_correspondence_receivers_admin' :
                    selectedParaType === 'নন এসএফআই' ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';

        const saved = localStorage.getItem(key);
        let items = [];
        if (saved) {
          try { items = JSON.parse(saved); } catch (e) {}
        }

        const fallbackProfile = {
          ...profileData,
          id: editingId && editingId.toString().startsWith('local-') ? editingId : 'local-' + Date.now()
        };

        if (editingId) {
          const idx = items.findIndex((it: any) => it.id === editingId || it.name === tempName);
          if (idx !== -1) {
            items[idx] = fallbackProfile;
          } else {
            items.push(fallbackProfile);
          }
        } else {
          items.push(fallbackProfile);
        }

        localStorage.setItem(key, JSON.stringify(items));
        window.dispatchEvent(new Event('storage'));
        await fetchReceivers();
        
        setIsModalOpen(false);
        resetForm();

        if (isSupabaseConfigured) {
          alert('সুপাবেজ (Supabase) এ তথ্য সংরক্ষণ করা যায়নি, তবে ব্রাউজারে (LocalStorage) এটি সফলভাবে সংরক্ষিত হয়েছে।');
        }
      } catch (localErr) {
        console.error('LocalStorage fallback failed:', localErr);
        alert('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTempName('');
    setTempDesignation('');
    setTempImage(null);
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("ছবির সাইজ ১ মেগাবাইটের কম হতে হবে।");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (profile: ReceiverProfile) => {
    if (!profile) return;

    if (profile.source === 'correspondence') {
      alert(`"${profile.name}" নামটি সরাসরি চিঠিপত্র এন্ট্রি থেকে আসছে। এটি মুছতে হলে সংশ্লিষ্ট চিঠিপত্র এন্ট্রিগুলো পরিবর্তন বা ডিলিট করতে হবে।`);
      return;
    }

    let hasCorrespondence = profile.entryCount ? profile.entryCount > 0 : false;
    let blockingEntries: any[] = profile.entryDetails || [];

    if (hasCorrespondence) {
      const entryList = blockingEntries.map(e => 
        `• ডায়েরি নং: ${e.diaryNo || 'N/A'}, তারিখ: ${e.diaryDate || 'N/A'}`
      ).slice(0, 5).join('\n');
      
      const moreCount = blockingEntries.length > 5 ? `\n...এবং আরও ${blockingEntries.length - 5}টি` : '';

      alert(`"${profile.name}" এর অধীনে ${blockingEntries.length}টি চিঠিপত্র এন্ট্রি থাকায় এটি মুছে ফেলা সম্ভব নয়।\n\nসংশ্লিষ্ট কিছু চিঠিপত্র এন্ট্রি:\n${entryList}${moreCount}`);
      return;
    }

    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${profile.name}" নামটিকে রিসেপশন বা মুছতে চান?`)) return;
    
    try {
      if (isSupabaseConfigured && profile.id && !profile.id.toString().startsWith('local-')) {
        const { error } = await supabase
          .from('receivers')
          .delete()
          .eq('id', profile.id);
        if (error) throw error;
        await fetchReceivers();
      } else {
        const b = getCleanBranch(profile.para_type);
        const key = b === 'প্রশাসন' ? 'ledger_correspondence_receivers_admin' :
                    b === 'নন এসএফআই' ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';
                    
        const saved = localStorage.getItem(key);
        if (saved) {
          const items = JSON.parse(saved);
          const filtered = items.filter((it: any) => it.id !== profile.id && it.name !== profile.name);
          localStorage.setItem(key, JSON.stringify(filtered));
          window.dispatchEvent(new Event('storage'));
          await fetchReceivers();
        }
      }
    } catch (err: any) {
      console.error('Error deleting receiver:', err);
      alert('সুপাবেজ থেকে মোছা সম্ভব হয়নি।');
    }
  };

  const renderBranchColumn = (branch: 'প্রশাসন' | 'এসএফআই' | 'নন এসএফআই', label: string) => {
    const list = receiversList.filter(r => getCleanBranch(r.para_type) === branch);

    const themes = {
      'প্রশাসন': {
        solidBg: 'bg-emerald-600',
        textTheme: 'text-emerald-700',
        borderTheme: 'hover:border-emerald-300',
        avatarBg: 'bg-emerald-50 text-emerald-600',
        lineTheme: 'bg-emerald-500',
        buttonTheme: 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100'
      },
      'এসএফআই': {
        solidBg: 'bg-blue-600',
        textTheme: 'text-blue-700',
        borderTheme: 'hover:border-blue-300',
        avatarBg: 'bg-blue-50 text-blue-600',
        lineTheme: 'bg-blue-500',
        buttonTheme: 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-100'
      },
      'নন এসএফআই': {
        solidBg: 'bg-indigo-600',
        textTheme: 'text-indigo-700',
        borderTheme: 'hover:border-indigo-300',
        avatarBg: 'bg-indigo-50 text-indigo-600',
        lineTheme: 'bg-indigo-500',
        buttonTheme: 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100'
      }
    }[branch];

    return (
      <div className="flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 relative">
        {/* Decorative Top Accent Line */}
        <div className={`absolute top-0 left-6 right-6 h-1 rounded-b-md ${themes.lineTheme}`}></div>
        
        {/* Branch Title and Counts Row */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 pt-1">
          <div>
            <h3 className="text-md sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${themes.lineTheme} animate-pulse shadow-sm`}></span>
              {label}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-black text-slate-400 mt-1 uppercase tracking-wider">
              মোট স্টাফ: <span className={`${themes.textTheme}`}>{toBengaliDigits(list.length.toString())}</span> জন
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openAddModal(branch)}
              className={`flex items-center justify-center p-2 rounded-xl text-white ${themes.buttonTheme} transition-all active:scale-95 shadow-md flex items-center gap-1 text-[11px] font-black`}
              title={`${label}-এ নতুন যোগ করুন`}
            >
              <Plus size={16} /> যোগ করুন
            </button>
          )}
        </div>

        {/* Scrollable Recipient List Column */}
        <div className="flex-1 space-y-3.5 max-h-[500px] overflow-y-auto no-scrollbar py-1">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <AlertCircle size={36} className="mb-3 opacity-20" />
              <p className="text-xs font-bold">কোন প্রাপক বা স্টাফ পাওয়া যায়নি।</p>
            </div>
          ) : (
            list.map((profile, idx) => (
              <div 
                key={idx} 
                className={`group flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl ${themes.borderTheme} hover:bg-blue-50/10 transition-all duration-300`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 sm:w-11 h-10 sm:h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${themes.avatarBg} font-black text-xs sm:text-sm`}>
                        {profile.name ? profile.name.slice(0, 1) : <User size={16} />}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700 text-[13px] sm:text-sm truncate">{profile.name}</span>
                      {profile.entryCount !== undefined && profile.entryCount > 0 && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-black rounded-full border border-blue-100">
                          {toBengaliDigits(profile.entryCount.toString())}টি চিঠিপত্র
                        </span>
                      )}
                    </div>
                    {profile.designation && (
                      <span className="text-[10px] font-bold text-slate-400 truncate block mt-0.5 uppercase tracking-wider">{profile.designation}</span>
                    )}
                  </div>
                </div>

                {/* Edit and Delete Actions on Hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {profile.entryCount !== undefined && profile.entryCount > 0 && onViewEntries && (
                    <button 
                      onClick={() => onViewEntries(profile.name, 'correspondence')}
                      className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                      title="বিতরণকৃত চিঠি"
                    >
                      <FileText size={14} />
                    </button>
                  )}
                  {isAdmin && profile.source !== 'unassigned' && (
                    <>
                      <button 
                        onClick={() => openEditModal(profile)}
                        className="p-2 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                        title="সম্পাদনা"
                      >
                        <FileEdit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(profile)}
                        className="p-2 bg-white text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                        title="মুছে ফেলুন"
                      >
                        <Trash size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 shrink-0 select-none">
            <User size={30} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">প্রাপক কর্মী ব্যবস্থাপনা</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">অফিসের ৩টি ভিন্ন শাখার কর্মকর্তাদের বায়োডাটা, ছবি এবং দায়িত্ব নিয়ন্ত্রণ করুন</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-blue-600">
          <Loader2 size={56} className="animate-spin mb-4 text-blue-500 stroke-[3]" />
          <p className="font-bold text-slate-500 text-sm tracking-wider uppercase">ডাটা সিঙ্ক্রোনাইজ হচ্ছে...</p>
        </div>
      ) : (
        /* Three Side-by-Side Bento Grid Columns from Left to Right */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: প্রশাসন শাখা */}
          {renderBranchColumn('প্রশাসন', '১. প্রশাসন শাখা')}

          {/* Column 2: এসএফআই শাখা */}
          {renderBranchColumn('এসএফআই', '২. এসএফআই শাখা')}

          {/* Column 3: নন এসএফআই শাখা */}
          {renderBranchColumn('নন এসএফআই', '৩. নন এসএফআই শাখা')}
        </div>
      )}

      {/* Unified Add/Edit modal popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md my-auto rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 relative border-t-8 border-t-blue-600">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                    {editingId ? <FileEdit size={22} /> : <Plus size={22} />}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{editingId ? 'কর্মী তথ্য পরিবর্তন' : 'নতুন কর্মী যোগ করুন'}</h4>
                    <p className="text-xs font-black text-slate-500 mt-0.5">সবগুলো ঘর সঠিকভাবে পূরণ করুন</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Profile Picture Upload Section (Base64 URL) */}
                <div className="flex justify-center mb-2">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all cursor-pointer relative shadow-inner">
                      {tempImage ? (
                        <img src={tempImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={32} className="text-slate-300" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg pointer-events-none">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>

                {/* Name field */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">কর্মকর্তা / কর্মচারীর নাম</label>
                  <input 
                    type="text"
                    autoFocus
                    className="w-full h-[54px] px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-sm shadow-sm"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="যেমনঃ আব্দুল খালেক"
                  />
                </div>

                {/* Designation field */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">পদবি (ঐচ্ছিক)</label>
                  <input 
                    type="text"
                    className="w-full h-[54px] px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-sm shadow-sm"
                    value={tempDesignation}
                    onChange={(e) => setTempDesignation(e.target.value)}
                    placeholder="যেমনঃ অডিটর / সুপার"
                  />
                </div>

                {/* Branch Selection Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">শাখা নির্ধারণ</label>
                  <select 
                    value={selectedParaType}
                    onChange={(e) => setSelectedParaType(e.target.value)}
                    className="w-full h-[54px] px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-sm shadow-sm"
                  >
                    <option value="প্রশাসন">১. প্রশাসন শাখা</option>
                    <option value="এসএফআই">২. এসএফআই শাখা</option>
                    <option value="নন এসএফআই">৩. নন এসএফআই শাখা</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-[54px] bg-slate-100 text-slate-600 font-extrabold rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-xs sm:text-sm"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleAddOrEdit}
                    disabled={!tempName.trim() || isSaving}
                    className="flex-1 h-[54px] bg-blue-600 text-white font-extrabold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'আপডেট করুন' : 'যোগ করুন')}
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
