import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Building2, Building, CheckCircle2, Layers, CalendarDays } from "lucide-react";
import { toBengaliDigits } from "../utils/numberUtils.ts";

export interface SettledEntityItem {
  entityName: string;
  count: number;
}

export interface SettledMinistryItem {
  ministryName: string;
  totalCount: number;
  entities: SettledEntityItem[];
}

interface SettledMinistryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchType: string;
  cycleLabel: string;
  totalCount: number;
  ministries: SettledMinistryItem[];
}

const SettledMinistryDetailModal: React.FC<SettledMinistryDetailModalProps> = ({
  isOpen,
  onClose,
  branchType,
  cycleLabel,
  totalCount,
  ministries,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSfi = branchType.includes("এসএফআই") && !branchType.includes("নন");
  const isNonSfi = branchType.includes("নন");

  const headerGradient = isSfi
    ? "from-emerald-700 via-teal-700 to-emerald-800"
    : isNonSfi
    ? "from-amber-600 via-orange-600 to-amber-700"
    : "from-slate-800 via-indigo-900 to-slate-900";

  const badgeBg = isSfi
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : isNonSfi
    ? "bg-amber-50 text-amber-900 border-amber-200"
    : "bg-blue-50 text-blue-900 border-blue-200";

  const ministryHeaderBg = isSfi
    ? "bg-emerald-50/90 text-emerald-950 border-emerald-200/90"
    : isNonSfi
    ? "bg-amber-50/90 text-amber-950 border-amber-200/90"
    : "bg-slate-100 text-slate-900 border-slate-200";

  const ministryIconColor = isSfi
    ? "text-emerald-700"
    : isNonSfi
    ? "text-amber-700"
    : "text-blue-700";

  const pillBadgeColor = isSfi
    ? "bg-emerald-600 text-white shadow-xs"
    : isNonSfi
    ? "bg-amber-600 text-white shadow-xs"
    : "bg-blue-600 text-white shadow-xs";

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white border-2 border-slate-200 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${headerGradient} text-white relative shrink-0`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Building2 size={22} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[16px] sm:text-[18px] font-black tracking-tight leading-tight">
                  মীমাংসিত অনুচ্ছেদ ও মন্ত্রণালয়ভিত্তিক সারসংক্ষেপ
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/90">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/25">
                    <CalendarDays size={12} />
                    সময়কাল: {toBengaliDigits(cycleLabel)}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/25">
                    <Layers size={12} />
                    {branchType}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/20 active:scale-95"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary Counter Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-black shrink-0 px-5">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold text-slate-500">মন্ত্রণালয়/বিভাগ সংখ্যা:</span>
            <span className={`px-2.5 py-0.5 rounded-lg border font-black ${badgeBg}`}>
              {toBengaliDigits(ministries.length)} টি
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">মোট মীমাংসিত অনুচ্ছেদ:</span>
            <span className={`px-3 py-0.5 rounded-lg font-black text-sm ${pillBadgeColor}`}>
              {toBengaliDigits(totalCount)} টি
            </span>
          </div>
        </div>

        {/* Modal Body: Ministry & Entity List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {ministries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold space-y-2">
              <CheckCircle2 size={36} className="mx-auto opacity-30" />
              <p className="text-sm">এই সময়কালে কোনো মীমাংসিত অনুচ্ছেদ নেই।</p>
            </div>
          ) : (
            ministries.map((m, mIdx) => (
              <div
                key={mIdx}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Ministry Group Header */}
                <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 ${ministryHeaderBg}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={16} className={`${ministryIconColor} shrink-0`} />
                    <span className="font-black text-[13px] sm:text-[14px] truncate" title={m.ministryName}>
                      {m.ministryName}
                    </span>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full font-black text-[11px] ${pillBadgeColor}`}>
                    মোট {toBengaliDigits(m.totalCount)} টি অনুচ্ছেদ
                  </span>
                </div>

                {/* Entity List under Ministry */}
                <div className="p-3 bg-slate-50/50 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {m.entities.map((entity, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-2.5 bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building size={14} className="text-slate-400 shrink-0" />
                          <span
                            className="font-bold text-slate-800 text-[12px] leading-tight break-words"
                            title={entity.entityName}
                          >
                            {entity.entityName}
                          </span>
                        </div>
                        <span className="shrink-0 font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                          {toBengaliDigits(entity.count)} টি
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettledMinistryDetailModal;
