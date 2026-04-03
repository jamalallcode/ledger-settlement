import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "তথ্য মুছে ফেলার নিশ্চিতকরণ",
  message = "আপনি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব হবে না।"
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/5 blur-[80px] rounded-full"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner border border-rose-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-slate-900 font-black text-lg tracking-tight">{title}</h3>
                <p className="text-rose-600/60 text-[9px] font-black uppercase tracking-[0.2em]">Delete Confirmation</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
            <p className="text-slate-700 font-bold text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95"
            >
              বাতিল করুন
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl font-black text-xs hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> নিশ্চিত করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
