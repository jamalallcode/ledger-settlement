import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Sparkles, FileText, Upload,
  ExternalLink, Trash2, Edit2, Check, RefreshCw, Send,
  ShieldCheck, Clock, Building, Calendar, Hash, Eye, EyeOff,
  Key, Settings, MessageSquare, Smartphone, ArrowRight, Loader2, QrCode, Link2, ArrowLeft
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface PendingDoc {
  id: string;
  title: string;
  category: string;
  archiveId: string;
  archiveUrl: string;
  docDate: string;
  memoNo: string;
  authority: string;
  description: string;
  tags?: string;
  originalFileName?: string;
  source?: string;
  senderName?: string;
  status: 'pending';
  createdAt: string;
}

interface AgentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentApproved: (doc: any) => void;
  pendingCount: number;
  onPendingCountChange: (count: number) => void;
}

const extractCleanId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/archive\.org\/(?:details|embed|download|stream)\/([^/?#]+)/i);
  if (match && match[1]) return match[1].trim();
  return trimmed.replace(/^https?:\/\/.*archive\.org\//i, '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
};

export const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  isOpen,
  onClose,
  onDocumentApproved,
  pendingCount,
  onPendingCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'fast_ingest' | 'archive_guide'>('pending');
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Edit State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PendingDoc>>({});

  // Fast Ingest Form State
  const [ingestForm, setIngestForm] = useState({
    title: '',
    category: 'সার্কুলার',
    archiveIdOrLink: '',
    authority: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
    memoNo: '',
    docDate: new Date().toISOString().split('T')[0],
    description: '',
    source: 'WhatsApp / Messenger'
  });
  const [isSubmittingIngest, setIsSubmittingIngest] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Pending Docs from Supabase & LocalStorage
  const loadPendingDocs = async () => {
    setIsLoading(true);
    let list: PendingDoc[] = [];

    // 1. Local Storage
    try {
      const saved = localStorage.getItem('pending_audit_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      }
    } catch (e) {}

    // 2. Supabase Cloud Sync
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('settlement_entries')
          .select('*')
          .like('id', 'pending_doc_%');

        if (!error && Array.isArray(data)) {
          const remoteList: PendingDoc[] = [];
          data.forEach((row: any) => {
            try {
              const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
              if (parsed && parsed.id) remoteList.push(parsed);
            } catch (e) {}
          });

          // Merge by ID
          const map = new Map<string, PendingDoc>();
          list.forEach(d => map.set(d.id, d));
          remoteList.forEach(d => map.set(d.id, d));
          list = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          localStorage.setItem('pending_audit_documents', JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Supabase pending docs error:', e);
      }
    }

    setPendingDocs(list);
    onPendingCountChange(list.length);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadPendingDocs();
      setIngestSuccess(null);
      setIngestError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Approve
  const handleApprove = async (doc: PendingDoc) => {
    const overrides = editingDocId === doc.id ? editForm : {};
    const finalDoc = {
      ...doc,
      ...(overrides || {}),
      id: `doc_${Date.now()}`,
      status: 'approved' as const,
      uploadedBy: 'Admin (Approved)',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save approved document to Supabase
      if (isSupabaseConfigured) {
        await supabase.from('settlement_entries').upsert({
          id: finalDoc.id,
          content: JSON.stringify(finalDoc),
          created_at: finalDoc.createdAt
        });
        // 2. Delete pending from Supabase
        await supabase.from('settlement_entries').delete().eq('id', doc.id);
      }

      // 3. Update Local Storage
      const currentPending = JSON.parse(localStorage.getItem('pending_audit_documents') || '[]')
        .filter((d: any) => d.id !== doc.id);
      localStorage.setItem('pending_audit_documents', JSON.stringify(currentPending));

      const currentDocs = JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]');
      const updatedDocs = [finalDoc, ...currentDocs.filter((d: any) => d.id !== finalDoc.id)];
      localStorage.setItem('audit_criteria_documents', JSON.stringify(updatedDocs));

      // 4. Notify parent state
      onDocumentApproved(finalDoc);
      setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
      onPendingCountChange(pendingDocs.length - 1);
      setEditingDocId(null);
    } catch (err: any) {
      alert('অনুমোদন সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Handle Reject
  const handleReject = async (id: string) => {
    if (!confirm('আপনি কি এই সার্কুলারটি বাতিল করতে চান?')) return;
    try {
      if (isSupabaseConfigured) {
        await supabase.from('settlement_entries').delete().eq('id', id);
      }
      const updated = pendingDocs.filter(d => d.id !== id);
      setPendingDocs(updated);
      localStorage.setItem('pending_audit_documents', JSON.stringify(updated));
      onPendingCountChange(updated.length);
    } catch (e) {
      console.error('Reject error:', e);
    }
  };

  // Fast Ingest Submission
  const handleFastIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.title.trim()) {
      setIngestError('অনুগ্রহ করে সার্কুলারের শিরোনাম বা বিষয় লিখুন।');
      return;
    }

    setIsSubmittingIngest(true);
    setIngestError(null);
    setIngestSuccess(null);

    const cleanId = extractCleanId(ingestForm.archiveIdOrLink) || `bd_circular_${Date.now()}`;
    const pendingDoc: PendingDoc = {
      id: `pending_doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: ingestForm.title.trim(),
      category: ingestForm.category || 'সার্কুলার',
      archiveId: cleanId,
      archiveUrl: `https://archive.org/details/${cleanId}`,
      docDate: ingestForm.docDate || new Date().toISOString().split('T')[0],
      memoNo: ingestForm.memoNo.trim(),
      authority: ingestForm.authority.trim() || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
      description: ingestForm.description.trim() || 'হোয়াটসঅ্যাপ/মেসেঞ্জার গ্রুপ থেকে সংগৃহীত সার্কুলার।',
      source: ingestForm.source || 'WhatsApp/Messenger',
      senderName: 'এডমিন ইনজেস্ট',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      // Save to Supabase
      if (isSupabaseConfigured) {
        await supabase.from('settlement_entries').upsert({
          id: pendingDoc.id,
          content: JSON.stringify(pendingDoc),
          created_at: pendingDoc.createdAt
        });
      }

      // Save to LocalStorage
      const updated = [pendingDoc, ...pendingDocs];
      setPendingDocs(updated);
      localStorage.setItem('pending_audit_documents', JSON.stringify(updated));
      onPendingCountChange(updated.length);

      setIngestSuccess(`"${pendingDoc.title}" সফলভাবে অপেক্ষমাণ তালিকায় জমা হয়েছে!`);
      setIngestForm({
        title: '',
        category: 'সার্কুলার',
        archiveIdOrLink: '',
        authority: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
        memoNo: '',
        docDate: new Date().toISOString().split('T')[0],
        description: '',
        source: 'WhatsApp / Messenger'
      });

      setTimeout(() => {
        setActiveTab('pending');
        setIngestSuccess(null);
      }, 1000);
    } catch (err: any) {
      setIngestError('সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setIsSubmittingIngest(false);
    }
  };

  // Fast Ingest via File Picker (Automatic naming & archive ID)
  const handleFastIngestFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const autoArchiveId = `bd_audit_${file.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25)}_${Date.now()}`;

    setIngestForm(prev => ({
      ...prev,
      title: rawTitle,
      archiveIdOrLink: autoArchiveId,
      description: `ফাইল: ${file.name} (আকার: ${(file.size / 1024).toFixed(1)} KB)`
    }));

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-black text-xs rounded-xl transition-all cursor-pointer border border-slate-200 hover:border-blue-200 active:scale-95 shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>অডিট ক্রাইটেরিয়া ভল্টে ফিরে যান</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-slate-400">অডিট ক্রাইটেরিয়া ভল্ট</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-black flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            সার্কুলার প্রসেসর ও অনুমোদন হাব
          </span>
        </div>
      </div>

      {/* Main Page Container - 100% Full Width */}
      <div className="bg-white rounded-2xl shadow-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Page Header Banner */}
        <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                  সার্কুলার প্রসেসর ও অনুমোদন হাব
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  সুপাবেজ ক্লাউড সংযুক্ত
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                হোয়াটসঅ্যাপ ও মেসেঞ্জারের সার্কুলার এখানে অপেক্ষমাণ তালিকায় জমা থাকে। এডমিন অনুমোদন দিলে তা মূল ভল্টে প্রকাশিত হয়।
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center gap-2 text-xs font-bold transition-all cursor-pointer border border-white/10"
            title="ভল্টে ফিরে যান"
          >
            <ArrowLeft size={14} />
            <span>ভল্টে ফিরুন</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-2.5 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock size={14} />
              অপেক্ষমাণ সার্কুলার তালিকা
              {pendingDocs.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'pending' ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                }`}>
                  {toBengaliDigits(pendingDocs.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fast_ingest')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'fast_ingest'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <Smartphone size={14} />
              ১-ক্লিক সার্কুলার ইনপুট / শেয়ার
            </button>

            <button
              onClick={() => setActiveTab('archive_guide')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'archive_guide'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Key size={14} />
              Archive.org গাইড ও সহায়তা
            </button>
          </div>

          <button
            onClick={loadPendingDocs}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0 ml-2"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Page Body */}
        <div className="p-6 md:p-8 space-y-6 w-full">
          
          {/* TAB 1: PENDING DOCUMENTS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingDocs.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-base font-black text-slate-800 mb-1">বর্তমানে কোনো অপেক্ষমাণ সার্কুলার নেই!</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mb-5 leading-relaxed">
                    হোয়াটসঅ্যাপ বা মেসেঞ্জারের কোনো সার্কুলার লিঙ্ক বা ফাইল ২য় ট্যাবে দিয়ে দিলে তা সাথে সাথে এখানে জমা হয়ে যাবে। আপনি শুধু দেখে অনুমোদন দেবেন।
                  </p>
                  <button
                    onClick={() => setActiveTab('fast_ingest')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Smartphone size={15} /> নতুন সার্কুলার ইনপুট করুন
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1">
                    <span>মোট অপেক্ষমাণ সার্কুলার: <strong className="text-blue-700 font-black">{toBengaliDigits(pendingDocs.length)} টি</strong></span>
                    <span className="text-[11px] text-slate-400">অনুমোদনের পর এটি সাথে সাথে অডিট ক্রাইটেরিয়া লাইব্রেরিতে যুক্ত হবে</span>
                  </div>

                  {pendingDocs.map((doc) => {
                    const isEditing = editingDocId === doc.id;
                    const isPreviewing = previewId === doc.id;

                    return (
                      <div 
                        key={doc.id}
                        className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative"
                      >
                        {/* Top Badges & Source */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                              {doc.category || 'সার্কুলার'}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Clock size={10} /> এডমিন অনুমোদন প্রয়োজন
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                              <Smartphone size={12} className="text-emerald-600" />
                              উৎস: {doc.source || 'WhatsApp/Messenger'}
                            </span>
                          </div>
                        </div>

                        {/* Document Info */}
                        {isEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <div>
                              <label className="text-[11px] font-black text-slate-600 block mb-1">সার্কুলারের বিষয় / শিরোনাম:</label>
                              <input 
                                type="text"
                                value={editForm.title ?? doc.title}
                                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[11px] font-black text-slate-600 block mb-1">মন্ত্রণালয় / কর্তৃপক্ষ:</label>
                                <input 
                                  type="text"
                                  value={editForm.authority ?? doc.authority}
                                  onChange={e => setEditForm(prev => ({ ...prev, authority: e.target.value }))}
                                  className="w-full px-3 py-2 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-black text-slate-600 block mb-1">স্মারক নম্বর:</label>
                                <input 
                                  type="text"
                                  value={editForm.memoNo ?? doc.memoNo}
                                  onChange={e => setEditForm(prev => ({ ...prev, memoNo: e.target.value }))}
                                  className="w-full px-3 py-2 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-black text-slate-600 block mb-1">জারির তারিখ:</label>
                                <input 
                                  type="date"
                                  value={editForm.docDate ?? doc.docDate}
                                  onChange={e => setEditForm(prev => ({ ...prev, docDate: e.target.value }))}
                                  className="w-full px-3 py-2 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                              {doc.title}
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Building size={13} className="text-slate-400 shrink-0" />
                                <span className="font-bold truncate" title={doc.authority || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার'}>
                                  {doc.authority || 'বাংলাদেশ সরকার'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Hash size={13} className="text-slate-400 shrink-0" />
                                <span className="font-bold truncate" title={doc.memoNo || 'স্মারক নং অপ্রাপ্ত'}>
                                  স্মারক: {doc.memoNo || 'অপ্রাপ্ত'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-slate-400 shrink-0" />
                                <span className="font-bold">
                                  তারিখ: {doc.docDate || 'অনির্দিষ্ট'}
                                </span>
                              </div>
                            </div>

                            {doc.description && (
                              <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed italic">
                                “{doc.description}”
                              </p>
                            )}

                            {/* Archive.org Link Badge */}
                            <div className="flex items-center justify-between text-xs pt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Archive.org আইডি:</span>
                                <code className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-bold border border-purple-200">
                                  {doc.archiveId}
                                </code>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewId(isPreviewing ? null : doc.id)}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                >
                                  {isPreviewing ? <EyeOff size={12} /> : <Eye size={12} />}
                                  {isPreviewing ? 'প্রিভিউ বন্ধ করুন' : 'ডকুমেন্ট প্রিভিউ'}
                                </button>
                                <a 
                                  href={`https://archive.org/details/${doc.archiveId}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <ExternalLink size={12} /> ভিউয়ারে দেখুন
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Embed Preview if active */}
                        {isPreviewing && (
                          <div className="mt-3 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-80 transition-all">
                            <iframe 
                              src={`https://archive.org/embed/${doc.archiveId}`}
                              className="w-full h-full border-0"
                              title="Archive Document Preview"
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDocId(null);
                                  setEditForm({});
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                              >
                                বাতিল
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(doc)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                              >
                                <Check size={14} /> আপডেট ও সরাসরি অনুমোদন দিন
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReject(doc.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 border border-transparent hover:border-rose-200"
                              >
                                <Trash2 size={13} /> বাতিল
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDocId(doc.id);
                                  setEditForm({
                                    title: doc.title,
                                    authority: doc.authority,
                                    memoNo: doc.memoNo,
                                    docDate: doc.docDate
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1 border border-slate-200"
                              >
                                <Edit2 size={13} /> এডিট
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(doc)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                              >
                                <CheckCircle2 size={14} /> অনুমোদন দিন (ভল্টে প্রকাশ করুন)
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAST INGEST / 1-CLICK MOBILE SHARE */}
          {activeTab === 'fast_ingest' && (
            <div className="space-y-6">
              
              {/* Quick file drop */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-3xl border-2 border-dashed border-emerald-300 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Smartphone size={26} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">
                    মোবাইল ফাইল বা সার্কুলার সিলেক্ট করুন
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    হোয়াটসঅ্যাপ বা মেসেঞ্জার থেকে পাওয়া যেকোনো সার্কুলার ফাইল (PDF বা ছবি) বাছলে স্বয়ংক্রিয়ভাবে নাম ও আইডি তৈরি হয়ে যাবে।
                  </p>
                </div>

                <div className="pt-1">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,image/*"
                    onChange={handleFastIngestFile}
                    className="hidden"
                    id="fast-ingest-file"
                  />
                  <label
                    htmlFor="fast-ingest-file"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Upload size={14} /> ফাইল থেকে অটো-পূরণ করুন
                  </label>
                </div>
              </div>

              {/* Ingest Form */}
              <form onSubmit={handleFastIngestSubmit} className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">১</span>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    সার্কুলারের তথ্য প্রদান করুন
                  </h4>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">সার্কুলারের বিষয় / শিরোনাম *:</label>
                  <input 
                    type="text"
                    required
                    value={ingestForm.title}
                    onChange={e => setIngestForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="যেমন: সরকারি কর্মকর্তা-কর্মচারীদের বিশেষ প্রণোদনা সংক্রান্ত সার্কুলার..."
                    className="w-full px-4 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">ক্যাটাগরি:</label>
                    <select
                      value={ingestForm.category}
                      onChange={e => setIngestForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                    >
                      <option value="সার্কুলার">সার্কুলার</option>
                      <option value="গেজেট">গেজেট</option>
                      <option value="আদেশ">আদেশ</option>
                      <option value="নীতিমালা">নীতিমালা</option>
                      <option value="আইন">আইন</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">মন্ত্রণালয় / কর্তৃপক্ষ:</label>
                    <input 
                      type="text"
                      value={ingestForm.authority}
                      onChange={e => setIngestForm(prev => ({ ...prev, authority: e.target.value }))}
                      placeholder="যেমন: অর্থ মন্ত্রণালয়"
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">স্মারক নম্বর (ঐচ্ছিক):</label>
                    <input 
                      type="text"
                      value={ingestForm.memoNo}
                      onChange={e => setIngestForm(prev => ({ ...prev, memoNo: e.target.value }))}
                      placeholder="যেমন: ০৭.০০.০০০০..."
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">জারির তারিখ:</label>
                    <input 
                      type="date"
                      value={ingestForm.docDate}
                      onChange={e => setIngestForm(prev => ({ ...prev, docDate: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block flex items-center justify-between">
                    <span>Archive.org লিঙ্ক বা আইডি:</span>
                    <span className="text-[10px] text-slate-400 font-medium">খালি রাখলে স্বয়ংক্রিয় আইডি বসবে</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={ingestForm.archiveIdOrLink}
                      onChange={e => setIngestForm(prev => ({ ...prev, archiveIdOrLink: e.target.value }))}
                      placeholder="https://archive.org/details/your_file_id অথবা শুধু আইডি"
                      className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50"
                    />
                    <Link2 size={15} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">সংক্ষিপ্ত বিবরণ / নোট:</label>
                  <textarea 
                    value={ingestForm.description}
                    onChange={e => setIngestForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="সার্কুলারের প্রয়োজনীয় বিবরণ বা গ্রুপ থেকে কপি করা টেক্সট..."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-emerald-500 bg-slate-50 min-h-[70px]"
                  />
                </div>

                {ingestSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{ingestSuccess}</span>
                  </div>
                )}

                {ingestError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{ingestError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingIngest}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {isSubmittingIngest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    অপেক্ষমাণ তালিকায় জমা করুন (অনুমোদনের জন্য)
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 3: ARCHIVE.ORG GUIDE */}
          {activeTab === 'archive_guide' && (
            <div className="space-y-5">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-900">Archive.org (ইন্টারনেট আর্কাইভ) লাইব্রেরি গাইড</h4>
                    <p className="text-[11px] text-purple-700 font-medium">ফাইল নিজস্ব ডাটাবেজে ভারী না রেখে archive.org-এ সংরক্ষণ করার নিয়ম:</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-purple-950 font-medium bg-white p-4 rounded-xl border border-purple-100 leading-relaxed">
                  <p>১. <strong>archive.org</strong>-এ যেকোনো সরকারি সার্কুলার আপলোড করার পর যে লিংকটি পাওয়া যায় (যেমন: <code>https://archive.org/details/bd_circular_2026</code>), সেটির আইডি হলো <code>bd_circular_2026</code>।</p>
                  <p>২. আপনি মোবাইল থেকে সেই লিংকটি কপি করে ২য় ট্যাবে বসালেই সিস্টেম সেটিকে সনাক্ত করে আপনার অপেক্ষমাণ তালিকায় এনে রাখবে।</p>
                  <p>৩. এরপর আপনি শুধু <strong>[অনুমোদন দিন]</strong> চাপলেই এটি স্থায়ীভাবে ক্রাইটেরিয়া ভল্টে ঢুকে যাবে।</p>
                </div>

                <div className="pt-1">
                  <a 
                    href="https://archive.org/upload" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-md"
                  >
                    <ExternalLink size={13} /> archive.org/upload এ যান
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Page Footer */}
        <div className="px-6 md:px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>এডমিনের চূড়ান্ত অনুমোদন ছাড়া কোনো ডকুমেন্ট সরাসরি ভল্টে দৃশ্যমান হবে না।</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>অডিট ক্রাইটেরিয়া ভল্টে ফিরে যান</span>
          </button>
        </div>

      </div>
    </div>
  );
};
