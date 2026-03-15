import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { EMPLOYEES, VOTE_POSITIONS } from '../constants';
import { BallotVote, PositionResult, VoterToken } from '../types';
import { 
  CheckCircle2, AlertCircle, BarChart3, Fingerprint, 
  Send, Trophy, UserCheck, Loader2, Key, RefreshCw, Copy, Check, Trash2, ShieldCheck, Ticket, Database, HelpCircle, ArrowRight, RotateCcw, MessageSquare, Plus, Settings2, Vote, Lock, Unlock, UserPlus, UserMinus, Eye, EyeOff, LayoutGrid, Trash, Pencil, X, ChevronDown, Search, KeyRound
} from 'lucide-react';
import { toBengaliDigits, parseBengaliNumber } from '../utils/numberUtils';

/**
 * Premium custom dropdown component for voter selection
 */
const PremiumVoterSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, value, options, onChange, placeholder = "প্রার্থী নির্বাচন করুন" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-[13px] font-black text-slate-700 ml-1">
        <UserCheck size={14} className="text-blue-600" /> {label}
      </label>
      
      <div 
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(''); }}
        className={`w-full h-[58px] px-5 bg-slate-50 border-2 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 shadow-sm ${isOpen ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
      >
        <span className={`font-bold text-[15px] truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-3xl shadow-2xl z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                autoFocus
                type="text"
                placeholder="নাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
            {filteredOptions.length > 0 ? filteredOptions.map((opt, i) => (
              <div 
                key={i}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-5 py-3.5 mx-2 my-0.5 rounded-xl cursor-pointer flex items-center justify-between transition-all group ${value === opt ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-50 text-slate-700 font-bold'}`}
              >
                <span className="text-[14px]">{opt}</span>
                {value === opt && <Check size={18} strokeWidth={3} className="animate-in zoom-in duration-300" />}
              </div>
            )) : (
              <div className="py-8 text-center text-slate-400 font-bold text-xs italic">কিছু পাওয়া যায়নি</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const VotingSystem: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'vote' | 'results' | 'admin' | 'poll'>('vote');
  const [voterTokenInput, setVoterTokenInput] = useState('');
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [pollSelection, setPollSelection] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [allVotes, setAllVotes] = useState<BallotVote[]>([]);
  const [allTokens, setAllTokens] = useState<VoterToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Dynamic Positions State
  const [activePositions, setActivePositions] = useState<{id: string, title: string}[]>([]);
  const [newPositionTitle, setNewPositionTitle] = useState('');
  
  // Position Edit State
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [newPositionEditValue, setNewPositionEditValue] = useState('');

  // Dynamic Voter List & Permissions
  const [voterList, setVoterList] = useState<string[]>([]);
  const [authorizedViewers, setAuthorizedViewers] = useState<any[]>([]);
  const [isViewerVerified, setIsViewerVerified] = useState(false);
  const [newVoterName, setNewVoterName] = useState('');
  
  // Voter Edit State
  const [editingVoterName, setEditingVoterName] = useState<string | null>(null);
  const [newVoterEditValue, setNewVoterEditValue] = useState('');

  // Poll Settings
  const [pollQuestion, setPollQuestion] = useState('আপনারা কি এ বছর বার্ষিক পিকনিকে যেতে ইচ্ছুক?');
  const [pollOptions, setPollOptions] = useState(['হ্যাঁ', 'না', 'ব বলা যাচ্ছে না']);
  const [isResultsLocked, setIsResultsLocked] = useState(false);

  // --- PERSISTENCE HELPERS ---
  const syncConfigToDB = async (updates: any) => {
    try {
      const { data: currentData } = await supabase
        .from('settlement_entries')
        .select('content')
        .eq('id', 'voting_system_config')
        .maybeSingle();

      const currentConfig = {
        activePositions,
        voterList,
        authorizedViewers,
        pollQuestion,
        pollOptions,
        isResultsLocked,
        ...(currentData?.content || {}),
        ...updates
      };
      await supabase.from('settlement_entries').upsert({
        id: 'voting_system_config',
        content: currentConfig
      });
    } catch (err) {
      console.error("Config sync error:", err);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('settlement_entries')
          .select('*')
          .eq('id', 'voting_system_config')
          .maybeSingle();
        
        if (!error && data && data.content) {
          const config = data.content;
          if (config.activePositions) setActivePositions(config.activePositions);
          if (config.voterList) setVoterList(config.voterList);
          if (config.authorizedViewers) setAuthorizedViewers(config.authorizedViewers);
          if (config.pollQuestion) setPollQuestion(config.pollQuestion);
          if (config.pollOptions) setPollOptions(config.pollOptions);
          if (config.isResultsLocked !== undefined) setIsResultsLocked(config.isResultsLocked);
        } else {
          // Fallback to localStorage if no DB entry exists yet
          const savedVoters = localStorage.getItem('voting_voter_list');
          const savedViewers = localStorage.getItem('voting_authorized_viewers');
          const savedQuestion = localStorage.getItem('active_poll_q');
          const savedOptions = localStorage.getItem('active_poll_opts');
          const savedLock = localStorage.getItem('voting_results_locked');
          const savedPos = localStorage.getItem('voting_active_positions');

          if (savedVoters) setVoterList(JSON.parse(savedVoters));
          else setVoterList(EMPLOYEES);

          if (savedPos) setActivePositions(JSON.parse(savedPos));
          else setActivePositions(VOTE_POSITIONS);

          if (savedViewers) setAuthorizedViewers(JSON.parse(savedViewers));
          if (savedQuestion) setPollQuestion(savedQuestion);
          if (savedOptions) setPollOptions(JSON.parse(savedOptions));
          if (savedLock !== null) setIsResultsLocked(JSON.parse(savedLock));
        }
      } catch (e) {
        console.error("Config load error:", e);
      }
    };
    
    fetchConfig();
  }, []);

  // Update localStorage for immediate feedback, though primary source is now DB
  useEffect(() => {
    localStorage.setItem('voting_voter_list', JSON.stringify(voterList));
    localStorage.setItem('voting_active_positions', JSON.stringify(activePositions));
    localStorage.setItem('voting_authorized_viewers', JSON.stringify(authorizedViewers));
    localStorage.setItem('active_poll_q', pollQuestion);
    localStorage.setItem('active_poll_opts', JSON.stringify(pollOptions));
    localStorage.setItem('voting_results_locked', JSON.stringify(isResultsLocked));
  }, [voterList, activePositions, authorizedViewers, pollQuestion, pollOptions, isResultsLocked]);

  // Initial fetch for votes/tokens
  useEffect(() => {
    fetchTokens();
    if (activeSubTab === 'results' || activeSubTab === 'poll') fetchVotes();
  }, [activeSubTab]);

  const fetchVotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settlement_entries')
        .select('*')
        .like('id', 'vote_%');
      if (error) throw error;
      setAllVotes((data || []).map((row: any) => ({ ...row.content, id: row.id })));
    } catch (err: any) {
      console.error("Fetch Votes Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('voter_tokens').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAllTokens(data || []);
    } catch (err: any) {
      console.error("Fetch Tokens Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVoter = () => {
    const nameToAdd = newVoterName.trim();
    if (!nameToAdd) return;
    
    setVoterList(prevList => {
      if (prevList.includes(nameToAdd)) {
        alert("এই নাম ইতিমধ্যে তালিকায় আছে।");
        return prevList;
      }
      const next = [...prevList, nameToAdd];
      syncConfigToDB({ voterList: next });
      return next;
    });
    setNewVoterName('');
  };

  const handleUpdateVoterName = async (oldName: string) => {
    const updatedName = newVoterEditValue.trim();
    if (!updatedName || updatedName === oldName) {
      setEditingVoterName(null);
      return;
    }

    if (voterList.includes(updatedName)) {
      alert("এই নাম ইতিমধ্যে তালিকায় আছে।");
      return;
    }

    try {
      setIsLoading(true);
      // 1. Update voterList
      const nextVoters = voterList.map(v => v === oldName ? updatedName : v);
      // 2. Update authorizedViewers
      const nextViewers = authorizedViewers.map(v => {
        if (typeof v === 'object' && v.name === oldName) {
          return { ...v, name: updatedName };
        }
        return v === oldName ? updatedName : v;
      });

      // 3. Update active state locally
      setVoterList(nextVoters);
      setAuthorizedViewers(nextViewers);

      // 4. Update historical votes in state for immediate UI update
      const updatedVotes = allVotes.map(vote => {
        const newVote = { ...vote } as any;
        Object.keys(newVote).forEach(key => {
          if (newVote[key] === oldName) newVote[key] = updatedName;
        });
        return newVote;
      });
      setAllVotes(updatedVotes);

      // 5. Sync updated votes to Supabase
      const { data: voteRows } = await supabase
        .from('settlement_entries')
        .select('*')
        .like('id', 'vote_%');
        
      if (voteRows) {
        for (const row of voteRows) {
          const content = row.content;
          let changed = false;
          Object.keys(content).forEach(k => {
            if (content[k] === oldName) {
              content[k] = updatedName;
              changed = true;
            }
          });
          if (changed) {
            await supabase.from('settlement_entries').upsert({ id: row.id, content: content });
          }
        }
      }

      // 6. Sync config to DB
      await syncConfigToDB({ voterList: nextVoters, authorizedViewers: nextViewers });

      setEditingVoterName(null);
      setMessage({ type: 'success', text: `নাম সফলভাবে পরিবর্তন করা হয়েছে।` });
    } catch (err: any) {
      alert("নাম পরিবর্তন ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPosition = () => {
    const title = newPositionTitle.trim();
    if (!title) return;
    
    const newId = `p${Date.now()}`;
    const next = [...activePositions, { id: newId, title }];
    setActivePositions(next);
    syncConfigToDB({ activePositions: next });
    setNewPositionTitle('');
    setMessage({ type: 'success', text: `নতুন পদ "${title}" যুক্ত করা হয়েছে।` });
  };

  const handleUpdatePositionTitle = async (id: string) => {
    const updatedTitle = newPositionEditValue.trim();
    if (!updatedTitle) {
      setEditingPositionId(null);
      return;
    }

    const pos = activePositions.find(p => p.id === id);
    if (pos && pos.title === updatedTitle) {
      setEditingPositionId(null);
      return;
    }

    try {
      setIsLoading(true);
      const next = activePositions.map(p => p.id === id ? { ...p, title: updatedTitle } : p);
      setActivePositions(next);
      await syncConfigToDB({ activePositions: next });
      setEditingPositionId(null);
      setMessage({ type: 'success', text: `পদের নাম সফলভাবে পরিবর্তন করা হয়েছে।` });
    } catch (err: any) {
      alert("পদের নাম পরিবর্তন ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePosition = (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই পদটি মুছে ফেলতে চান?")) return;
    const next = activePositions.filter(p => p.id !== id);
    setActivePositions(next);
    syncConfigToDB({ activePositions: next });
  };

  const handleRemoveVoter = (name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${name}" কে তালিকা থেকে বাদ দিতে চান?`)) return;
    const nextVoters = voterList.filter(v => v !== name);
    const nextViewers = authorizedViewers.filter(v => {
      if (typeof v === 'object') return v.name !== name;
      return v !== name;
    });
    setVoterList(nextVoters);
    setAuthorizedViewers(nextViewers);
    syncConfigToDB({ voterList: nextVoters, authorizedViewers: nextViewers });
  };

  const toggleViewerPermission = (name: string) => {
    let next: any[];
    const isAuthorized = authorizedViewers.some(v => (typeof v === 'object' ? v.name === name : v === name));

    if (isAuthorized) {
      next = authorizedViewers.filter(v => (typeof v === 'object' ? v.name !== name : v !== name));
    } else {
      const accessId = `VIEW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      next = [...authorizedViewers, { name, accessId }];
    }
    
    setAuthorizedViewers(next);
    syncConfigToDB({ authorizedViewers: next });
  };

  const generateTokens = async () => {
    const count = voterList.length;
    if (!window.confirm(`আপনি কি নতুন ${toBengaliDigits(count)}টি টোকেন জেনারেট করতে চান?`)) return;
    try {
      setIsLoading(true);
      const newTokens = Array.from({ length: count }).map(() => ({
        token: `VOTE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        is_used: false
      }));
      const { error } = await supabase.from('voter_tokens').insert(newTokens);
      if (error) throw error;
      await fetchTokens();
      setActiveSubTab('admin');
      setMessage({ type: 'success', text: `${toBengaliDigits(count)}টি নতুন টোকেন জেনারেট করা হয়েছে।` });
    } catch (err: any) {
      alert("টোকেন জেনারেশন ব্যর্থ হয়েছে: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePollUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem('q') as HTMLInputElement).value;
    const opts = (form.elements.namedItem('opts') as HTMLInputElement).value.split(',').map(o => o.trim()).filter(o => o);
    
    setPollQuestion(q);
    setPollOptions(opts);
    syncConfigToDB({ pollQuestion: q, pollOptions: opts });
    setMessage({ type: 'success', text: 'পোল প্রশ্ন সফলভাবে আপডেট করা হয়েছে।'});
  };

  const toggleResultsLock = () => {
    const nextState = !isResultsLocked;
    setIsResultsLocked(nextState);
    syncConfigToDB({ isResultsLocked: nextState });
    setMessage({ type: 'success', text: nextState ? 'ফলাফল লক করা হয়েছে।' : 'ফলাফল আনলক করা হয়েছে।' });
  };

  const clearOnlyVotes = async () => {
    if (!window.confirm("সাবধান! এটি শুধুমাত্র সকল 'ভোটের ফলাফল' মুছে ফেলবে। ভোটার টোকেনগুলো আগের মতোই থাকবে।")) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.from('settlement_entries').delete().like('id', 'vote_%');
      if (error) throw error;
      setAllVotes([]);
      setMessage({ type: 'success', text: 'ভোটের ফলাফল সফলভাবে মুছে ফেলা হয়েছে।' });
    } catch (err: any) {
      alert("ফলাফল মুছতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllTokens = async () => {
    if (!window.confirm("সাবধান! এটি সকল টোকেন এবং ভোট স্থায়ীভাবে মুছে ফেলবে।")) return;
    try {
      setIsLoading(true);
      await supabase.from('settlement_entries').delete().like('id', 'vote_%');
      await supabase.from('voter_tokens').delete().not('id', 'is', null);
      setAllVotes([]);
      setAllTokens([]);
      setMessage({ type: 'success', text: 'সিস্টেমের সকল তথ্য মুছে ফেলা হয়েছে।' });
    } catch (err: any) {
      alert("তথ্য মুছতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateElectionResults = useMemo((): PositionResult[] => {
    return activePositions.map(pos => {
      const voteCounts: Record<string, number> = {};
      allVotes.forEach(v => {
        const choice = (v as any)[pos.id];
        if (typeof choice === 'string' && voterList.includes(choice)) {
          voteCounts[choice] = (voteCounts[choice] || 0) + 1;
        }
      });
      const results = Object.entries(voteCounts)
        .map(([name, count]) => ({ name, votes: count }))
        .sort((a, b) => b.votes - a.votes);
      return { title: pos.title, id: pos.id, results };
    });
  }, [allVotes, voterList, activePositions]);

  const calculatePollResults = useMemo(() => {
    const counts: Record<string, number> = {};
    pollOptions.forEach(opt => counts[opt] = 0);
    allVotes.forEach(v => {
      if (pollOptions.includes(String(v.p1))) {
        counts[String(v.p1)] = (counts[String(v.p1)] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [allVotes, pollOptions]);

  const handleVoteSubmit = async (e: React.FormEvent, type: 'election' | 'poll') => {
    e.preventDefault();
    const token = voterTokenInput.trim().toUpperCase();
    
    if (!token) return alert("দয়া করে আপনার সিক্রেট টোকেনটি দিন।");
    if (type === 'election' && Object.keys(selections).length < activePositions.length) return alert("অনুগ্রহ করে সকল পদের জন্য ভোট দিন।");
    if (type === 'poll' && !pollSelection) return alert("দয়া করে একটি অপশন নির্বাচন করুন।");

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('voter_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (tokenError) throw tokenError;
      if (!tokenData || tokenData.is_used) {
        setMessage({ type: 'error', text: !tokenData ? 'ভুল টোকেন!' : 'টোকেনটি ইতিমধ্যে ব্যবহৃত হয়েছে।' });
        setIsSubmitting(false); return;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
      const voterHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      let voteData: any = { voter_hash: voterHash, type: type, created_at: new Date().toISOString() };
      
      if (type === 'election') {
        activePositions.forEach(pos => {
          voteData[pos.id] = String(selections[pos.id] || '');
        });
      } else {
        voteData.p1 = pollSelection;
      }

      const entryId = `vote_${voterHash}`;

      if (!navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem('ledger_offline_sync_queue_v1') || '[]');
        const offlineVoteEntry = { id: entryId, content: voteData };
        localStorage.setItem('ledger_offline_sync_queue_v1', JSON.stringify([...queue, offlineVoteEntry]));
        
        setAllTokens(prev => prev.map(t => t.token === token ? { ...t, is_used: true } : t));
        setAllVotes(prev => [...prev, voteData]);
        
        setMessage({ type: 'success', text: 'অফলাইন ভোট গ্রহণ করা হয়েছে। ইন্টারনেট সংযোগ পেলে তা স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।' });
        setSelections({}); setPollSelection(''); setVoterTokenInput('');
      } else {
        const { error: voteError } = await supabase.from('settlement_entries').upsert({ id: entryId, content: voteData });

        if (voteError) {
          console.error("Supabase Insert Error:", voteError);
          setMessage({ type: 'error', text: 'ভোট গ্রহণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
        } else {
          await supabase.from('voter_tokens').update({ is_used: true }).eq('token', token);
          setAllVotes(prev => [...prev, voteData]);
          setMessage({ type: 'success', text: 'আপনার ভোট সফলভাবে সম্পন্ন হয়েছে।' });
          setSelections({}); setPollSelection(''); setVoterTokenInput('');
          fetchTokens();
        }
      }
    } catch (err: any) {
      console.error("Critical Error:", err);
      setMessage({ type: 'error', text: 'কারিগরি ত্রুটি।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedToken(txt);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleViewerVerification = () => {
    const inputId = prompt("ফলাফল দেখতে আপনার সিক্রেট এক্সেস আইডি (Access ID) প্রদান করুন:");
    if (!inputId) return;
    
    const viewer = authorizedViewers.find(v => (typeof v === 'object' ? v.accessId === inputId.trim().toUpperCase() : false));
    
    if (viewer) {
      setIsViewerVerified(true);
      setMessage({ type: 'success', text: `স্বাগতম ${viewer.name}, আপনাকে ফলাফল দেখার অনুমতি দেওয়া হয়েছে।` });
    } else {
      alert("দুঃখিত, আপনার আইডিটি সঠিক নয় বা আপনার জন্য কোনো এক্সেস আইডি বরাদ্দ করা হয়নি।");
    }
  };

  const showResults = isAdmin || !isResultsLocked || isViewerVerified;

  /**
   * Corrected typo in Lock component's size prop.
   */
  const LockedResultsView = () => (
    <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-xl">
        <Lock size={40} />
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">ফলাফল বর্তমানে লক করা আছে</h3>
        <p className="text-slate-500 font-bold max-w-sm mx-auto">এডমিন দ্বারা ফলাফল গোপন রাখা হয়েছে। শুধুমাত্র অনুমোদিত আইডি দিয়েই ফলাফল দেখা যাবে।</p>
        <button onClick={handleViewerVerification} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-blue-600/20 active:scale-95">
          <Key size={18} /> আমার এক্সেস আইডি আছে
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-landing-premium px-4 md:px-0">
      <div className="sticky top-0 z-[100] flex flex-col md:flex-row items-stretch justify-between bg-white/95 backdrop-blur-xl rounded-none border border-slate-200 shadow-xl overflow-hidden transition-all duration-500 md:min-h-[100px]">
        <div className="flex items-center gap-4 pl-6 md:pl-10 py-4 md:py-2 shrink-0">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/30"><Ticket size={24} className="md:size-[28px]" /></div>
          <div><h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">ডিজিটাল ব্যালট বক্স</h2><p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest">Election & Poll System</p></div>
        </div>
        
        <div className="flex flex-row items-stretch border-t md:border-t-0 md:border-l border-slate-100 rounded-none bg-white overflow-x-auto no-scrollbar shrink-0">
          <button onClick={() => {setActiveSubTab('vote'); setMessage(null);}} className={`flex items-center gap-2.5 px-5 md:px-6 py-4 md:py-0 font-black text-[11px] transition-all border-r border-slate-50 whitespace-nowrap ${activeSubTab === 'vote' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Fingerprint size={16} /> ব্যালট
          </button>
          <button onClick={() => {setActiveSubTab('poll'); setMessage(null);}} className={`flex items-center gap-2.5 px-5 md:px-6 py-4 md:py-0 font-black text-[11px] transition-all border-r border-slate-50 whitespace-nowrap ${activeSubTab === 'poll' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquare size={16} /> পাবলিক পোল
          </button>
          <button onClick={() => {setActiveSubTab('results'); setMessage(null);}} className={`flex items-center gap-2.5 px-5 md:px-6 py-4 md:py-0 font-black text-[11px] transition-all border-r border-slate-50 whitespace-nowrap ${activeSubTab === 'results' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <BarChart3 size={16} /> ইলেকশন ফলাফল
          </button>
          {isAdmin && (
            <button onClick={() => {setActiveSubTab('admin'); setMessage(null);}} className={`flex items-center gap-2.5 px-5 md:px-6 py-4 md:py-0 font-black text-[11px] transition-all whitespace-nowrap ${activeSubTab === 'admin' ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Settings2 size={16} /> এডমিন
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'vote' && (
        <form onSubmit={(e) => handleVoteSubmit(e, 'election')} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-slate-900 text-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden h-fit">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div><h3 className="text-xl font-black tracking-tight text-white">সিক্রেট টোকেন</h3></div>
                <input type="text" placeholder="যেমন: VOTE-XXXXX" value={voterTokenInput} onChange={(e) => setVoterTokenInput(e.target.value.toUpperCase())} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-5 text-white font-black text-2xl tracking-widest outline-none focus:border-blue-500 transition-all placeholder:text-slate-700" />
                <p className="mt-4 text-slate-400 text-sm">টোকেনটি শুধুমাত্র একবার ব্যবহারযোগ্য। ভোট দেওয়ার সাথে সাথে এটি নিষ্ক্রিয় হয়ে যাবে।</p>
              </div>
           </div>
           
           <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-xl flex flex-col min-h-[620px]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900">
                  ব্যালট পেপার (নির্বাচন)
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 mb-8">
                {activePositions.map((pos) => (
                  <PremiumVoterSelect 
                    key={pos.id}
                    label={pos.title}
                    value={selections[pos.id] || ''}
                    options={voterList}
                    onChange={(val) => setSelections({...selections, [pos.id]: val})}
                  />
                ))}
              </div>
              
              <div className="mt-auto pt-6 space-y-4">
                {message?.type === 'error' && (
                  <div className="p-5 rounded-2xl border-2 animate-in slide-in-from-bottom-2 duration-300 flex items-center gap-4 bg-red-50 border-red-100 text-red-600 shadow-sm">
                    <AlertCircle size={24} className="shrink-0" />
                    <span className="text-[15px] font-black leading-tight">{message.text}</span>
                  </div>
                )}
                
                {message?.type === 'success' ? (
                  <div className="w-full py-5 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-lg flex items-center justify-center gap-3 border-2 border-emerald-200 animate-in zoom-in duration-500">
                    <CheckCircle2 size={24} /> {message.text}
                  </div>
                ) : (
                  <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl transition-all ${isSubmitting ? 'bg-slate-200' : 'bg-blue-600 text-white shadow-blue-600/30 active:scale-95 hover:bg-blue-700'}`}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />} {isSubmitting ? 'প্রসেসিং...' : 'ভোট প্রদান নিশ্চিত করুন'}
                  </button>
                )}
              </div>
           </div>
        </form>
      )}

      {activeSubTab === 'poll' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-slate-100 shadow-xl space-y-8">
              <div className="flex items-center gap-3"><div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div><h3 className="text-2xl font-black tracking-tight text-slate-900">পাবলিক পোল ফলাফল</h3></div>
              <p className="text-slate-500 font-bold">{pollQuestion}</p>
              
              {!showResults ? (
                <div className="py-12 bg-slate-50 rounded-3xl flex flex-col items-center gap-3 border-2 border-dashed border-slate-200">
                  <Lock size={32} className="text-slate-400" />
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">ফলাফল লক করা আছে</p>
                  <button onClick={handleViewerVerification} className="text-[10px] font-black text-blue-600 hover:underline">আমি একজন অনুমোদিত পর্যবেক্ষক</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {calculatePollResults.map((res, i) => {
                    const total = calculatePollResults.reduce((a, b) => a + b.value, 0);
                    const pct = total > 0 ? Math.round((res.value / total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-black text-slate-700"><span>{res.label}</span><span>{toBengaliDigits(res.value)} ভোট ({toBengaliDigits(pct)}%)</span></div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div></div>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t border-slate-100"><p className="text-xs font-black text-slate-400 text-center uppercase tracking-widest">সর্বমোট কাস্টকৃত ভোট: {toBengaliDigits(calculatePollResults.reduce((a, b) => a + b.value, 0))}</p></div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl space-y-8">
            <form onSubmit={(e) => handleVoteSubmit(e, 'poll')} className="space-y-8">
              <div className="flex items-center gap-3 text-white"><Vote size={28} className="text-emerald-400" /><h3 className="text-2xl font-black">পোলে অংশগ্রহণ করুন</h3></div>
              <p className="text-slate-400 font-bold">{pollQuestion}</p>
              <div className="space-y-4">
                {pollOptions.map((opt, i) => (
                  <label key={i} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${pollSelection === opt ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`} onClick={() => setPollSelection(opt)}>
                    <span className="font-black">{opt}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${pollSelection === opt ? 'border-white bg-white' : 'border-slate-600'}`}>{pollSelection === opt && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}</div>
                  </label>
                ))}
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">সিক্রেট টোকেন</label>
                <input type="text" placeholder="VOTE-XXXXX" value={voterTokenInput} onChange={(e) => setVoterTokenInput(e.target.value.toUpperCase())} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white font-black text-xl tracking-widest outline-none focus:border-emerald-500" />
              </div>

              <div className="space-y-4 pt-4">
                {message?.type === 'error' && (
                  <div className="p-5 rounded-2xl border-2 animate-in slide-in-from-bottom-2 duration-300 flex items-center gap-4 bg-red-50 border-red-100 text-red-600 shadow-sm">
                    <AlertCircle size={24} className="shrink-0" />
                    <span className="text-[15px] font-black leading-tight">{message.text}</span>
                  </div>
                )}
                
                {message?.type === 'success' ? (
                  <div className="w-full py-5 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-lg flex items-center justify-center gap-3 border-2 border-emerald-200 animate-in zoom-in duration-500">
                    <CheckCircle2 size={24} /> {message.text}
                  </div>
                ) : (
                  <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/40 active:scale-95">
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'ভোট সাবমিট করুন'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'results' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {!showResults ? (
            <LockedResultsView />
          ) : (
            <>
              {calculateElectionResults.map((pos) => (
                <div key={pos.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col">
                  <div className="bg-slate-900 p-6 flex items-center justify-between"><h3 className="text-white font-black text-lg">{pos.title}</h3><div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{toBengaliDigits(allVotes.filter(v => voterList.includes(String((v as any)[pos.id]))).length)} ভোট</div></div>
                  <div className="p-6 space-y-4 flex-1">
                    {pos.results.length > 0 ? pos.results.map((res, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${idx === 0 ? 'bg-emerald-50 border-emerald-100 scale-[1.02]' : 'bg-slate-50 border-slate-100'}`}><div className="flex items-center gap-3">{idx === 0 && <Trophy size={20} className="text-amber-500 animate-bounce" />}<span className={`text-sm font-black ${idx === 0 ? 'text-emerald-900' : 'text-slate-700'}`}>{res.name}</span></div><div className="flex items-center gap-2"><span className="text-lg font-black">{toBengaliDigits(res.votes)}</span><span className="text-[10px] font-black text-slate-400 uppercase">ভোট</span></div></div>
                    )) : <div className="py-12 text-center text-slate-400 font-bold">কোনো ডাটা নেই</div>}
                  </div>
                </div>
              ))}

              <button 
                onClick={() => {
                  const title = prompt("নতুন পদের নাম লিখুন (যেমন: প্রচার সম্পাদক):");
                  if (title && title.trim()) {
                    const newTitle = title.trim();
                    const newId = `p${Date.now()}`;
                    const next = [...activePositions, { id: newId, title: newTitle }];
                    setActivePositions(next);
                    syncConfigToDB({ activePositions: next });
                    setMessage({ type: 'success', text: `নতুন পদ "${newTitle}" যুক্ত করা হয়েছে।` });
                  }
                }}
                className="bg-white border-4 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center min-h-[300px] hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group shadow-lg"
              >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300 shadow-inner">
                  <Plus size={48} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="mt-6 font-black text-slate-500 group-hover:text-blue-700 uppercase tracking-widest text-sm text-center px-4">নতুন নির্বাচনী পদ যোগ করুন</h4>
                <p className="mt-2 text-[10px] font-bold text-slate-400 italic">নতুন পদ যুক্ত করলে তা ব্যালটে দেখা যাবে</p>
              </button>
            </>
          )}
        </div>
      )}

      {activeSubTab === 'admin' && isAdmin && (
        <div className="space-y-8 animate-in zoom-in duration-300">
          {message?.type === 'error' && (
            <div className="p-6 rounded-[2rem] border-2 flex items-center gap-4 bg-red-50 border-red-100 text-red-700 shadow-md">
              <AlertCircle size={32} />
              <span className="text-lg font-black">{message.text}</span>
            </div>
          )}
          
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4 w-full md:w-auto"><div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><ShieldCheck size={32} /></div><div><h3 className="text-2xl font-black text-slate-900">এডমিন কন্ট্রোল প্যানেল</h3><p className="text-slate-500 font-bold">সিস্টেম ম্যানেজমেন্ট ও রিসেট অপশন।</p></div></div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                <button onClick={toggleResultsLock} className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 border transition-all shadow-sm ${isResultsLocked ? 'bg-amber-600 text-white border-amber-700' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                  {isResultsLocked ? <Unlock size={16} /> : <Lock size={16} />} 
                  {isResultsLocked ? 'ফলাফল আনলক করুন' : 'ফলাফল লক করুন'}
                </button>
                <button onClick={clearOnlyVotes} className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-xs flex items-center gap-2 border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"><RotateCcw size={16} /> ফলাফল রিসেট</button>
                <button onClick={clearAllTokens} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-black text-xs flex items-center gap-2 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /> ফ্যাক্টরি রিসেট</button>
                <button onClick={generateTokens} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-purple-700 transition-all"><Plus size={16} /> {toBengaliDigits(voterList.length)}টি টোকেন তৈরি</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Election Positions Management */}
              <div className="pt-6 space-y-6">
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><LayoutGrid size={20} className="text-blue-600" /> নির্বাচনী পদের সেটিংস</h4>
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl space-y-4">
                  <p className="text-[11px] font-bold text-blue-700">এখানে আপনি নির্বাচনের জন্য নতুন পদ যুক্ত করতে পারেন। যেমন: প্রচার সম্পাদক, ক্রীড়া সম্পাদক ইত্যাদি।</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="পদের নাম (যেমন: প্রচার সম্পাদক)" value={newPositionTitle} onChange={e => setNewPositionTitle(e.target.value)} className="flex-1 h-[50px] px-4 bg-white border border-blue-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all text-sm" />
                    <button onClick={handleAddPosition} className="px-4 bg-blue-600 text-white rounded-xl font-black text-xs shadow-md hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 shrink-0">
                      <Plus size={16} /> পদ যুক্ত করুন
                    </button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 no-scrollbar">
                  {activePositions.map((pos, idx) => (
                    <div key={pos.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-6 h-6 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg flex items-center justify-center">{toBengaliDigits(idx + 1)}</span>
                        
                        {editingPositionId === pos.id ? (
                          <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            <input 
                              autoFocus
                              type="text" 
                              value={newPositionEditValue} 
                              onChange={e => setNewPositionEditValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleUpdatePositionTitle(pos.id)}
                              className="flex-1 px-4 h-9 bg-white border-2 border-blue-400 rounded-xl font-black text-slate-800 outline-none shadow-inner text-xs"
                            />
                            <button onClick={() => handleUpdatePositionTitle(pos.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"><Check size={14} strokeWidth={3} /></button>
                            <button onClick={() => setEditingPositionId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"><X size={14} /></button>
                          </div>
                        ) : (
                          <span className="font-black text-slate-700">{pos.title}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        {!editingPositionId && (
                          <button 
                            onClick={() => { setEditingPositionId(pos.id); setNewPositionEditValue(pos.title); }} 
                            className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                            title="পদ এডিট করুন"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button onClick={() => handleRemovePosition(pos.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voter & Permission Management */}
              <div className="pt-6 space-y-6">
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><UserPlus size={20} className="text-emerald-600" /> ভোটার ও পারমিশন ম্যানেজমেন্ট</h4>
                <form onSubmit={(e) => { e.preventDefault(); handleAddVoter(); }} className="flex gap-2">
                  <input type="text" placeholder="নতুন ভোটারের নাম" value={newVoterName} onChange={e => setNewVoterName(e.target.value)} className="flex-1 h-[58px] px-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                  <button type="submit" className="h-[58px] w-[58px] bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center shrink-0">
                    <Plus size={24} />
                  </button>
                </form>
                <div className="max-h-[450px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
                  {voterList.map((voter, idx) => {
                    const authViewer = authorizedViewers.find(v => (typeof v === 'object' ? v.name === voter : v === voter));
                    const isAuthorized = !!authViewer;
                    const accessId = typeof authViewer === 'object' ? authViewer.accessId : null;

                    return (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-3xl group hover:border-emerald-400 transition-all shadow-sm">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            {toBengaliDigits(idx + 1)}
                          </div>
                          
                          {editingVoterName === voter ? (
                            <div className="flex-1 flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                              <input 
                                autoFocus
                                type="text" 
                                value={newVoterEditValue} 
                                onChange={e => setNewVoterEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateVoterName(voter)}
                                className="flex-1 px-4 h-10 bg-white border-2 border-blue-400 rounded-xl font-black text-slate-800 outline-none shadow-inner text-sm"
                              />
                              <button onClick={() => handleUpdateVoterName(voter)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"><Check size={16} strokeWidth={3} /></button>
                              <button onClick={() => setEditingVoterName(null)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><X size={16} /></button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-3">
                                <span className="font-black text-slate-800 text-[15px]">{voter}</span>
                                {isAuthorized && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-sm border border-emerald-200"><Eye size={10} /> Authorized</span>}
                              </div>
                              {isAuthorized && accessId && (
                                <div className="flex items-center gap-2 mt-0.5 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg w-fit shadow-lg animate-in slide-in-from-top-1 duration-300">
                                   <KeyRound size={12} className="text-amber-400" />
                                   <span className="tracking-widest font-mono">ID: {accessId}</span>
                                   <button 
                                      onClick={() => copyToClipboard(accessId)} 
                                      className="ml-2 p-1 hover:bg-slate-700 rounded transition-colors"
                                      title="আইডি কপি করুন"
                                   >
                                      {copiedToken === accessId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                   </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4 md:mt-0 ml-auto">
                          {!editingVoterName && (
                            <button 
                              onClick={() => { setEditingVoterName(voter); setNewVoterEditValue(voter); }} 
                              title="নাম এডিট করুন"
                              className="p-2.5 bg-white text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => toggleViewerPermission(voter)} 
                            title={isAuthorized ? "অনুমতি বাতিল করুন" : "ফলাফল দেখার আইডি জেনারেট করুন"} 
                            className={`p-2.5 rounded-xl transition-all border shadow-sm ${isAuthorized ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-200' : 'bg-white text-slate-400 hover:text-emerald-600 border-slate-200 hover:bg-emerald-50'}`}
                          >
                            {isAuthorized ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button 
                            onClick={() => handleRemoveVoter(voter)} 
                            title="মুছে ফেলুন"
                            className="p-2.5 bg-white text-slate-400 hover:text-red-600 border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-slate-100 pt-8">
                <div className="space-y-6">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><MessageSquare size={20} className="text-indigo-600" /> পাবলিক পোল সেটিংস</h4>
                  <form onSubmit={handlePollUpdate} className="grid grid-cols-1 gap-6">
                     <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">পোলের প্রশ্ন</label><input name="q" defaultValue={pollQuestion} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500" /></div>
                     <div className="space-y-2"><label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">বিকল্পসমূহ (কমা দিয়ে লিখুন)</label><input name="opts" defaultValue={pollOptions.join(', ')} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500" /></div>
                     <div className="flex justify-end"><button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700">পোল আপডেট করুন</button></div>
                  </form>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                  <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Key size={20} className="text-blue-600" /> সিকিউরিটি সেটিংস</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                      <div>
                        <p className="text-sm font-black text-slate-800">রেজাল্ট পাবলিশিং</p>
                        <p className="text-xs font-bold text-slate-500">ফলাফল সবার জন্য উন্মুক্ত রাখা হবে কিনা।</p>
                      </div>
                      <button onClick={toggleResultsLock} className={`w-14 h-7 rounded-full transition-all relative ${isResultsLocked ? 'bg-slate-300' : 'bg-emerald-500'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isResultsLocked ? 'left-1' : 'left-8'}`}></div>
                      </button>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><HelpCircle size={10} /> ইনফো</p>
                      <p className="text-[11px] font-bold text-blue-700">ফলাফল লক থাকা অবস্থায় শুধুমাত্র এডমিন এবং আপনার অনুমোদিত পর্যবেক্ষকরা (Observers) বরাদ্দকৃত ইউনিক আইডি দিয়ে ফলাফল দেখতে পাবেন।</p>
                    </div>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-8 border-t border-slate-100">
              {allTokens.map((t) => (
                <div key={t.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 relative group transition-all ${t.is_used ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg'}`}>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.is_used ? 'ব্যবহৃত' : 'সক্রিয়'}</div>
                  <div className="text-sm font-black text-slate-900 tracking-wider font-mono">{t.token}</div>
                  {!t.is_used && (<button onClick={() => copyToClipboard(t.token)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-purple-600">{copiedToken === t.token ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</button>)}
                  {t.is_used && <div className="absolute inset-0 bg-slate-50/60 rounded-2xl flex items-center justify-center"><CheckCircle2 className="text-emerald-500" size={24} /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingSystem;
