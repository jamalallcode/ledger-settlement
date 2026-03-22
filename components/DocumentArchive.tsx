// /components/DocumentArchive.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ArchiveDoc } from '../types';
import { 
  Library, Search, Filter, Plus, FileText, Calendar, 
  ExternalLink, Trash2, LayoutGrid, List, X, 
  ChevronRight, BookOpen, Clock, Download, Eye, Loader2, Sparkles, AlertCircle,
  ArrowUpRight, Bookmark, Share2, MoreVertical
} from 'lucide-react';
import { toBengaliDigits, formatDateBN } from '../utils/numberUtils';
import { motion, AnimatePresence } from 'motion/react';

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

  const extractCleanId = (rawId: string) => {
    if (!rawId) return '';
    let clean = rawId.trim();
    
    const itemsMatch = clean.match(/archive\\.org\\/items\\/([^\\/\\?\\#\\s]+)/i);
    if (itemsMatch && itemsMatch[1]) return itemsMatch[1];

    const standardMatch = clean.match(/archive\\.org\\/(?:details|embed|stream|download|metadata|services\\/img)\\/([^\\/\\?\\#\\s]+)/i);
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
      if (s && !ignored.includes(s) && !s.includes('.archive.org') && !/^\\d+$/.test(s)) {
        return segment.split(/[?#]/)[0];
      }
    }
    
    const finalId = clean.split(/[?#]/)[0];
    if (finalId.includes('.archive.org')) return '';
    return finalId;
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractCleanId(newDoc.archiveId);
    
    if (!newDoc.title || !cleanId) {
      return alert("শিরোনাম এবং সঠিক আর্কাইভ লিঙ্ক বা আইডি আবশ্যক!");
    }

    const docId = `doc_${Date.now()}`;
    const docData: ExtendedArchiveDoc = {
      id: docId,
      ...newDoc,
      archiveId: cleanId,
      createdAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('settlement_entries').upsert({
        id: docId,
        content: docData
      });

      if (!error) {
        setDocuments(prev => [docData, ...prev]);
        setShowAddModal(false);
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
      .sort((a, b) => {
        const timeA = a.docDate ? new Date(a.docDate).getTime() : 0;
        const timeB = b.docDate ? new Date(b.docDate).getTime() : 0;
        return timeB - timeA;
      });
  }, [documents, searchTerm, activeCategory]);


  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 px-4 md:px-6">
      {/* Premium Editorial Header */}
      <header className="relative pt-12 pb-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-8 border-b border-slate-200 pb-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-600 font-black tracking-[0.2em] uppercase text-[10px]">
              <Library size={14} /> Digital Archive System
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
              অডিট <span className="text-blue-600 italic font-serif font-light">রেফারেন্স</span> লাইব্রেরি
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              সরকারি বিধি-বিধান, সার্কুলার এবং অডিট ক্রাইটেরিয়া এখন এক জায়গায়। দ্রুত রেফারেন্স খুঁজে পেতে স্মারক নম্বর বা বিষয় দিয়ে সার্চ করুন।
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-black text-sm flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-200 active:scale-95"
            >
              <Plus size={18} /> নতুন রেফারেন্স
            </button>
          </div>
        </div>
        {/* Decorative Element */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>
      </header>

      {/* Controls Bar - Minimalist & Sleek */}
      <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-xl border border-slate-200/60 p-3 rounded-[2rem] shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row items-center gap-4">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="স্মারক নং, শিরোনাম বা বিষয় দিয়ে খুঁজুন..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 h-[56px] bg-slate-50/50 border-none rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
            />
         </div>

         <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-xl font-black text-[12px] whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
              >
                {cat}
              </button>
            ))}
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block"></div>
            <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
               <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
               <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
            </div>
         </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center"><Library size={20} className="text-blue-400" /></div>
           </div>
           <p className="font-black text-slate-400 tracking-[0.3em] uppercase text-[10px]">Synchronizing Library...</p>
        </div>
      ) : filteredDocs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
             {filteredDocs.map((doc, idx) => (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.05 }}
                 key={doc.id}
                 className="group relative flex flex-col h-full"
               >
                  <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200/50 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                     <img 
                        src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                     />
                     {/* Overlay Actions */}
                     <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4">
                        <button 
                          onClick={() => setSelectedDoc(doc)}
                          className="w-14 h-14 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                        >
                          <Eye size={24} />
                        </button>
                        <div className="flex gap-2">
                           <a href={`https://archive.org/details/${extractCleanId(doc.archiveId)}`} target="_blank" className="p-3 bg-blue-600 text-white rounded-2xl hover:scale-105 transition-all"><Download size={20} /></a>
                           <button onClick={() => copyCitation(doc)} className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/30 transition-all"><FileText size={20} /></button>
                        </div>
                     </div>
                     {/* Category Tag */}
                     <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black rounded-full uppercase tracking-widest border border-white/50 shadow-sm">
                          {doc.category}
                        </span>
                     </div>
                  </div>

                  <div className="pt-6 px-2 space-y-3 flex-1 flex flex-col">
                     <div className="flex-1 space-y-2">
                        <h4 className="text-xl font-black text-slate-900 leading-[1.1] tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                          {doc.title}
                        </h4>
                        {doc.memoNo && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                            <Bookmark size={10} /> {doc.memoNo}
                          </div>
                        )}
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                           <div className="flex items-center gap-1.5"><Calendar size={12} /> {formatDateBN(doc.docDate)}</div>
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        )}
                     </div>
                  </div>
               </motion.div>
             ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Document Details</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Category</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Authority</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em]">Date</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                            <img 
                               src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                               className="w-full h-full object-cover"
                               onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                            />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">স্মারক: {doc.memoNo || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-widest">{doc.category}</span>
                      </td>
                      <td className="p-6">
                        <span className="text-[13px] font-bold text-slate-600">{doc.authority || '—'}</span>
                      </td>
                      <td className="p-6">
                        <span className="text-[13px] font-bold text-slate-500">{formatDateBN(doc.docDate)}</span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button onClick={() => setSelectedDoc(doc)} className="p-3 bg-white text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-slate-100 shadow-sm"><Eye size={16} /></button>
                           <a href={`https://archive.org/details/${extractCleanId(doc.archiveId)}`} target="_blank" className="p-3 bg-white text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-slate-100 shadow-sm"><Download size={16} /></a>
                           {isAdmin && (
                             <button onClick={() => handleDelete(doc.id)} className="p-3 bg-white text-slate-200 hover:bg-red-600 hover:text-white transition-all border border-slate-100 shadow-sm"><Trash2 size={16} /></button>
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
        <div className="py-40 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center space-y-6">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-xl"><Search size={48} /></div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">কোনো রেফারেন্স পাওয়া যায়নি</h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">আপনার অনুসন্ধানের সাথে মেলে এমন কোনো ফাইল এই মুহূর্তে নেই।</p>
           </div>
           {searchTerm && <button onClick={() => setSearchTerm('')} className="px-8 py-3 bg-white text-blue-600 font-black text-xs rounded-full border border-blue-100 hover:bg-blue-50 transition-all uppercase tracking-widest">সকল রেজাল্ট দেখুন</button>}
        </div>
      )}

      {/* Premium View Modal - Recipe 4 / 12 Style */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-6xl bg-white rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedDoc(null)}
                className="absolute top-8 right-8 z-[1010] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all active:scale-95 border border-white/10"
              >
                <X size={24} />
              </button>
              
              {/* Left Side: Visual & Action */}
              <div className="flex-[1.2] bg-slate-900 relative flex flex-col items-center justify-center p-12 text-center space-y-10">
                 <div className="absolute inset-0 opacity-20">
                    <img 
                      src={`https://archive.org/services/img/${extractCleanId(selectedDoc.archiveId)}`} 
                      className="w-full h-full object-cover blur-2xl"
                    />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="w-40 h-56 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl p-2 overflow-hidden mx-auto">
                       <img 
                          src={`https://archive.org/services/img/${extractCleanId(selectedDoc.archiveId)}`} 
                          className="w-full h-full object-cover rounded-[1.5rem]"
                       />
                    </div>
                    <div className="space-y-4 max-w-sm">
                       <h3 className="text-3xl font-black text-white tracking-tight leading-tight">ডকুমেন্টটি পড়ার জন্য প্রস্তুত</h3>
                       <p className="text-slate-400 font-medium text-sm leading-relaxed">নিরাপত্তা ও দ্রুত লোডিং নিশ্চিত করতে আমরা ডকুমেন্টটি সরাসরি নতুন ট্যাবে ওপেন করার পরামর্শ দিচ্ছি।</p>
                    </div>
                    <div className="flex flex-col gap-3">
                       <a 
                          href={`https://archive.org/details/${extractCleanId(selectedDoc.archiveId)}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-lg flex items-center justify-center gap-4 shadow-2xl shadow-blue-900/50 hover:scale-105 active:scale-95 transition-all group"
                       >
                          <Eye size={24} className="group-hover:animate-bounce" /> ডকুমেন্টটি ওপেন করুন
                       </a>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Archive.org Digital Library</p>
                    </div>
                 </div>
              </div>

              {/* Right Side: Metadata Editorial */}
              <div className="flex-1 p-12 lg:p-16 space-y-10 overflow-y-auto bg-white no-scrollbar">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <span className="px-5 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                         {selectedDoc.category}
                       </span>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: {extractCleanId(selectedDoc.archiveId)}</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                      {selectedDoc.title}
                    </h2>
                    
                    <div className="grid grid-cols-1 gap-4 pt-4">
                       <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Calendar size={18} /></div>
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ডকুমেন্ট তারিখ</span>
                                <span className="text-sm font-black text-slate-700">{formatDateBN(selectedDoc.docDate)}</span>
                             </div>
                          </div>
                       </div>
                       {selectedDoc.memoNo && (
                         <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Bookmark size={18} /></div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">স্মারক নম্বর</span>
                                  <span className="text-sm font-black text-slate-700">{selectedDoc.memoNo}</span>
                               </div>
                            </div>
                         </div>
                       )}
                       {selectedDoc.authority && (
                         <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Library size={18} /></div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ইস্যুকারী কর্তৃপক্ষ</span>
                                  <span className="text-sm font-black text-slate-700">{selectedDoc.authority}</span>
                                </div>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">বিবরণ (Description)</h5>
                    <p className="text-slate-600 font-medium leading-relaxed text-lg italic font-serif">
                      {selectedDoc.description || 'কোনো বিবরণ দেওয়া নেই।'}
                    </p>
                 </div>

                 {selectedDoc.tags && (
                   <div className="flex flex-wrap gap-2">
                      {selectedDoc.tags.split(',').map(tag => (
                        <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl border border-slate-200">#{tag.trim()}</span>
                      ))}
                   </div>
                 )}
                 
                 <div className="pt-10 flex flex-col gap-4">
                    <button 
                      onClick={() => copyCitation(selectedDoc)}
                      className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-4 shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-[0.98]"
                    >
                       <FileText size={20} /> রেফারেন্স কপি করুন
                    </button>
                    <button 
                      onClick={() => setSelectedDoc(null)}
                      className="w-full py-5 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all"
                    >
                       বন্ধ করুন
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal - Clean & Professional */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-white rounded-[3rem] p-10 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-8 mb-8">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner"><Plus size={28} /></div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">নতুন রেফারেন্স</h3>
                       <p className="text-slate-400 font-bold text-sm">লাইব্রেরিতে নতুন একটি ডকুমেন্ট যুক্ত করুন</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleAddDocument} className="space-y-8">
                 {/* Archive Link Section - Highlighted */}
                 <div className="space-y-4 bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100/50">
                    <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase tracking-[0.2em]">
                      <AlertCircle size={14} /> আর্কাইভ লিঙ্ক (Archive Link)
                    </div>
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         required
                         placeholder="এখানে লিঙ্ক বা আইডি পেস্ট করুন" 
                         className="flex-1 px-6 h-[60px] bg-white border border-blue-200 rounded-2xl font-black text-blue-900 placeholder:text-blue-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-sm tracking-widest"
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
                         className="px-6 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                       >
                         চেক করুন
                       </button>
                    </div>
                    {newDoc.archiveId && (
                      <div className="flex items-center gap-3 px-2">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">শনাক্তকৃত আইডি:</span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${!extractCleanId(newDoc.archiveId) ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-white border-blue-100 shadow-sm'}`}>
                          {extractCleanId(newDoc.archiveId) || 'শনাক্ত করা যায়নি'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ডকুমেন্ট শিরোনাম</label>
                       <input 
                         type="text" 
                         required
                         placeholder="যেমন: বার্ষিক অডিট সার্কুলার ২০২৪-২৫" 
                         className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                         value={newDoc.title}
                         onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ক্যাটাগরি</label>
                          <select 
                            className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                            value={newDoc.category}
                            onChange={e => setNewDoc({...newDoc, category: e.target.value as any})}
                          >
                             {categories.filter(c => c !== 'সকল').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ডকুমেন্ট তারিখ</label>
                          <input 
                            type="date" 
                            required
                            className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={newDoc.docDate}
                            onChange={e => setNewDoc({...newDoc, docDate: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">স্মারক নম্বর</label>
                          <input 
                            type="text" 
                            placeholder="যেমন: ০৫.০০.০০০০.১২৩.৪৫.৬৭৮" 
                            className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={newDoc.memoNo}
                            onChange={e => setNewDoc({...newDoc, memoNo: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ইস্যুকারী কর্তৃপক্ষ</label>
                          <input 
                            type="text" 
                            placeholder="যেমন: অর্থ মন্ত্রণালয় / বাংলাদেশ ব্যাংক" 
                            className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                            value={newDoc.authority}
                            onChange={e => setNewDoc({...newDoc, authority: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)</label>
                       <input 
                         type="text" 
                         placeholder="যেমন: বোনাস, ভাতা, বেতন কাঠামো" 
                         className="w-full px-6 h-[60px] bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                         value={newDoc.tags}
                         onChange={e => setNewDoc({...newDoc, tags: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">বিবরণ (ঐচ্ছিক)</label>
                       <textarea 
                         placeholder="ডকুমেন্টের সারসংক্ষেপ বা গুরুত্বপূর্ণ নোট এখানে লিখুন..." 
                         className="w-full p-6 min-h-[120px] bg-slate-50 border border-slate-200 rounded-[2rem] font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                         value={newDoc.description}
                         onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                       ></textarea>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">বাতিল</button>
                    <button type="submit" className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                       <Sparkles size={20} className="text-blue-400" /> আর্কাইভে যুক্ত করুন
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentArchive;
