import React, { useState, useEffect } from 'react';
import { User, Plus, FileEdit, Trash, X, ShieldCheck, Sparkles, AlertCircle, Loader2, FileText, Check } from 'lucide-react';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';
import { isSFI, isNonSFI, getBranchVariations } from '../utils/branchUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
}

const CORR_STORAGE_KEY = 'ledger_correspondence_v1';

const ReceiverManagement: React.FC<ReceiverManagementProps> = ({ isAdmin, onViewEntries }) => {
  const [paraType, setParaType] = useState<string>('এসএফআই');
  const [receivers, setReceivers] = useState<ReceiverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempDesignation, setTempDesignation] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReceivers = async () => {
    setLoading(true);
    try {
      let finalReceivers: ReceiverProfile[] = [];
      
      const uniqueVariations = getBranchVariations(paraType);

      const normalizeName = (name: string | null | undefined) => {
        if (!name) return '';
        return name
          .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '') // Remove all possible invisible characters and non-breaking spaces
          .trim()
          .replace(/\s+/g, ' ')                  // Normalize internal whitespace to a single space
          .replace(/[:ঃ।\.\-]/g, '')             // Remove punctuation for comparison (colon, visarga, dari, dot, dash)
          .normalize('NFC');                     // Normalize Unicode to canonical form
      };

      // 1. Fetch from receivers table (Current Branch)
      let supabaseError = null;
      if (isSupabaseConfigured) {
        const { data: dbReceivers, error: dbError } = await supabase
          .from('receivers')
          .select('*')
          .in('para_type', uniqueVariations)
          .order('name', { ascending: true });

        if (dbError) {
          console.error('Supabase fetch error:', dbError);
          supabaseError = dbError;
        } else {
          finalReceivers = (dbReceivers || []).map(r => ({ 
            ...r, 
            name: r.name ? r.name.trim() : '',
            source: 'database' 
          }));
        }
      }

      // 2. Fetch ALL receivers to build a Global Master List of names
      // This ensures that if a receiver is "Saved" in ANY branch, they show as "Saved" everywhere
      const globalSavedNames = new Map<string, any>();
      if (isSupabaseConfigured) {
        const { data: allData, error: allError } = await supabase
          .from('receivers')
          .select('*');
        if (!allError && allData) {
          allData.forEach(r => {
            const norm = normalizeName(r.name);
            if (norm) globalSavedNames.set(norm, { ...r, source: 'database' });
          });
        }
      }

      // If Supabase failed or is not configured, or to merge local items
      const key = isSFI(paraType) ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const localItems = JSON.parse(saved);
          const existingIds = new Set(finalReceivers.map(r => r.id));
          const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name)));
          
          localItems.forEach((li: any) => {
            const normalizedName = normalizeName(li.name);
            if (!existingIds.has(li.id) && !existingNormalizedNames.has(normalizedName)) {
              finalReceivers.push({ ...li, source: 'local' });
              existingNormalizedNames.add(normalizedName);
            }
          });
        } catch (e) { console.error('Error parsing local receivers:', e); }
      }

      // 2. Fetch unique names from correspondence entries to ensure they are listed
      let correspondenceNames: string[] = [];
      let entryCounts: Record<string, number> = {};
      let entryDetails: Record<string, any[]> = {};
      let unassignedEntries: any[] = [];

      if (isSupabaseConfigured) {
        // Query settlement_entries for receiverName in content with server-side filtering
        const { data: entries, error: entriesError } = await supabase
          .from('settlement_entries')
          .select('id, content')
          .filter('content->>paraType', 'in', `(${uniqueVariations.map(v => `"${v}"`).join(',')})`);
        
        if (!entriesError && entries) {
          entries.forEach(row => {
            let content = row.content;
            if (typeof content === 'string') {
              try { content = JSON.parse(content); } catch (e) { return; }
            }
            if (!content) return;
            
            // Robust check for correspondence: either has type 'correspondence' or has a description (which only letters have)
            const isCorr = content.type === 'correspondence' || 
                          (content.description !== undefined && content.description !== null && content.description !== '');
            
            if (isCorr) {
              if (content.receiverName && content.receiverName.trim()) {
                const originalName = content.receiverName.trim();
                const normalizedName = normalizeName(originalName);
                if (normalizedName) {
                  if (!entryCounts[normalizedName]) {
                    entryCounts[normalizedName] = 0;
                    entryDetails[normalizedName] = [];
                    // Store original name for display if we need to create a new profile
                    if (!correspondenceNames.some(cn => normalizeName(cn) === normalizedName)) {
                      correspondenceNames.push(originalName);
                    }
                  }
                  entryCounts[normalizedName]++;
                  entryDetails[normalizedName].push({
                    id: row.id,
                    diaryNo: content.diaryNo,
                    diaryDate: content.diaryDate,
                    letterNo: content.letterNo
                  });
                }
              } else {
                // Unassigned entry
                unassignedEntries.push({
                  id: row.id,
                  diaryNo: content.diaryNo,
                  diaryDate: content.diaryDate,
                  letterNo: content.letterNo
                });
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
              const entryPara = entry.paraType?.replace('-', ' ');
              const currentPara = paraType.replace('-', ' ');
              const isCorr = entry.type === 'correspondence' || 
                            (entry.description !== undefined && entry.description !== null && entry.description !== '');
              
              if (isCorr && entryPara === currentPara) {
                if (entry.receiverName && entry.receiverName.trim()) {
                  const originalName = entry.receiverName.trim();
                  const normalizedName = normalizeName(originalName);
                  if (normalizedName) {
                    if (!entryCounts[normalizedName]) {
                      entryCounts[normalizedName] = 0;
                      entryDetails[normalizedName] = [];
                      if (!correspondenceNames.some(cn => normalizeName(cn) === normalizedName)) {
                        correspondenceNames.push(originalName);
                      }
                    }
                    entryCounts[normalizedName]++;
                    entryDetails[normalizedName].push({
                      id: entry.id,
                      diaryNo: entry.diaryNo,
                      diaryDate: entry.diaryDate,
                      letterNo: entry.letterNo
                    });
                  }
                } else {
                  // Unassigned entry
                  unassignedEntries.push({
                    id: entry.id,
                    diaryNo: entry.diaryNo,
                    diaryDate: entry.diaryDate,
                    letterNo: entry.letterNo
                  });
                }
              }
            });
          } catch (e) { console.error(e); }
        }
      }

      // 4. Merge unique names from correspondence into finalReceivers if they don't exist
      const existingNormalizedNames = new Set(finalReceivers.map(r => normalizeName(r.name)));
      
      correspondenceNames.forEach(name => {
        const originalName = name.trim();
        const normalizedName = normalizeName(originalName);
        if (normalizedName && !existingNormalizedNames.has(normalizedName)) {
          // Check Global Master List for "Saved" status
          const globalMatch = globalSavedNames.get(normalizedName);
          if (globalMatch) {
            finalReceivers.push({ 
              ...globalMatch,
              para_type: paraType, // Show them in this branch's list
              source: 'database' 
            });
          } else {
            // User said "Recipient is always an Auditor"
            finalReceivers.push({ 
              name: originalName, 
              para_type: paraType,
              designation: 'অডিটর',
              source: 'correspondence'
            });
          }
          existingNormalizedNames.add(normalizedName);
        }
      });

      // 4. Attach counts and filter out those with 0 entries if they are local/correspondence
      const receiversWithCounts = finalReceivers.map(r => {
        const name = r.name || '';
        const normalizedName = normalizeName(name);
        return {
          ...r,
          name,
          entryCount: entryCounts[normalizedName] || 0,
          entryDetails: entryDetails[normalizedName] || []
        };
      }).filter(r => {
        // Keep if it's from database (Saved in master list)
        if (r.source === 'database') return true;
        // Keep if it has entries
        if (r.entryCount > 0) return true;
        // Otherwise, filter out (for local and correspondence sources)
        return false;
      });

      receiversWithCounts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      if (unassignedEntries.length > 0) {
        receiversWithCounts.unshift({
          name: 'অনির্ধারিত এন্ট্রি',
          designation: 'প্রাপকের নাম নেই',
          entryCount: unassignedEntries.length,
          entryDetails: unassignedEntries,
          source: 'unassigned'
        });
      }

      setReceivers(receiversWithCounts);

    } catch (err) {
      console.error('Error fetching receivers:', err);
      const initialList = isSFI(paraType) ? SFI_RECEIVERS : NONSFI_RECEIVERS;
      setReceivers(initialList.map(name => ({ name, entryCount: 0, entryDetails: [] })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivers();
  }, [paraType]);

  const handleAddOrEdit = async () => {
    if (!tempName.trim()) return;
    setIsSaving(true);
    
    const profileData = {
      name: tempName.trim(),
      designation: tempDesignation.trim() || null,
      image: tempImage || null,
      para_type: paraType
    };

    try {
      if (isSupabaseConfigured) {
        let error;
        if (editingIdx !== null && receivers[editingIdx]?.id) {
          const { error: updateError } = await supabase
            .from('receivers')
            .update(profileData)
            .eq('id', receivers[editingIdx].id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('receivers')
            .insert([profileData]);
          error = insertError;
        }
        
        if (error) {
          console.error('Supabase save error:', error);
          // If it's a "relation not found" error, it means the table is missing
          if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            throw new Error('TABLE_MISSING');
          }
          throw error;
        }
        await fetchReceivers();
      } else {
        throw new Error('SUPABASE_NOT_CONFIGURED');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving receiver:', err);
      
      // Fallback to LocalStorage if Supabase fails or is not configured
      try {
        let newList = [...receivers];
        if (editingIdx !== null) {
          newList[editingIdx] = { ...profileData, id: receivers[editingIdx].id };
        } else {
          newList.push({ ...profileData, id: 'local-' + Date.now() });
        }
        const key = isSFI(paraType) ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
        localStorage.setItem(key, JSON.stringify(newList));
        setReceivers(newList);
        window.dispatchEvent(new Event('storage'));
        
        setIsModalOpen(false);
        resetForm();
        
        if (isSupabaseConfigured) {
          alert('সুপাবেজ (Supabase) এ তথ্য সংরক্ষণ করা যায়নি, তবে আপনার ব্রাউজারে (LocalStorage) এটি সংরক্ষিত হয়েছে।\n\nত্রুটি: ' + (err.message === 'TABLE_MISSING' ? 'receivers টেবিলটি ডাটাবেসে পাওয়া যায়নি।' : err.message));
        }
      } catch (localErr) {
        console.error('LocalStorage fallback failed:', localErr);
        alert('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট সংযোগ বা ব্রাউজার স্টোরেজ চেক করুন।');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTempName('');
    setTempDesignation('');
    setTempImage(null);
    setEditingIdx(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
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

  const handleDelete = async (index: number) => {
    const receiverToDelete = receivers[index];
    if (!receiverToDelete) return;

    // If source is correspondence, it's not in the receivers table or local storage
    if (receiverToDelete.source === 'correspondence') {
      alert(`"${receiverToDelete.name}" নামটি সরাসরি চিঠিপত্র এন্ট্রি থেকে আসছে। এটি মুছতে হলে আপনাকে সংশ্লিষ্ট চিঠিপত্র এন্ট্রিগুলো পরিবর্তন করতে হবে।`);
      return;
    }

    // Check if receiver has correspondence entries across ALL paraTypes to be safe
    let hasCorrespondence = receiverToDelete.entryCount ? receiverToDelete.entryCount > 0 : false;
    let blockingEntries: any[] = receiverToDelete.entryDetails || [];
    const searchName = receiverToDelete.name.trim();
    
    try {
      if (isSupabaseConfigured && !hasCorrespondence) {
        // Scan ALL entries for this name, regardless of paraType
        const { data, error } = await supabase
          .from('settlement_entries')
          .select('id, content')
          .not('content->>receiverName', 'is', null);
        
        if (!error && data) {
          data.forEach(row => {
            let content = row.content;
            if (typeof content === 'string') {
              try { content = JSON.parse(content); } catch (e) { return; }
            }
            if (!content) return;

            const isCorr = content.type === 'correspondence' || 
                          (content.description !== undefined && content.description !== null && content.description !== '');
            
            if (isCorr && content.receiverName && content.receiverName.trim() === searchName) {
              hasCorrespondence = true;
              blockingEntries.push({
                id: row.id,
                diaryNo: content.diaryNo,
                diaryDate: content.diaryDate,
                letterNo: content.letterNo,
                paraType: content.paraType
              });
            }
          });
        }
      } else if (!isSupabaseConfigured && !hasCorrespondence) {
        const savedCorr = localStorage.getItem(CORR_STORAGE_KEY);
        if (savedCorr) {
          try {
            const entries = JSON.parse(savedCorr);
            blockingEntries = entries.filter((e: any) => e.receiverName && e.receiverName.trim() === searchName);
            hasCorrespondence = blockingEntries.length > 0;
          } catch (e) { console.error(e); }
        }
      }
    } catch (e) { console.error(e); }

    if (hasCorrespondence) {
      const entryList = blockingEntries.map(e => 
        `• ডায়েরি নং: ${e.diaryNo || 'N/A'}, তারিখ: ${e.diaryDate || 'N/A'}${e.paraType ? ` (${e.paraType})` : ''}`
      ).slice(0, 5).join('\n');
      
      const moreCount = blockingEntries.length > 5 ? `\n...এবং আরও ${blockingEntries.length - 5}টি এন্ট্রি` : '';

      alert(`"${receiverToDelete.name}" এর অধীনে ${blockingEntries.length}টি চিঠিপত্র এন্ট্রি পাওয়া গেছে, তাই এটি মুছে ফেলা সম্ভব নয়।\n\nকিছু এন্ট্রি:\n${entryList}${moreCount}\n\nদয়া করে প্রথমে এই এন্ট্রিগুলো মুছে ফেলুন বা প্রাপকের নাম পরিবর্তন করুন।`);
      return;
    }

    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই নামটি মুছে ফেলতে চান?")) return;
    
    try {
      if (isSupabaseConfigured && receiverToDelete.id && !receiverToDelete.id.toString().startsWith('local-')) {
        const { error } = await supabase
          .from('receivers')
          .delete()
          .eq('id', receiverToDelete.id);
        if (error) throw error;
        await fetchReceivers();
      } else {
        // LocalStorage fallback or local-only item
        const newList = receivers.filter((_, i) => i !== index);
        const key = isSFI(paraType) ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
        localStorage.setItem(key, JSON.stringify(newList));
        setReceivers(newList);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err: any) {
      console.error('Error deleting receiver:', err);
      
      // Try local delete if Supabase fails
      const newList = receivers.filter((_, i) => i !== index);
      const key = isSFI(paraType) ? 'ledger_correspondence_receivers_sfi' : 'ledger_correspondence_receivers_nonsfi';
      localStorage.setItem(key, JSON.stringify(newList));
      setReceivers(newList);
      window.dispatchEvent(new Event('storage'));
      
      if (isSupabaseConfigured) {
        alert('সুপাবেজ (Supabase) থেকে তথ্য মোছা যায়নি, তবে আপনার ব্রাউজার (LocalStorage) থেকে এটি মুছে ফেলা হয়েছে।');
      }
    }
  };

  // Removed the strict isAdmin return to allow viewing for all

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
        {isAdmin && (
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} /> নতুন যোগ করুন
          </button>
        )}
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
            onClick={() => setParaType('নন এসএফআই')}
            className={`flex-1 py-5 font-black text-sm transition-all ${paraType.replace('-', ' ') === 'নন এসএফআই' ? 'text-blue-600 border-b-4 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            নন-এসএফআই তালিকা
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-blue-600">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="font-bold">লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receivers.map((profile, idx) => (
                <div key={idx} className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden group-hover:border-blue-200 transition-colors">
                      {profile.image ? (
                        <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 block">{profile.name}</span>
                        {profile.entryCount !== undefined && profile.entryCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full border border-blue-200">
                            {profile.entryCount}টি এন্ট্রি
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded-full border ${
                          profile.source === 'database' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          profile.source === 'local' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          profile.source === 'unassigned' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {profile.source === 'database' ? 'সংরক্ষিত' : 
                           profile.source === 'local' ? 'ব্রাউজারে' : 
                           profile.source === 'unassigned' ? 'অনির্ধারিত' : 'চিঠিপত্র থেকে'}
                        </span>
                        {profile.source === 'correspondence' && isAdmin && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { error } = await supabase
                                  .from('receivers')
                                  .insert([{ 
                                    name: profile.name, 
                                    designation: profile.designation || 'অডিটর', 
                                    para_type: paraType 
                                  }]);
                                if (error) throw error;
                                alert(`"${profile.name}" সফলভাবে মাস্টার লিস্টে সংরক্ষিত হয়েছে।`);
                                fetchReceivers();
                              } catch (err: any) {
                                console.error('Error saving to master list:', err);
                                alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message);
                              }
                            }}
                            className="p-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                            title="মাস্টার লিস্টে সেভ করুন"
                          >
                            <Check size={10} />
                          </button>
                        )}
                      </div>
                      {profile.designation && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{profile.designation}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {profile.entryCount !== undefined && profile.entryCount > 0 && onViewEntries && (
                      <button 
                        onClick={() => onViewEntries(profile.name === 'অনির্ধারিত এন্ট্রি' ? '__UNASSIGNED__' : profile.name, 'correspondence')}
                        className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        title="এন্ট্রিগুলো দেখুন"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    {isAdmin && profile.source !== 'unassigned' && (
                      <>
                        <button 
                          onClick={() => {
                            setEditingIdx(idx);
                            setTempName(profile.name);
                            setTempDesignation(profile.designation || '');
                            setTempImage(profile.image || null);
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
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && receivers.length === 0 && (
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
                <div className="flex justify-center mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all">
                      {tempImage ? (
                        <img src={tempImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-slate-300" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg pointer-events-none">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">প্রাপকের নাম</label>
                  <input 
                    type="text"
                    autoFocus
                    className="w-full h-[58px] px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-lg"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="নাম লিখুন..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">পদবি</label>
                  <input 
                    type="text"
                    className="w-full h-[58px] px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-lg"
                    value={tempDesignation}
                    onChange={(e) => setTempDesignation(e.target.value)}
                    placeholder="পদবি লিখুন..."
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
                    disabled={!tempName.trim() || isSaving}
                    className="flex-1 h-[58px] bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : (editingIdx !== null ? 'আপডেট করুন' : 'যোগ করুন')}
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
