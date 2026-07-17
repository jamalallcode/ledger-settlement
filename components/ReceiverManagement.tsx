import React, { useState, useEffect } from 'react';
import { User, Plus, FileEdit, Trash, X, ShieldCheck, Sparkles, AlertCircle, Loader2, FileText, Check, ArrowLeft } from 'lucide-react';
import { SFI_RECEIVERS } from '../utils/sfi';
import { NONSFI_RECEIVERS } from '../utils/nonsfi';
import { isSFI, isNonSFI, isAdminBranch, getBranchVariations } from '../utils/branchUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toBengaliDigits } from '../utils/numberUtils';

interface ReceiverManagementProps {
  isAdmin: boolean;
  onViewEntries?: (name: string, type: 'settlement' | 'correspondence') => void;
  onBack?: () => void;
  entries?: any[];
  correspondenceEntries?: any[];
  onUpdateEntries?: (newEntries: any[], newCorrEntries: any[]) => void;
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
  is_active?: boolean;
  transferred_to?: string;
  transferred_at?: string;
}

const CORR_STORAGE_KEY = 'ledger_correspondence_v1';

const normalizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  let n = name
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u2028\u2029\u180E\u2060\u2000-\u200A]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[:ঃ।\.\-\u09CD]/g, '')
    .normalize('NFC');

  // Strip common prefixes like "জনাব", "জনাবা", "ডাঃ", "ডা", "ড", "ডক্টর"
  n = n.replace(/^(জনাব|জনাবা|ডাঃ|ডা|ড|ডক্টর|মহোদয়)\s+/, '');

  // Normalize common spelling variations in Bengali vowels for matching
  n = n.replace(/ী/g, 'ি')
       .replace(/ূ/g, 'ু')
       .replace(/ষ/g, 'স')
       .replace(/শ/g, 'স');

  return n;
};

const getCleanBranch = (type: string | null | undefined): string => {
  if (!type) return 'এসএফআই';
  if (type.includes('প্রশাসন') || type === 'ADMIN' || type === 'admin') return 'প্রশাসন';
  if (type.includes('নন') || type.toUpperCase().includes('NON')) return 'নন এসএফআই';
  return 'এসএফআই';
};

const INACTIVE_STORAGE_KEY = 'ledger_inactive_receivers_v1';

