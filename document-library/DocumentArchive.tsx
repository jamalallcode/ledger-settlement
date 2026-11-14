import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, signInWithGoogle } from '../lib/supabase';
import { ArchiveDoc } from '../types';
import { 
  Library, Search, Filter, Plus, FileText, Calendar, 
  ExternalLink, Trash2, LayoutGrid, List, X, Edit2,
  ChevronRight, BookOpen, Clock, Eye, Loader2, Sparkles, AlertCircle,
  Lock, CheckCircle2, XCircle, CreditCard, Gift, Zap, MessageSquare, Mail, UserCheck, FileSearch, MessageSquarePlus, Send, KeyRound, Smartphone, AlertTriangle, Upload, Download, RefreshCw
} from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';
import { UnlockStatusModal } from './UnlockStatusModal';
import { PendingDocsModal } from './PendingDocsModal';
import { AgentApprovalModal } from './AgentApprovalModal';
import { recordVisitorLog, isValidIdentifier } from './visitorTracker';
import { checkCurrentDeviceUnlock, verifyAndActivatePin, deactivateCurrentDevicePin } from '../utils/pinManager';
import {
  analyzeDocumentWithAI,
  summarizeDocumentWithAI,
  uploadToArchiveWithSmartRetry,
  DocumentKeyTakeaway,
  DuplicateMatchInfo,
  ExistingDocCheckItem
} from './aiDocumentAnalyzer';

interface ExtendedArchiveDoc extends ArchiveDoc {
  memoNo?: string;
  authority?: string;
  tags?: string;
  originalFileName?: string;
  archiveDownloadUrl?: string;
  status?: 'approved' | 'pending' | 'rejected';
  uploadedBy?: string;
  fileData?: string;
  keyTakeaway?: DocumentKeyTakeaway;
}

const DEMO_DOC_IDS = ['doc_101', 'doc_102', 'doc_103', 'doc_104', 'doc_105', 'doc_106'];

const stripFileDataFromDocs = (docs: ExtendedArchiveDoc[]): ExtendedArchiveDoc[] =>
  docs.map(({ fileData: _omit, ...rest }) => rest);

const DocumentCardThumbnail: React.FC<{
  doc: ExtendedArchiveDoc;
  isDocUnlocked: boolean;
  cleanId: string;
  sessionPreviewUrl?: string;
}> = ({ doc, isDocUnlocked, cleanId, sessionPreviewUrl }) => {
  const [thumbStage, setThumbStage] = useState<'primary' | 'download' | 'fallback'>('primary');

  const localOrSessionImg =
    (sessionPreviewUrl && sessionPreviewUrl.startsWith('data:image/') ? sessionPreviewUrl : '') ||
    (doc.fileData && (doc.fileData.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)/i.test(doc.fileData)) ? doc.fileData : '');

  const isOriginalImage = Boolean(doc.originalFileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalFileName));
  const downloadImgSrc =
    cleanId && isOriginalImage && doc.originalFileName
      ? `https://archive.org/download/${cleanId}/${encodeURIComponent(doc.originalFileName)}`
      : '';

  useEffect(() => {
    setThumbStage('primary');
  }, [doc.id, cleanId, localOrSessionImg, downloadImgSrc]);

  const primarySrc = localOrSessionImg || (cleanId ? `https://archive.org/services/img/${cleanId}` : downloadImgSrc);
  const activeSrc =
    thumbStage === 'primary'
      ? primarySrc
      : thumbStage === 'download'
      ? downloadImgSrc
      : '';

  if (thumbStage === 'fallback' || !activeSrc) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 p-4 flex flex-col justify-between border-b border-slate-100 select-none relative overflow-hidden ${!isDocUnlocked ? 'blur-[1.5px]' : ''}`}>
        <div className="flex items-center justify-between z-10">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
            <FileText size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider bg-white/95 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {doc.category || 'সার্কুলার'}
          </span>
        </div>

        <div className="my-auto py-2 text-center space-y-1.5 z-10 px-1">
          <p className="text-xs font-black text-slate-800 leading-snug line-clamp-3">
            {doc.title}
          </p>
          {doc.authority && (
            <p className="text-[10px] font-bold text-slate-500 truncate">
              {doc.authority}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-400 border-t border-slate-200/80 pt-2 z-10">
          <span className="truncate max-w-[110px]">{doc.memoNo ? `স্মারক: ${doc.memoNo}` : 'সরকারি সার্কুলার'}</span>
          <span>{doc.docDate || ''}</span>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={activeSrc} 
      alt={doc.title}
      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isDocUnlocked ? 'blur-[1.5px] opacity-75' : ''}`}
      onError={() => {
        if (thumbStage === 'primary' && downloadImgSrc && activeSrc !== downloadImgSrc) {
          setThumbStage('download');
        } else {
          setThumbStage('fallback');
        }
      }}
    />
  );
};

const createBlobUrlFromDataUrl = (dataUrl: string): string | null => {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const body = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/i);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const isBase64 = /;base64/i.test(header);

    let byteArray: Uint8Array<ArrayBuffer>;
    if (isBase64) {
      const byteChars = atob(body.replace(/\s/g, ''));
      byteArray = new Uint8Array(new ArrayBuffer(byteChars.length));
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
    } else {
      const decoded = decodeURIComponent(body);
      const encoded = new TextEncoder().encode(decoded);
      byteArray = new Uint8Array(new ArrayBuffer(encoded.length));
      byteArray.set(encoded);
    }
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Blob URL conversion failed:', e);
    return null;
  }
};

