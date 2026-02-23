import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { ArchiveDoc } from '../types';
import { 
  Library, Search, Filter, Plus, FileText, Calendar, 
  ExternalLink, Trash2, LayoutGrid, List, X, 
  ChevronRight, BookOpen, Clock, Download, Eye, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { toBengaliDigits } from '../utils/numberUtils';

const DocumentArchive: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const [documents, setDocuments] = useState<ArchiveDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('সকল');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ArchiveDoc | null>(null);

  // New Doc Form State
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'সার্কুলার' as ArchiveDoc['category'],
    archiveId: '',
    docDate: new Date().toISOString().split('T')[0],
    description: ''
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
        const mappedDocs: ArchiveDoc[] = [];
        
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
   * Helper function to extract only the identifier from a potential URL
   */
  const extractCleanId = (rawId: string) => {
    let clean = rawId.trim();
    if (clean.includes('archive.org/')) {
      const parts = clean.split('/');
      // Look for the segment after 'details' or 'embed'
      const detailIdx = parts.indexOf('details');
      const embedIdx = parts.indexOf('embed');
      const targetIdx = detailIdx !== -1 ? detailIdx : embedIdx;
      
      if (targetIdx !== -1 && parts[targetIdx + 1]) {
        clean = parts[targetIdx + 1].split('?')[0].split('#')[0];
      }
    }
    return clean;
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.archiveId) return alert("শিরোনাম এবং আর্কাইভ আইডি আবশ্যক!");

    const cleanId = extractCleanId(newDoc.archiveId);
    const docId = `doc_${Date.now()}`;
    const docData: ArchiveDoc = {
      id: docId,
      ...newDoc,
      archiveId: cleanId, // Save the cleaned ID to prevent display issues
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
        setNewDoc({ title: '', category: 'সার্কুলার', archiveId: '', docDate: new Date().toISOString().split('T')[0], description: '' });
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

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    
    return documents
      .filter(doc => {
        // Extra defensive string checks
        const title = String(doc.title || '').toLowerCase();
        const description = String(doc.description || '').toLowerCase();
        const search = String(searchTerm || '').toLowerCase();
        
        const matchesSearch = title.includes(search) || description.includes(search);
        const matchesCat = activeCategory === 'সকল' || doc.category === activeCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        // Strict timestamp sorting to prevent NaN in production
        const timeA = a.docDate ? new Date(a.docDate).getTime() : 0;
        const timeB = b.docDate ? new Date(b.docDate).getTime() : 0;
        const validA = isNaN(timeA) ? 0 : timeA;
        const validB = isNaN(timeB) ? 0 : timeB;
        return validB - validA;
      });
  }, [documents, searchTerm, activeCategory]);

  const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-landing-premium pb-20">
      {/* Header Section - Height Reduced (p-10 to p-8) */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 text-white/5"><Library size={240} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Library size={20} /></div>
                 <h2 className="text-2xl md:text-3xl font-black tracking-tight">ডকুমেন্ট আর্কাইভ ও লাইব্রেরি</h2>
              </div>
              <p className="text-slate-400 font-bold max-w-xl text-sm md:text-base leading-relaxed">সরকারি অর্ডার, সার্কুলার এবং গুরুত্বপূর্ণ সকল ডকুমেন্ট এখন এক জায়গার। Archive.org ইন্টিগ্রেশনের মাধ্যমে আপনার ফাইলগুলো থাকছে নিরাপদ।</p>
           </div>
           {/* Work: Removed {isAdmin && (...)} wrapper to allow all users to upload */}
           <button onClick={() => setShowAddModal(true)} className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-blue-900/40 active:scale-95 transition-all shrink-0">
              <Plus size={18} /> নতুন ডকুমেন্ট যুক্ত করুন
           </button>
        </div>
      </div>

      {/* Controls Bar - Sticky, height reduced (p-6 to p-5, input h-55 to h-50) */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border border-slate-200 p-5 rounded-3xl shadow-lg flex flex-col lg:flex-row items-center gap-5 transition-all duration-300">
         <div className="relative flex-1 w-full flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="শিরোনাম বা কী-ওয়ার্ড দিয়ে খুঁজুন..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 h-[50px] bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm"
              />
            </div>
            
            {/* Work: Added Premium Quick Upload Plus Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="h-[50px] w-[50px] shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-110 active:scale-95 transition-all duration-300 group"
              title="দ্রুত আপলোড"
            >
              <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
         </div>

         <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-center">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl font-black text-[13px] transition-all border ${activeCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
            <div className="h-8 w-[1.5px] bg-slate-200 mx-2 hidden lg:block"></div>
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
               <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><List size={16} /></button>
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
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "space-y-4"}>
           {filteredDocs.map((doc) => (
             <div 
               key={doc.id}
               className={`group bg-white border border-slate-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 ${viewMode === 'grid' ? 'rounded-[2.5rem] flex flex-col h-full' : 'rounded-2xl p-5 flex items-center justify-between'}`}
             >
                {viewMode === 'grid' ? (
                  <>
                    <div className="p-4 flex-1 space-y-4">
                       <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] overflow-hidden relative border border-slate-100 group-hover:border-blue-200 transition-colors">
                          <img 
                            src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                            alt={doc.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                          />
                          <div className="absolute top-4 left-4">
                             <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black rounded-full uppercase tracking-widest border border-white/50 shadow-sm">{doc.category}</span>
                          </div>
                          <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                             <button onClick={() => setSelectedDoc(doc)} className="p-4 bg-white text-blue-600 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all"><Eye size={24} /></button>
                             <a href={`https://archive.org/details/${extractCleanId(doc.archiveId)}`} target="_blank" className="p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all"><Download size={24} /></a>
                          </div>
                       </div>
                       <div className="space-y-2 px-2">
                          <h4 className="text-lg font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                             <div className="flex items-center gap-1.5"><Calendar size={12} /> {toBengaliDigits(doc.docDate)}</div>
                             <div className="flex items-center gap-1.5"><Clock size={12} /> {toBengaliDigits(safeFormatDate(doc.createdAt))}</div>
                          </div>
                       </div>
                    </div>
                    <div className="p-4 mt-auto border-t border-slate-50 flex items-center justify-between bg-slate-50/50 rounded-b-[2.5rem]">
                       <button onClick={() => setSelectedDoc(doc)} className="text-xs font-black text-blue-600 flex items-center gap-2 hover:underline">বিস্তারিত দেখুন <ChevronRight size={14} /></button>
                       {isAdmin && (
                         <button onClick={() => handleDelete(doc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                       )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                       <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                          <img 
                             src={`https://archive.org/services/img/${extractCleanId(doc.archiveId)}`} 
                             className="w-full h-full object-cover"
                             onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                          />
                       </div>
                       <div className="min-w-0">
                          <h4 className="text-[15px] font-black text-slate-900 truncate">{doc.title}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-1 uppercase">
                             <span className="text-blue-600">{doc.category}</span>
                             <span>•</span>
                             <span>{toBengaliDigits(doc.docDate)}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                       <button onClick={() => setSelectedDoc(doc)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"><Eye size={18} /></button>
                       <a href={`https://archive.org/details/${extractCleanId(doc.archiveId)}`} target="_blank" className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100"><Download size={18} /></a>
                       {isAdmin && (
                         <button onClick={() => handleDelete(doc.id)} className="p-3 bg-slate-50 text-slate-300 hover:text-red-500 transition-all border border-slate-100"><Trash2 size={18} /></button>
                       )}
                    </div>
                  </>
                )}
             </div>
           ))}
        </div>
      ) : (
        <div className="py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-4">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><Search size={40} /></div>
           <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">কোনো ডকুমেন্ট পাওয়া যায়নি</h3>
              <p className="text-slate-500 font-bold text-sm">আপনার অনুসন্ধানের সাথে মেলে এমন কোনো ফাইল এই মুহূর্তে নেই।</p>
           </div>
           {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 font-black text-xs hover:underline uppercase tracking-widest">সকল রেজাল্ট দেখুন</button>}
        </div>
      )}

      {/* View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-6xl h-full bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="absolute top-6 right-6 z-[1010] p-4 bg-slate-900 text-white rounded-2xl hover:bg-red-600 transition-all shadow-xl active:scale-95"
              >
                <X size={24} />
              </button>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                 <div className="flex-[3] bg-slate-50 relative min-h-[400px]">
                    <iframe 
                       src={`https://archive.org/embed/${extractCleanId(selectedDoc.archiveId)}`} 
                       className="w-full h-full border-none"
                       allowFullScreen
                    ></iframe>
                 </div>
                 <div className="flex-1 p-10 space-y-8 overflow-y-auto bg-white border-l border-slate-100 no-scrollbar">
                    <div className="space-y-4">
                       <span className="px-5 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">{selectedDoc.category}</span>
                       <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedDoc.title}</h3>
                       <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                          <Calendar size={16} /> <span>{toBengaliDigits(selectedDoc.docDate)}</span>
                       </div>
                    </div>
                    
                    <div className="h-[1.5px] w-full bg-slate-100"></div>
                    
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">বিবরণ (Description)</h5>
                       <p className="text-slate-600 font-bold leading-relaxed text-sm whitespace-pre-wrap">{selectedDoc.description || 'কোনো বিবরণ দেওয়া নেই।'}</p>
                    </div>
                    
                    <div className="pt-6 space-y-3">
                       <a 
                         href={`https://archive.org/details/${extractCleanId(selectedDoc.archiveId)}`} 
                         target="_blank"
                         className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                       >
                          <Download size={18} /> ফাইল ডাউনলোড করুন
                       </a>
                       <button 
                         onClick={() => setSelectedDoc(null)}
                         className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-100 transition-all"
                       >
                          বন্ধ করুন
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Plus size={24} /></div>
                    <h3 className="text-2xl font-black text-slate-900">নতুন আর্কাইভ এন্ট্রি</h3>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleAddDocument} className="space-y-6">
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

                 <div className="grid grid-cols-2 gap-6">
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

                 <div className="space-y-3 bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 font-black text-xs uppercase tracking-widest"><AlertCircle size={14} /> গুরুত্বপূর্ণ নির্দেশিকা</div>
                    <p className="text-[11px] font-bold text-blue-600 leading-relaxed">ডকুমেন্টটি প্রথমে Archive.org এ আপলোড করুন। আপলোড সম্পন্ন হলে URL বা Archive ID নিচে দিন। <br/>সঠিক ফরম্যাট: <span className="bg-blue-200 px-1 rounded text-blue-900 font-black tracking-tight">https://archive.org/details/20260214_20260214_2027</span></p>
                    <input 
                      type="text" 
                      required
                      placeholder="এখানে লিঙ্ক বা আইডি পেস্ট করুন" 
                      className="w-full px-5 h-[50px] bg-white border border-blue-200 rounded-xl font-black text-blue-900 placeholder:text-blue-300 outline-none focus:border-blue-500 transition-all text-sm tracking-widest"
                      value={newDoc.archiveId}
                      onChange={e => setNewDoc({...newDoc, archiveId: e.target.value})}
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

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">বাতিল</button>
                    <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                       <Sparkles size={18} className="text-blue-300" /> আর্কাইভে যুক্ত করুন
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