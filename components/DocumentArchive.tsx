import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ArchiveDoc } from '../types';
import { 
  Library, Search, Filter, Plus, FileText, Calendar, 
  ExternalLink, Trash2, LayoutGrid, List, X, Edit2,
  ChevronRight, BookOpen, Clock, Download, Eye, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';

interface ExtendedArchiveDoc extends ArchiveDoc {
  memoNo?: string;
  authority?: string;
  tags?: string;
}

const DocumentArchive: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const [documents, setDocuments] = useState<ExtendedArchiveDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ExtendedArchiveDoc | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ExtendedArchiveDoc | null>(null);

  // New Doc Form State
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

  useEffect(() => {
    fetchDocuments();
  }, []);

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
          if (!row || !row.id) return;

          // Production Fix: Safe content extraction if it's a string
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
            createdAt: String(content.createdAt || new Date().toISOString())
          });
        });

        setDocuments(mappedDocs);
      }
    } catch (err) {
      console.error("Fetch Documents Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Robust helper function to extract the Archive ID from various URL formats
   */
  const extractCleanId = (rawId: string) => {
    if (!rawId) return '';
    let clean = rawId.trim();
    
    // 1. Handle server-style URLs: iaXXXX.us.archive.org/items/ID/...
    const itemsMatch = clean.match(/archive\.org\/items\/([^\/\?\#\s]+)/i);
    if (itemsMatch && itemsMatch[1]) return itemsMatch[1];

    // 2. Standard details/embed/etc: archive.org/details/ID
    const standardMatch = clean.match(/archive\.org\/(?:details|embed|stream|download|metadata|services\/img)\/([^\/\?\#\s]+)/i);
    if (standardMatch && standardMatch[1]) {
      const id = standardMatch[1];
      if (id.toLowerCase() !== 'upload') return id;
    }
    
    // 3. Fallback: If it's not a URL, or we couldn't parse it as one
    const segments = clean.split('/').filter(Boolean);
    const ignored = ['http:', 'https:', 'www.archive.org', 'archive.org', 'details', 'embed', 'stream', 'download', 'metadata', 'upload', 'ia'];
    
    // Look for segments following 'details', 'items', etc in case regex missed it
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
      // Ignore empty, ignored list, server names, and purely numeric segments (usually path parts like '24')
      if (s && !ignored.includes(s) && !s.includes('.archive.org') && !/^\d+$/.test(s)) {
        return segment.split(/[?#]/)[0];
      }
    }
    
    const finalId = clean.split(/[?#]/)[0];
    // If the final result still looks like a server name, it's probably not a valid ID
    if (finalId.includes('.archive.org')) return '';
    return finalId;
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractCleanId(newDoc.archiveId);
    
    if (!newDoc.title || !cleanId) {
      return alert("শিরোনাম এবং সঠিক আর্কাইভ লিঙ্ক বা আইডি আবশ্যক!");
    }

    const docId = editingDoc ? editingDoc.id : `doc_${Date.now()}`;
    const docData: ExtendedArchiveDoc = {
      id: docId,
      ...newDoc,
      archiveId: cleanId,
      createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('settlement_entries').upsert({
        id: docId,
        content: docData
      });

      if (!error) {
        if (editingDoc) {
          setDocuments(prev => prev.map(d => d.id === docId ? docData : d));
        } else {
          setDocuments(prev => [docData, ...prev]);
        }
        
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
      }
    } catch (err) {
      alert("সংরক্ষণে ত্রুটি হয়েছে।");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ডকুমেন্টটি লাইব্রেরি থেকে সরিয়ে ফেলতে চান?")) return;
    try {
      const { error } = await supabase.from('settlement_entries').delete().eq('id', id);
      if (!error) setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const copyCitation = (doc: ExtendedArchiveDoc) => {
    const citation = `${doc.title}${doc.memoNo ? `, স্মারক নং: ${doc.memoNo}` : ''}${doc.docDate ? `, তারিখ: ${formatDateBN(doc.docDate)}` : ''}${doc.authority ? `, ইস্যুকারী: ${doc.authority}` : ''}।`;
    navigator.clipboard.writeText(citation);
    alert("রেফারেন্স কপি করা হয়েছে!");
  };

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    
    return documents
      .filter(doc => {
        // Extra defensive string checks
        const title = String(doc.title || '').toLowerCase();
        const description = String(doc.description || '').toLowerCase();
        const memoNo = String(doc.memoNo || '').toLowerCase();
        const authority = String(doc.authority || '').toLowerCase();
        const tags = String(doc.tags || '').toLowerCase();
        const search = String(searchTerm || '').toLowerCase();
        
        const matchesSearch = 
          title.includes(search) || 
          description.includes(search) || 
          memoNo.includes(search) || 
          authority.includes(search) ||
          tags.includes(search);

        const matchesCat = activeCategory === 'সকল' || doc.category === activeCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => new Date(b.docDate).getTime() - new Date(a.docDate).getTime());
  }, [documents, searchTerm, activeCategory]);

  return (
    <div className="w-full pb-20 relative [transform:translateZ(0)]">
      {/* Main Content Wrapper */}
      <div className={`max-w-7xl mx-auto space-y-8 animate-landing-premium transition-all duration-700 ${showAddModal || selectedDoc ? 'opacity-60 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}>
        {/* Header Section - Height Reduced (p-10 to p-8) */}
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none"><Library size={240} /></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="space-y-3">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 border border-white/10">
                     <Library size={24} className="text-white" />
                   </div>
                   <h2 className="text-2xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                     অডিট রেফারেন্স ও ডকুমেন্ট লাইব্রেরি
                   </h2>
                </div>
                <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed tracking-tight">
                  সরকারি বিধি-বিধান, সার্কুলার এবং অডিট ক্রাইটেরিয়া এখন এক জায়গায়। দ্রুত রেফারেন্স খুঁজে পেতে স্মারক নম্বর বা বিষয় দিয়ে সার্চ করুন।
                </p>
             </div>
             <button 
               onClick={() => setShowAddModal(true)} 
               className="px-8 py-4 bg-white text-slate-900 hover:bg-blue-50 rounded-2xl font-black flex items-center gap-3 shadow-2xl active:scale-95 transition-all shrink-0 group"
             >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> নতুন রেফারেন্স যুক্ত করুন
             </button>
          </div>
        </div>

        {/* Controls Bar - Sticky, height reduced (p-6 to p-5, input h-55 to h-50) */}
        <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl border border-white/20 p-4 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col lg:flex-row items-center gap-4 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
           <div className="relative flex-1 w-full flex items-center gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="স্মারক নং, শিরোনাম বা বিষয় দিয়ে খুঁজুন..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 h-[56px] bg-slate-50/50 border border-slate-100 rounded-[1.5rem] font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500/30 focus:ring-[6px] focus:ring-blue-500/5 transition-all text-sm placeholder:text-slate-400 shadow-inner"
                />
              </div>
              
              <button 
                onClick={() => setShowAddModal(true)}
                className="h-[56px] w-[56px] shrink-0 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg hover:bg-black active:scale-95 transition-all duration-300 group"
                title="দ্রুত আপলোড"
              >
                <Plus size={24} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
           </div>

           <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-center">
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl font-black text-[12px] transition-all duration-300 ${activeCategory === cat ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-105' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="h-10 w-[1px] bg-slate-200 mx-1 hidden lg:block"></div>
              <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                 <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                 <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
              </div>
           </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
             <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
             <p className="font-black text-slate-500 tracking-widest uppercase text-xs">ডকুমেন্টগুলো লোড হচ্ছে...</p>
          </div>
        ) : filteredDocs.length > 0 ? (
          viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                   {filteredDocs.map((doc) => (
                     <div 
                       key={doc.id}
                       className="group bg-white border border-slate-100 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 rounded-[2.5rem] flex flex-col h-full relative overflow-hidden"
                     >
                        <div className="p-4 flex-1 space-y-5">
                           <div className="aspect-[4/5] bg-slate-50 rounded-[2rem] overflow-hidden relative border border-slate-100 group-hover:border-blue-100 transition-all duration-500">
                              <img 
                                src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                                alt={doc.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                              />
                              <div className="absolute top-4 left-4 z-20">
                                 <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black rounded-full uppercase tracking-[0.15em] border border-white/50 shadow-sm">{doc.category}</span>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-6 gap-3">
                                 <button 
                                   onClick={() => window.open(`https://archive.org/details/${extractCleanId(doc.archiveId)}`, '_blank')} 
                                   className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-50 transition-all active:scale-95"
                                 >
                                   ওপেন করুন
                                 </button>
                                 <button 
                                   onClick={() => {
                                     const id = extractCleanId(doc.archiveId);
                                     window.open(`https://archive.org/download/${id}/${id}.pdf`, '_blank');
                                   }} 
                                   className="p-3 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
                                 >
                                   <Download size={18} />
                                 </button>
                              </div>
                           </div>
                           <div className="space-y-3 px-2">
                              <h4 className="text-lg font-black text-slate-900 leading-[1.2] line-clamp-2 group-hover:text-blue-600 transition-colors tracking-tight">{doc.title}</h4>
                              {doc.memoNo && (
                                <div className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-blue-100/50">
                                  স্মারক: {doc.memoNo}
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight pt-2 border-t border-slate-50">
                                 <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> {formatDateBN(doc.docDate)}</div>
                                 <div className="flex items-center gap-1.5"><Clock size={12} className="text-slate-300" /> {formatDateBN(doc.createdAt)}</div>
                              </div>
                           </div>
                        </div>
                        <div className="p-4 mt-auto flex items-center justify-between bg-slate-50/30 rounded-b-[2.5rem] border-t border-slate-50">
                           <button 
                             onClick={() => setSelectedDoc(doc)} 
                             className="text-[11px] font-black text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors uppercase tracking-widest"
                           >
                             বিস্তারিত দেখুন <ChevronRight size={14} />
                           </button>
                           <div className="flex items-center gap-1">
                              {isAdmin && (
                                <button 
                                  onClick={() => setEditingDoc(doc)} 
                                  className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDelete(doc.id)} 
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
          ) : (
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">ডকুমেন্ট শিরোনাম ও স্মারক</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">ক্যাটাগরি</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">ইস্যুকারী কর্তৃপক্ষ</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">তারিখ</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                        <td className="p-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                              <img 
                                 src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                 onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                              />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{doc.title}</h4>
                              <p className="text-[11px] font-bold text-slate-400">স্মারক: {doc.memoNo || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-4 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-wider border border-slate-100">{doc.category}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-[11px] font-bold text-slate-600">{doc.authority || 'অনির্ধারিত'}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-[11px] font-bold text-slate-500">{formatDateBN(doc.docDate)}</span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                             <button 
                               onClick={() => setSelectedDoc(doc)} 
                               className="p-3 bg-white text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-100 shadow-sm" 
                               title="বিস্তারিত দেখুন"
                             >
                               <Eye size={18} />
                             </button>
                             <button onClick={() => copyCitation(doc)} className="p-3 bg-white text-slate-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all border border-slate-100 shadow-sm" title="রেফারেন্স কপি করুন"><FileText size={18} /></button>
                             <button 
                               onClick={() => {
                                 const id = extractCleanId(doc.archiveId);
                                 window.open(`https://archive.org/download/${id}/${id}.pdf`, '_blank');
                               }} 
                               className="p-3 bg-white text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-slate-100 shadow-sm" 
                               title="সরাসরি ডাউনলোড"
                             >
                               <Download size={18} />
                             </button>
                             {isAdmin && (
                               <>
                                 <button 
                                   onClick={() => setEditingDoc(doc)} 
                                   className="p-3 bg-white text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-100 shadow-sm"
                                   title="এডিট করুন"
                                 >
                                   <Edit2 size={18} />
                                 </button>
                                 <button onClick={() => handleDelete(doc.id)} className="p-3 bg-white text-slate-300 hover:bg-red-600 hover:text-white transition-all border border-slate-100 shadow-sm"><Trash2 size={18} /></button>
                               </>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Search size={40} /></div>
             <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800">কোনো রেফারেন্স পাওয়া যায়নি</h3>
                <p className="text-slate-500 font-bold text-sm">আপনার অনুসন্ধানের সাথে মেলে এমন কোনো ফাইল এই মুহূর্তে নেই।</p>
             </div>
             {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 font-black text-xs hover:underline uppercase tracking-widest">সকল রেজাল্ট দেখুন</button>}
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-400/10 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
           <div className="w-full max-w-6xl bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/40 relative animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="absolute top-8 right-8 z-[1010] p-3.5 bg-white/80 backdrop-blur-md text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-white transition-all shadow-sm border border-slate-100 group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[550px]">
                  <div className="flex-[3] bg-slate-900 relative flex flex-col items-center justify-center p-12 text-center space-y-8 overflow-hidden">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none"></div>
                     <div className="w-36 h-36 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-blue-400 mb-2 relative z-10 border border-white/10 shadow-inner">
                        <BookOpen size={72} strokeWidth={1.2} />
                     </div>
                     <div className="space-y-4 max-w-md relative z-10">
                        <h3 className="text-3xl font-black text-white tracking-tight leading-none">ডকুমেন্টটি পড়ার জন্য প্রস্তুত</h3>
                        <p className="text-slate-400 font-medium text-base leading-relaxed opacity-80">নিরাপত্তা ও দ্রুত লোডিং নিশ্চিত করতে আমরা ডকুমেন্টটি সরাসরি নতুন ট্যাবে ওপেন করার পরামর্শ দিচ্ছি।</p>
                     </div>
                     <a 
                        href={`https://archive.org/details/${extractCleanId(selectedDoc.archiveId)}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-lg flex items-center gap-4 shadow-2xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all group relative z-10"
                     >
                        <Eye size={28} className="group-hover:animate-bounce" /> ডকুমেন্টটি ওপেন করুন
                     </a>
                  </div>
                 <div className="flex-[2] p-12 space-y-10 overflow-y-auto bg-white no-scrollbar border-l border-slate-100">
                    <div className="space-y-6">
                       <span className="px-6 py-2 bg-slate-50 text-slate-500 text-[11px] font-black rounded-full uppercase tracking-[0.2em] border border-slate-100 inline-block">{selectedDoc.category}</span>
                       <h3 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{selectedDoc.title}</h3>
                       
                       <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-5 text-slate-600 font-bold text-base bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 border border-slate-50"><Calendar size={22} /></div>
                             <span>তারিখ: {formatDateBN(selectedDoc.docDate)}</span>
                          </div>
                          {selectedDoc.memoNo && (
                            <div className="flex items-center gap-5 text-slate-600 font-bold text-base bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 border border-slate-50"><FileText size={22} /></div>
                               <span>স্মারক নং: {selectedDoc.memoNo}</span>
                            </div>
                          )}
                          {selectedDoc.authority && (
                            <div className="flex items-center gap-5 text-slate-600 font-bold text-base bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 border border-slate-50"><Library size={22} /></div>
                               <span>কর্তৃপক্ষ: {selectedDoc.authority}</span>
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="h-px w-full bg-slate-100"></div>
                    
                    <div className="space-y-4">
                       <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">বিবরণ (Description)</h5>
                       <p className="text-slate-600 font-medium leading-relaxed text-base whitespace-pre-wrap">{selectedDoc.description || 'কোনো বিবরণ দেওয়া নেই।'}</p>
                    </div>

                    {selectedDoc.tags && (
                      <div className="flex flex-wrap gap-2.5">
                         {selectedDoc.tags.split(',').map(tag => (
                           <span key={tag} className="px-4 py-2 bg-slate-50 text-slate-500 text-[11px] font-black rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all cursor-default">#{tag.trim()}</span>
                         ))}
                      </div>
                    )}
                    
                    <div className="pt-10 grid grid-cols-1 gap-4">
                       <button 
                         onClick={() => copyCitation(selectedDoc)}
                         className="w-full py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-[0.98]"
                       >
                          <FileText size={22} /> রেফারেন্স কপি করুন
                       </button>
                       <button 
                         onClick={() => setSelectedDoc(null)}
                         className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-base hover:bg-black transition-all active:scale-[0.98]"
                       >
                          বন্ধ করুন
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-400/10 backdrop-blur-md animate-in fade-in duration-500 overflow-y-auto">
           <div className="w-full max-w-3xl bg-white rounded-[3rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/40 space-y-10 animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 no-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-blue-100/50">
                      {editingDoc ? <Edit2 size={32} /> : <Plus size={32} />}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        {editingDoc ? 'রেফারেন্স এডিট করুন' : 'নতুন রেফারেন্স এন্ট্রি'}
                      </h3>
                      <p className="text-slate-400 font-bold text-sm">লাইব্রেরিতে নতুন তথ্য যুক্ত করুন</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => {
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
                   }} 
                   className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all group"
                 >
                   <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                 </button>
              </div>

              <form onSubmit={handleAddDocument} className="space-y-6">
                 <div className="space-y-3 bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-widest"><AlertCircle size={14} /> আর্কাইভ লিঙ্ক (Archive Link)</div>
                    <p className="text-[11px] font-bold text-blue-600 leading-relaxed">
                      ডকুমেন্টটি <button 
                        type="button"
                        onClick={() => {
                          const w = 800;
                          const h = 600;
                          const left = (window.screen.width / 2) - (w / 2);
                          const top = (window.screen.height / 2) - (h / 2);
                          window.open('https://archive.org/upload/', 'archive_upload', `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`);
                        }}
                        className="underline font-black hover:text-blue-800 transition-colors cursor-pointer"
                      >Archive.org</button> এ আপলোড করে সেই লিঙ্কটি এখানে দিন।
                    </p>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         required
                         placeholder="এখানে লিঙ্ক বা আইডি পেস্ট করুন" 
                         className="flex-1 px-5 h-[50px] bg-white border border-blue-200 rounded-xl font-black text-blue-900 placeholder:text-blue-300 outline-none focus:border-blue-500 transition-all text-sm tracking-widest"
                         value={newDoc.archiveId}
                         onChange={e => setNewDoc({...newDoc, archiveId: e.target.value})}
                       />
                       <button 
                         type="button"
                         onClick={() => {
                           const id = extractCleanId(newDoc.archiveId);
                           if (id) window.open(`https://archive.org/details/${id}`, '_blank');
                           else alert("প্রথমে একটি সঠিক লিঙ্ক দিন!");
                         }}
                         className="px-4 bg-blue-100 text-blue-600 rounded-xl font-black text-[10px] uppercase hover:bg-blue-200 transition-all border border-blue-200"
                       >
                         পরীক্ষা করুন
                       </button>
                    </div>
                    {newDoc.archiveId && (
                      <div className="space-y-1 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">শনাক্তকৃত আইডি:</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${!extractCleanId(newDoc.archiveId) ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-100/50 border-blue-100'}`}>
                            {extractCleanId(newDoc.archiveId) || 'শনাক্ত করা যায়নি'}
                          </span>
                        </div>
                        {newDoc.archiveId.includes('.archive.org') && !extractCleanId(newDoc.archiveId) && (
                          <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                            <AlertCircle size={10} /> আপনি সম্ভবত সার্ভারের নাম পেস্ট করেছেন। অনুগ্রহ করে আসল আইটেম লিঙ্কটি দিন (যেমন: archive.org/details/ITEM_ID)।
                          </p>
                        )}
                      </div>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ডকুমেন্ট শিরোনাম</label>
                    <input 
                      type="text" 
                      required
                      placeholder="যেমন: বার্ষিক অডিট সার্কুলার ২০২৪-২৫" 
                      className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                      value={newDoc.title}
                      onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ক্যাটাগরি</label>
                       <select 
                         className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                         value={newDoc.category}
                         onChange={e => setNewDoc({...newDoc, category: e.target.value as any})}
                       >
                          {categories.filter(c => c !== 'সকল').map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ডকুমেন্ট তারিখ</label>
                       <input 
                         type="date" 
                         required
                         className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                         value={newDoc.docDate}
                         onChange={e => setNewDoc({...newDoc, docDate: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">স্মারক নম্বর (Memo No.)</label>
                       <input 
                         type="text" 
                         placeholder="যেমন: ০৫.০০.০০০০.১২৩.৪৫.৬৭৮" 
                         className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                         value={newDoc.memoNo}
                         onChange={e => setNewDoc({...newDoc, memoNo: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ইস্যুকারী কর্তৃপক্ষ</label>
                       <input 
                         type="text" 
                         placeholder="যেমন: অর্থ মন্ত্রণালয় / বাংলাদেশ ব্যাংক" 
                         className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                         value={newDoc.authority}
                         onChange={e => setNewDoc({...newDoc, authority: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)</label>
                    <input 
                      type="text" 
                      placeholder="যেমন: বোনাস, ভাতা, বেতন কাঠামো" 
                      className="w-full px-5 h-[55px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                      value={newDoc.tags}
                      onChange={e => setNewDoc({...newDoc, tags: e.target.value})}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">বিবরণ (ঐচ্ছিক)</label>
                    <textarea 
                      placeholder="ডকুমেন্টের সারসংক্ষেপ বা গুরুত্বপূর্ণ নোট এখানে লিখুন..." 
                      className="w-full p-5 min-h-[100px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                      value={newDoc.description}
                      onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                    ></textarea>
                 </div>

                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <p className="text-[11px] font-bold text-amber-700 flex items-center gap-2">
                      <Clock size={14} /> নতুন আপলোড করা ফাইল লাইব্রেরিতে দৃশ্যমান হতে ২-৫ মিনিট সময় লাগতে পারে।
                    </p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => {
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
                      }} 
                      className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                    >
                      বাতিল
                    </button>
                    <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                       <Sparkles size={18} className="text-blue-300" /> {editingDoc ? 'আপডেট করুন' : 'আর্কাইভে যুক্ত করুন'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default DocumentArchive;