const DocumentArchive: React.FC<{ isAdmin?: boolean; userEmail?: string | null }> = ({ isAdmin = false, userEmail = null }) => {
  const [documents, setDocuments] = useState<ExtendedArchiveDoc[]>(() => {
    try {
      const saved = localStorage.getItem('audit_criteria_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter((d: any) => d && !DEMO_DOC_IDS.includes(d.id));
          localStorage.setItem('audit_criteria_documents', JSON.stringify(userOnly));
          return userOnly;
        }
      }
    } catch (e) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExtendedArchiveDoc | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ExtendedArchiveDoc | null>(null);
  const [sessionPreviewMap, setSessionPreviewMap] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [archiveImgError, setArchiveImgError] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [showKeyTakeaway, setShowKeyTakeaway] = useState(false);
  const [isSummarizingDocId, setIsSummarizingDocId] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const keyTakeawayRef = useRef<HTMLDivElement>(null);

  // Sticky Filter Bar Measurement
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState<number>(140);

  useEffect(() => {
    const updateHeight = () => {
      if (filterBarRef.current) {
        setFilterBarHeight(filterBarRef.current.offsetHeight);
      }
    };
    updateHeight();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && filterBarRef.current) {
      observer = new ResizeObserver(updateHeight);
      observer.observe(filterBarRef.current);
    }
    window.addEventListener('resize', updateHeight);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Document Feedback Modal State
  const [feedbackDoc, setFeedbackDoc] = useState<ExtendedArchiveDoc | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackUserName, setFeedbackUserName] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Modal States
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'whatsapp' | 'dupcheck'>('whatsapp');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [pendingAgentCount, setPendingAgentCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pending_audit_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPendingAgentCount(parsed.length);
      }
    } catch (e) {}

    try {
      supabase
        .from('settlement_entries')
        .select('id')
        .like('id', 'pending_doc_%')
        .then(({ data, error }) => {
          if (!error && data && Array.isArray(data)) {
            setPendingAgentCount(data.length);
          }
        })
        .catch(() => {});
    } catch (e) {}
  }, []);

  // Listen for navigation clicks from Sidebar or Navbar to reset to vault view
  useEffect(() => {
    const handleResetArchiveView = () => {
      setShowAgentModal(false);
      setSelectedDoc(null);
      setShowUnlockModal(false);
      setShowPendingModal(false);
    };
    window.addEventListener('reset-archive-view', handleResetArchiveView);
    return () => window.removeEventListener('reset-archive-view', handleResetArchiveView);
  }, []);

  const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setArchiveImgError(false);
    setShowKeyTakeaway(false);
    setSummaryError(null);
    const activeData = selectedDoc
      ? (sessionPreviewMap[selectedDoc.id] || selectedDoc.fileData || '')
      : '';
    if (!activeData) {
      setSelectedDocBlobUrl(null);
      return;
    }
    if (!activeData.startsWith('data:')) {
      setSelectedDocBlobUrl(activeData);
      return;
    }
    const blobUrl = createBlobUrlFromDataUrl(activeData);
    setSelectedDocBlobUrl(blobUrl);
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [selectedDoc?.id, selectedDoc?.fileData, sessionPreviewMap]);

  const handleAgentDocumentApproved = (approvedDoc: any) => {
    const { _sessionPreviewData, fileData: _omitFileData, ...cleanApproved } = approvedDoc || {};
    if (_sessionPreviewData) {
      setSessionPreviewMap(prev => ({ ...prev, [cleanApproved.id]: _sessionPreviewData }));
    }

    setDocuments(prev => {
      const cleanApprovedArchiveId = extractCleanId(cleanApproved.archiveId || cleanApproved.archiveUrl || '');
      const cleanApprovedMemo = (cleanApproved.memoNo || '').trim().toLowerCase();

      // Find if an existing document already matches by id, Archive.org ID, or Memo No
      const existingIdx = prev.findIndex(d => {
        if (d.id === cleanApproved.id) return true;
        const dCleanArchiveId = extractCleanId(d.archiveId || '');
        if (cleanApprovedArchiveId && dCleanArchiveId && cleanApprovedArchiveId.toLowerCase() === dCleanArchiveId.toLowerCase()) {
          return true;
        }
        if (cleanApprovedMemo && cleanApprovedMemo.length >= 3 && d.memoNo) {
          if (d.memoNo.trim().toLowerCase() === cleanApprovedMemo) {
            return true;
          }
        }
        return false;
      });

      let updated: ExtendedArchiveDoc[];
      if (existingIdx >= 0) {
        const retainedId = prev[existingIdx].id;
        if (_sessionPreviewData) {
          setSessionPreviewMap(sp => ({ ...sp, [retainedId]: _sessionPreviewData }));
        }
        updated = [...prev];
        updated[existingIdx] = {
          ...prev[existingIdx],
          ...cleanApproved,
          id: retainedId
        };
      } else {
        updated = [cleanApproved, ...prev];
      }
      try {
        localStorage.setItem('audit_criteria_documents', JSON.stringify(stripFileDataFromDocs(updated)));
      } catch (e) {}
      return updated;
    });
  };

  // Whitelisted Emails State (Sync with localStorage & Supabase)
  const [whitelistedEmails, setWhitelistedEmails] = useState<string[]>(() => {
    const saved = localStorage.getItem('audit_doc_whitelisted_emails');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: string) => e.toLowerCase() !== 'approved.auditor@gmail.com');
        }
      } catch (e) {}
    }
    return [];
  });

  // Verified Session logged-in email (strictly from Supabase Google Auth)
  const sessionUserEmail = useMemo(() => {
    return userEmail ? userEmail.trim().toLowerCase() : '';
  }, [userEmail]);

  // Active Current User Gmail State (strictly bound to verified session email)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return userEmail ? userEmail.trim().toLowerCase() : '';
  });

  useEffect(() => {
    if (userEmail) {
      const clean = userEmail.trim().toLowerCase();
      localStorage.setItem('audit_doc_logged_in_user_email', clean);
      setCurrentUserEmail(clean);
    } else {
      localStorage.removeItem('audit_doc_logged_in_user_email');
      localStorage.removeItem('audit_doc_current_user_email');
      setCurrentUserEmail('');
    }
  }, [userEmail]);

  useEffect(() => {
    if (sessionUserEmail && isValidIdentifier(sessionUserEmail)) {
      localStorage.setItem('audit_doc_current_user_email', sessionUserEmail);
      const isW = whitelistedEmails.some(e => e.toLowerCase() === sessionUserEmail);
      recordVisitorLog(sessionUserEmail, isW);
    }
  }, [sessionUserEmail, whitelistedEmails]);

  // Demo / Subscription / Admin State
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('audit_doc_is_subscribed') === 'true';
  });
  const [demoAdmin, setDemoAdmin] = useState<boolean>(false);
  const effectiveAdmin = isAdmin || demoAdmin;

  // Active Single Session Lock State & Functions
  const [sessionLockedNotice, setSessionLockedNotice] = useState<string | null>(null);

  const getSessionToken = () => {
    let tok = sessionStorage.getItem('audit_active_session_token');
    if (!tok) {
      tok = 'st_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('audit_active_session_token', tok);
    }
    return tok;
  };

  const registerActiveSession = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !isValidIdentifier(trimmed)) return;
    const token = getSessionToken();

    try {
      await fetch('/api/user/active-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, sessionToken: token, action: 'register' })
      });
    } catch (e) {}

    try {
      await supabase.from('settlement_entries').upsert({
        id: 'session_' + trimmed,
        content: JSON.stringify({ token, timestamp: Date.now() }),
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  };

  useEffect(() => {
    const trimmedEmail = currentUserEmail ? currentUserEmail.trim().toLowerCase() : '';
    if (!trimmedEmail || !isValidIdentifier(trimmedEmail) || effectiveAdmin) {
      return;
    }

    const token = getSessionToken();

    // Register active session when email is set
    registerActiveSession(trimmedEmail);

    const checkActiveSession = async () => {
      let isValid = true;

      // 1. Check Server API
      try {
        const res = await fetch(`/api/user/active-session?email=${encodeURIComponent(trimmedEmail)}&token=${encodeURIComponent(token)}&t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.isValid === false) {
            isValid = false;
          }
        }
      } catch (e) {}

      // 2. Check Supabase
      if (isValid) {
        try {
          const { data } = await supabase
            .from('settlement_entries')
            .select('content')
            .eq('id', 'session_' + trimmedEmail)
            .single();

          if (data && data.content) {
            let parsed: any = null;
            try { parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content; } catch(e) {}
            if (parsed && parsed.token && parsed.token !== token) {
              isValid = false;
            }
          }
        } catch (e) {}
      }

      if (!isValid) {
        // Terminate local session
        setCurrentUserEmail('');
        localStorage.removeItem('audit_doc_current_user_email');
        setSessionLockedNotice(`⚠️ অন্য একটি ডিভাইস বা ব্রাউজার থেকে এই জিমেইল (${trimmedEmail}) দিয়ে নতুন সেশন শুরু করার কারণে আপনার এই বর্তমান সেশনটি স্বয়ংক্রিয়ভাবে বন্ধ করা হয়েছে।`);
      }
    };

    const intervalId = setInterval(checkActiveSession, 4000);

    const handleFocus = () => {
      checkActiveSession();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUserEmail, effectiveAdmin]);

  useEffect(() => {
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(whitelistedEmails));
  }, [whitelistedEmails]);

  // Custom Send Money / Payment Phone Number State
  const [paymentNumber, setPaymentNumber] = useState<string>(() => {
    return localStorage.getItem('audit_doc_payment_number') || '01789-539494';
  });

  // Fetch admin WhatsApp number from server on load (persists across incognito/all browsers)
  useEffect(() => {
    fetch('/api/admin/whatsapp-number?t=' + Date.now(), { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.whatsappNumber) {
          setPaymentNumber(data.whatsappNumber);
          localStorage.setItem('audit_doc_payment_number', data.whatsappNumber);
        }
      })
      .catch(err => console.error('Failed to fetch whatsapp number from server:', err));
  }, []);

  const handleUpdatePaymentNumber = (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) return;
    setPaymentNumber(trimmed);
    localStorage.setItem('audit_doc_payment_number', trimmed);

    fetch('/api/admin/whatsapp-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: trimmed })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.whatsappNumber) {
          setPaymentNumber(data.whatsappNumber);
          localStorage.setItem('audit_doc_payment_number', data.whatsappNumber);
        }
      })
      .catch(err => console.error('Failed to save whatsapp number on server:', err));
  };

  useEffect(() => {
    localStorage.setItem('audit_doc_payment_number', paymentNumber);
  }, [paymentNumber]);

  // Device-bound PIN unlock state
  const [pinState, setPinState] = useState<{
    isUnlocked: boolean;
    activePin?: string;
    userName?: string;
    deviceCount?: number;
  }>({ isUnlocked: false });
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkCurrentDeviceUnlock().then(res => {
      if (res.isUnlocked) {
        setPinState(res);
      }
    });
  }, []);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setPinMessage(null);
    const res = await verifyAndActivatePin(pinInput);
    if (res.success) {
      setPinMessage({ type: 'success', text: res.message });
      setPinState({
        isUnlocked: true,
        activePin: res.codeItem?.code || pinInput.trim().toUpperCase(),
        userName: res.userName,
        deviceCount: res.deviceCount
      });
      setPinInput('');
    } else {
      setPinMessage({ type: 'error', text: res.message });
    }
  };

  const handleLogoutPin = () => {
    deactivateCurrentDevicePin();
    setPinState({ isUnlocked: false });
    setPinMessage({ type: 'success', text: 'কোডটি এই ডিভাইস থেকে সফলভাবে সরানো হয়েছে।' });
    setTimeout(() => setPinMessage(null), 3000);
  };

  // Access check strictly based on verified Google session email or activated PIN
  const isWhitelisted = useMemo(() => {
    if (!sessionUserEmail) return false;
    return whitelistedEmails.some(e => e.toLowerCase() === sessionUserEmail);
  }, [sessionUserEmail, whitelistedEmails]);

  const isFullyUnlocked = effectiveAdmin || isSubscribed || isWhitelisted || pinState.isUnlocked;

  // Form state for document addition (Admin only)
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'সার্কুলার' as ArchiveDoc['category'],
    archiveId: '',
    docDate: new Date().toISOString().split('T')[0],
    description: '',
    memoNo: '',
    authority: '',
    tags: ''
  });

  const [newDocFile, setNewDocFile] = useState<{
    file?: File;
    name: string;
    size: string;
    data: string;
    mimeType: string;
  } | null>(null);

  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiWarningMessage, setAiWarningMessage] = useState<string | null>(null);
  const [aiDuplicateMatch, setAiDuplicateMatch] = useState<DuplicateMatchInfo | null>(null);
  const [ignoreDuplicateOverride, setIgnoreDuplicateOverride] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);

  const buildExistingDocsPayload = (): ExistingDocCheckItem[] => {
    const merged: ExistingDocCheckItem[] = [];
    const seen = new Set<string>();
    const add = (d: any, location: 'vault' | 'pending') => {
      if (!d || (editingDoc && d.id === editingDoc.id) || (!d.title && !d.memoNo)) return;
      const key = String(d.id || d.archiveId || `${location}_${d.title}_${d.memoNo}`);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({
        id: d.id,
        title: d.title,
        memoNo: d.memoNo,
        docDate: d.docDate,
        authority: d.authority,
        description: d.description,
        location
      });
    };
    documents.forEach(d => add(d, 'vault'));
    try {
      const pendingSaved = JSON.parse(localStorage.getItem('pending_audit_documents') || '[]');
      if (Array.isArray(pendingSaved)) pendingSaved.forEach(d => add(d, 'pending'));
    } catch (e) {}
    return merged.slice(0, 75);
  };

  const handleDirectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
    }
    const controller = new AbortController();
    aiAbortRef.current = controller;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setAiSuccessMessage(null);
    setAiWarningMessage(null);
    setAiDuplicateMatch(null);
    setIgnoreDuplicateOverride(false);
    setIsAnalyzingAI(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const detectedMime = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      setNewDocFile({
        file,
        name: file.name,
        size: sizeStr,
        data: dataUrl,
        mimeType: detectedMime
      });

      const cleanSlug = file.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 30) || "doc";
      const autoId = `bd_audit_${cleanSlug}_${Date.now()}`;

      setNewDoc(prev => ({
        ...prev,
        archiveId: prev.archiveId && !prev.archiveId.startsWith('bd_audit_') ? prev.archiveId : autoId
      }));

      if (controller.signal.aborted) {
        setIsAnalyzingAI(false);
        return;
      }

      // AI Multimodal Document Reading & Content-based Duplicate Check
      try {
        const aiResult = await analyzeDocumentWithAI({
          fileBase64: dataUrl,
          fileName: file.name,
          mimeType: detectedMime,
          existingDocs: buildExistingDocsPayload(),
          signal: controller.signal
        });

        if (controller.signal.aborted) return;

        if (aiResult.success && aiResult.data && aiResult.isAiAnalyzed) {
          setNewDoc(prev => ({
            ...prev,
            title: aiResult.data!.title || prev.title,
            category: (aiResult.data!.category as any) || prev.category,
            authority: aiResult.data!.authority || prev.authority,
            memoNo: aiResult.data!.memoNo || prev.memoNo,
            docDate: aiResult.data!.docDate || prev.docDate,
            description: aiResult.data!.description || prev.description,
            archiveId: prev.archiveId && !prev.archiveId.startsWith('bd_audit_') ? prev.archiveId : autoId
          }));
          setAiSuccessMessage('✨ এআই সফলভাবে ডকুমেন্টের আসল বিষয় ও তথ্য স্বয়ংক্রিয়ভাবে পূরণ করেছে');
          setAiWarningMessage(null);
          if (aiResult.duplicateMatch && aiResult.duplicateMatch.isDuplicate) {
            setAiDuplicateMatch(aiResult.duplicateMatch);
            setIgnoreDuplicateOverride(false);
          }
        } else if (aiResult.apiKeyMissing) {
          setAiWarningMessage('⚠️ জেমিনি এপিআই কী (GEMINI_API_KEY) সেট করা নেই! Vercel Settings > Environment Variables-এ GEMINI_API_KEY যুক্ত করুন, অথবা ম্যানুয়ালি তথ্য পূরণ করুন।');
        } else if (aiResult.error) {
          const errStr = String(aiResult.error);
          if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
            setAiWarningMessage('⚠️ জেমিনি সার্ভারে সাময়িক উচ্চ চাপ (High Demand) রয়েছে। অনুগ্রহ করে ৫-১০ সেকেন্ড পর আবার ফাইলটি নির্বাচন করুন, স্বয়ংক্রিয়ভাবে সমাধান হয়ে যাবে।');
          } else if (errStr.includes('free tier is not available') || errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) {
            setAiWarningMessage('⚠️ আপনার এই Google Project-টিতে Free Tier সক্রিয় নেই। সমাধান: Google AI Studio (aistudio.google.com) থেকে আপনার ব্যক্তিগত @gmail.com অ্যাকাউন্টে "Create API key in new project" সিলেক্ট করে সম্পূর্ণ নতুন একটি ফ্রি কী তৈরি করে Vercel-এ যোগ করুন (কোনো কার্ডের প্রয়োজন নেই)।');
          } else {
            setAiWarningMessage(`⚠️ এআই বিশ্লেষণ সম্পন্ন হয়নি: ${aiResult.error}`);
          }
        }
      } catch (aiErr: any) {
        if (!controller.signal.aborted) {
          console.warn('AI analysis call exception:', aiErr);
          setAiWarningMessage('⚠️ এআই নথিটি পড়তে পারেনি। অনুগ্রহ করে ম্যানুয়ালি তথ্য পূরণ করুন।');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyzingAI(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const categories = ['সকল', 'সার্কুলার', 'অফিস আদেশ', 'গেজেট', 'অন্যান্য'];

  const formatPremiumDate = (iso: string | undefined | null) => {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return toBengaliDigits(iso);
      const day = toBengaliDigits(date.getDate().toString().padStart(2, '0'));
      const monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const month = monthNames[date.getMonth()];
      const year = toBengaliDigits(date.getFullYear().toString());
      return `${day} ${month} ${year}`;
    } catch (e) {
      return toBengaliDigits(iso);
    }
  };

  const formatPremiumTime = (iso: string | undefined | null) => {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return '';
      let hours = date.getHours();
      const minutes = toBengaliDigits(date.getMinutes().toString().padStart(2, '0'));
      const period = hours >= 12 ? 'বিকাল' : 'সকাল';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      const hourStr = toBengaliDigits(hours.toString());
      return `${period} ${hourStr}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchWhitelistedEmails();
  }, []);

  useEffect(() => {
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(whitelistedEmails));
  }, [whitelistedEmails]);

  useEffect(() => {
    localStorage.setItem('audit_doc_current_user_email', currentUserEmail);
  }, [currentUserEmail]);

  useEffect(() => {
    localStorage.setItem('audit_doc_is_subscribed', isSubscribed ? 'true' : 'false');
  }, [isSubscribed]);

  useEffect(() => {
    if (editingDoc) {
      setNewDoc({
        title: editingDoc.title,
        category: editingDoc.category,
        archiveId: editingDoc.archiveId,
        docDate: editingDoc.docDate,
        description: editingDoc.description || '',
        memoNo: editingDoc.memoNo || '',
        authority: editingDoc.authority || '',
        tags: editingDoc.tags || ''
      });
      setShowAddModal(true);
    }
  }, [editingDoc]);

  const fetchWhitelistedEmails = async () => {
    let serverList: string[] = [];
    let supabaseList: string[] = [];
    let localList: string[] = [];

    try {
      const saved = localStorage.getItem('audit_doc_whitelisted_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) localList = parsed;
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/admin/whitelisted-emails?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.emails)) {
          serverList = data.emails;
        }
      }
    } catch (e) {}

    try {
      const { data, error } = await supabase
        .from('settlement_entries')
        .select('*')
        .eq('id', 'doc_whitelisted_emails')
        .single();
      if (!error && data && data.content) {
        let list = data.content;
        if (typeof list === 'string') {
          try { list = JSON.parse(list); } catch (e) {}
        }
        if (Array.isArray(list)) {
          supabaseList = list;
        }
      }
    } catch (e) {}

    const merged = Array.from(
      new Set(
        [...serverList, ...supabaseList, ...localList]
          .map(e => String(e).trim().toLowerCase())
          .filter(e => Boolean(e) && e !== 'approved.auditor@gmail.com')
      )
    );

    setWhitelistedEmails(merged);
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(merged));

    if (merged.length > 0) {
      try {
        await fetch('/api/admin/whitelisted-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: merged })
        });
      } catch (e) {}

      try {
        await supabase.from('settlement_entries').upsert({
          id: 'doc_whitelisted_emails',
          content: JSON.stringify(merged),
          created_at: new Date().toISOString()
        });
      } catch (e) {}
    }
  };

  const saveWhitelistedEmailsToDb = async (list: string[]) => {
    try {
      await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: list })
      });
    } catch (e) {}

    try {
      await supabase.from('settlement_entries').upsert({
        id: 'doc_whitelisted_emails',
        content: JSON.stringify(list),
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    let localList: ExtendedArchiveDoc[] = [];
    let serverList: ExtendedArchiveDoc[] = [];
    let supabaseList: ExtendedArchiveDoc[] = [];

    // 1. LocalStorage fallback
    try {
      const saved = localStorage.getItem('audit_criteria_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localList = parsed;
        }
      }
    } catch (e) {}

    // 2. Server API fallback
    try {
      const res = await fetch('/api/admin/documents?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.documents) && data.documents.length > 0) {
          serverList = data.documents;
        }
      }
    } catch (e) {}

    // 3. Supabase
    try {
      const { data, error } = await supabase
        .from('settlement_entries')
        .select('*')
        .like('id', 'doc_%');
      
      if (!error && data && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (!row || !row.id || row.id === 'doc_whitelisted_emails') return;

          let content = row.content;
          if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch (e) { return; }
          }
          if (!content) return;

          supabaseList.push({
            id: row.id,
            title: String(content.title || ''),
            category: (content.category as any) || 'অন্যান্য',
            archiveId: String(content.archiveId || ''),
            docDate: String(content.docDate || ''),
            description: String(content.description || ''),
            memoNo: String(content.memoNo || ''),
            authority: String(content.authority || ''),
            tags: String(content.tags || ''),
            originalFileName: content.originalFileName ? String(content.originalFileName) : undefined,
            archiveDownloadUrl: content.archiveDownloadUrl ? String(content.archiveDownloadUrl) : undefined,
            status: (content.status as any) || 'approved',
            uploadedBy: String(content.uploadedBy || ''),
            createdAt: String(content.createdAt || new Date().toISOString()),
            fileData: content.fileData ? String(content.fileData) : undefined,
            keyTakeaway: content.keyTakeaway && typeof content.keyTakeaway === 'object' ? content.keyTakeaway : undefined
          });
        });
      }
    } catch (err) {
      console.error("Fetch Documents Supabase Error:", err);
    }

    // Merge all sources without mock/dummy docs:
    // Only genuine user/admin-uploaded documents are loaded and displayed
    const isRealUploadedDoc = (d: ExtendedArchiveDoc) => d && d.id && !DEMO_DOC_IDS.includes(d.id);

    const docMap = new Map<string, ExtendedArchiveDoc>();
    localList.filter(isRealUploadedDoc).forEach(d => docMap.set(d.id, d));
    serverList.filter(isRealUploadedDoc).forEach(d => {
      const existing = docMap.get(d.id);
      docMap.set(d.id, {
        ...(existing || {}),
        ...d,
        fileData: d.fileData || existing?.fileData || undefined,
        keyTakeaway: d.keyTakeaway || existing?.keyTakeaway
      });
    });
    supabaseList.filter(isRealUploadedDoc).forEach(d => {
      const existing = docMap.get(d.id);
      docMap.set(d.id, {
        ...(existing || {}),
        ...d,
        fileData: d.fileData || existing?.fileData || undefined,
        keyTakeaway: d.keyTakeaway || existing?.keyTakeaway
      });
    });

    const finalDocs = Array.from(docMap.values());
    setDocuments(finalDocs);
    try {
      localStorage.setItem('audit_criteria_documents', JSON.stringify(stripFileDataFromDocs(finalDocs)));
    } catch (e) {}
    setIsLoading(false);
  };

  const extractCleanId = (rawId: string) => {
    if (!rawId) return '';
    let clean = rawId.trim();
    
    const itemsMatch = clean.match(/archive\.org\/items\/([^\/\?\#\s]+)/i);
    if (itemsMatch && itemsMatch[1]) return itemsMatch[1];

    const standardMatch = clean.match(/archive\.org\/(?:details|embed|stream|download|metadata|services\/img)\/([^\/\?\#\s]+)/i);
    if (standardMatch && standardMatch[1]) {
      const id = standardMatch[1];
      if (id.toLowerCase() !== 'upload') return id;
    }
    
    const segments = clean.split('/').filter(Boolean);
    const ignored = ['http:', 'https:', 'www.archive.org', 'archive.org', 'details', 'embed', 'stream', 'download', 'metadata', 'upload', 'ia'];
    
    const markers = ['details', 'items', 'download', 'stream', 'metadata'];
    for (let i = 0; i < segments.length - 1; i++) {
      if (markers.includes(segments[i].toLowerCase())) {
        const potentialId = segments[i+1].split(/[?#]/)[0];
        if (potentialId && !potentialId.includes('.archive.org')) {
          return potentialId;
        }
      }
    }

    for (const segment of segments) {
      const s = segment.toLowerCase();
      if (s && !ignored.includes(s) && !s.includes('.archive.org') && !/^\d+$/.test(s)) {
        return segment.split(/[?#]/)[0];
      }
    }

    return clean.replace(/\.pdf$/i, '').trim().replace(/\s+/g, '_');
  };

  // Real-time Duplicate Detection (AI Content Match + Manual Form Field Match)
  const duplicateWarning = useMemo(() => {
    if (!showAddModal) return null;

    if (aiDuplicateMatch && aiDuplicateMatch.isDuplicate) {
      return {
        reason: aiDuplicateMatch.reason || 'এআই ডকুমেন্টের ভেতরের বিষয়বস্তু পূর্ববর্তী নথির সাথে মিল পেয়েছে',
        location: aiDuplicateMatch.location || 'vault',
        matchedDoc: {
          id: aiDuplicateMatch.matchedId || '',
          title: aiDuplicateMatch.matchedTitle,
          memoNo: aiDuplicateMatch.matchedMemoNo,
          docDate: aiDuplicateMatch.matchedDocDate
        }
      };
    }

    const cleanId = extractCleanId(newDoc.archiveId || '');
    const cleanMemo = (newDoc.memoNo || '').trim().toLowerCase();
    const cleanTitle = (newDoc.title || '').trim().toLowerCase();

    for (const doc of documents) {
      if (editingDoc && doc.id === editingDoc.id) continue;

      const docCleanId = extractCleanId(doc.archiveId || '');
      if (cleanId && docCleanId && cleanId.toLowerCase() === docCleanId.toLowerCase()) {
        return {
          reason: 'একই Archive.org ফাইল লিঙ্ক বা আইডি',
          location: 'vault' as const,
          matchedDoc: doc
        };
      }

      if (cleanMemo && cleanMemo.length >= 3 && doc.memoNo) {
        if (doc.memoNo.trim().toLowerCase() === cleanMemo) {
          return {
            reason: `একই স্মারক নম্বর (${doc.memoNo})`,
            location: 'vault' as const,
            matchedDoc: doc
          };
        }
      }

      if (cleanTitle && cleanTitle.length >= 5 && doc.title) {
        if (doc.title.trim().toLowerCase() === cleanTitle) {
          return {
            reason: `একই শিরোনাম ("${doc.title}")`,
            location: 'vault' as const,
            matchedDoc: doc
          };
        }
      }
    }
    return null;
  }, [showAddModal, aiDuplicateMatch, newDoc.archiveId, newDoc.memoNo, newDoc.title, documents, editingDoc]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPublishing) return;
    if (!effectiveAdmin) {
      alert("দুঃখিত, শুধুমাত্র অ্যাডমিন নতুন সার্কুলার যুক্ত করতে পারেন।");
      return;
    }

    const cleanId = extractCleanId(newDoc.archiveId);
    if (!cleanId) {
      alert("অনুগ্রহ করে একটি সঠিক Archive.org লিঙ্ক বা আইডি দিন!");
      return;
    }

    // Warn on duplicate unless Admin explicitly chose Ignore & Upload
    if (duplicateWarning && !ignoreDuplicateOverride) {
      alert(
        `⚠️ এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে!\n\nপূর্বের নথির শিরোনাম: "${duplicateWarning.matchedDoc.title}"\nকারণ: ${duplicateWarning.reason}\n\nযদি এটি আসলেই আলাদা কোনো নথি হয়ে থাকে, তবে ফর্মের উপরের হলুদ সতর্কবার্তায় "সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে আপলোড করুন" বাটনে ক্লিক করে তারপর আবার সেভ করুন।`
      );
      return;
    }

    const docId = editingDoc ? editingDoc.id : `doc_${Date.now()}`;
    const uploadedFileMeta = newDocFile;
    let confirmedArchiveId = cleanId;
    let confirmedFileName = editingDoc?.originalFileName;
    let confirmedDownloadUrl = editingDoc?.archiveDownloadUrl;

    setIsPublishing(true);
    try {
      // 1. If a file was chosen, upload it to Archive.org FIRST and verify success (no silent fallback to Supabase!)
      if (uploadedFileMeta) {
        const rawBase64 = uploadedFileMeta.data.includes(',')
          ? uploadedFileMeta.data.split(',')[1]
          : uploadedFileMeta.data;

        const alreadyCheckedByAi = Boolean(aiSuccessMessage);
        const uploadResult = await uploadToArchiveWithSmartRetry(
          {
            fileBase64: rawBase64,
            fileName: uploadedFileMeta.name,
            mimeType: uploadedFileMeta.mimeType,
            archiveId: cleanId,
            title: newDoc.title,
            category: newDoc.category,
            authority: newDoc.authority,
            memoNo: newDoc.memoNo,
            docDate: newDoc.docDate,
            description: newDoc.description,
            source: 'Direct Admin Upload',
            senderName: 'এডমিন',
            autoAnalyze: false,
            existingDocs: ignoreDuplicateOverride || alreadyCheckedByAi ? undefined : buildExistingDocsPayload(),
            ignoreDuplicate: ignoreDuplicateOverride || alreadyCheckedByAi
          },
          { maxAttempts: 5 }
        );

        if (uploadResult.duplicateDetected && uploadResult.duplicateInfo) {
          setAiDuplicateMatch(uploadResult.duplicateInfo);
          setIgnoreDuplicateOverride(false);
          alert(
            `⚠️ এআই যাচাইয়ে দেখা গেছে এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে!\n\nপূর্বের শিরোনাম: "${uploadResult.duplicateInfo.matchedTitle}"\nকারণ: ${uploadResult.duplicateInfo.reason}\n\nআলাদা নথি হিসেবে আপলোড করতে চাইলে উপরের সতর্কবার্তায় "সতর্কবার্তা উপেক্ষা করে আপলোড করুন" বাটনে ক্লিক করে পুনরায় জমা দিন।`
          );
          return;
        }
        if (!uploadResult.success || !uploadResult.uploadedToArchive) {
          alert(
            `❌ Archive.org-এ ফাইল আপলোড ব্যর্থ হয়েছে:\n${uploadResult.error || 'Archive.org সার্ভার থেকে সাড়া পাওয়া যায়নি।'}\n\nআপনার নির্দেশনা অনুযায়ী Supabase-এ কোনো ফাইল সংরক্ষণ করা হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।`
          );
          return;
        }

        confirmedArchiveId = uploadResult.archiveId || cleanId;
        confirmedFileName = uploadResult.originalFileName || uploadedFileMeta.name;
        confirmedDownloadUrl =
          uploadResult.archiveDownloadUrl ||
          `https://archive.org/download/${confirmedArchiveId}/${encodeURIComponent(confirmedFileName)}`;

        // Keep data URL strictly in memory for instant preview in the current session while Archive.org finishes indexing
        setSessionPreviewMap(prev => ({ ...prev, [docId]: uploadedFileMeta.data }));
      }

      // Build lightweight metadata record with ZERO file bytes (fileData is never persisted to Supabase or localStorage)
      const payload: ExtendedArchiveDoc = {
        id: docId,
        title: newDoc.title,
        category: newDoc.category,
        archiveId: confirmedArchiveId,
        docDate: newDoc.docDate,
        description: newDoc.description,
        memoNo: newDoc.memoNo,
        authority: newDoc.authority,
        tags: newDoc.tags,
        originalFileName: confirmedFileName,
        archiveDownloadUrl: confirmedDownloadUrl,
        status: 'approved',
        uploadedBy: 'Admin',
        createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString(),
        keyTakeaway: uploadedFileMeta ? undefined : editingDoc?.keyTakeaway
      };

      // 2. Update local state & localStorage (metadata only, zero fileData)
      setDocuments(prev => {
        const existingIdx = prev.findIndex(d => d.id === docId);
        let updated: ExtendedArchiveDoc[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = payload;
        } else {
          updated = [payload, ...prev];
        }
        try {
          localStorage.setItem('audit_criteria_documents', JSON.stringify(stripFileDataFromDocs(updated)));
        } catch (e) {}
        return updated;
      });

      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc(payload);
      }

      setShowAddModal(false);
      setEditingDoc(null);
      setIsAnalyzingAI(false);
      setAiSuccessMessage(null);
      setAiDuplicateMatch(null);
      setIgnoreDuplicateOverride(false);
      setNewDocFile(null);
      setNewDoc({
        title: '',
        category: 'সার্কুলার',
        archiveId: '',
        docDate: new Date().toISOString().split('T')[0],
        description: '',
        memoNo: '',
        authority: '',
        tags: ''
      });

      // 3. Save metadata pointer to Server API (no fileData)
      try {
        await fetch('/api/admin/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc: payload })
        });
      } catch (e) {}

      // 4. Save lightweight catalog pointer ONLY (no file bytes) to Supabase
      try {
        await supabase.from('settlement_entries').upsert({
          id: docId,
          content: JSON.stringify(payload),
          created_at: payload.createdAt
        });
      } catch (err) {
        console.error("Supabase upsert error:", err);
      }

      alert(
        uploadedFileMeta
          ? (editingDoc
              ? "✅ ফাইলটি Archive.org-এ আপলোড ও ডকুমেন্ট আপডেট হয়েছে!"
              : "✅ ডকুমেন্টটি সফলভাবে সরাসরি Archive.org-এ জমা ও প্রকাশিত হয়েছে!")
          : (editingDoc
              ? "ডকুমেন্ট সফলভাবে আপডেট হয়েছে!"
              : "নতুন ডকুমেন্ট সরাসরি প্রকাশিত হয়েছে!")
      );
    } catch (err: any) {
      alert('❌ আপলোড বা সংরক্ষণে ত্রুটি হয়েছে: ' + (err?.message || 'অজানা ত্রুটি'));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleKeyTakeaway = async (doc: ExtendedArchiveDoc, forceRegenerate = false) => {
    setShowKeyTakeaway(true);
    setSummaryError(null);

    setTimeout(() => {
      keyTakeawayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);

    if (!forceRegenerate && doc.keyTakeaway?.summary) {
      return;
    }

    if (isSummarizingDocId === doc.id) return;

    setIsSummarizingDocId(doc.id);
    try {
      const cleanSelectedId = extractCleanId(doc.archiveId);
      const localDataUrl = sessionPreviewMap[doc.id] || doc.fileData || '';
      const canSendInlineBase64 =
        typeof localDataUrl === 'string' &&
        localDataUrl.startsWith('data:') &&
        localDataUrl.length < 3.5 * 1024 * 1024;

      const res = await summarizeDocumentWithAI({
        fileBase64: canSendInlineBase64 ? localDataUrl : undefined,
        archiveId: cleanSelectedId,
        fileName: doc.originalFileName,
        downloadUrl: doc.archiveDownloadUrl,
        title: doc.title,
        memoNo: doc.memoNo,
        authority: doc.authority
      });

      if (!res.success || !res.data) {
        setSummaryError(res.error || 'ডকুমেন্টটির মূল কথা তৈরি করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
        return;
      }

      const savedTakeaway: DocumentKeyTakeaway = res.data;
      const { fileData: _omitFileData, ...docWithoutFileData } = doc;
      const lightweightUpdatedDoc: ExtendedArchiveDoc = {
        ...docWithoutFileData,
        keyTakeaway: savedTakeaway
      };

      setDocuments(prev => {
        const updatedList = prev.map(d =>
          d.id === doc.id ? { ...d, keyTakeaway: savedTakeaway } : d
        );
        try {
          localStorage.setItem('audit_criteria_documents', JSON.stringify(stripFileDataFromDocs(updatedList)));
        } catch (e) {}
        return updatedList;
      });

      setSelectedDoc(prev =>
        prev && prev.id === doc.id ? { ...prev, keyTakeaway: savedTakeaway } : prev
      );

      try {
        await fetch('/api/admin/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc: lightweightUpdatedDoc })
        });
      } catch (e) {}

      try {
        await supabase.from('settlement_entries').upsert({
          id: lightweightUpdatedDoc.id,
          content: JSON.stringify(lightweightUpdatedDoc),
          created_at: lightweightUpdatedDoc.createdAt || new Date().toISOString()
        });
      } catch (e) {}
    } catch (err: any) {
      setSummaryError(err?.message || 'মূল কথা তৈরি করতে অপ্রত্যাশিত ত্রুটি হয়েছে।');
    } finally {
      setIsSummarizingDocId(prev => (prev === doc.id ? null : prev));
    }
  };

  const handleDelete = async (id: string) => {
    if (!effectiveAdmin) return;
    if (!confirm("আপনি কি নিশ্চিত যে এই ডকুমেন্টটি মুছে ফেলতে চান?")) return;

    // 1. Update local state & localStorage
    setDocuments(prev => {
      const updated = prev.filter(d => d.id !== id);
      try {
        localStorage.setItem('audit_criteria_documents', JSON.stringify(stripFileDataFromDocs(updated)));
      } catch (e) {}
      return updated;
    });
    if (selectedDoc?.id === id) setSelectedDoc(null);

    // 2. Delete from Server API
    try {
      await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteId: id })
      });
    } catch (e) {}

    // 3. Delete from Supabase
    try {
      await supabase.from('settlement_entries').delete().eq('id', id);
    } catch (err) {
      console.error("Supabase delete error:", err);
    }
  };

  const handleAddWhitelistedEmail = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!whitelistedEmails.some(e => e.toLowerCase() === trimmed)) {
      const updated = Array.from(new Set([...whitelistedEmails, trimmed]));
      setWhitelistedEmails(updated);
      localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(updated));

      try {
        await fetch('/api/admin/whitelisted-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addEmail: trimmed })
        });
      } catch (e) {}

      try {
        await supabase.from('settlement_entries').upsert({
          id: 'doc_whitelisted_emails',
          content: JSON.stringify(updated),
          created_at: new Date().toISOString()
        });
      } catch (e) {}
    }
  };

  const handleRemoveWhitelistedEmail = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    const updated = whitelistedEmails.filter(e => e.toLowerCase() !== trimmed);
    setWhitelistedEmails(updated);
    localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(updated));

    try {
      await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeEmail: trimmed })
      });
    } catch (e) {}

    try {
      await supabase.from('settlement_entries').upsert({
        id: 'doc_whitelisted_emails',
        content: JSON.stringify(updated),
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  };

  const handleVerifyGmail = async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !sessionUserEmail || trimmed !== sessionUserEmail) return false;
    registerActiveSession(sessionUserEmail);

    let isW = whitelistedEmails.some(e => e.toLowerCase() === sessionUserEmail);

    try {
      const res = await fetch('/api/admin/whitelisted-emails?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.emails)) {
          const latestList = data.emails.map((e: string) => e.trim().toLowerCase());
          setWhitelistedEmails(latestList);
          localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(latestList));
          if (latestList.includes(sessionUserEmail)) {
            isW = true;
          }
        }
      }
    } catch (e) {}

    recordVisitorLog(sessionUserEmail, isW);
    return isW;
  };

  const handleArchiveGoogleSignIn = async () => {
    try {
      localStorage.setItem('audit_oauth_return_tab', 'archive');
    } catch (e) {}
    const res = await signInWithGoogle();
    if (res?.error) {
      try {
        localStorage.removeItem('audit_oauth_return_tab');
      } catch (e) {}
    }
  };

  const handleGoogleSignOut = async () => {
    localStorage.removeItem('audit_doc_logged_in_user_email');
    localStorage.removeItem('audit_doc_current_user_email');
    setCurrentUserEmail('');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  };

  const copyCitation = (doc: ExtendedArchiveDoc) => {
    const text = `স্মারক নং: ${doc.memoNo || 'N/A'}, তারিখ: ${formatPremiumDate(doc.docDate)}, বিষয়: ${doc.title} (${doc.authority || ''})`;
    navigator.clipboard.writeText(text);
    alert('অডিট সাইটেশন কপি করা হয়েছে:\n\n' + text);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackDoc || !feedbackMessage.trim()) return;

    const docInfo = `স্মারক: ${feedbackDoc.memoNo || 'N/A'}, শিরোনাম: ${feedbackDoc.title}`;
    const text = `হ্যালো এডমিন,\n\nআমি অডিট লাইব্রেরির নিচে উল্লেখিত ডকুমেন্ট/সার্কুলারটি সম্পর্কে মতামত জানাতে চাই:\n📌 ${docInfo}\n\n💬 আমার মতামত:\n${feedbackMessage.trim()}\n\nপ্রেরক: ${feedbackUserName || currentUserEmail || 'সাধারণ ব্যবহারকারী'}`;

    const waNum = paymentNumber.replace(/[^0-9]/g, '');
    const cleanNum = waNum.startsWith('88') ? waNum : '88' + waNum;
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');

    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackDoc(null);
      setFeedbackMessage('');
    }, 2200);
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = activeCategory === 'সকল' || doc.category === activeCategory;
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.memoNo && doc.memoNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.authority && doc.authority.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.tags && doc.tags.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [documents, activeCategory, searchTerm]);

  const handleDocClick = (doc: ExtendedArchiveDoc, isDocUnlocked: boolean = true) => {
    if (isDocUnlocked) {
      setSelectedDoc(doc);
    } else {
      setShowUnlockModal(true);
    }
  };

  const triggerBlobDownload = (blobUrl: string, fileName: string) => {
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDownloadDocument = async (doc: ExtendedArchiveDoc, isDocUnlocked: boolean = true) => {
    if (!isDocUnlocked) {
      setShowUnlockModal(true);
      return;
    }
    if (downloadingDocId === doc.id) return;

    const cleanTitle = (doc.title || 'document')
      .replace(/[\\/:*?"<>|\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 90);

    const buildNameWithExt = (extHint: string) => {
      const cleanExt = extHint && extHint.startsWith('.') ? extHint : extHint ? `.${extHint}` : '.pdf';
      const base = cleanTitle || 'document';
      return base.toLowerCase().endsWith(cleanExt.toLowerCase()) ? base : `${base}${cleanExt}`;
    };

    const localDataUrl = sessionPreviewMap[doc.id] || doc.fileData || '';
    if (localDataUrl && localDataUrl.startsWith('data:')) {
      const blobUrl = createBlobUrlFromDataUrl(localDataUrl);
      if (blobUrl) {
        const mimeMatch = localDataUrl.match(/^data:([^;]+)/i);
        const mime = (mimeMatch ? mimeMatch[1] : '').toLowerCase();
        const origExtMatch = (doc.originalFileName || '').match(/\.[a-z0-9]{2,5}$/i);
        const ext =
          origExtMatch?.[0] ||
          (mime.includes('pdf')
            ? '.pdf'
            : mime.includes('png')
            ? '.png'
            : mime.includes('webp')
            ? '.webp'
            : mime.includes('jpeg') || mime.includes('jpg')
            ? '.jpg'
            : '.pdf');
        triggerBlobDownload(blobUrl, buildNameWithExt(ext));
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
        return;
      }
    }

    const cleanId = extractCleanId(doc.archiveId || doc.archiveDownloadUrl || '');
    if (!cleanId && !doc.archiveDownloadUrl) {
      alert('এই ডকুমেন্টটির সাথে কোনো ডাউনলোডযোগ্য Archive.org ফাইল সংযুক্ত নেই।');
      return;
    }

    setDownloadingDocId(doc.id);
    try {
      const params = new URLSearchParams();
      if (cleanId) params.set('archiveId', cleanId);
      if (doc.originalFileName) params.set('fileName', doc.originalFileName);
      if (doc.archiveDownloadUrl) params.set('downloadUrl', doc.archiveDownloadUrl);
      if (cleanTitle) params.set('title', cleanTitle);

      const resp = await fetch(`/api/agent/download-document?${params.toString()}`);
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        throw new Error(errJson?.error || `ডাউনলোড ব্যর্থ হয়েছে (HTTP ${resp.status})`);
      }

      const blob = await resp.blob();
      if (!blob || blob.size === 0) {
        throw new Error('ফাইলটি খালি পাওয়া গেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
      }

      const disposition = resp.headers.get('content-disposition') || '';
      let finalFileName = '';
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      if (utf8Match && utf8Match[1]) {
        try {
          finalFileName = decodeURIComponent(utf8Match[1].trim());
        } catch (e) {}
      }
      if (!finalFileName) {
        const origExtMatch = (doc.originalFileName || '').match(/\.[a-z0-9]{2,5}$/i);
        const blobMime = (blob.type || '').toLowerCase();
        const ext =
          origExtMatch?.[0] ||
          (blobMime.includes('pdf')
            ? '.pdf'
            : blobMime.includes('png')
            ? '.png'
            : blobMime.includes('webp')
            ? '.webp'
            : blobMime.includes('jpeg') || blobMime.includes('jpg')
            ? '.jpg'
            : '.pdf');
        finalFileName = buildNameWithExt(ext);
      }

      const blobUrl = URL.createObjectURL(blob);
      triggerBlobDownload(blobUrl, finalFileName);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (err: any) {
      alert(`❌ ডকুমেন্ট ডাউনলোড করা যায়নি:\n${err?.message || 'Archive.org থেকে ফাইল আনা সম্ভব হয়নি।'}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Render AI Agent Circular Processor as a full-width normal page instead of a floating popup
  if (showAgentModal) {
    return (
      <div className="w-full space-y-6 pb-20 animate-in fade-in duration-200">
        <AgentApprovalModal
          isOpen={true}
          onClose={() => setShowAgentModal(false)}
          onDocumentApproved={handleAgentDocumentApproved}
          pendingCount={pendingAgentCount}
          onPendingCountChange={setPendingAgentCount}
          vaultDocuments={documents}
        />
      </div>
    );
  }

  return (
    <div className="-mt-2 md:-mt-5 space-y-3 pb-20">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl border border-slate-800 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-black tracking-wider uppercase">
                <Library size={14} /> সরকারি অডিট সার্কুলার ও গেজেট ভল্ট
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                স্মার্ট অডিট ক্রাইটেরিয়া
              </h1>
              <p className="text-slate-300 font-medium text-sm md:text-base leading-relaxed">
                অর্থ মন্ত্রণালয়, সিএজি অফিস ও বিভিন্ন সরকারি দপ্তরের সকল গুরুতপূর্ণ সার্কুলার, অফিস আদেশ ও গেজেট এক জায়গায়। অডিট সাইটেশন ১-ক্লিকে কপি করুন।
              </p>
            </div>

            {/* Right Control Actions */}
            <div className="flex flex-col gap-3 shrink-0">
              {effectiveAdmin ? (
                <>
                  <button
                    onClick={() => setShowAgentModal(true)}
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/30 active:scale-95"
                  >
                    <Sparkles size={16} className="text-amber-300 animate-pulse" />
                    <span>🤖 এআই এজেন্ট: সার্কুলার প্রসেসর ও অনুমোদন</span>
                    {pendingAgentCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce shadow-md">
                        {toBengaliDigits(pendingAgentCount)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setShowAddModal(true);
                    }}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus size={18} /> ম্যানুয়াল সার্কুলার/ডকুমেন্ট যুক্ত করুন
                  </button>
                  <button
                    onClick={() => setShowPendingModal(true)}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <UserCheck size={16} className="text-blue-300" /> 👥 নতুন জিমেইল যুক্তকরণ ও ১ মাসের ভিজিটর লগ ({toBengaliDigits(whitelistedEmails.length)})
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageSquare size={20} /> WhatsApp এ ফাইল পাঠিয়ে আনলক করুন
                </button>
              )}
            </div>
          </div>

          {/* Quick Verified Gmail ID & Unlock Guide Strip inside Hero Block */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Mail size={15} className="text-emerald-400 shrink-0" />
                <span>আপনার অনুমোদিত জিমেইল আইডি:</span>
              </span>

              {sessionUserEmail ? (
                <>
                  <div className="px-3 py-1.5 border border-slate-700 bg-slate-950/75 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
                    <span>{sessionUserEmail}</span>
                    <button
                      type="button"
                      onClick={handleGoogleSignOut}
                      className="text-[10px] font-sans font-bold text-slate-400 hover:text-rose-300 underline cursor-pointer transition-colors"
                      title="লগআউট করে অন্য জিমেইল দিয়ে যাচাই করুন"
                    >
                      সাইন আউট
                    </button>
                  </div>

                  {isWhitelisted ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-black rounded-lg text-xs flex items-center gap-1.5 border border-emerald-500/30">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span>অনুমোদিত জিমেইল আইডি (সকল নথি উন্মুক্ত)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 font-bold rounded-lg text-[11px] border border-rose-500/30 flex items-center gap-1">
                      <AlertCircle size={13} className="text-rose-400 shrink-0" />
                      <span>এই জিমেইল আইডিটি অনুমোদনপ্রাপ্ত নয়! এডমিনের অনুমোদন প্রয়োজন।</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleArchiveGoogleSignIn}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google দিয়ে জিমেইল যাচাই করুন</span>
                  </button>

                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-black rounded-lg text-[11px] border border-amber-500/30">
                    সাধারণ এক্সেস (প্রথম ৫টি ফ্রি, অন্যান্য লকড)
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowUnlockModal(true)}
              className="text-emerald-400 hover:text-emerald-300 font-black text-xs hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              এক্সেস বিস্তারিত ও আনলক নির্দেশিকা <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Sticky Top) */}
      <div ref={filterBarRef} className="sticky top-0 z-30 -mx-2 md:-mx-4 px-2 md:px-4 py-2 bg-[#eef2f6] shadow-sm transition-all">
        <div className="bg-white px-4 py-3 md:px-5 md:py-3.5 rounded-2xl border border-slate-200/90 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Tabs (Left) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar (Middle - Marked Area) */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="শিরোনাম, স্মারক নং বা কিওয়ার্ড খুঁজুন..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="সার্চ মুছুন"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Duplicate Checker & Layout Toggles (Right) */}
            <div className="flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setModalInitialTab('dupcheck');
                  setShowUnlockModal(true);
                }}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl font-black text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                title="নতুন ফাইল পাঠানোর আগে ডুপ্লিকেট চেক করুন"
              >
                <FileSearch size={16} className="text-blue-600" />
                <span className="hidden sm:inline">🔍 ডুপ্লিকেট চেকার</span>
              </button>

              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  title="গ্রিড ভিউ"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  title="লিস্ট ভিউ"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Grid / List Content */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="font-black text-slate-500 tracking-widest uppercase text-xs">ডকুমেন্টগুলো লোড হচ্ছে...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocs.map((doc, idx) => {
              const cleanId = extractCleanId(doc.archiveId);
              const isDocUnlocked = isFullyUnlocked || idx < 5;
              return (
                <div 
                  key={doc.id}
                  className="group bg-white border border-slate-200/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-2xl flex flex-col h-full relative overflow-hidden"
                >
                  <div className="p-4 flex-1 space-y-4">
                    <div className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100 group-hover:border-blue-100 transition-all">
                      <DocumentCardThumbnail
                        doc={doc}
                        isDocUnlocked={isDocUnlocked}
                        cleanId={cleanId}
                        sessionPreviewUrl={sessionPreviewMap[doc.id]}
                      />

                      {!isDocUnlocked && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
                          <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg mb-2">
                            <Lock size={20} />
                          </div>
                          <span className="text-white text-xs font-black drop-shadow">ফাইল আনলক প্রয়োজন</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 z-20">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm border border-white/50">{doc.category}</span>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 gap-2 z-20">
                        <button 
                          onClick={() => handleDocClick(doc, isDocUnlocked)} 
                          className="w-full py-2.5 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-xl hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isDocUnlocked ? <Eye size={14} /> : <Lock size={14} />} {isDocUnlocked ? 'ওপেন করুন' : 'আনলক অপশন'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 px-1">
                      <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                      {doc.memoNo && (
                        <div className="inline-flex items-center px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded border border-blue-100">
                          স্মারক: {doc.memoNo}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-300" /> 
                          <span>{formatPremiumDate(doc.docDate)}</span>
                        </div>
                        {doc.authority && (
                          <span className="truncate max-w-[120px] text-slate-500">{doc.authority}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-b-2xl border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleDownloadDocument(doc, isDocUnlocked)}
                      disabled={downloadingDocId === doc.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 ${
                        isDocUnlocked
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 hover:border-blue-300 shadow-2xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-950 border border-amber-200 hover:border-amber-300 shadow-2xs'
                      }`}
                      title={isDocUnlocked ? 'ডকুমেন্ট ডাউনলোড করুন' : 'ডাউনলোড করতে আনলক করুন'}
                    >
                      {downloadingDocId === doc.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : isDocUnlocked ? (
                        <Download size={15} />
                      ) : (
                        <Lock size={14} />
                      )}
                      <span>
                        {downloadingDocId === doc.id
                          ? 'ডাউনলোড হচ্ছে...'
                          : isDocUnlocked
                          ? 'ডাউনলোড'
                          : 'আনলক করুন'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => copyCitation(doc)} 
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer" 
                        title="সাইটেশন কপি করুন"
                      >
                        <FileText size={16} />
                      </button>
                      {effectiveAdmin && (
                        <>
                          <button 
                            onClick={() => setEditingDoc(doc)} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="এডিট"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-visible">
            <div className="w-full overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead className="sticky z-20 shadow-md transition-all" style={{ top: `${filterBarHeight}px` }}>
                  <tr className="bg-slate-900 text-white text-xs font-black">
                    <th className="p-4 uppercase tracking-wider bg-slate-900 text-center">ডকুমেন্ট শিরোনাম ও স্মারক</th>
                    <th className="p-4 uppercase tracking-wider bg-slate-900 text-center">ক্যাটাগরি</th>
                    <th className="p-4 uppercase tracking-wider bg-slate-900 text-center">কর্তৃপক্ষ</th>
                    <th className="p-4 uppercase tracking-wider text-center bg-slate-900">আপলোডের তারিখ</th>
                    <th className="p-4 uppercase tracking-wider text-center bg-slate-900">অ্যাকশন</th>
                  </tr>
                  {/* ক্রমিক রো (Sequence Row) */}
                  <tr className="bg-slate-800 text-slate-300 text-[11px] font-mono font-bold text-center border-t border-slate-700/60 divide-x divide-slate-700/60">
                    <td className="py-1.5 px-3 bg-slate-800 text-center">১</td>
                    <td className="py-1.5 px-3 bg-slate-800 text-center">২</td>
                    <td className="py-1.5 px-3 bg-slate-800 text-center">৩</td>
                    <td className="py-1.5 px-3 bg-slate-800 text-center">৪</td>
                    <td className="py-1.5 px-3 bg-slate-800 text-center">৫</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDocs.map((doc, idx) => {
                    const cleanId = extractCleanId(doc.archiveId);
                    const isDocUnlocked = isFullyUnlocked || idx < 5;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-200">
                              {(sessionPreviewMap[doc.id] || doc.fileData || '').startsWith('data:image/') ? (
                                <img src={sessionPreviewMap[doc.id] || doc.fileData} className="w-full h-full object-cover z-10" />
                              ) : cleanId ? (
                                <img 
                                  src={`https://archive.org/services/img/${cleanId}`} 
                                  className={`w-full h-full object-cover z-10 ${!isDocUnlocked ? 'blur-[1px]' : ''}`}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : null}
                              <FileText size={18} className="text-slate-400 absolute" />
                            </div>
                            <div>
                              <div className="font-black text-slate-900">{doc.title}</div>
                              <div className="text-[11px] font-bold text-slate-400">স্মারক: {doc.memoNo || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-black rounded-lg text-[10px]">
                            {doc.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-600 text-center">{doc.authority || 'N/A'}</td>
                        <td className="p-4 font-bold text-slate-500 text-center">{formatPremiumDate(doc.docDate)}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleDocClick(doc, isDocUnlocked)} 
                              className="p-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                              title={isDocUnlocked ? "ওপেন করুন" : "আনলক করুন"}
                            >
                              {isDocUnlocked ? <Eye size={16} /> : <Lock size={16} className="text-amber-500" />}
                            </button>
                            <button 
                              onClick={() => setFeedbackDoc(doc)} 
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200/80 rounded-lg transition-all"
                              title="এই ডকুমেন্ট সম্পর্কে মতামত জানান"
                            >
                              <MessageSquarePlus size={16} />
                            </button>
                            <button 
                              onClick={() => copyCitation(doc)} 
                              className="p-2 bg-slate-100 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                              title="সাইটেশন কপি"
                            >
                              <FileText size={16} />
                            </button>
                            {effectiveAdmin && (
                              <button 
                                onClick={() => handleDelete(doc.id)} 
                                className="p-2 bg-slate-100 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
          <Search size={36} className="mx-auto text-slate-300" />
          <h3 className="text-lg font-black text-slate-800">কোনো ফাইল পাওয়া যায়নি</h3>
          <p className="text-xs font-bold text-slate-400">
            {documents.length === 0
              ? 'বর্তমানে কোনো আপলোডকৃত ডকুমেন্ট নেই। আপনি যে ডকুমেন্টগুলো আপলোড করবেন শুধুমাত্র সেগুলোই এখানে প্রদর্শিত হবে।'
              : 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো ডকুমেন্ট লাইব্রেরিতে নেই।'}
          </p>
          {effectiveAdmin && documents.length === 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingDoc(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus size={16} /> নতুন ডকুমেন্ট আপলোড করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Document Full View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-16 md:pt-20 pb-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-300 my-auto">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="absolute top-6 right-6 z-30 p-2.5 bg-slate-900/80 hover:bg-black text-white rounded-full transition-all cursor-pointer border border-white/10 shadow-lg"
              title="বন্ধ করুন"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-slate-950 p-4 md:p-6 text-white flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[420px]">
                {(() => {
                  const activePreviewData = sessionPreviewMap[selectedDoc.id] || selectedDoc.fileData || '';
                  const cleanSelectedId = extractCleanId(selectedDoc.archiveId);
                  const isOriginalImg = Boolean(selectedDoc.originalFileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedDoc.originalFileName));
                  const archiveDirectUrl =
                    selectedDoc.archiveDownloadUrl ||
                    (cleanSelectedId && selectedDoc.originalFileName
                      ? `https://archive.org/download/${cleanSelectedId}/${encodeURIComponent(selectedDoc.originalFileName)}`
                      : '');
                  const viewInNewTabHref =
                    selectedDocBlobUrl ||
                    (activePreviewData && !activePreviewData.startsWith('data:')
                      ? activePreviewData
                      : archiveDirectUrl || `https://archive.org/details/${cleanSelectedId}`);

                  return (
                    <>
                      <div className="w-full h-[360px] md:h-[420px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner relative flex items-center justify-center">
                        {activePreviewData && activePreviewData.startsWith('data:image/') ? (
                          <img 
                            src={activePreviewData} 
                            alt={selectedDoc.title} 
                            className="max-h-full max-w-full object-contain mx-auto" 
                          />
                        ) : activePreviewData ? (
                          <iframe
                            src={selectedDocBlobUrl || activePreviewData}
                            className="w-full h-full border-0"
                            title={selectedDoc.title}
                            allowFullScreen
                          />
                        ) : isOriginalImg && archiveDirectUrl && !archiveImgError ? (
                          <img
                            src={archiveDirectUrl}
                            alt={selectedDoc.title}
                            className="max-h-full max-w-full object-contain mx-auto"
                            onError={() => setArchiveImgError(true)}
                          />
                        ) : (
                          <div className="w-full h-full relative">
                            <iframe
                              src={`https://archive.org/embed/${cleanSelectedId}`}
                              className="w-full h-full border-0"
                              title={selectedDoc.title}
                              allowFullScreen
                            />
                            <div className="absolute bottom-2 left-2 right-2 p-2 bg-slate-950/85 backdrop-blur-xs border border-slate-700/60 rounded-xl text-center text-[10px] text-amber-300 font-bold pointer-events-none">
                              🌐 Archive.org থেকে লোড হচ্ছে (নতুন আপলোড হলে ইনডেক্স হতে ১–৩ মিনিট সময় লাগতে পারে)
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-full pt-3 flex flex-wrap items-center justify-center gap-2.5">
                        <a 
                          href={viewInNewTabHref}
                          target="_blank"
                          rel={selectedDocBlobUrl?.startsWith('blob:') ? 'noopener' : 'noopener noreferrer'}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={14} /> নতুন ট্যাবে ভিউ করুন
                        </a>
                        <button
                          type="button"
                          onClick={() => handleToggleKeyTakeaway(selectedDoc, false)}
                          disabled={isSummarizingDocId === selectedDoc.id}
                          className={`px-4 py-2 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ${
                            showKeyTakeaway
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300/60'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          } disabled:opacity-70`}
                        >
                          {isSummarizingDocId === selectedDoc.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Sparkles size={14} />
                          )}
                          মূল কথা
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[80vh]">
                <div className="space-y-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg uppercase border border-blue-100">
                    {selectedDoc.category}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedDoc.title}</h3>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">আপলোডের তারিখ:</span>
                    <span>{formatDateBN(selectedDoc.docDate)}</span>
                  </div>
                  {selectedDoc.memoNo && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">স্মারক নম্বর:</span>
                      <span className="font-mono text-blue-700">{selectedDoc.memoNo}</span>
                    </div>
                  )}
                  {selectedDoc.authority && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">ইস্যুকারী কর্তৃপক্ষ:</span>
                      <span>{selectedDoc.authority}</span>
                    </div>
                  )}
                </div>

                {selectedDoc.description && (
                  <div className="space-y-1 pt-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">বিবরণ:</span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}

                {showKeyTakeaway && (
                  <div
                    ref={keyTakeawayRef}
                    className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-4 shadow-sm space-y-3 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Sparkles size={14} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">ডকুমেন্টের মূল কথা</h4>
                          {selectedDoc.keyTakeaway?.generatedAt && isSummarizingDocId !== selectedDoc.id && (
                            <p className="text-[10px] font-bold text-slate-400">সংরক্ষিত সারাংশ</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleKeyTakeaway(selectedDoc, true)}
                          disabled={isSummarizingDocId === selectedDoc.id}
                          className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-black text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="এআই দিয়ে ডকুমেন্টটি পুনরায় বিশ্লেষণ করুন"
                        >
                          <RefreshCw size={12} className={isSummarizingDocId === selectedDoc.id ? 'animate-spin' : ''} />
                          পুনরায় বিশ্লেষণ
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKeyTakeaway(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="বন্ধ করুন"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {isSummarizingDocId === selectedDoc.id ? (
                      <div className="py-5 flex flex-col items-center justify-center text-center gap-2">
                        <Loader2 size={22} className="text-indigo-600 animate-spin" />
                        <p className="text-xs font-bold text-slate-700">এআই ডকুমেন্টটি পড়ে সহজ ভাষায় মূল কথা তৈরি করছে...</p>
                        <p className="text-[11px] text-slate-400 font-medium">অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন</p>
                      </div>
                    ) : summaryError ? (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-2">
                        <div className="flex items-start gap-2 text-xs font-bold">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <span>{summaryError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleKeyTakeaway(selectedDoc, true)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-black cursor-pointer transition-all"
                        >
                          আবার চেষ্টা করুন
                        </button>
                      </div>
                    ) : selectedDoc.keyTakeaway ? (
                      <div className="space-y-3">
                        {selectedDoc.keyTakeaway.isUnclear && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2 text-xs font-bold">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                            <span>
                              {selectedDoc.keyTakeaway.unclearNote || 'ডকুমেন্টটির লেখা অস্পষ্ট হওয়ায় অনুমান ছাড়া নিশ্চিতভাবে পড়া সম্ভব হচ্ছে না।'}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs">
                          {selectedDoc.keyTakeaway.summary}
                        </div>

                        {selectedDoc.keyTakeaway.example && selectedDoc.keyTakeaway.example.trim() !== '' && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                            <span className="text-[11px] font-black text-emerald-800 block">সহজ উদাহরণ:</span>
                            <p className="text-xs text-emerald-900 font-medium leading-relaxed whitespace-pre-line">
                              {selectedDoc.keyTakeaway.example}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="pt-2 border-t border-indigo-100/80 flex items-start gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50/70 px-2.5 py-2 rounded-lg border border-amber-200/70">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                      <span>সতর্কতা: এআই ভুল করতে পারে। গুরুত্বপূর্ণ দাপ্তরিক বা অডিট সিদ্ধান্তের আগে অনুগ্রহ করে মূল ডকুমেন্টটি যাচাই করে নিন।</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      const target = selectedDoc;
                      setSelectedDoc(null);
                      setFeedbackDoc(target);
                    }}
                    className="flex-1 min-w-fit py-3 px-4 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shadow-md"
                  >
                    <MessageSquarePlus size={16} className="shrink-0" /> এডমিনকে মতামত জানান
                  </button>
                  <button 
                    onClick={() => copyCitation(selectedDoc)}
                    className="flex-1 min-w-fit py-3 px-4 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <FileText size={16} className="shrink-0" /> রেফারেন্স কপি করুন
                  </button>
                  {effectiveAdmin && (
                    <button 
                      onClick={() => {
                        const target = selectedDoc;
                        setSelectedDoc(null);
                        setEditingDoc(target);
                      }}
                      className="py-3 px-5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-md"
                    >
                      <Edit2 size={16} className="shrink-0" /> এডিট
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="py-3 px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all whitespace-nowrap cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Feedback / Opinion Modal */}
      {feedbackDoc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-300 my-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black shrink-0">
                  <MessageSquarePlus size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">ডকুমেন্ট সম্পর্কে মতামত প্রদান</h3>
                  <p className="text-xs text-slate-500 font-bold">এডমিনকে আপনার মতামত বা সার্কুলার সম্পর্কিত তথ্য জানান</p>
                </div>
              </div>
              <button 
                onClick={() => { setFeedbackDoc(null); setFeedbackSubmitted(false); }}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Document Info Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {feedbackDoc.category}
              </span>
              <h4 className="font-black text-slate-900 text-xs md:text-sm leading-snug">{feedbackDoc.title}</h4>
              {feedbackDoc.memoNo && (
                <p className="text-[11px] font-bold text-slate-500">স্মারক নং: {feedbackDoc.memoNo}</p>
              )}
            </div>

            {feedbackSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <h4 className="font-black text-emerald-900 text-sm">আপনার মতামত সফলভাবে পাঠানো হয়েছে!</h4>
                <p className="text-xs text-emerald-700 font-bold">WhatsApp বার্তার মাধ্যমে এডমিনকে অবহিত করা হয়েছে। ধন্যবাদ।</p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-slate-700 font-black">আপনার নাম / জিমেইল (ঐচ্ছিক):</label>
                  <input 
                    type="text"
                    placeholder="যেমন: জহিরুল ইসলাম / user@gmail.com"
                    value={feedbackUserName}
                    onChange={e => setFeedbackUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-black">আপনার মতামত বা প্রশ্ন:*</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="এই সার্কুলার বা নির্দেশিকা সম্পর্কে আপনার মতামত লিখুন..."
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 min-h-[100px]"
                  ></textarea>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setFeedbackDoc(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Send size={15} /> WhatsApp-এ এডমিনকে মতামত জানান
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin-Only Document Addition Modal */}
      {showAddModal && effectiveAdmin && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pt-16 md:pt-20 pb-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in slide-in-from-bottom-6 duration-300 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                  {editingDoc ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {editingDoc ? 'রেফারেন্স এডিট করুন' : 'নতুন অডিট সার্কুলার / গেজেট যুক্ত করুন'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">অ্যাডমিন মোড: সরাসরি ভল্টে প্রকাশিত হবে</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (aiAbortRef.current) {
                    aiAbortRef.current.abort();
                    aiAbortRef.current = null;
                  }
                  setShowAddModal(false);
                  setEditingDoc(null);
                  setNewDocFile(null);
                  setIsAnalyzingAI(false);
                  setAiSuccessMessage(null);
                  setAiWarningMessage(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 text-xs font-bold">
              {/* Real-time AI + Field Duplicate Warning Banner with Admin Ignore Override */}
              {duplicateWarning && (
                <div className={`p-4 rounded-2xl border-2 space-y-2.5 animate-in fade-in duration-200 ${
                  ignoreDuplicateOverride
                    ? 'bg-sky-50 border-sky-300 text-sky-950'
                    : 'bg-amber-50 border-amber-400 text-amber-950'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={19} className={`${ignoreDuplicateOverride ? 'text-sky-600' : 'text-amber-600'} shrink-0 mt-0.5`} />
                    <div className="text-xs leading-relaxed space-y-1 flex-1">
                      <p className="font-black">
                        {ignoreDuplicateOverride
                          ? '✓ সতর্কবার্তা উপেক্ষা করা হয়েছে — এটিকে আলাদা নথি হিসেবে আপলোডের অনুমতি দেওয়া হয়েছে'
                          : '⚠️ সতর্কতা: এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে!'}
                      </p>
                      <div className="p-2 rounded-xl bg-white/80 border border-amber-200/80 space-y-0.5">
                        <p className="font-black text-slate-900">
                          পূর্বের নথির শিরোনাম: &ldquo;{duplicateWarning.matchedDoc.title}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-600">
                          অবস্থান: {duplicateWarning.location === 'pending' ? 'অপেক্ষমাণ তালিকা' : 'মূল ভল্ট'}
                          {duplicateWarning.matchedDoc.memoNo ? ` • স্মারক: ${duplicateWarning.matchedDoc.memoNo}` : ''}
                          {duplicateWarning.matchedDoc.docDate ? ` • তারিখ: ${duplicateWarning.matchedDoc.docDate}` : ''}
                        </p>
                        <p className="text-[11px] text-amber-900 font-medium">
                          কারণ: {duplicateWarning.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {!ignoreDuplicateOverride ? (
                      <button
                        type="button"
                        onClick={() => setIgnoreDuplicateOverride(true)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 size={13} />
                        <span>সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে আপলোড করুন</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIgnoreDuplicateOverride(false)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                      >
                        পূর্বাবস্থায় ফিরুন
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 1-Click Direct File Upload Section */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-2xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">সরাসরি ফাইল সিলেক্ট করুন (স্বয়ংক্রিয় আপলোড)</h4>
                      <p className="text-[11px] text-slate-500 font-bold">PDF বা ছবি বাছলে স্বয়ংক্রিয়ভাবে Archive.org আইডি তৈরি হবে ও তাৎক্ষণিক প্রিভিউ লোড হবে</p>
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="admin-doc-direct-file-input"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleDirectFileChange}
                    />
                    <label
                      htmlFor="admin-doc-direct-file-input"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Upload size={14} /> ফাইল নির্বাচন করুন
                    </label>
                  </div>
                </div>

                {/* AI Analysis Loader & Status */}
                {isAnalyzingAI && (
                  <div className="p-3 bg-blue-50/90 border border-blue-300 rounded-xl flex items-center gap-3 text-xs font-black text-blue-800 animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                    <span>🤖 এআই ডকুমেন্টটি পড়ছে ও তথ্য উদ্ধার করছে...</span>
                  </div>
                )}

                {aiSuccessMessage && !isAnalyzingAI && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-black text-emerald-800 animate-in fade-in">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}

                {aiWarningMessage && !isAnalyzingAI && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs font-bold text-amber-900 animate-in fade-in shadow-xs">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{aiWarningMessage}</p>
                      {aiWarningMessage.includes('GEMINI_API_KEY') && (
                        <p className="text-[11px] text-amber-700 font-normal">
                          📌 Vercel ড্যাশবোর্ডে <strong>Settings &gt; Environment Variables</strong>-এ <strong>GEMINI_API_KEY</strong> যুক্ত করলেই এআই ফাইল প্রসেসিং কার্যকর হবে।
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {newDocFile && (
                  <div className="p-2.5 bg-white border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <span className="font-bold text-emerald-800 truncate flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                      {newDocFile.name} ({newDocFile.size})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiAbortRef.current) {
                          aiAbortRef.current.abort();
                          aiAbortRef.current = null;
                        }
                        setIsAnalyzingAI(false);
                        setNewDocFile(null);
                        setAiSuccessMessage(null);
                        setAiWarningMessage(null);
                      }}
                      className="text-red-500 hover:text-red-700 font-bold text-[11px] ml-2 cursor-pointer"
                    >
                      মুছুন
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-blue-900 font-black uppercase tracking-wider flex items-center gap-1">
                  Archive.org লিঙ্ক বা আইডি
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    required
                    placeholder="https://archive.org/details/your_file_id"
                    value={newDoc.archiveId}
                    onChange={e => setNewDoc({ ...newDoc, archiveId: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white border border-blue-200 rounded-xl font-mono text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-black">ডকুমেন্ট শিরোনাম</label>
                <input 
                  type="text"
                  required
                  placeholder="যেমন: সরকারি চাকুরিজীবীদের বাড়ি ভাড়া ভাতা বৃদ্ধি সার্কুলার"
                  value={newDoc.title}
                  onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-black">ক্যাটাগরি</label>
                  <select 
                    value={newDoc.category}
                    onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500"
                  >
                    {categories.filter(c => c !== 'সকল').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-black">তারিখ</label>
                  <input 
                    type="date"
                    required
                    value={newDoc.docDate}
                    onChange={e => setNewDoc({ ...newDoc, docDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 font-black">স্মারক নম্বর</label>
                  <input 
                    type="text"
                    placeholder="যেমন: ০৭.০০.০০০০.১৬১.৩৮.০০১"
                    value={newDoc.memoNo}
                    onChange={e => setNewDoc({ ...newDoc, memoNo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-600 font-black">কর্তৃপক্ষ</label>
                  <input 
                    type="text"
                    placeholder="যেমন: অর্থ বিভাগ / সিএজি অফিস"
                    value={newDoc.authority}
                    onChange={e => setNewDoc({ ...newDoc, authority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600 font-black">বিবরণ</label>
                <textarea 
                  placeholder="ডকুমেন্টের প্রয়োজনীয় বিবরণ লিখুন..."
                  value={newDoc.description}
                  onChange={e => setNewDoc({ ...newDoc, description: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-blue-500 min-h-[80px]"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPublishing && <Loader2 size={15} className="animate-spin" />}
                  <span>
                    {isPublishing
                      ? (newDocFile ? 'Archive.org-এ আপলোড হচ্ছে...' : 'সংরক্ষণ হচ্ছে...')
                      : (editingDoc ? 'আপডেট করুন' : 'সরাসরি প্রকাশ করুন')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access & Subscription Modal */}
      <UnlockStatusModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        isSubscribed={isSubscribed}
        isAdmin={effectiveAdmin}
        whitelistedEmails={whitelistedEmails}
        currentUserEmail={currentUserEmail}
        sessionUserEmail={sessionUserEmail}
        whatsappNumber={paymentNumber}
        paymentNumber={paymentNumber}
        onUpdatePaymentNumber={handleUpdatePaymentNumber}
        onVerifyGmail={handleVerifyGmail}
        onActivateSubscription={(trxId, phone) => {
          setIsSubscribed(true);
        }}
        existingDocuments={documents}
        initialTab={modalInitialTab}
        onSetDemoState={(state) => {
          setIsSubscribed(state.isSubscribed);
          setDemoAdmin(state.isAdmin);
          if (state.demoEmail !== undefined) {
            setCurrentUserEmail(state.demoEmail);
          }
        }}
      />

      {/* Gmail Access & Whitelist Register Modal (Admin) */}
      <PendingDocsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        isAdmin={effectiveAdmin}
        whitelistedEmails={whitelistedEmails}
        onAddWhitelistedEmail={handleAddWhitelistedEmail}
        onRemoveWhitelistedEmail={handleRemoveWhitelistedEmail}
        whatsappNumber={paymentNumber}
        onUpdateWhatsappNumber={handleUpdatePaymentNumber}
      />

      {/* Active Session Lock Notice Modal */}
      {sessionLockedNotice && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-red-200">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner">
              <Lock size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">সক্রিয় সেশন স্থগিত করা হয়েছে</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              {sessionLockedNotice}
            </p>
            <button
              onClick={() => setSessionLockedNotice(null)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              ঠিক আছে (বন্ধ করুন)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocumentArchive;
