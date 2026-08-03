import React, { useState, useEffect } from 'react';
import { 
  Link2, Plus, ExternalLink, Copy, Check, Trash2, Edit3, 
  Search, X, Globe, Sparkles, FolderPlus, ArrowUpRight
} from 'lucide-react';

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  createdAt: number;
}

interface SavedLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOCAL_STORAGE_KEY = 'audit_app_saved_links_v1';

export const SavedLinksModal: React.FC<SavedLinksModalProps> = ({ isOpen, onClose }) => {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState('');

  // Toast / Feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Load links from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLinks(parsed);
          return;
        }
      }
      setLinks([]);
    } catch (e) {
      console.error('Failed to load saved links', e);
      setLinks([]);
    }
  }, []);

  // Save links to localStorage
  const saveLinksToStorage = (updatedLinks: SavedLink[]) => {
    setLinks(updatedLinks);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));
    } catch (e) {
      console.error('Failed to save links', e);
    }
  };

  if (!isOpen) return null;

  const handleOpenAddForm = () => {
    setEditingLinkId(null);
    setFormTitle('');
    setFormUrl('');
    setFormCategory('');
    setFormError('');
    setShowAddForm(true);
  };

  const handleOpenEditForm = (link: SavedLink) => {
    setEditingLinkId(link.id);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormCategory(link.category || '');
    setFormError('');
    setShowAddForm(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('অনুগ্রহ করে লিংকের নাম বা শিরোনাম দিন');
      return;
    }
    if (!formUrl.trim()) {
      setFormError('অনুগ্রহ করে লিংকের ইউআরএল (URL) দিন');
      return;
    }

    let formattedUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    if (editingLinkId) {
      const updated = links.map(l => 
        l.id === editingLinkId 
          ? { ...l, title: formTitle.trim(), url: formattedUrl, category: formCategory.trim() || undefined }
          : l
      );
      saveLinksToStorage(updated);
    } else {
      const newLink: SavedLink = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        url: formattedUrl,
        category: formCategory.trim() || undefined,
        createdAt: Date.now()
      };
      saveLinksToStorage([newLink, ...links]);
    }

    setShowAddForm(false);
    setEditingLinkId(null);
    setFormTitle('');
    setFormUrl('');
    setFormCategory('');
    setFormError('');
  };

  const confirmDeleteLink = (id: string) => {
    const updated = links.filter(l => l.id !== id);
    saveLinksToStorage(updated);
    if (deletingLinkId === id) {
      setDeletingLinkId(null);
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredLinks = links.filter(link => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      (link.category && link.category.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-400/30">
              <Link2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                প্রয়োজনীয় লিংকসমূহ
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-400/30">
                  {links.length} টি
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                আপনার প্রয়োজনীয় গুরুত্বপূর্ণ ওয়েবলিংকগুলো এখানে সেভ করে রাখুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-600/30"
              >
                <Plus size={15} strokeWidth={3} />
                <span>নতুন লিংক</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add / Edit Form Drawer */}
          {showAddForm && (
            <form 
              onSubmit={handleSaveForm}
              className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <FolderPlus size={14} className="text-indigo-600" />
                  <span>{editingLinkId ? 'লিংক সম্পাদনা করুন' : 'নতুন লিংক যুক্ত করুন'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  বাতিল
                </button>
              </div>

              {formError && (
                <div className="p-2 bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">লিংকের নাম / শিরোনাম <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="যেমন: সিএজি অফিশিয়াল সাইট"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">ক্যাটাগরি/ট্যাগ (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="যেমন: অডিট, মিটিং, সার্কুলার"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">ইউআরএল (URL / ওয়েবলিংক) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="যেমন: https://cag.gov.bd"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1"
                >
                  <Check size={14} strokeWidth={3} />
                  <span>{editingLinkId ? 'আপডেট করুন' : 'সেভ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সংসংরক্ষিত লিংকগুলো খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Saved Links List */}
          {filteredLinks.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Globe className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {searchQuery ? 'কোনো মানানসই লিংক পাওয়া যায়নি' : 'এখনো কোনো প্রয়োজনীয় লিংক সেভ করা নেই'}
              </p>
              {!showAddForm && (
                <button
                  onClick={handleOpenAddForm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-md"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>প্রথম লিংক যুক্ত করুন</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-3.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 rounded-xl transition-colors shrink-0 mt-0.5 sm:mt-0">
                      <Globe size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                          {link.title}
                        </h4>
                        {link.category && (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full shrink-0">
                            {link.category}
                          </span>
                        )}
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-slate-500 hover:text-indigo-600 transition-colors truncate block mt-0.5"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    {deletingLinkId === link.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in duration-150">
                        <span className="text-[10px] font-black text-red-700 px-1">মুছে ফেলবেন?</span>
                        <button
                          onClick={() => confirmDeleteLink(link.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black rounded-lg transition-all shadow-xs"
                        >
                          হ্যাঁ
                        </button>
                        <button
                          onClick={() => setDeletingLinkId(null)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-all"
                        >
                          না
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopyUrl(link.id, link.url)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 border ${
                            copiedId === link.id
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                          title="লিংক কপি করুন"
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span>কপি হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>কপি</span>
                            </>
                          )}
                        </button>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black transition-all flex items-center gap-1"
                          title="ব্রাউজারে খুলুন"
                        >
                          <ArrowUpRight size={13} />
                          <span>ওপেন</span>
                        </a>

                        <button
                          onClick={() => handleOpenEditForm(link)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => setDeletingLinkId(link.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-bold shrink-0">
          <span>মোট সংরক্ষিত লিংক: {links.length} টি</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-xs transition-all"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