const getInactiveList = (): string[] => {
  try {
    const saved = localStorage.getItem(INACTIVE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveInactiveList = (list: string[]) => {
  try {
    localStorage.setItem(INACTIVE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};

const TRANSFERS_STORAGE_KEY = 'ledger_receiver_transfers_v2';

const getTransfersMap = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveTransfersMap = (map: Record<string, string>) => {
  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
};

const TRANSFER_TIMES_STORAGE_KEY = 'ledger_receiver_transfer_times_v1';

const getTransferTimesMap = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem(TRANSFER_TIMES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveTransferTimesMap = (map: Record<string, string>) => {
  try {
    localStorage.setItem(TRANSFER_TIMES_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
};

const getBengaliDateTimeString = (dateInput?: Date): string => {
  const date = dateInput || new Date();
  const day = toBengaliDigits(String(date.getDate()).padStart(2, '0'));
  const month = toBengaliDigits(String(date.getMonth() + 1).padStart(2, '0'));
  const year = toBengaliDigits(String(date.getFullYear()));
  
  let hours = date.getHours();
  const minutes = toBengaliDigits(String(date.getMinutes()).padStart(2, '0'));
  
  let period = 'সকাল';
  if (hours >= 12) {
    if (hours < 16) period = 'দুপুর';
    else if (hours < 18) period = 'বিকাল';
    else if (hours < 20) period = 'সন্ধ্যা';
    else period = 'রাত';
  } else {
    if (hours < 5) period = 'রাত';
    else if (hours < 6) period = 'ভোর';
  }
  
  const displayHours = hours % 12 || 12;
  const bengaliHours = toBengaliDigits(String(displayHours).padStart(2, '0'));
  
  return `${day}/${month}/${year} (${period} ${bengaliHours}:${minutes})`;
};

const getBranchFromTransferName = (name: string): string | null => {
  if (name === 'প্রশাসন শাখা') return 'প্রশাসন';
  if (name === 'এসএফআই শাখা') return 'এসএফআই';
  if (name === 'নন এসএফআই শাখা') return 'নন এসএফআই';
  return null;
};

const ReceiverManagement: React.FC<ReceiverManagementProps> = ({ 
  isAdmin, 
  onViewEntries, 
  onBack,
  entries,
  correspondenceEntries,
  onUpdateEntries
}) => {
  const [receiversList, setReceiversList] = useState<ReceiverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [tempName, setTempName] = useState('');
  const [tempDesignation, setTempDesignation] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [tempIsActive, setTempIsActive] = useState(true);
  const [tempTransferredTo, setTempTransferredTo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchReceivers = async (customEntries?: any[], customCorrEntries?: any[]) => {
    setLoading(true);
    try {
      const activeEntries = customEntries || entries || [];
      const activeCorrEntries = customCorrEntries || correspondenceEntries || [];
      let finalReceivers: ReceiverProfile[] = [];

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

      const hasPassedProps = (Array.isArray(activeEntries) && activeEntries.length > 0) || (Array.isArray(activeCorrEntries) && activeCorrEntries.length > 0);

      if (hasPassedProps) {
        const combined = [
          ...activeEntries,
          ...activeCorrEntries
        ];
        combined.forEach(item => {
          if (!item) return;
          const isCorr = item.type === 'correspondence' || 
                        (item.description !== undefined && item.description !== null && item.description !== '');
          
          if (isCorr) {
            const b = getCleanBranch(item.paraType);
            if (item.receiverName && item.receiverName.trim()) {
              const originalName = item.receiverName.trim();
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
                  id: item.id,
                  diaryNo: item.diaryNo,
                  diaryDate: item.diaryDate,
                  letterNo: item.letterNo
                });
              }
            }
          }
        });
      } else if (isSupabaseConfigured) {
        const { data: dbEntries, error: entriesError } = await supabase
          .from('settlement_entries')
          .select('id, content');
        
        if (!entriesError && dbEntries) {
          dbEntries.forEach(row => {
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
            const dbEntries = JSON.parse(savedCorr);
            dbEntries.forEach((entry: any) => {
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

      const inactiveListRaw = getInactiveList();
      const inactiveKeysSet = new Set(inactiveListRaw.map(item => normalizeName(item)));
      const transfersMap = getTransfersMap();
      const transferTimesMap = getTransferTimesMap();

      // Map counts and active status
      const receiversWithCounts = finalReceivers.map(r => {
        const b = getCleanBranch(r.para_type);
        const norm = normalizeName(r.name);
        const compKey = `${norm}_${b}`;
        
        let is_active = r.is_active;
        if (is_active === undefined || is_active === null) {
          if (inactiveKeysSet.has(compKey)) {
            is_active = false;
          } else if (inactiveKeysSet.has(norm)) {
            const hasBranchSpecificKey = Array.from(inactiveKeysSet).some(k => k.startsWith(`${norm}_`));
            is_active = !hasBranchSpecificKey;
          } else {
            is_active = true;
          }
        }

        let transferred_to = r.transferred_to || transfersMap[compKey] || '';
        let transferred_at = r.transferred_at || transferTimesMap[compKey] || '';

        return {
          ...r,
          para_type: b,
          is_active,
          transferred_to,
          transferred_at,
          entryCount: entryCounts[compKey] || 0,
          entryDetails: entryDetails[compKey] || []
        };
      }).filter(r => {
        if (!r.name || !r.name.trim()) return false;
        if (r.source === 'database') return true;
        if (r.entryCount > 0) return true;
        if (r.source === 'local') return true;
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
  }, [entries, correspondenceEntries]);

  const openAddModal = (branch: string) => {
    setEditingId(null);
    setTempName('');
    setTempDesignation('');
    setTempImage(null);
    setTempIsActive(true);
    setTempTransferredTo('');
    setSelectedBranches([getCleanBranch(branch)]);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: ReceiverProfile) => {
    const norm = normalizeName(profile.name);
    setEditingId(profile.id || profile.name);
    setTempName(profile.name);
    setTempDesignation(profile.designation || '');
    setTempImage(profile.image || null);
    setTempIsActive(profile.is_active !== false);
    setTempTransferredTo(profile.transferred_to || '');

    // Get all branches where this worker is currently active
    const activeBranches = receiversList
      .filter(r => normalizeName(r.name) === norm && r.is_active !== false)
      .map(r => getCleanBranch(r.para_type));

    setSelectedBranches(activeBranches);
    setIsModalOpen(true);
  };

  const handleAddOrEdit = async () => {
    if (!tempName.trim()) return;
    if (selectedBranches.length === 0) {
      alert("অন্তত একটি শাখা নির্বাচন করুন।");
      return;
    }
    setIsSaving(true);
    
    try {
      const currentNorm = normalizeName(tempName.trim());
      let oldName = '';
      if (editingId) {
        const oldProfile = receiversList.find(r => r.id === editingId || r.name === editingId);
        if (oldProfile) {
          oldName = oldProfile.name.trim();
        }
      }

      const nameToMatch = oldName || tempName.trim();
      const matchNorm = normalizeName(nameToMatch);

      // Find all existing branch records for this person in the receiversList
      const existingRecords = receiversList.filter(r => normalizeName(r.name) === matchNorm);

      const allBranches: Array<'প্রশাসন' | 'এসএফআই' | 'নন এসএফআই'> = ['প্রশাসন', 'এসএফআই', 'নন এসএফআই'];

      // Propagate name change if name has changed
      if (oldName && oldName.trim() !== tempName.trim()) {
        const newNameClean = tempName.trim();
        // 1. Supabase propagation
        if (isSupabaseConfigured) {
          try {
            // Update receivers table for all matching records
            const { data: dbRecs, error: recErr } = await supabase
              .from('receivers')
              .select('id, name');
            if (!recErr && dbRecs) {
              const matchedDbRecs = dbRecs.filter(r => normalizeName(r.name) === matchNorm);
              for (const r of matchedDbRecs) {
                await supabase
                  .from('receivers')
                  .update({ name: newNameClean })
                  .eq('id', r.id);
              }
            }

            // Update settlement_entries table
            const { data: dbEntries, error: entriesError } = await supabase
              .from('settlement_entries')
              .select('id, content');
            if (!entriesError && dbEntries) {
              for (const row of dbEntries) {
                let content = row.content;
                if (typeof content === 'string') {
                  try { content = JSON.parse(content); } catch (e) { continue; }
                }
                if (content && content.receiverName && normalizeName(content.receiverName) === matchNorm) {
                  content.receiverName = newNameClean;
                  await supabase
                    .from('settlement_entries')
                    .update({ content: content })
                    .eq('id', row.id);
                }
              }
            }
          } catch (err) {
            console.error('Error propagating name change in Supabase:', err);
          }
        }

        // 2. Local Storage propagation
        const receiverKeys = [
          'ledger_correspondence_receivers_admin',
          'ledger_correspondence_receivers_sfi',
          'ledger_correspondence_receivers_nonsfi'
        ];
        receiverKeys.forEach(key => {
          const saved = localStorage.getItem(key);
          if (saved) {
            try {
              let items = JSON.parse(saved);
              let updated = false;
              items = items.map((it: any) => {
                if (it && it.name && normalizeName(it.name) === matchNorm) {
                  updated = true;
                  return { ...it, name: newNameClean };
                }
                return it;
              });
              if (updated) {
                localStorage.setItem(key, JSON.stringify(items));
              }
            } catch (e) {
              console.error('Error propagating in local receivers key:', key, e);
            }
          }
        });

        // Update ledger_correspondence_entries (CORR_STORAGE_KEY)
        const savedCorr = localStorage.getItem(CORR_STORAGE_KEY);
        if (savedCorr) {
          try {
            let dbEntries = JSON.parse(savedCorr);
            let updated = false;
            dbEntries = dbEntries.map((entry: any) => {
              if (entry && entry.receiverName && normalizeName(entry.receiverName) === matchNorm) {
                updated = true;
                return { ...entry, receiverName: newNameClean };
              }
              return entry;
            });
            if (updated) {
              localStorage.setItem(CORR_STORAGE_KEY, JSON.stringify(dbEntries));
            }
          } catch (e) {
            console.error('Error propagating in local corr entries:', e);
          }
        }

        // Update transfersMap
        const transfers = getTransfersMap();
        const updatedTransfers: Record<string, string> = {};
        let transfersUpdated = false;
        for (const [key, val] of Object.entries(transfers)) {
          if (key.startsWith(`${matchNorm}_`)) {
            transfersUpdated = true;
            const branchSuffix = key.substring(matchNorm.length);
            updatedTransfers[`${currentNorm}${branchSuffix}`] = val;
          } else {
            updatedTransfers[key] = val;
          }
        }
        if (transfersUpdated) {
          saveTransfersMap(updatedTransfers);
        }

        // Update transferTimesMap
        const transferTimes = getTransferTimesMap();
        const updatedTransferTimes: Record<string, string> = {};
        let transferTimesUpdated = false;
        for (const [key, val] of Object.entries(transferTimes)) {
          if (key.startsWith(`${matchNorm}_`)) {
            transferTimesUpdated = true;
            const branchSuffix = key.substring(matchNorm.length);
            updatedTransferTimes[`${currentNorm}${branchSuffix}`] = val;
          } else {
            updatedTransferTimes[key] = val;
          }
        }
        if (transferTimesUpdated) {
          saveTransferTimesMap(updatedTransferTimes);
        }
      }



      // Save to Supabase if configured
      if (isSupabaseConfigured) {
        const saveToDbWithFallback = async (data: any, id?: any) => {
          let error;
          if (id) {
            const { error: updateError } = await supabase
              .from('receivers')
              .update(data)
              .eq('id', id);
            error = updateError;

            if (error && (error.message?.includes('column') || error.code === '42703')) {
              const { transferred_at, ...withTransferredTo } = data;
              const { error: retryError } = await supabase
                .from('receivers')
                .update(withTransferredTo)
                .eq('id', id);
              error = retryError;
            }

            if (error && (error.message?.includes('column') || error.code === '42703')) {
              const { is_active, transferred_to, transferred_at, ...rest } = data;
              const { error: finalRetryError } = await supabase
                .from('receivers')
                .update(rest)
                .eq('id', id);
              error = finalRetryError;
            }
          } else {
            const { error: insertError } = await supabase
              .from('receivers')
              .insert([data]);
            error = insertError;

            if (error && (error.message?.includes('column') || error.code === '42703')) {
              const { transferred_at, ...withTransferredTo } = data;
              const { error: retryError } = await supabase
                .from('receivers')
                .insert([withTransferredTo]);
              error = retryError;
            }

            if (error && (error.message?.includes('column') || error.code === '42703')) {
              const { is_active, transferred_to, transferred_at, ...rest } = data;
              const { error: finalRetryError } = await supabase
                .from('receivers')
                .insert([rest]);
              error = finalRetryError;
            }
          }

          if (error) throw error;
        };

        for (const b of allBranches) {
          const isSelected = selectedBranches.includes(b);
          const existingRec = existingRecords.find(r => getCleanBranch(r.para_type) === b);

          if (isSelected) {
            const profileData = {
              name: tempName.trim(),
              designation: tempDesignation.trim() || null,
              image: tempImage || null,
              para_type: b,
              is_active: true,
              transferred_to: '',
              transferred_at: ''
            };

            if (existingRec && existingRec.id && !existingRec.id.toString().startsWith('local-')) {
              // Update existing db row with fallback handling
              await saveToDbWithFallback(profileData, existingRec.id);
            } else {
              // Insert new db row with fallback handling
              await saveToDbWithFallback(profileData);
            }
          } else {
            // Unselected. If they have files, set them to inactive instead of deleting
            const hasFiles = existingRec && existingRec.entryCount && existingRec.entryCount > 0;
            if (hasFiles) {
              const profileData = {
                name: tempName.trim(),
                designation: tempDesignation.trim() || null,
                image: tempImage || null,
                para_type: b,
                is_active: false,
                transferred_to: 'অন্যান্য শাখা',
                transferred_at: getBengaliDateTimeString()
              };

              if (existingRec && existingRec.id && !existingRec.id.toString().startsWith('local-')) {
                await saveToDbWithFallback(profileData, existingRec.id);
              } else {
                await saveToDbWithFallback(profileData);
              }
            } else {
              // No files in this branch, delete it from the database since they are completely removed
              if (existingRec && existingRec.id && !existingRec.id.toString().startsWith('local-')) {
                const { error } = await supabase
                  .from('receivers')
                  .delete()
                  .eq('id', existingRec.id);
                if (error) throw error;
              }
            }
          }
        }
      }

      // Sync and save to local storage (for fallback or direct tracking)
      for (const b of allBranches) {
        const isSelected = selectedBranches.includes(b);
        const existingRec = existingRecords.find(r => getCleanBranch(r.para_type) === b);

        const key = b === 'প্রশাসন' ? 'ledger_correspondence_receivers_admin' :
                    b === 'নন এসএফআই' ? 'ledger_correspondence_receivers_nonsfi' :
                    'ledger_correspondence_receivers_sfi';

        const saved = localStorage.getItem(key);
        let items = saved ? JSON.parse(saved) : [];

        // Remove old records for this person in this branch's storage
        items = items.filter((it: any) => normalizeName(it.name) !== matchNorm && it.id !== editingId);

        if (isSelected) {
          const newId = existingRec?.id || 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
          items.push({
            id: newId,
            name: tempName.trim(),
            designation: tempDesignation.trim() || null,
            image: tempImage || null,
            para_type: b,
            is_active: true,
            transferred_to: '',
            transferred_at: ''
          });
        } else {
          // If they have files, keep them as inactive
          const hasFiles = existingRec && existingRec.entryCount && existingRec.entryCount > 0;
          if (hasFiles) {
            const newId = existingRec?.id || 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            items.push({
              id: newId,
              name: tempName.trim(),
              designation: tempDesignation.trim() || null,
              image: tempImage || null,
              para_type: b,
              is_active: false,
              transferred_to: 'অন্যান্য শাখা',
              transferred_at: getBengaliDateTimeString()
            });
          }
        }

        localStorage.setItem(key, JSON.stringify(items));
      }

      // Sync local deactivation storage
      let inactiveList = getInactiveList();

      // Filter out any existing entries for this person in the inactive list
      inactiveList = inactiveList.filter(n => {
        const itemNorm = normalizeName(n);
        if (itemNorm === matchNorm || itemNorm === currentNorm) return false;
        if (itemNorm.startsWith(`${matchNorm}_`) || itemNorm.startsWith(`${currentNorm}_`)) return false;
        return true;
      });

      // Add back any unselected branches where they have files
      for (const b of allBranches) {
        const isSelected = selectedBranches.includes(b);
        const existingRec = existingRecords.find(r => getCleanBranch(r.para_type) === b);
        const hasFiles = existingRec && existingRec.entryCount && existingRec.entryCount > 0;
        
        if (!isSelected && hasFiles) {
          inactiveList.push(`${currentNorm}_${b}`);
        }
      }

      saveInactiveList(inactiveList);

      let updatedEntries = entries ? [...entries] : [];
      let updatedCorrEntries = correspondenceEntries ? [...correspondenceEntries] : [];
      let entriesChanged = false;

      if (oldName && oldName.trim() !== tempName.trim()) {
        const newNameClean = tempName.trim();
        
        updatedEntries = updatedEntries.map(entry => {
          if (entry && entry.receiverName && normalizeName(entry.receiverName) === matchNorm) {
            entriesChanged = true;
            return { ...entry, receiverName: newNameClean };
          }
          return entry;
        });

        updatedCorrEntries = updatedCorrEntries.map(entry => {
          if (entry && entry.receiverName && normalizeName(entry.receiverName) === matchNorm) {
            entriesChanged = true;
            return { ...entry, receiverName: newNameClean };
          }
          return entry;
        });

        if (entriesChanged) {
          localStorage.setItem('cached_settlement_entries', JSON.stringify(updatedEntries));
          localStorage.setItem('cached_correspondence_entries', JSON.stringify(updatedCorrEntries));
          if (onUpdateEntries) {
            onUpdateEntries(updatedEntries, updatedCorrEntries);
          }
        }
      }

      window.dispatchEvent(new Event('storage'));
      setIsModalOpen(false);
      resetForm();
      await fetchReceivers(updatedEntries, updatedCorrEntries);
    } catch (err: any) {
      console.error('Error saving receiver branches:', err);
      alert('কর্মী তথ্য পরিবর্তন বা সংরক্ষণ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTempName('');
    setTempDesignation('');
    setTempImage(null);
    setTempIsActive(true);
    setTempTransferredTo('');
    setEditingId(null);
    setSelectedBranches([]);
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

    const confirmMessage = `আপনি কি নিশ্চিতভাবে "${profile.name}"-কে এই শাখা (${profile.para_type}) হতে ডিলিট করতে চান?\n\n` +
      `সতর্কতা: ডিলিট করলে ইনি শুধুমাত্র এই শাখা হতে ডিলিট হবেন। ` +
      `যদি উনাকে একাধিক শাখায় সক্রিয় রাখা হয়ে থাকে, তবে অন্যান্য শাখায় উনার প্রোফাইলটি সম্পূর্ণ সুরক্ষিত থাকবে।`;

    if (!window.confirm(confirmMessage)) return;
    
    try {
      const norm = normalizeName(profile.name);
      const branchClean = getCleanBranch(profile.para_type);
      const compKey = `${norm}_${branchClean}`;
      const inactiveList = getInactiveList().filter(n => {
        const itemNorm = normalizeName(n);
        return itemNorm !== norm && itemNorm !== compKey;
      });
      saveInactiveList(inactiveList);

      // Also clean up local transfer time if any
      const transferTimesMap = getTransferTimesMap();
      delete transferTimesMap[compKey];
      saveTransferTimesMap(transferTimesMap);

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
    const list = receiversList.filter(r => r.name && r.name.trim() && getCleanBranch(r.para_type) === branch);

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
            list.map((profile, idx) => {
              const isInactive = profile.is_active === false;
              return (
                <div 
                  key={idx} 
                  className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${isInactive ? 'bg-rose-50/45 border-rose-200 shadow-sm shadow-rose-50/20 opacity-90' : 'bg-slate-50 border-slate-100 hover:bg-blue-50/10'} ${themes.borderTheme}`}
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
                        <span className={`font-bold text-[13px] sm:text-sm truncate ${isInactive ? 'text-slate-400 line-through font-normal' : 'text-slate-700'}`}>
                          {profile.name} {isInactive && <span className="text-rose-500 font-bold ml-1 no-underline inline-block">(বদলী হয়েছেন)</span>}
                        </span>
                        {isInactive && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded border border-rose-100 uppercase tracking-wider shrink-0 flex items-center gap-1">
                            বদলি / নিষ্ক্রিয় {profile.transferred_to ? `(${profile.transferred_to})` : ''}
                          </span>
                        )}
                        {profile.entryCount !== undefined && profile.entryCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] sm:text-[9px] font-black rounded-full border border-blue-100">
                            {toBengaliDigits(profile.entryCount.toString())}টি চিঠিপত্র
                          </span>
                        )}
                      </div>
                      {profile.designation && (
                        <span className="text-[10px] font-bold text-slate-400 truncate block mt-0.5 uppercase tracking-wider">{profile.designation}</span>
                      )}
                      {isInactive && profile.transferred_at && (
                        <span className="text-[10px] font-extrabold text-rose-500 block mt-0.5">
                          বদলির সময়কাল: {profile.transferred_at}
                        </span>
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
                      {profile.entryCount !== undefined && profile.entryCount > 0 ? (
                        <button 
                          disabled
                          className="p-2 bg-slate-100 text-slate-300 border border-slate-200 rounded-xl cursor-not-allowed shrink-0"
                          title="চিঠিপত্র বা ডায়েরি এন্ট্রি থাকায় উনাকে ডিলিট করা সম্ভব নয়"
                        >
                          <Trash size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDelete(profile)}
                          className="p-2 bg-white text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
                          title="মুছে ফেলুন"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all hover:border-slate-300 shadow-sm hover:shadow active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
              title="পূর্ববর্তী পৃষ্ঠায় ফিরে যান"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
          )}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 shrink-0 select-none">
            <User size={30} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">প্রাপক কর্মী ব্যবস্থাপনা</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5">অফিসের ৩টি ভিন্ন শাখার কর্মকর্তাদের বায়োডাটা, ছবি এবং দায়িত্ব নিয়ন্ত্রণ করুন</p>
          </div>
        </div>

        {onBack && (
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-100 hover:border-rose-300 rounded-2xl font-black text-xs transition-all hover:shadow active:scale-95 self-start sm:self-center cursor-pointer shadow-sm"
          >
            <X size={16} className="stroke-[2.5]" />
            বাতিল / বন্ধ করুন
          </button>
        )}
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

                {/* Branch Selection Selector with Checkboxes */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1 block">শাখা নির্ধারণ (এক বা একাধিক নির্বাচন করুন)</label>
                  <div className="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                    {['প্রশাসন', 'এসএফআই', 'নন এসএফআই'].map((branch) => {
                      const isChecked = selectedBranches.includes(branch);
                      
                      // Check if they have files in this branch
                      const currentNorm = normalizeName(tempName.trim());
                      const existingRec = receiversList.find(r => normalizeName(r.name) === currentNorm && getCleanBranch(r.para_type) === branch);
                      const hasFiles = existingRec && existingRec.entryCount && existingRec.entryCount > 0;

                      return (
                        <label 
                          key={branch}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            isChecked 
                              ? 'bg-blue-50/50 border-blue-500/50 text-blue-700 font-bold' 
                              : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBranches(prev => [...prev, branch]);
                                } else {
                                  setSelectedBranches(prev => prev.filter(b => b !== branch));
                                }
                              }}
                              className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs sm:text-sm">{branch === 'প্রশাসন' ? '১. প্রশাসন শাখা' : branch === 'এসএফআই' ? '২. এসএফআই শাখা' : '৩. নন এসএফআই শাখা'}</span>
                          </div>
                          {hasFiles && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                              চিঠিপত্র আছে
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
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
