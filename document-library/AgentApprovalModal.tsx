import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Sparkles, FileText, Upload,
  ExternalLink, Trash2, Edit2, Check, RefreshCw, Send,
  ShieldCheck, Clock, Building, Calendar, Hash, Eye, EyeOff,
  Key, Settings, MessageSquare, Smartphone, ArrowRight, Loader2, QrCode, Link2, ArrowLeft, ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  analyzeDocumentWithAI,
  checkGeminiStatus,
  testGeminiConnection,
  DuplicateMatchInfo,
  ExistingDocCheckItem
} from './aiDocumentAnalyzer';

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
  archiveDownloadUrl?: string;
  source?: string;
  senderName?: string;
  status: 'pending';
  createdAt: string;
  fileData?: string;
}

interface AgentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentApproved: (doc: any) => void;
  pendingCount: number;
  onPendingCountChange: (count: number) => void;
  vaultDocuments?: any[];
}

const extractCleanId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/archive\.org\/(?:details|embed|download|stream)\/([^/?#]+)/i);
  if (match && match[1]) return match[1].trim();
  return trimmed.replace(/^https?:\/\/.*archive\.org\//i, '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
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
    return null;
  }
};

const stripFileDataFromPendingList = (items: PendingDoc[]): PendingDoc[] =>
  items.map(({ fileData: _omit, ...rest }) => rest);

const PendingDocPreview: React.FC<{ doc: PendingDoc; sessionDataUrl?: string }> = ({ doc, sessionDataUrl }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const rawData = sessionDataUrl || doc.fileData || '';
  const cleanId = extractCleanId(doc.archiveId || doc.archiveUrl || '');
  const isImageOriginal = Boolean(doc.originalFileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalFileName));

  useEffect(() => {
    setImgFailed(false);
    if (!rawData || !rawData.startsWith('data:') || rawData.startsWith('data:image/')) {
      setBlobUrl(null);
      return;
    }
    const url = createBlobUrlFromDataUrl(rawData);
    setBlobUrl(url);
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [rawData, doc.id]);

  if (rawData && rawData.startsWith('data:image/')) {
    return <img src={rawData} alt={doc.title} className="max-h-full max-w-full object-contain mx-auto" />;
  }

  if (rawData) {
    return (
      <iframe
        src={blobUrl || rawData}
        className="w-full h-full border-0"
        title={doc.title || 'Archive Document Preview'}
      />
    );
  }

  if (cleanId && isImageOriginal && !imgFailed && doc.originalFileName) {
    return (
      <img
        src={`https://archive.org/download/${cleanId}/${encodeURIComponent(doc.originalFileName)}`}
        alt={doc.title}
        className="max-h-full max-w-full object-contain mx-auto"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <iframe
      src={`https://archive.org/embed/${cleanId}`}
      className="w-full h-full border-0"
      title={doc.title || 'Archive Document Preview'}
    />
  );
};

// Strict Deduplication Helper Function
export const checkIsDuplicate = (
  candidate: { title?: string; archiveId?: string; archiveUrl?: string; memoNo?: string },
  vaultDocs: any[],
  pendingDocsList?: any[],
  currentId?: string
): { isDuplicate: boolean; reason?: string; matchedDoc?: any; location?: 'vault' | 'pending' } => {
  const cleanId = extractCleanId(candidate.archiveId || candidate.archiveUrl || '');
  const cleanMemo = (candidate.memoNo || '').trim().toLowerCase();
  const cleanTitle = (candidate.title || '').trim().toLowerCase();

  // 1. Check against Vault (Approved documents)
  if (Array.isArray(vaultDocs)) {
    for (const doc of vaultDocs) {
      if (!doc || (currentId && doc.id === currentId)) continue;

      const docArchiveId = extractCleanId(doc.archiveId || doc.archiveUrl || '');
      if (cleanId && docArchiveId && cleanId.toLowerCase() === docArchiveId.toLowerCase()) {
        return {
          isDuplicate: true,
          reason: 'একই Archive.org ফাইল লিঙ্ক বা আইডি',
          matchedDoc: doc,
          location: 'vault'
        };
      }

      if (cleanMemo && cleanMemo.length >= 3 && doc.memoNo) {
        if (doc.memoNo.trim().toLowerCase() === cleanMemo) {
          return {
            isDuplicate: true,
            reason: `একই স্মারক নম্বর (${doc.memoNo})`,
            matchedDoc: doc,
            location: 'vault'
          };
        }
      }

      if (cleanTitle && cleanTitle.length >= 5 && doc.title) {
        if (doc.title.trim().toLowerCase() === cleanTitle) {
          return {
            isDuplicate: true,
            reason: `একই শিরোনাম ("${doc.title}")`,
            matchedDoc: doc,
            location: 'vault'
          };
        }
      }
    }
  }

  // 2. Check against Pending List
  if (Array.isArray(pendingDocsList) && pendingDocsList.length > 0) {
    for (const pending of pendingDocsList) {
      if (!pending || (currentId && pending.id === currentId)) continue;

      const pArchiveId = extractCleanId(pending.archiveId || pending.archiveUrl || '');
      if (cleanId && pArchiveId && cleanId.toLowerCase() === pArchiveId.toLowerCase()) {
        return {
          isDuplicate: true,
          reason: 'অপেক্ষমাণ তালিকায় একই Archive.org লিঙ্ক বিদ্যমান',
          matchedDoc: pending,
          location: 'pending'
        };
      }

      if (cleanMemo && cleanMemo.length >= 3 && pending.memoNo) {
        if (pending.memoNo.trim().toLowerCase() === cleanMemo) {
          return {
            isDuplicate: true,
            reason: `অপেক্ষমাণ তালিকায় একই স্মারক নম্বর (${pending.memoNo}) বিদ্যমান`,
            matchedDoc: pending,
            location: 'pending'
          };
        }
      }

      if (cleanTitle && cleanTitle.length >= 5 && pending.title) {
        if (pending.title.trim().toLowerCase() === cleanTitle) {
          return {
            isDuplicate: true,
            reason: `অপেক্ষমাণ তালিকায় একই শিরোনাম ("${pending.title}") বিদ্যমান`,
            matchedDoc: pending,
            location: 'pending'
          };
        }
      }
    }
  }

  return { isDuplicate: false };
};

export const AgentApprovalModal: React.FC<AgentApprovalModalProps> = ({
  isOpen,
  onClose,
  onDocumentApproved,
  pendingCount,
  onPendingCountChange,
  vaultDocuments = []
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
  const ingestFormRef = useRef<HTMLFormElement>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [rawSelectedFile, setRawSelectedFile] = useState<File | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiWarningMessage, setAiWarningMessage] = useState<string | null>(null);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<{ active: boolean; model: string } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sessionPreviewMap, setSessionPreviewMap] = useState<Record<string, string>>({});
  const [isDirectServerSending, setIsDirectServerSending] = useState(false);
  const [directServerNotice, setDirectServerNotice] = useState<string | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const cachedFileDataUrlRef = useRef<string>('');
  const pendingDocsRef = useRef<PendingDoc[]>([]);
  const [aiDuplicateMatch, setAiDuplicateMatch] = useState<DuplicateMatchInfo | null>(null);
  const [ignoreSingleDuplicate, setIgnoreSingleDuplicate] = useState(false);

  // Multi-file Batch Upload Queue State
  type BatchItemStatus = 'queued' | 'uploading' | 'done' | 'duplicate' | 'error';
  interface BatchQueueItem {
    localId: string;
    file: File;
    sizeLabel: string;
    status: BatchItemStatus;
    title?: string;
    archiveId?: string;
    error?: string;
    duplicateInfo?: DuplicateMatchInfo;
    extractedData?: {
      title?: string;
      category?: string;
      authority?: string;
      memoNo?: string;
      docDate?: string;
      description?: string;
    };
  }
  const [batchItems, setBatchItems] = useState<BatchQueueItem[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const batchAbortRef = useRef<boolean>(false);
  const batchPanelRef = useRef<HTMLDivElement>(null);

  const buildExistingDocsPayload = (): ExistingDocCheckItem[] => {
    let vaultList: any[] = [];
    if (Array.isArray(vaultDocuments) && vaultDocuments.length > 0) {
      vaultList = vaultDocuments;
    } else {
      try {
        vaultList = JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]');
      } catch (e) {}
    }
    const merged: ExistingDocCheckItem[] = [];
    const seenIds = new Set<string>();
    const pushItem = (d: any, location: 'vault' | 'pending') => {
      if (!d || (!d.title && !d.memoNo)) return;
      const key = String(d.id || d.archiveId || `${location}_${d.title}_${d.memoNo}`);
      if (seenIds.has(key)) return;
      seenIds.add(key);
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
    vaultList.forEach(d => pushItem(d, 'vault'));
    pendingDocsRef.current.forEach(d => pushItem(d, 'pending'));
    return merged.slice(0, 75);
  };

  useEffect(() => {
    pendingDocsRef.current = pendingDocs;
  }, [pendingDocs]);

  useEffect(() => {
    checkGeminiStatus().then(res => setAiConnectionStatus(res)).catch(() => {});
  }, []);

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const result = await testGeminiConnection();
      setAiTestResult(result);
      if (result.success) {
        setAiConnectionStatus({ active: true, model: 'gemini-3.1-flash-lite' });
      }
    } catch (e: any) {
      setAiTestResult({ success: false, message: 'সংযোগ ব্যর্থ: ' + e.message });
    } finally {
      setIsTestingAi(false);
    }
  };

  // Load Pending Docs from Server, Supabase & LocalStorage
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

    // 1.5. Server Ingestion Queue
    try {
      const srvResp = await fetch('/api/agent/pending-documents');
      if (srvResp.ok) {
        const srvData = await srvResp.json();
        if (Array.isArray(srvData.pendingDocuments)) {
          srvData.pendingDocuments.forEach((pd: PendingDoc) => {
            if (pd && pd.id) {
              const existingIdx = list.findIndex(x => x.id === pd.id);
              if (existingIdx >= 0) {
                if (!list[existingIdx].fileData && pd.fileData) {
                  list[existingIdx].fileData = pd.fileData;
                }
              } else {
                list.unshift(pd);
              }
            }
          });
        }
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
          remoteList.forEach(d => {
            const existing = map.get(d.id);
            map.set(d.id, {
              ...(existing || {}),
              ...d,
              fileData: d.fileData || existing?.fileData || ''
            });
          });
          list = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          try {
            localStorage.setItem('pending_audit_documents', JSON.stringify(stripFileDataFromPendingList(list)));
          } catch (e) {}
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
    const candidateDoc = { ...doc, ...(overrides || {}) };

    // Strict Deduplication Check against Vault
    const vaultList = Array.isArray(vaultDocuments) && vaultDocuments.length > 0
      ? vaultDocuments
      : JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]');

    const dupCheck = checkIsDuplicate(candidateDoc, vaultList, [], doc.id);

    let targetDocId = `doc_${Date.now()}`;
    if (dupCheck.isDuplicate && dupCheck.matchedDoc) {
      const confirmReplace = confirm(
        `⚠️ ডাবল এন্ট্রি সতর্কতা (ডুপ্লিকেট নথি)!\n\nএই সার্কুলারটি ইতিমধ্যে মূল ভল্টে বিদ্যমান রয়েছে।\nমিল পাওয়ার কারণ: ${dupCheck.reason}\nবিদ্যমান নথির নাম: "${dupCheck.matchedDoc.title}"\nতারিখ: ${dupCheck.matchedDoc.docDate || 'অনির্দিষ্ট'}\n\nআপনি কি নতুন তথ্য দিয়ে পূর্ববর্তী নথিটি আপডেট/প্রতিস্থাপন করতে চান?\n[OK চাপলে পূর্বের নথিটি আপডেট হবে (ডাবল এন্ট্রি হবে না)]\n[Cancel চাপলে অনুমোদন স্থগিত থাকবে]`
      );
      if (!confirmReplace) return;

      // Update existing document instead of creating a second copy!
      targetDocId = dupCheck.matchedDoc.id;
    }

    const { fileData: _omitFileData, ...cleanBaseDoc } = doc as any;
    const { fileData: _omitOverrideFileData, ...cleanOverrides } = (overrides || {}) as any;

    const finalDoc = {
      ...cleanBaseDoc,
      ...cleanOverrides,
      id: targetDocId,
      status: 'approved' as const,
      uploadedBy: 'Admin (Approved)',
      createdAt: new Date().toISOString()
    };

    const sessionPreviewData = sessionPreviewMap[doc.id] || doc.fileData || (overrides as any)?.fileData || '';

    try {
      // 1. Save approved metadata pointer ONLY (no fileData) to Supabase
      if (isSupabaseConfigured) {
        await supabase.from('settlement_entries').upsert({
          id: finalDoc.id,
          content: JSON.stringify(finalDoc),
          created_at: finalDoc.createdAt
        });
        // 2. Delete pending from Supabase
        await supabase.from('settlement_entries').delete().eq('id', doc.id);
      }

      // 2.5. Save metadata to Server Storage
      try {
        await fetch('/api/admin/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc: finalDoc })
        });
        await fetch('/api/agent/pending-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteId: doc.id })
        });
      } catch (e) {}

      // 3. Update Local Storage (without fileData)
      const currentPending = stripFileDataFromPendingList(
        JSON.parse(localStorage.getItem('pending_audit_documents') || '[]')
          .filter((d: any) => d.id !== doc.id)
      );
      localStorage.setItem('pending_audit_documents', JSON.stringify(currentPending));

      const currentDocs = JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]')
        .map(({ fileData: _omit, ...rest }: any) => rest);
      const updatedDocs = [finalDoc, ...currentDocs.filter((d: any) => d.id !== finalDoc.id)];
      localStorage.setItem('audit_criteria_documents', JSON.stringify(updatedDocs));

      // 4. Notify parent state (pass in-memory session preview only, never persisted)
      onDocumentApproved(
        sessionPreviewData
          ? { ...finalDoc, _sessionPreviewData: sessionPreviewData }
          : finalDoc
      );
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
      localStorage.setItem('pending_audit_documents', JSON.stringify(stripFileDataFromPendingList(updated)));
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

    // Rule-based + AI Duplicate Check unless admin explicitly chose to ignore the warning
    const vaultList = Array.isArray(vaultDocuments) && vaultDocuments.length > 0
      ? vaultDocuments
      : JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]');

    const dupCheck = checkIsDuplicate(
      {
        title: ingestForm.title,
        archiveId: cleanId,
        archiveUrl: `https://archive.org/details/${cleanId}`,
        memoNo: ingestForm.memoNo
      },
      vaultList,
      pendingDocs
    );

    const activeDup: DuplicateMatchInfo | null = aiDuplicateMatch
      ? aiDuplicateMatch
      : dupCheck.isDuplicate && dupCheck.matchedDoc
      ? {
          isDuplicate: true,
          matchedId: dupCheck.matchedDoc.id,
          matchedTitle: dupCheck.matchedDoc.title,
          matchedMemoNo: dupCheck.matchedDoc.memoNo,
          matchedDocDate: dupCheck.matchedDoc.docDate,
          location: dupCheck.location,
          reason: dupCheck.reason || 'শিরোনাম বা স্মারক নম্বর পূর্ববর্তী নথির সাথে মিলে গেছে।'
        }
      : null;

    if (activeDup && !ignoreSingleDuplicate) {
      if (!aiDuplicateMatch) setAiDuplicateMatch(activeDup);
      setIngestError(
        `⚠️ এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে (পূর্বের শিরোনাম: "${activeDup.matchedTitle}")। যদি এটি ভিন্ন নথি হয় তবে উপরের সতর্কবার্তায় "সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে আপলোড করুন" বাটনে ক্লিক করে পুনরায় জমা দিন।`
      );
      setIsSubmittingIngest(false);
      return;
    }

    let pendingDoc: PendingDoc;
    let inMemoryDataUrl = '';

    if (rawSelectedFile) {
      try {
        const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        inMemoryDataUrl = await toDataUrl(rawSelectedFile);
        const fileBase64 = inMemoryDataUrl.includes(',') ? inMemoryDataUrl.split(',')[1] : inMemoryDataUrl;

        let savedToSupabaseOnServer = false;

        const resp = await fetch("/api/agent/process-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            fileName: rawSelectedFile.name,
            mimeType: rawSelectedFile.type,
            archiveId: cleanId,
            title: ingestForm.title.trim(),
            category: ingestForm.category || 'সার্কুলার',
            authority: ingestForm.authority.trim() || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
            memoNo: ingestForm.memoNo.trim(),
            docDate: ingestForm.docDate || new Date().toISOString().split('T')[0],
            description: ingestForm.description.trim() || 'হোয়াটসঅ্যাপ/মোবাইল থেকে সংগৃহীত সার্কুলার।',
            source: 'WhatsApp / Mobile Upload',
            senderName: 'এডমিন ইনজেস্ট',
            savePendingOnServer: true,
            existingDocs: ignoreSingleDuplicate ? undefined : buildExistingDocsPayload(),
            ignoreDuplicate: ignoreSingleDuplicate
          })
        });

        const data = await resp.json().catch(() => ({}));
        if (data.duplicateDetected && data.duplicateInfo) {
          setAiDuplicateMatch(data.duplicateInfo);
          setIgnoreSingleDuplicate(false);
          setIngestError(
            `⚠️ এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে (পূর্বের শিরোনাম: "${data.duplicateInfo.matchedTitle}")। ভিন্ন নথি হলে উপরের "উপেক্ষা করে আলাদা নথি হিসেবে আপলোড করুন" বাটনে ক্লিক করুন।`
          );
          setIsSubmittingIngest(false);
          return;
        }
        if (!resp.ok || !data.success || !data.uploadedToArchive || !data.pendingDocument) {
          throw new Error(data.error || "Archive.org-এ ফাইল আপলোড সম্পন্ন হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
        }

        savedToSupabaseOnServer = Boolean(data.savedToSupabaseOnServer);
        const { fileData: _omitFileData, ...cleanPending } = data.pendingDocument;
        pendingDoc = {
          ...cleanPending,
          archiveId: data.archiveId || cleanPending.archiveId || cleanId,
          archiveUrl: data.archiveUrl || cleanPending.archiveUrl || `https://archive.org/details/${cleanId}`,
          archiveDownloadUrl: data.archiveDownloadUrl || cleanPending.archiveDownloadUrl,
          originalFileName: data.originalFileName || cleanPending.originalFileName || rawSelectedFile.name,
          status: 'pending'
        };

        if (inMemoryDataUrl) {
          setSessionPreviewMap(prev => ({ ...prev, [pendingDoc.id]: inMemoryDataUrl }));
        }

        if (isSupabaseConfigured && !savedToSupabaseOnServer) {
          await supabase.from('settlement_entries').upsert({
            id: pendingDoc.id,
            content: JSON.stringify(pendingDoc),
            created_at: pendingDoc.createdAt
          });
        }
      } catch (uploadErr: any) {
        setIngestError('❌ Archive.org আপলোড ব্যর্থ: ' + (uploadErr?.message || 'ফাইলটি Archive.org-এ পাঠানো যায়নি। Supabase-এ কোনো ফাইল সংরক্ষণ করা হয়নি।'));
        setIsSubmittingIngest(false);
        return;
      }
    } else {
      pendingDoc = {
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

      if (isSupabaseConfigured) {
        await supabase.from('settlement_entries').upsert({
          id: pendingDoc.id,
          content: JSON.stringify(pendingDoc),
          created_at: pendingDoc.createdAt
        });
      }
    }

    try {
      // Save to LocalStorage (without fileData)
      const updated = [pendingDoc, ...pendingDocs.filter(d => d.id !== pendingDoc.id)];
      setPendingDocs(updated);
      localStorage.setItem('pending_audit_documents', JSON.stringify(stripFileDataFromPendingList(updated)));
      onPendingCountChange(updated.length);

      setIngestSuccess(`"${pendingDoc.title}" সফলভাবে Archive.org-এ আপলোড ও অপেক্ষমাণ তালিকায় জমা হয়েছে!`);
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
      setSelectedFileMeta(null);
      setRawSelectedFile(null);
      cachedFileDataUrlRef.current = '';
      setAiSuccessMessage(null);
      setDirectServerNotice(null);
      setAiDuplicateMatch(null);
      setIgnoreSingleDuplicate(false);

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

  // Direct 1-Click Server Auto-Process: sends file straight to server for AI + Archive.org + Supabase Pending Queue
  const handleDirectServerAutoIngest = async () => {
    if (!rawSelectedFile || isDirectServerSending || isSubmittingIngest) return;

    if (aiDuplicateMatch && !ignoreSingleDuplicate) {
      setIngestError(
        `⚠️ এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে (পূর্বের শিরোনাম: "${aiDuplicateMatch.matchedTitle}")। ভিন্ন নথি হলে নিচের সতর্কবার্তায় "সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে আপলোড করুন" বাটনে ক্লিক করে তারপর আবার পাঠান।`
      );
      return;
    }

    // Cancel any ongoing browser-side AI wait immediately
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
      aiAbortRef.current = null;
    }
    setIsAnalyzingAI(false);
    setAiWarningMessage(null);
    setIngestError(null);
    setIngestSuccess(null);
    setIsDirectServerSending(true);
    setDirectServerNotice(
      '🚀 ফাইলটি সরাসরি সার্ভারে পাঠানো হচ্ছে... ডুপ্লিকেট যাচাই ও Archive.org-এ আপলোড চলছে।'
    );

    try {
      let dataUrl = cachedFileDataUrlRef.current;
      if (!dataUrl) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(rawSelectedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = err => reject(err);
        });
        cachedFileDataUrlRef.current = dataUrl;
      }

      const fileBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const cleanId =
        extractCleanId(ingestForm.archiveIdOrLink) ||
        `bd_audit_${rawSelectedFile.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25)}_${Date.now()}`;

      const resp = await fetch('/api/agent/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          fileName: rawSelectedFile.name,
          mimeType: rawSelectedFile.type,
          archiveId: cleanId,
          title: ingestForm.title.trim() || undefined,
          category: ingestForm.category || undefined,
          authority: ingestForm.authority !== 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার' ? ingestForm.authority.trim() : undefined,
          memoNo: ingestForm.memoNo.trim() || undefined,
          docDate: ingestForm.docDate || undefined,
          description: ingestForm.description.trim() || undefined,
          source: ingestForm.source || 'Direct Server Auto-Ingest',
          senderName: 'এডমিন (অটো-প্রসেস)',
          autoAnalyze: true,
          savePendingOnServer: true,
          existingDocs: ignoreSingleDuplicate ? undefined : buildExistingDocsPayload(),
          ignoreDuplicate: ignoreSingleDuplicate
        })
      });

      const data = await resp.json().catch(() => ({}));
      if (data.duplicateDetected && data.duplicateInfo) {
        setDirectServerNotice(null);
        setAiDuplicateMatch(data.duplicateInfo);
        setIgnoreSingleDuplicate(false);
        if (data.extractedData) {
          setIngestForm(prev => ({
            ...prev,
            title: prev.title || data.extractedData.title || prev.title,
            category: data.extractedData.category || prev.category,
            authority: data.extractedData.authority || prev.authority,
            memoNo: prev.memoNo || data.extractedData.memoNo || prev.memoNo,
            docDate: data.extractedData.docDate || prev.docDate,
            description: prev.description || data.extractedData.description || prev.description,
            archiveIdOrLink: prev.archiveIdOrLink || cleanId
          }));
        }
        return;
      }

      if (!resp.ok || !data.success || !data.uploadedToArchive || !data.pendingDocument) {
        throw new Error(data.error || 'সার্ভারে অটো-প্রসেস সম্পন্ন হয়নি।');
      }

      const { fileData: _omitFileData, ...cleanPending } = data.pendingDocument;
      const pendingDoc: PendingDoc = {
        ...cleanPending,
        archiveId: data.archiveId || cleanPending.archiveId || cleanId,
        archiveUrl: data.archiveUrl || cleanPending.archiveUrl || `https://archive.org/details/${cleanId}`,
        archiveDownloadUrl: data.archiveDownloadUrl || cleanPending.archiveDownloadUrl,
        originalFileName: data.originalFileName || cleanPending.originalFileName || rawSelectedFile.name,
        status: 'pending'
      };

      if (dataUrl) {
        setSessionPreviewMap(prev => ({ ...prev, [pendingDoc.id]: dataUrl }));
      }

      if (isSupabaseConfigured && !data.savedToSupabaseOnServer) {
        await supabase.from('settlement_entries').upsert({
          id: pendingDoc.id,
          content: JSON.stringify(pendingDoc),
          created_at: pendingDoc.createdAt
        });
      }

      const updated = [pendingDoc, ...pendingDocs.filter(d => d.id !== pendingDoc.id)];
      setPendingDocs(updated);
      localStorage.setItem('pending_audit_documents', JSON.stringify(stripFileDataFromPendingList(updated)));
      onPendingCountChange(updated.length);

      setDirectServerNotice(null);
      setIngestSuccess(
        `✅ "${pendingDoc.title}" সার্ভার নিজেই Archive.org-এ আপলোড ও অপেক্ষমাণ তালিকায় জমা করেছে!`
      );
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
      setSelectedFileMeta(null);
      setRawSelectedFile(null);
      cachedFileDataUrlRef.current = '';
      setAiSuccessMessage(null);
      setAiDuplicateMatch(null);
      setIgnoreSingleDuplicate(false);

      setTimeout(() => {
        setActiveTab('pending');
        setIngestSuccess(null);
      }, 1200);
    } catch (err: any) {
      setDirectServerNotice(null);
      setIngestError('❌ সরাসরি সার্ভার প্রসেস ব্যর্থ: ' + (err?.message || 'আবার চেষ্টা করুন।'));
    } finally {
      setIsDirectServerSending(false);
    }
  };

  // Sequential Batch Processor for Multi-File Selection
  const runBatchUploadQueue = async (
    itemsToProcess: BatchQueueItem[],
    forceIgnoreIds?: Set<string>
  ) => {
    if (itemsToProcess.length === 0) return;
    batchAbortRef.current = false;
    setIsBatchRunning(true);
    setIngestError(null);
    setIngestSuccess(null);

    const readFileAsDataUrl = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = err => reject(err);
      });

    for (let i = 0; i < itemsToProcess.length; i++) {
      const target = itemsToProcess[i];
      const shouldForceIgnore = Boolean(forceIgnoreIds?.has(target.localId));
      if (target.status === 'done') continue;
      if (target.status === 'duplicate' && !shouldForceIgnore) continue;
      if (batchAbortRef.current) break;

      setBatchItems(prev =>
        prev.map(it =>
          it.localId === target.localId
            ? { ...it, status: 'uploading', error: undefined }
            : it
        )
      );

      try {
        const dataUrl = await readFileAsDataUrl(target.file);
        const fileBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const detectedMime =
          target.file.type || (target.file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
        const uniqueSuffix = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
        const cleanId = `bd_audit_${target.file.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 22)}_${uniqueSuffix}`;

        const resp = await fetch('/api/agent/process-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64,
            fileName: target.file.name,
            mimeType: detectedMime,
            archiveId: cleanId,
            title: shouldForceIgnore ? target.extractedData?.title : undefined,
            category: shouldForceIgnore ? target.extractedData?.category : undefined,
            authority: shouldForceIgnore ? target.extractedData?.authority : undefined,
            memoNo: shouldForceIgnore ? target.extractedData?.memoNo : undefined,
            docDate: shouldForceIgnore ? target.extractedData?.docDate : undefined,
            description: shouldForceIgnore ? target.extractedData?.description : undefined,
            source: ingestForm.source || 'Batch Multi-Upload',
            senderName: 'এডমিন (ব্যাচ অটো-প্রসেস)',
            autoAnalyze: !shouldForceIgnore,
            savePendingOnServer: true,
            existingDocs: shouldForceIgnore ? undefined : buildExistingDocsPayload(),
            ignoreDuplicate: shouldForceIgnore
          })
        });

        const data = await resp.json().catch(() => ({}));
        if (data.duplicateDetected && data.duplicateInfo) {
          setBatchItems(prev =>
            prev.map(it =>
              it.localId === target.localId
                ? {
                    ...it,
                    status: 'duplicate',
                    title: data.extractedData?.title || it.title,
                    duplicateInfo: data.duplicateInfo,
                    extractedData: data.extractedData
                  }
                : it
            )
          );
          continue;
        }

        if (!resp.ok || !data.success || !data.uploadedToArchive || !data.pendingDocument) {
          throw new Error(data.error || 'Archive.org-এ আপলোড সম্পন্ন হয়নি।');
        }

        const { fileData: _omitFileData, ...cleanPending } = data.pendingDocument;
        const pendingDoc: PendingDoc = {
          ...cleanPending,
          archiveId: data.archiveId || cleanPending.archiveId || cleanId,
          archiveUrl: data.archiveUrl || cleanPending.archiveUrl || `https://archive.org/details/${cleanId}`,
          archiveDownloadUrl: data.archiveDownloadUrl || cleanPending.archiveDownloadUrl,
          originalFileName: data.originalFileName || cleanPending.originalFileName || target.file.name,
          status: 'pending'
        };

        if (dataUrl) {
          setSessionPreviewMap(prev => ({ ...prev, [pendingDoc.id]: dataUrl }));
        }

        if (isSupabaseConfigured && !data.savedToSupabaseOnServer) {
          await supabase.from('settlement_entries').upsert({
            id: pendingDoc.id,
            content: JSON.stringify(pendingDoc),
            created_at: pendingDoc.createdAt
          });
        }

        const nextPending = [pendingDoc, ...pendingDocsRef.current.filter(d => d.id !== pendingDoc.id)];
        pendingDocsRef.current = nextPending;
        setPendingDocs(nextPending);
        try {
          localStorage.setItem('pending_audit_documents', JSON.stringify(stripFileDataFromPendingList(nextPending)));
        } catch (e) {}
        onPendingCountChange(nextPending.length);

        setBatchItems(prev =>
          prev.map(it =>
            it.localId === target.localId
              ? {
                  ...it,
                  status: 'done',
                  title: pendingDoc.title,
                  archiveId: pendingDoc.archiveId,
                  duplicateInfo: undefined
                }
              : it
          )
        );
      } catch (err: any) {
        setBatchItems(prev =>
          prev.map(it =>
            it.localId === target.localId
              ? { ...it, status: 'error', error: err?.message || 'আপলোড ব্যর্থ হয়েছে' }
              : it
          )
        );
      }
    }

    setIsBatchRunning(false);
  };

  // Fast Ingest via File Picker (Supports single OR multiple files!)
  const handleFastIngestFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Multi-file Batch Upload Mode
    if (files.length > 1) {
      if (aiAbortRef.current) {
        aiAbortRef.current.abort();
        aiAbortRef.current = null;
      }
      setIsAnalyzingAI(false);
      setAiSuccessMessage(null);
      setAiWarningMessage(null);
      setAiDuplicateMatch(null);
      setIgnoreSingleDuplicate(false);
      setDirectServerNotice(null);
      setIngestError(null);
      setIngestSuccess(null);
      setRawSelectedFile(null);
      setSelectedFileMeta(null);
      cachedFileDataUrlRef.current = '';

      const newItems: BatchQueueItem[] = files.map((file, idx) => ({
        localId: `batch_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        sizeLabel: `${(file.size / 1024).toFixed(1)} KB`,
        status: 'queued'
      }));

      setBatchItems(newItems);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        if (batchPanelRef.current) {
          batchPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);

      void runBatchUploadQueue(newItems);
      return;
    }

    // Single-file Mode (Original Interactive Auto-Fill Flow)
    const file = files[0];
    setBatchItems([]);
    setAiDuplicateMatch(null);
    setIgnoreSingleDuplicate(false);

    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
    }
    const controller = new AbortController();
    aiAbortRef.current = controller;

    const autoArchiveId = `bd_audit_${file.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 25)}_${Date.now()}`;
    const sizeInKb = (file.size / 1024).toFixed(1);
    const detectedMime = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    cachedFileDataUrlRef.current = '';
    setDirectServerNotice(null);
    setIngestError(null);
    setRawSelectedFile(file);
    setSelectedFileMeta({
      name: file.name,
      size: `${sizeInKb} KB`,
      type: detectedMime
    });

    setAiSuccessMessage(null);
    setAiWarningMessage(null);
    setIsAnalyzingAI(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      cachedFileDataUrlRef.current = dataUrl;

      if (controller.signal.aborted) {
        setIsAnalyzingAI(false);
        return;
      }

      // Smart Multimodal AI Vision & OCR Extraction + Content-based Duplicate Check
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
          setIngestForm(prev => ({
            ...prev,
            title: aiResult.data!.title || prev.title,
            category: aiResult.data!.category || prev.category,
            authority: aiResult.data!.authority || prev.authority,
            memoNo: aiResult.data!.memoNo || prev.memoNo,
            docDate: aiResult.data!.docDate || prev.docDate,
            description: aiResult.data!.description || `ফাইল: ${file.name} (আকার: ${sizeInKb} KB)`,
            archiveIdOrLink: autoArchiveId
          }));
          setAiSuccessMessage('✨ এআই সফলভাবে ডকুমেন্টের আসল বিষয় ও তথ্য পূরণ করেছে');
          setAiWarningMessage(null);
          if (aiResult.duplicateMatch && aiResult.duplicateMatch.isDuplicate) {
            setAiDuplicateMatch(aiResult.duplicateMatch);
            setIgnoreSingleDuplicate(false);
          }
        } else if (aiResult.apiKeyMissing) {
          setAiWarningMessage('⚠️ জেমিনি এপিআই কী (GEMINI_API_KEY) সেট করা নেই! Vercel Settings > Environment Variables-এ GEMINI_API_KEY যুক্ত করুন, অথবা নিচে তথ্যগুলো ম্যানুয়ালি পূরণ করুন।');
        } else if (aiResult.error) {
          const errStr = String(aiResult.error);
          if (errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE')) {
            setAiWarningMessage('⚠️ জেমিনি সার্ভারে সাময়িক উচ্চ চাপ (High Demand) রয়েছে। অনুগ্রহ করে ৫-১০ সেকেন্ড পর আবার ফাইলটি নির্বাচন করুন অথবা নিচের “সরাসরি সার্ভারে পাঠান” বাটন ব্যবহার করুন।');
          } else if (errStr.includes('free tier is not available') || errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) {
            setAiWarningMessage('⚠️ আপনার এই Google Project-টিতে Free Tier সক্রিয় নেই। সমাধান: Google AI Studio (aistudio.google.com) থেকে আপনার ব্যক্তিগত @gmail.com অ্যাকাউন্টে "Create API key in new project" সিলেক্ট করে সম্পূর্ণ নতুন একটি ফ্রি কী তৈরি করে Vercel-এ যোগ করুন (কোনো কার্ডের প্রয়োজন নেই)।');
          } else {
            setAiWarningMessage(`⚠️ এআই বিশ্লেষণ সম্পন্ন হয়নি: ${aiResult.error}`);
          }
        }
      } catch (aiErr: any) {
        if (!controller.signal.aborted) {
          console.warn('AI agent document analysis error:', aiErr);
          setAiWarningMessage('⚠️ এআই নথিটি পড়তে পারেনি। অনুগ্রহ করে ম্যানুয়ালি তথ্য পূরণ করুন বা সরাসরি সার্ভারে পাঠান।');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAnalyzingAI(false);
        }
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';

    // ফাইল সিলেক্ট করার পর স্বয়ংক্রিয়ভাবে পেজটি/ফরমটি কিছুটা নিচে নিয়ে যাবে যেন সম্পূর্ণ ফরমটির তথ্য দেখা যায়
    setTimeout(() => {
      if (ingestFormRef.current) {
        ingestFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* Main Page Container - 100% Full Width */}
      <div className="bg-white rounded-2xl shadow-xl w-full border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Page Header Banner */}
        <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
              title="অডিট ক্রাইটেরিয়া ভল্টে ফিরে যান"
              aria-label="ভল্টে ফিরে যান"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
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

                    const vaultList = Array.isArray(vaultDocuments) && vaultDocuments.length > 0
                      ? vaultDocuments
                      : JSON.parse(localStorage.getItem('audit_criteria_documents') || '[]');

                    const cardCandidate = isEditing ? { ...doc, ...editForm } : doc;
                    const dupCheck = checkIsDuplicate(cardCandidate, vaultList, [], doc.id);

                    return (
                      <div 
                        key={doc.id}
                        className={`bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative ${
                          dupCheck.isDuplicate ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                        }`}
                      >
                        {/* Top Badges & Source */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                              {doc.category || 'সার্কুলার'}
                            </span>
                            {dupCheck.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertTriangle size={10} className="text-amber-600" /> ডুপ্লিকেট সার্কুলার
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Clock size={10} /> এডমিন অনুমোদন প্রয়োজন
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                              <Smartphone size={12} className="text-emerald-600" />
                              উৎস: {doc.source || 'WhatsApp/Messenger'}
                            </span>
                          </div>
                        </div>

                        {/* Duplicate Alert Banner */}
                        {dupCheck.isDuplicate && (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 font-bold animate-in fade-in duration-200">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <span className="font-black text-amber-800">⚠️ ডাবল এন্ট্রি শনাক্ত: </span>
                              <span>{dupCheck.reason}! ভল্টে ইতিমধ্যে বিদ্যমান রয়েছে (পূর্বে সংরক্ষিত নথির নাম: &quot;{dupCheck.matchedDoc?.title}&quot;)।</span>
                            </div>
                          </div>
                        )}

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
                          <div className="mt-3 border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-80 transition-all flex items-center justify-center">
                            <PendingDocPreview doc={doc} sessionDataUrl={sessionPreviewMap[doc.id]} />
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
                                className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                                  dupCheck.isDuplicate
                                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                }`}
                              >
                                {dupCheck.isDuplicate ? (
                                  <>
                                    <RefreshCw size={14} /> পূর্বের নথি আপডেট/প্রতিস্থাপন করুন
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} /> অনুমোদন দিন (ভল্টে প্রকাশ করুন)
                                  </>
                                )}
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
                    হোয়াটসঅ্যাপ বা মেসেঞ্জার থেকে পাওয়া <strong className="text-emerald-700">এক বা একাধিক সার্কুলার ফাইল</strong> (PDF বা ছবি) একসাথে বাছতে পারবেন—প্রতিটি স্বয়ংক্রিয়ভাবে AI দিয়ে পড়া ও Archive.org-এ আপলোড হবে।
                  </p>
                </div>

                <div className="pt-1">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleFastIngestFile}
                    className="hidden"
                    id="fast-ingest-file"
                  />
                  <label
                    htmlFor="fast-ingest-file"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Upload size={14} /> ফাইল থেকে অটো-পূরণ করুন (এক বা একাধিক)
                  </label>

                  {/* AI Status & 1-Click Test Button */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border transition-all ${
                      aiConnectionStatus?.active 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${aiConnectionStatus?.active ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`}></span>
                      {aiConnectionStatus?.active ? 'জেমিনি এআই সংযুক্ত (AI Ready)' : 'জেমিনি এআই কী আনসেট (ম্যানুয়াল মোড)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleTestAi}
                      disabled={isTestingAi}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-[11px] font-black border border-slate-300 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      title="জেমিনি এপিআই সংযোগ পরীক্ষা করুন"
                    >
                      {isTestingAi ? <Loader2 size={12} className="animate-spin text-blue-600" /> : <Sparkles size={12} className="text-blue-600" />}
                      <span>{isTestingAi ? 'পরীক্ষা চলছে...' : 'এআই টেস্ট করুন'}</span>
                    </button>
                  </div>

                  {aiTestResult && (
                    <div className={`mt-2 p-2.5 rounded-xl text-xs font-bold max-w-md mx-auto animate-in fade-in ${
                      aiTestResult.success 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                        : 'bg-rose-50 text-rose-800 border border-rose-300'
                    }`}>
                      <div className="flex items-center justify-center gap-1.5">
                        {aiTestResult.success ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-rose-600" />}
                        <span>{aiTestResult.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-File Batch Upload Progress Queue */}
              {batchItems.length > 0 && (
                <div
                  ref={batchPanelRef}
                  className="bg-white border-2 border-indigo-200 rounded-3xl p-5 space-y-4 shadow-sm scroll-mt-6 animate-in fade-in duration-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isBatchRunning ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isBatchRunning ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          একাধিক ফাইল ব্যাচ আপলোড ({toBengaliDigits(batchItems.filter(i => i.status === 'done').length)}/{toBengaliDigits(batchItems.length)} সম্পন্ন)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold">
                          {isBatchRunning
                            ? 'একটির পর একটি ফাইল AI দিয়ে পড়ে সরাসরি Archive.org ও অপেক্ষমাণ তালিকায় জমা হচ্ছে...'
                            : 'ব্যাচ প্রসেস শেষ হয়েছে। সম্পন্ন হওয়া নথিগুলো "অপেক্ষমাণ নথি" ট্যাবে জমা হয়েছে।'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isBatchRunning && (
                        <button
                          type="button"
                          onClick={() => { batchAbortRef.current = true; }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                        >
                          বাকিগুলো থামান
                        </button>
                      )}
                      {!isBatchRunning && batchItems.some(i => i.status === 'error' || i.status === 'queued') && (
                        <button
                          type="button"
                          onClick={() => void runBatchUploadQueue(batchItems)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> বাকি/ব্যর্থ ফাইল আবার চালান
                        </button>
                      )}
                      {!isBatchRunning && batchItems.some(i => i.status === 'done') && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('pending')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
                        >
                          <ArrowRight size={12} /> অপেক্ষমাণ তালিকায় যান
                        </button>
                      )}
                      {!isBatchRunning && (
                        <button
                          type="button"
                          onClick={() => setBatchItems([])}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="তালিকা পরিষ্কার করুন"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {batchItems.map((item, idx) => (
                      <div
                        key={item.localId}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          item.status === 'done'
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : item.status === 'uploading'
                            ? 'bg-indigo-50/90 border-indigo-300'
                            : item.status === 'duplicate'
                            ? 'bg-amber-50/90 border-amber-300'
                            : item.status === 'error'
                            ? 'bg-rose-50/80 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[10px] font-black text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            {toBengaliDigits(idx + 1)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 truncate">
                              {item.title || item.file.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                              <span className="truncate max-w-[200px]">{item.file.name}</span>
                              <span>• {item.sizeLabel}</span>
                              {item.archiveId && <span className="text-emerald-700 font-mono">ID: {item.archiveId}</span>}
                            </div>
                            {item.status === 'duplicate' && item.duplicateInfo && (
                              <div className="mt-1.5 p-2 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 space-y-0.5">
                                <p className="text-[11px] font-black">
                                  ⚠️ এটি পূর্বেই আপলোড করা হয়েছে ({item.duplicateInfo.location === 'pending' ? 'অপেক্ষমাণ তালিকায়' : 'মূল ভল্টে'})
                                </p>
                                <p className="text-[11px] font-bold">
                                  পূর্বের শিরোনাম: &ldquo;{item.duplicateInfo.matchedTitle}&rdquo;
                                  {item.duplicateInfo.matchedDocDate ? ` • তারিখ: ${item.duplicateInfo.matchedDocDate}` : ''}
                                </p>
                                <p className="text-[10px] text-amber-800">{item.duplicateInfo.reason}</p>
                              </div>
                            )}
                            {item.error && (
                              <p className="text-[11px] font-bold text-rose-700 mt-1 break-words">{item.error}</p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          {item.status === 'queued' && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-black">
                              অপেক্ষায়...
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black">
                              <Loader2 size={11} className="animate-spin" /> AI ও Archive.org...
                            </span>
                          )}
                          {item.status === 'done' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                              <CheckCircle2 size={11} /> সম্পন্ন
                            </span>
                          )}
                          {item.status === 'duplicate' && (
                            <button
                              type="button"
                              disabled={isBatchRunning}
                              onClick={() => void runBatchUploadQueue([item], new Set([item.localId]))}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[10px] font-black shadow-xs transition-all cursor-pointer active:scale-95"
                              title="সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে Archive.org-এ আপলোড করুন"
                            >
                              <Upload size={11} /> উপেক্ষা করে আপলোড করুন
                            </button>
                          )}
                          {item.status === 'error' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black">
                              <AlertCircle size={11} /> ব্যর্থ
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingest Form */}
              <form 
                ref={ingestFormRef} 
                onSubmit={handleFastIngestSubmit} 
                className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm scroll-mt-6"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">১</span>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    সার্কুলারের তথ্য প্রদান করুন
                  </h4>
                </div>

                {/* সংযুক্ত ডকুমেন্টের স্ট্যাটাস ও আইকন - যাতে এডমিন স্পষ্ট বুঝতে পারেন ডকুমেন্ট যুক্ত হয়েছে */}
                {selectedFileMeta && (
                  <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            ডকুমেন্ট যুক্ত হয়েছে
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 font-bold">
                            {selectedFileMeta.size}
                          </span>
                        </div>
                        <p className="text-xs font-black text-slate-800 truncate" title={selectedFileMeta.name}>
                          {selectedFileMeta.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleDirectServerAutoIngest}
                        disabled={isDirectServerSending || isSubmittingIngest}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-[11px] font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        title="ফর্ম পূরণের অপেক্ষা না করে সরাসরি সার্ভারে পাঠান—সার্ভারে পৌঁছানোর পর কম্পিউটার অফ করলেও কাজ চলবে"
                      >
                        {isDirectServerSending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        <span>{isDirectServerSending ? 'সার্ভারে পাঠানো হচ্ছে...' : 'সরাসরি সার্ভারে পাঠান (অটো)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (aiAbortRef.current) {
                            aiAbortRef.current.abort();
                            aiAbortRef.current = null;
                          }
                          cachedFileDataUrlRef.current = '';
                          setIsAnalyzingAI(false);
                          setSelectedFileMeta(null);
                          setRawSelectedFile(null);
                          setAiSuccessMessage(null);
                          setAiWarningMessage(null);
                          setAiDuplicateMatch(null);
                          setIgnoreSingleDuplicate(false);
                          setDirectServerNotice(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="ডকুমেন্ট সরান"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {directServerNotice && (
                  <div className="p-3 bg-indigo-50 border border-indigo-300 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-indigo-900 animate-in fade-in">
                    <Loader2 size={16} className="animate-spin text-indigo-600 shrink-0 mt-0.5" />
                    <span>{directServerNotice}</span>
                  </div>
                )}

                {/* AI Analysis Loader & Status */}
                {isAnalyzingAI && (
                  <div className="p-3 bg-blue-50/90 border border-blue-300 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs font-black text-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      <span>🤖 এআই ডকুমেন্টটি পড়ছে ও পূর্ববর্তী নথির সাথে মিল যাচাই করছে...</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDirectServerAutoIngest}
                      disabled={isDirectServerSending}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <ArrowRight size={12} />
                      <span>অপেক্ষা না করে সরাসরি সার্ভারে পাঠান</span>
                    </button>
                  </div>
                )}

                {aiSuccessMessage && !isAnalyzingAI && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-800 animate-in fade-in">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{aiSuccessMessage}</span>
                  </div>
                )}

                {/* Smart AI Duplicate Warning Card with Previous Title & Admin Ignore Override */}
                {aiDuplicateMatch && !isAnalyzingAI && (
                  <div className={`p-4 rounded-2xl border-2 space-y-2.5 animate-in fade-in shadow-sm ${
                    ignoreSingleDuplicate
                      ? 'bg-sky-50 border-sky-300 text-sky-950'
                      : 'bg-amber-50 border-amber-400 text-amber-950'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={20} className={`${ignoreSingleDuplicate ? 'text-sky-600' : 'text-amber-600'} shrink-0 mt-0.5`} />
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-xs font-black">
                          {ignoreSingleDuplicate
                            ? '✓ সতর্কবার্তা উপেক্ষা করা হয়েছে — এডমিন এটিকে আলাদা নথি হিসেবে আপলোডের অনুমতি দিয়েছেন'
                            : '⚠️ সতর্কতা: এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে!'}
                        </p>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-xs space-y-0.5">
                          <p className="font-black text-slate-900">
                            পূর্বের আপলোডকৃত নথির শিরোনাম: &ldquo;{aiDuplicateMatch.matchedTitle}&rdquo;
                          </p>
                          <p className="text-[11px] font-bold text-slate-600">
                            অবস্থান: {aiDuplicateMatch.location === 'pending' ? 'অপেক্ষমাণ তালিকা' : 'মূল ক্রাইটেরিয়া ভল্ট'}
                            {aiDuplicateMatch.matchedMemoNo ? ` • স্মারক: ${aiDuplicateMatch.matchedMemoNo}` : ''}
                            {aiDuplicateMatch.matchedDocDate ? ` • তারিখ: ${aiDuplicateMatch.matchedDocDate}` : ''}
                          </p>
                          <p className="text-[11px] font-medium text-amber-900">
                            এআই যাচাইয়ের কারণ: {aiDuplicateMatch.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {!ignoreSingleDuplicate ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIgnoreSingleDuplicate(true);
                            setIngestError(null);
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 size={13} />
                          <span>সতর্কবার্তা উপেক্ষা করে এটি আলাদা নথি হিসেবে আপলোড করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIgnoreSingleDuplicate(false)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-black transition-all cursor-pointer"
                        >
                          পূর্বাবস্থায় ফিরুন
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {aiWarningMessage && !isAnalyzingAI && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs font-bold text-amber-900 animate-in fade-in shadow-xs">
                    <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>{aiWarningMessage}</p>
                      {aiWarningMessage.includes('GEMINI_API_KEY') && (
                        <p className="text-[11px] text-amber-700 font-normal leading-relaxed">
                          📌 <strong>করণীয়:</strong> Vercel ড্যাশবোর্ডে <strong>Settings &gt; Environment Variables</strong>-এ গিয়ে <strong>GEMINI_API_KEY</strong> ভ্যারিয়েবলটি যোগ করুন, অথবা নিচে তথ্যগুলো ম্যানুয়ালি লিখে অপেক্ষমাণ তালিকায় জমা করুন।
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {isSubmittingIngest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isSubmittingIngest
                      ? (rawSelectedFile ? 'Archive.org-এ আপলোড হচ্ছে...' : 'জমা হচ্ছে...')
                      : 'অপেক্ষমাণ তালিকায় জমা করুন (অনুমোদনের জন্য)'}
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
