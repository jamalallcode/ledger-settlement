import React from 'react';
import { ArchiveDoc } from '../types';
import { X, CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck, User, Calendar, FileText } from 'lucide-react';
import { formatDateBN, toBengaliDigits } from '../utils/numberUtils';

interface ExtendedArchiveDoc extends ArchiveDoc {
  memoNo?: string;
  authority?: string;
  tags?: string;
  status?: 'approved' | 'pending' | 'rejected';
  uploadedBy?: string;
}

interface PendingDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingDocs: ExtendedArchiveDoc[];
  isAdmin?: boolean;
  onApproveDoc: (id: string) => void;
  onRejectDoc: (id: string) => void;
  extractCleanId: (rawId: string) => string;
}

export const PendingDocsModal: React.FC<PendingDocsModalProps> = ({
  isOpen,
  onClose,
  pendingDocs,
  isAdmin = false,
  onApproveDoc,
  onRejectDoc,
  extractCleanId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in slide-in-from-bottom-6 duration-300 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {isAdmin ? 'অনুমোদনের জন্য অপেক্ষমান ডকুমেন্টসমূহ' : 'আপনার আপলোডকৃত ফাইল ও স্ট্যাটাস'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {isAdmin ? 'প্রাপ্য কন্ট্রিবিউটর ফাইলগুলো যাচাই করে অনুমোদন অথবা বাতিল করুন' : 'আপনার সাবমিট করা ডকুমেন্টের বর্তমান অবস্থা'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of Pending Docs */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {pendingDocs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-lg font-black text-slate-800">কোনো অপেক্ষমান ডকুমেন্ট নেই</h4>
              <p className="text-xs font-bold text-slate-500">সব কন্ট্রিবিউশন ফাইল ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।</p>
            </div>
          ) : (
            pendingDocs.map((doc) => {
              const cleanId = extractCleanId(doc.archiveId);
              return (
                <div 
                  key={doc.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                        <img 
                          src={`https://archive.org/services/img/${cleanId}`}
                          alt={doc.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = 'https://archive.org/images/archive_logo_large.png'; }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded uppercase">
                            {doc.category}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Calendar size={12} /> {formatDateBN(doc.docDate)}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 leading-snug">{doc.title}</h4>
                        {doc.memoNo && (
                          <p className="text-xs font-bold text-slate-600">স্মারক নং: {doc.memoNo}</p>
                        )}
                        {doc.authority && (
                          <p className="text-xs text-slate-500">কর্তৃপক্ষ: {doc.authority}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions / Status Badge */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <a
                        href={`https://archive.org/details/${cleanId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <ExternalLink size={14} /> প্রিভিউ
                      </a>

                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => onApproveDoc(doc.id)}
                            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> অনুমোদন
                          </button>
                          <button
                            onClick={() => onRejectDoc(doc.id)}
                            className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <XCircle size={14} /> বাতিল
                          </button>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-black rounded-full flex items-center gap-1">
                          <Clock size={14} /> অপেক্ষমান (Pending)
                        </span>
                      )}
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                      <strong>নোট:</strong> {doc.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-900 transition-all"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
