import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Sparkles, FileText, Upload,
  ExternalLink, Trash2, Edit2, Check, RefreshCw, Send,
  ShieldCheck, Clock, Building, Calendar, Hash, Eye, EyeOff,
  Key, Settings, MessageSquare, Smartphone, ArrowRight, Loader2, QrCode
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

interface PendingDoc {
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

export const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  isOpen,
  onClose,
  onDocumentApproved,
  pendingCount,
  onPendingCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'whatsapp_qr' | 'upload' | 'settings'>('pending');
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Edit State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PendingDoc>>({});

  // Direct Ingest / Upload State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archive.org Settings State
  const [archiveConfig, setArchiveConfig] = useState({
    accessKey: '',
    secretKey: '',
    collection: 'opensource_media',
    hasAccessKey: false
  });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // WhatsApp Web QR Connector State
  const [waStatus, setWaStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waUser, setWaUser] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);

  // Load Pending Docs
  const loadPendingDocs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/pending-documents');
      const data = await res.json();
      if (Array.isArray(data.pendingDocuments)) {
        setPendingDocs(data.pendingDocuments);
        onPendingCountChange(data.pendingDocuments.length);
      }
    } catch (e) {
      console.error('Error loading pending documents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Archive Config
  const loadArchiveConfig = async () => {
    try {
      const res = await fetch('/api/agent/archive-config');
      const data = await res.json();
      setArchiveConfig(prev => ({
        ...prev,
        accessKey: data.accessKey || '',
        hasAccessKey: Boolean(data.hasAccessKey),
        collection: data.collection || 'opensource_media'
      }));
    } catch (e) {}
  };

  // Fetch WhatsApp Status
  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/agent/whatsapp-status');
      const data = await res.json();
      setWaStatus(data.status || 'disconnected');
      setWaQrCode(data.qrCodeDataUrl || null);
      setWaUser(data.connectedUser || null);
    } catch (e) {}
  };

  // Trigger WhatsApp Connect
  const handleStartWhatsAppConnect = async () => {
    setWaLoading(true);
    try {
      const res = await fetch('/api/agent/whatsapp-connect', { method: 'POST' });
      const data = await res.json();
      setWaStatus(data.status || 'connecting');
      setWaQrCode(data.qrCodeDataUrl || null);
      setWaUser(data.connectedUser || null);
    } catch (err: any) {
      alert('হোয়াটসঅ্যাপ কানেক্ট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  // Trigger WhatsApp Disconnect
  const handleDisconnectWhatsApp = async () => {
    if (!confirm('আপনি কি হোয়াটসঅ্যাপ সেশন ডিসকানেক্ট করতে চান?')) return;
    setWaLoading(true);
    try {
      const res = await fetch('/api/agent/whatsapp-disconnect', { method: 'POST' });
      const data = await res.json();
      setWaStatus(data.status || 'disconnected');
      setWaQrCode(null);
      setWaUser(null);
    } catch (e) {}
    finally {
      setWaLoading(false);
    }
  };

  // Poll WhatsApp Status when modal is open and on whatsapp_qr tab
  useEffect(() => {
    if (isOpen) {
      loadPendingDocs();
      loadArchiveConfig();
      fetchWhatsAppStatus();
      setProcessSuccess(null);
      setProcessError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any = null;
    if (isOpen) {
      timer = setInterval(() => {
        fetchWhatsAppStatus();
        loadPendingDocs();
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, waStatus]);

  if (!isOpen) return null;

  // Handle Approve
  const handleApprove = async (doc: PendingDoc) => {
    const overrides = editingDocId === doc.id ? editForm : {};
    try {
      const res = await fetch('/api/agent/pending-documents/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, overrides })
      });
      const data = await res.json();
      if (data.success && data.approvedDocument) {
        onDocumentApproved(data.approvedDocument);
        setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
        onPendingCountChange(pendingDocs.length - 1);
        setEditingDocId(null);
      } else {
        alert(data.error || 'অনুমোদনে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      alert('অনুমোদন করা সম্ভব হয়নি: ' + err.message);
    }
  };

  // Handle Reject
  const handleReject = async (id: string) => {
    if (!confirm('আপনি কি এই সার্কুলারটি বাতিল করতে চান?')) return;
    try {
      const res = await fetch('/api/agent/pending-documents/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setPendingDocs(prev => prev.filter(d => d.id !== id));
        onPendingCountChange(pendingDocs.length - 1);
      }
    } catch (e) {}
  };

  // Handle File Process
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessError(null);
    setProcessSuccess(null);
    setProcessingStep('সার্কুলার ফাইলটি লোড করা হচ্ছে...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        setProcessingStep('১/৩: এআই ব্রেন (Gemini) দ্বারা সার্কুলার বিশ্লেষণ ও তথ্য পাঠ...');

        try {
          const res = await fetch('/api/agent/process-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64String,
              fileName: file.name,
              mimeType: file.type || 'application/pdf',
              source: 'direct_upload',
              senderName: 'এডমিন ইনপুট'
            })
          });

          const data = await res.json();
          if (data.success && data.pendingDocument) {
            setProcessingStep('৩/৩: archive.org আপলোড সম্পন্ন ও অপেক্ষমাণ তালিকায় সংরক্ষিত!');
            setProcessSuccess(`"${data.pendingDocument.title}" সফলভাবে অপেক্ষমাণ তালিকায় যোগ হয়েছে।`);
            setPendingDocs(prev => [data.pendingDocument, ...prev]);
            onPendingCountChange(pendingDocs.length + 1);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => {
              setActiveTab('pending');
              setIsProcessing(false);
            }, 1200);
          } else {
            setProcessError(data.error || 'প্রসেসিংয়ে ত্রুটি হয়েছে।');
            setIsProcessing(false);
          }
        } catch (apiErr: any) {
          setProcessError('সার্ভারে যোগাযোগ করা যায়নি: ' + apiErr.message);
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setProcessError('ফাইল পড়তে সমস্যা হয়েছে: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Handle Save Archive Config
  const handleSaveArchiveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await fetch('/api/agent/archive-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey: archiveConfig.accessKey,
          secretKey: archiveConfig.secretKey,
          collection: archiveConfig.collection
        })
      });
      const data = await res.json();
      if (data.success) {
        setArchiveConfig(prev => ({
          ...prev,
          hasAccessKey: data.hasAccessKey,
          secretKey: ''
        }));
        setConfigSuccess(true);
        setTimeout(() => setConfigSuccess(false), 3000);
      }
    } catch (e) {
      alert('Archive.org কনফিগারেশন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">
                  এআই এজেন্ট: স্বয়ংক্রিয় সার্কুলার প্রসেসর ও অনুমোদন
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  উপায় ১ সক্রিয়
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                হোয়াটসঅ্যাপ গ্রুপের সার্কুলার স্বয়ংক্রিয়ভাবে archive.org-এ আপলোড হয়ে এখানে জমা হবে। আপনি শুধু অনুমোদন দেবেন।
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
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
              অপেক্ষমাণ সার্কুলার
              {pendingDocs.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'pending' ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                }`}>
                  {toBengaliDigits(pendingDocs.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('whatsapp_qr')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'whatsapp_qr'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <QrCode size={14} />
              হোয়াটসঅ্যাপ কানেক্ট (QR কোড)
              {waStatus === 'connected' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Upload size={14} />
              ম্যানুয়াল ফাইল টেস্ট
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Settings size={14} />
              Archive.org সেটিংস
            </button>
          </div>

          <button
            onClick={() => { loadPendingDocs(); fetchWhatsAppStatus(); }}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200 shrink-0 ml-2"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
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
                    আপনার হোয়াটসঅ্যাপ লিঙ্ক করা থাকলে গ্রুপে কোনো সার্কুলার আসার সাথে সাথেই তা এআই দ্বারা স্বয়ংক্রিয়ভাবে পড়ে archive.org-এ আপলোড হয়ে এখানে জমা হবে। আপনি শুধু অনুমোদন দেবেন।
                  </p>
                  <button
                    onClick={() => setActiveTab('whatsapp_qr')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <QrCode size={15} /> হোয়াটসঅ্যাপ কিউআর কোড স্ক্যান করুন
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
                              উৎস: {doc.senderName || 'WhatsApp'}
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

          {/* TAB 2: WHATSAPP QR CODE SCANNER CONNECTOR */}
          {activeTab === 'whatsapp_qr' && (
            <div className="space-y-6">
              {waStatus === 'connected' ? (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-200 text-emerald-800 uppercase tracking-wider">
                      সংযোগ সক্রিয় আছে (Live Connected)
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">
                      হোয়াটসঅ্যাপ সফলভাবে সার্ভারে লিঙ্ক করা আছে!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                      আপনার সংযুক্ত অ্যাকাউন্টের গ্রুপগুলোতে যখনই কোনো সরকারি আদেশ, সার্কুলার বা গেজেট ফাইল পোস্ট করা হবে, ব্যাকগ্রাউন্ড লিসেনার তা স্বয়ংক্রিয়ভাবে ডাউনলোড করে archive.org-এ আপলোড সম্পন্ন করে রাখবে।
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-emerald-200 max-w-sm mx-auto text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>সংযুক্ত আইডি:</span>
                    <span className="text-emerald-700 font-mono font-black">{waUser || 'Admin Device'}</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={waLoading}
                      className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition-all border border-rose-200 cursor-pointer"
                    >
                      {waLoading ? 'ডিসকানেক্ট হচ্ছে...' : 'হোয়াটসঅ্যাপ সংযোগ বিচ্ছিন্ন (Logout) করুন'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                      <QrCode size={28} />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      গ্রুপের সার্কুলার অটো-রিসিভ করতে হোয়াটসঅ্যাপ লিঙ্ক করুন
                    </h3>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                      কম্পিউটারে যেমন WhatsApp Web চালান, ঠিক তেমনি নিচে তৈরি হওয়া QR কোডটি আপনার মোবাইলের WhatsApp দিয়ে একবার স্ক্যান করে নিন। এরপর থেকে গ্রুপের সব সার্কুলার নিজে নিজেই জমা হবে।
                    </p>
                  </div>

                  {waQrCode ? (
                    <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 max-w-sm mx-auto text-center shadow-xl space-y-4 animate-in zoom-in-95">
                      <div className="p-2 bg-slate-50 rounded-2xl inline-block border border-slate-200">
                        <img 
                          src={waQrCode} 
                          alt="WhatsApp Web QR Code" 
                          className="w-64 h-64 mx-auto rounded-xl shadow-sm"
                        />
                      </div>

                      <div className="space-y-1.5 text-left text-xs font-bold text-slate-700 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-emerald-900 font-black mb-1">কীভাবে স্ক্যান করবেন:</p>
                        <p className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">১</span>
                          আপনার মোবাইলে WhatsApp অ্যাপ খুলুন।
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">২</span>
                          ওপরের তিনটি ডট (⋮) বা Settings থেকে <strong>Linked Devices</strong> সিলেক্ট করুন।
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-black">৩</span>
                          <strong>Link a Device</strong> চাপুন এবং এই কিউআর কোডটি স্ক্যান করুন।
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
                        <Loader2 size={14} className="animate-spin text-emerald-600" />
                        <span>স্ক্যান করার অপেক্ষায়...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <button
                        type="button"
                        onClick={handleStartWhatsAppConnect}
                        disabled={waLoading}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        {waLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            কিউআর কোড জেনারেট হচ্ছে...
                          </>
                        ) : (
                          <>
                            <QrCode size={18} />
                            কিউআর কোড (QR Code) তৈরি করুন
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed font-medium">
                    <span className="font-black text-blue-950">নিরাপত্তা ও গোপনীয়তা:</span> এই সংযোগটি শুধুমাত্র নির্দিষ্ট গ্রুপে আসা সার্কুলার এবং অফিসিয়াল পিডিএফ ফাইলগুলো পর্যবেক্ষণ ও স্বয়ংক্রিয়ভাবে archive.org-এ ব্যাকআপ নেওয়ার কাজে ব্যবহার করা হয়। অন্য কোনো ব্যক্তিগত চ্যাটে এটি কোনো প্রকার হস্তক্ষেপ করে না।
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIRECT TEST UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-blue-200 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Upload size={28} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-1">
                    সার্কুলার ফাইল ড্রপ করুন (ম্যানুয়াল টেস্ট অপশন)
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    আপনার কাছে কোনো সার্কুলার ফাইল থাকলে তা সরাসরি এখানে ড্রপ করেও টেস্ট করতে পারেন। এআই সাথে সাথে পড়ে archive.org-এ আপলোড সম্পন্ন করে দেবে।
                  </p>
                </div>

                <div className="pt-2">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="agent-file-upload"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="agent-file-upload"
                    className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all cursor-pointer ${
                      isProcessing ? 'opacity-50 pointer-events-none' : 'active:scale-95'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        প্রসেস হচ্ছে...
                      </>
                    ) : (
                      <>
                        <FileText size={16} /> সার্কুলার ফাইল সিলেক্ট করুন
                      </>
                    )}
                  </label>
                </div>

                {isProcessing && (
                  <div className="max-w-md mx-auto p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-xs font-black text-blue-700">
                      <Sparkles size={14} className="animate-spin" />
                      <span>{processingStep}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {processSuccess && (
                  <div className="max-w-md mx-auto p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{processSuccess}</span>
                  </div>
                )}

                {processError && (
                  <div className="max-w-md mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{processError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHIVE.ORG SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Key size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-900 mb-1">Archive.org S3 ক্রেডেনশিয়ালস</h4>
                  <p className="text-[11.5px] text-purple-700 font-medium leading-relaxed">
                    সিস্টেমটি সম্পূর্ণভাবে `archive.org`-এর সাথে সংযুক্ত। আপনি যদি আপনার ব্যক্তিগত archive.org অ্যাকাউন্টে স্বয়ংক্রিয় আপলোড করতে চান, তবে আপনার সম্পূর্ণ ফ্রি S3 Access Key ও Secret Key টি নিচে সংরক্ষণ করুন।
                  </p>
                  <a 
                    href="https://archive.org/account/s3.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-black text-purple-800 underline underline-offset-2 mt-2"
                  >
                    <ExternalLink size={12} /> archive.org/account/s3.php থেকে আপনার কী (Key) সংগ্রহ করুন
                  </a>
                </div>
              </div>

              <form onSubmit={handleSaveArchiveConfig} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">S3 Access Key:</label>
                  <input 
                    type="text"
                    value={archiveConfig.accessKey}
                    onChange={e => setArchiveConfig(prev => ({ ...prev, accessKey: e.target.value }))}
                    placeholder="আপনার archive.org access key লিখুন..."
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">S3 Secret Key:</label>
                  <input 
                    type="password"
                    value={archiveConfig.secretKey}
                    onChange={e => setArchiveConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder={archiveConfig.hasAccessKey ? "পূর্বে সংরক্ষিত কী বিদ্যমান (পরিবর্তন করতে চাইলে লিখুন)" : "আপনার secret key লিখুন..."}
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">ডিফল্ট কালেকশন (Collection):</label>
                  <input 
                    type="text"
                    value={archiveConfig.collection}
                    onChange={e => setArchiveConfig(prev => ({ ...prev, collection: e.target.value }))}
                    placeholder="opensource_media"
                    className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-xs outline-none focus:border-blue-500 bg-slate-50 font-mono"
                  />
                </div>

                {configSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Archive.org ক্রেডেনশিয়ালস সফলভাবে সংরক্ষিত হয়েছে!</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={configSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {configSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>এডমিনের চূড়ান্ত অনুমোদন ছাড়া কোনো ডকুমেন্ট সরাসরি ভল্টে দৃশ্যমান হবে না।</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
