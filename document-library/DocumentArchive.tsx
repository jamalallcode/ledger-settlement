import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArchiveDoc } from '../types';
import { 
  Library, Search, Filter, Plus, FileText, Calendar, 
  ExternalLink, Trash2, LayoutGrid, List, X, Edit2,
  ChevronRight, BookOpen, Clock, Download, Eye, EyeOff, Loader2, Sparkles, AlertCircle,
  Lock, Unlock, ShieldCheck, CheckCircle2, CreditCard, Gift, Zap, MessageSquare, Mail, UserCheck, FileSearch, MessageSquarePlus, Send
} from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';
import { UnlockStatusModal } from './UnlockStatusModal';
import { PendingDocsModal } from './PendingDocsModal';
import { recordVisitorLog } from './visitorTracker';

interface ExtendedArchiveDoc extends ArchiveDoc {
  memoNo?: string;
  authority?: string;
  tags?: string;
  status?: 'approved' | 'pending' | 'rejected';
  uploadedBy?: string;
}

const DocumentArchive: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const [documents, setDocuments] = useState<ExtendedArchiveDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExtendedArchiveDoc | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ExtendedArchiveDoc | null>(null);

  // Sticky Filter Bar Measurement & Collapse State
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [filterBarHeight, setFilterBarHeight] = useState<number>(140);
  const [isFilterHidden, setIsFilterHidden] = useState<boolean>(false);

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

  // Active Current User Gmail State
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    const saved = localStorage.getItem('audit_doc_current_user_email');
    if (saved && saved !== 'user@gmail.com' && saved !== 'newuser@gmail.com') return saved;
    return '';
  });

  useEffect(() => {
    localStorage.setItem('audit_doc_current_user_email', currentUserEmail);
    const isW = whitelistedEmails.some(e => e.toLowerCase() === currentUserEmail.toLowerCase());
    recordVisitorLog(currentUserEmail, isW);
  }, [currentUserEmail, whitelistedEmails]);

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

  // Demo / Subscription / Admin State
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('audit_doc_is_subscribed') === 'true';
  });
  const [demoAdmin, setDemoAdmin] = useState<boolean>(false);

  const effectiveAdmin = isAdmin || demoAdmin;

  // Access check
  const isWhitelisted = useMemo(() => {
    if (!currentUserEmail) return false;
    return whitelistedEmails.some(e => e.toLowerCase() === currentUserEmail.trim().toLowerCase());
  }, [currentUserEmail, whitelistedEmails]);

  const isFullyUnlocked = effectiveAdmin || isSubscribed || isWhitelisted;

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
    saveWhitelistedEmailsToDb(whitelistedEmails);
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
    try {
      const res = await fetch('/api/admin/whitelisted-emails?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.emails)) {
          const list = data.emails.map((e: string) => e.trim().toLowerCase());
          setWhitelistedEmails(list);
          localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(list));
          return;
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
        if (Array.isArray(list) && list.length > 0) {
          setWhitelistedEmails(list);
        }
      }
    } catch (e) {}
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
    try {
      const { data, error } = await supabase
        .from('settlement_entries')
        .select('*')
        .like('id', 'doc_%');
      
      if (!error && data) {
        const mappedDocs: ExtendedArchiveDoc[] = [];
        
        data.forEach((row: any) => {
          if (!row || !row.id || row.id === 'doc_whitelisted_emails') return;

          let content = row.content;
          if (typeof content === 'string') {
            try { content = JSON.parse(content); } catch (e) { return; }
          }
          if (!content) return;

          mappedDocs.push({
            id: row.id,
            title: String(content.title || ''),
            category: (content.category as any) || 'অন্যান্য',
            archiveId: String(content.archiveId || ''),
            docDate: String(content.docDate || ''),
            description: String(content.description || ''),
            memoNo: String(content.memoNo || ''),
            authority: String(content.authority || ''),
            tags: String(content.tags || ''),
            status: (content.status as any) || 'approved',
            uploadedBy: String(content.uploadedBy || ''),
            createdAt: String(content.createdAt || new Date().toISOString())
          });
        });

        // Default initial docs if database is empty
        if (mappedDocs.length === 0) {
          const defaultDocs: ExtendedArchiveDoc[] = [
            {
              id: 'doc_101',
              title: 'সরকারি চাকুরিজীবীদের বাড়ি ভাড়া ভাতা পুনর্নির্ধারণ সার্কুলার',
              category: 'সার্কুলার',
              archiveId: 'https://archive.org/details/govt_house_rent_circular_2024',
              docDate: '2024-01-15',
              memoNo: '০৭.০০.০০০০.১৬১.৩৮.০০১.২৪-৪২',
              authority: 'অর্থ বিভাগ, অর্থ মন্ত্রণালয়',
              description: 'জাতীয় বেতন স্কেল ২০১৫ এর আওতায় সরকারি কর্মচারীদের এলাকা ভিত্তিক বাড়ি ভাড়া সংক্রান্ত নতুন গেজেট নির্দেশনা।',
              tags: 'বাড়ি ভাড়া, বেতন স্কেল, ভাতা',
              status: 'approved',
              createdAt: new Date().toISOString()
            },
            {
              id: 'doc_102',
              title: 'অডিট আপত্তি নিষ্পত্তিকরণ গাইডলাইন ও নতুন ম্যানুয়াল',
              category: 'গেজেট',
              archiveId: 'https://archive.org/details/audit_objection_manual_bd',
              docDate: '2023-11-20',
              memoNo: '১২.০১.০০০০.৫০২.১২.০০৩.২৩-৯৯',
              authority: 'মহাহিসাব নিরীক্ষক ও নিয়ন্ত্রকের কার্যালয় (CAG)',
              description: 'সরকারি অফিসে অডিট আপত্তি ব্রডশীট জবাব ও কোয়ালিফাইড রিপোর্ট প্রস্তুতকরণ নির্দেশিকা।',
              tags: 'অডিট আপত্তি, সিএজি, ব্রডশীট',
              status: 'approved',
              createdAt: new Date().toISOString()
            }
          ];
          setDocuments(defaultDocs);
        } else {
          setDocuments(mappedDocs);
        }
      }
    } catch (err) {
      console.error("Fetch Documents Error:", err);
    } finally {
      setIsLoading(false);
    }
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

    return clean;
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAdmin) {
      alert("দুঃখিত, শুধুমাত্র অ্যাডমিন নতুন সার্কুলার যুক্ত করতে পারেন।");
      return;
    }

    const cleanId = extractCleanId(newDoc.archiveId);
    if (!cleanId) {
      alert("অনুগ্রহ করে একটি সঠিক Archive.org লিঙ্ক বা আইডি দিন!");
      return;
    }

    const docId = editingDoc ? editingDoc.id : `doc_${Date.now()}`;
    const payload = {
      title: newDoc.title,
      category: newDoc.category,
      archiveId: cleanId,
      docDate: newDoc.docDate,
      description: newDoc.description,
      memoNo: newDoc.memoNo,
      authority: newDoc.authority,
      tags: newDoc.tags,
      status: 'approved',
      uploadedBy: 'Admin',
      createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString()
    };

    try {
      await supabase.from('settlement_entries').upsert({
        id: docId,
        content: JSON.stringify(payload),
        created_at: payload.createdAt
      });

      fetchDocuments();

      setShowAddModal(false);
      setEditingDoc(null);
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

      alert(editingDoc ? "ডকুমেন্ট সফলভাবে আপডেট হয়েছে!" : "নতুন ডকুমেন্ট সরাসরি প্রকাশিত হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("সংরক্ষণে সমস্যা হয়েছে।");
    }
  };

  const handleDelete = async (id: string) => {
    if (!effectiveAdmin) return;
    if (!confirm("আপনি কি নিশ্চিত যে এই ডকুমেন্টটি মুছে ফেলতে চান?")) return;

    try {
      await supabase.from('settlement_entries').delete().eq('id', id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWhitelistedEmail = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!whitelistedEmails.some(e => e.toLowerCase() === trimmed)) {
      const updated = [...whitelistedEmails, trimmed];
      setWhitelistedEmails(updated);
      try {
        await fetch('/api/admin/whitelisted-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addEmail: trimmed })
        });
      } catch (e) {}
    }
  };

  const handleRemoveWhitelistedEmail = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    const updated = whitelistedEmails.filter(e => e.toLowerCase() !== trimmed);
    setWhitelistedEmails(updated);
    try {
      await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeEmail: trimmed })
      });
    } catch (e) {}
  };

  const handleVerifyGmail = async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return false;
    setCurrentUserEmail(trimmed);

    let isW = whitelistedEmails.some(e => e.toLowerCase() === trimmed);

    try {
      const res = await fetch('/api/admin/whitelisted-emails?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.emails)) {
          const latestList = data.emails.map((e: string) => e.trim().toLowerCase());
          setWhitelistedEmails(latestList);
          localStorage.setItem('audit_doc_whitelisted_emails', JSON.stringify(latestList));
          if (latestList.includes(trimmed)) {
            isW = true;
          }
        }
      }
    } catch (e) {}

    recordVisitorLog(trimmed, isW);
    return isW;
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

  return (
    <div className="space-y-10 pb-20">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden bg-slate-900 rounded-2xl border border-slate-800 p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-black tracking-wider uppercase">
              <Library size={14} /> সরকারি অডিট সার্কুলার ও গেজেট ভল্ট
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              স্মার্ট অডিট ক্রাইটেরিয়া
            </h1>
            <p className="text-slate-300 font-medium text-sm md:text-base leading-relaxed">
              অর্থ মন্ত্রণালয়, সিএজি অফিস ও বিভিন্ন সরকারি দপ্তরের সকল গুরুতপূর্ণ সার্কুলার, অফিস আদেশ ও গেজেট এক জায়গায়। অডিট সাইটেশন <strong className="font-extrabold text-white">১-ক্লিকে</strong> কপি করুন।
            </p>

            {/* Access Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 border ${isFullyUnlocked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                {isFullyUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>
                  {effectiveAdmin ? 'অ্যাডমিন মোড (সকল নথি উন্মুক্ত)' : isWhitelisted ? 'Whitelisted Gmail (সকল নথি উন্মুক্ত)' : 'প্রথম ৫টি নথি ফ্রি (অন্যান্য লকড)'}
                </span>
              </div>

              {!isFullyUnlocked && (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <MessageSquare size={14} /> WhatsApp কন্ট্রিবিউট / আনলক করুন
                </button>
              )}
            </div>
          </div>

          {/* Right Control Actions */}
          <div className="flex flex-col gap-3 shrink-0">
            {effectiveAdmin ? (
              <>
                <button
                  onClick={() => {
                    setEditingDoc(null);
                    setShowAddModal(true);
                  }}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Plus size={20} /> নতুন সার্কুলার/ডকুমেন্ট যুক্ত করুন
                </button>
                <button
                  onClick={() => setShowPendingModal(true)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
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
      </div>

      {/* Filter and Search Bar (Sticky Top) */}
      <div ref={filterBarRef} className="sticky top-0 z-30 -mx-2 md:-mx-4 px-2 md:px-4 pt-2 md:pt-3 pb-3 bg-[#eef2f6] shadow-sm transition-all">
        {isFilterHidden ? (
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>সার্চ ও ফিল্টার প্যানেল লুকানো রয়েছে</span>
              {searchTerm && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                  সার্চ: "{searchTerm}"
                </span>
              )}
            </div>
            <button
              onClick={() => setIsFilterHidden(false)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Eye size={15} />
              <span>ফিল্টার অপশন দেখান</span>
            </button>
          </div>
        ) : (
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 lg:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Layout Toggles */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="শিরোনাম, স্মারক নং বা কিওয়ার্ড খুঁজুন..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Duplicate Checker Button */}
                <button
                  onClick={() => {
                    setModalInitialTab('dupcheck');
                    setShowUnlockModal(true);
                  }}
                  className="px-3.5 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                  title="নতুন ফাইল পাঠানোর আগে ডুপ্লিকেট চেক করুন"
                >
                  <FileSearch size={16} className="text-blue-600" />
                  <span className="hidden sm:inline">🔍 ডুপ্লিকেট চেকার</span>
                </button>

                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    title="গ্রিড ভিউ"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    title="লিস্ট ভিউ"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick User Gmail Status Banner */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <span>আপনার টেস্ট জিমেইল:</span>
                <input 
                  type="email"
                  value={currentUserEmail}
                  onChange={e => setCurrentUserEmail(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700 outline-none focus:bg-white focus:border-blue-500 w-52"
                  placeholder="user@gmail.com"
                />
                {isWhitelisted ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[10px] flex items-center gap-1">
                    <CheckCircle2 size={12} /> অনুমোদিত (সকল নথি উন্মুক্ত)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black rounded text-[10px]">
                    সাধারণ এক্সেস (প্রথম ৫টি নথি ফ্রি, অন্যান্য লকড)
                  </span>
                )}
              </div>

              {/* User Marked Hide Button & Unlock Instructions Link */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterHidden(true)}
                  className="px-3 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs active:scale-95"
                  title="ফিল্টার ও সার্চ অপশনগুলো হাইড করুন"
                >
                  <EyeOff size={14} className="text-slate-500 hover:text-red-600" />
                  <span>হাইড করুন</span>
                </button>

                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="text-blue-600 font-black text-xs hover:underline flex items-center gap-1 cursor-pointer"
                >
                  এক্সেস বিস্তারিত ও আনলক নির্দেশিকা <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
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
                      <img 
                        src={`https://archive.org/services/img/${cleanId}`} 
                        alt={doc.title}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isDocUnlocked ? 'blur-[1.5px] opacity-75' : ''}`}
                        onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
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
                          className="flex-1 py-2.5 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-wider shadow-xl hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isDocUnlocked ? <Eye size={14} /> : <Lock size={14} />} {isDocUnlocked ? 'ওপেন করুন' : 'আনলক অপশন'}
                        </button>
                        {isDocUnlocked && (
                          <button 
                            onClick={() => window.open(`https://archive.org/download/${cleanId}/${cleanId}.pdf`, '_blank')} 
                            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 transition-all cursor-pointer"
                            title="ডাউনলোড PDF"
                          >
                            <Download size={16} />
                          </button>
                        )}
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
                      onClick={() => handleDocClick(doc, isDocUnlocked)} 
                      className="text-xs font-black text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isDocUnlocked ? 'বিস্তারিত দেখুন' : 'আনলক করুন'} <ChevronRight size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setFeedbackDoc(doc)} 
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        title="এই সার্কুলার সম্পর্কে মতামত পাঠান"
                      >
                        <MessageSquarePlus size={16} />
                        <span className="hidden sm:inline">মতামত</span>
                      </button>
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
                            <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative">
                              <img 
                                src={`https://archive.org/services/img/${cleanId}`} 
                                className={`w-full h-full object-cover ${!isDocUnlocked ? 'blur-[1px]' : ''}`}
                                onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                              />
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
          <p className="text-xs font-bold text-slate-400">আপনার অনুসন্ধানের সাথে মেলে এমন কোনো ডকুমেন্ট লাইব্রেরিতে নেই।</p>
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
              <div className="bg-slate-950 p-8 text-white flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
                <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 border border-white/15">
                  <BookOpen size={56} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">ফুল রিড ও ভিউ মোড</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    ডকুমেন্টটি ফুল স্ক্রিনে স্বাচ্ছন্দ্যে পড়ার জন্য নিচের বোতামে ক্লিক করুন।
                  </p>
                </div>
                <a 
                  href={`https://archive.org/details/${extractCleanId(selectedDoc.archiveId)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Eye size={18} /> ফাইলটি নতুন ট্যাবে খুলুন
                </a>
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
                    <span className="text-slate-400">তারিখ:</span>
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

                <div className="pt-4 flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      const target = selectedDoc;
                      setSelectedDoc(null);
                      setFeedbackDoc(target);
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <MessageSquarePlus size={16} /> এডমিনকে মতামত জানান
                  </button>
                  <button 
                    onClick={() => copyCitation(selectedDoc)}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={16} /> রেফারেন্স কপি করুন
                  </button>
                  <button 
                    onClick={() => setSelectedDoc(null)}
                    className="py-3 px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all cursor-pointer"
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
                  setShowAddModal(false);
                  setEditingDoc(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 text-xs font-bold">
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
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black hover:bg-slate-200 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  {editingDoc ? 'আপডেট করুন' : 'সরাসরি প্রকাশ করুন'}
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

    </div>
  );
};

export default DocumentArchive;
