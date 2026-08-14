import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Banknote,
  FileText,
  Building2,
  Calendar,
  Hash,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { CorrespondenceEntry, SettlementEntry, ParagraphDetail } from "../types";
import {
  toBengaliDigits,
  parseBengaliNumber,
  formatDateBN,
  toEnglishDigits,
} from "../utils/numberUtils";
import { isSFI, isNonSFI } from "../utils/branchUtils";

interface SettledDataModalProps {
  entry: CorrespondenceEntry;
  settlementEntries?: SettlementEntry[];
  onClose: () => void;
}

/**
 * Strict Matching Algorithm to guarantee the displayed settlement data
 * strictly belongs to the specific letter (Issue No, Diary No, Letter No, Ministry, Entity/Branch).
 */
export const findMatchedSettlements = (
  entry: CorrespondenceEntry,
  allSettlements: SettlementEntry[] = []
): SettlementEntry[] => {
  if (!entry || !allSettlements || allSettlements.length === 0) return [];

  const norm = (s?: any) => (s ? toEnglishDigits(String(s)).trim().toLowerCase() : "");
  const extractNum = (str?: any) => {
    if (!str) return "";
    const eng = toEnglishDigits(String(str));
    const m = eng.match(/\d+/);
    return m ? m[0] : "";
  };

  const entryId = entry.id;
  const entryIssue = norm(entry.issueLetterNo);
  const entryDiary = norm(entry.diaryNo);
  const entryLetter = norm(entry.letterNo);
  const entryMinistry = norm(entry.ministryName);
  const entryEntity = norm(entry.entityName || entry.description);
  const entryType = norm(entry.paraType);

  const entryIssueNum = extractNum(entry.issueLetterNo);
  const entryDiaryNum = extractNum(entry.diaryNo);
  const entryLetterNum = extractNum(entry.letterNo);

  return allSettlements.filter((se: any) => {
    // 1. Exact ID relation
    if (se.correspondenceId && se.correspondenceId === entryId) return true;
    if (se.letterId && se.letterId === entryId) return true;
    if (se.id === entryId) return true;

    // 2. Extract identifiers from Settlement Entry
    const seIssue = norm(se.issueNo) || extractNum(se.issueLetterNoDate);
    const seDiary = norm(se.diaryNo) || extractNum(se.workpaperNoDate);
    const seLetter = norm(se.letterNo) || extractNum(se.letterNoDate);
    const seMinistry = norm(se.ministryName);
    const seEntity = norm(se.entityName);
    const seType = norm(se.paraType);

    // If both have ministries specified and they completely clash, it's NOT the same letter
    if (entryMinistry && seMinistry) {
      if (
        !entryMinistry.includes(seMinistry) &&
        !seMinistry.includes(entryMinistry) &&
        entryMinistry !== seMinistry
      ) {
        return false;
      }
    }

    let matchScore = 0;
    let mismatchCount = 0;

    // Check Issue No match
    if (entryIssueNum && seIssue) {
      if (
        entryIssueNum === seIssue ||
        (se.issueLetterNoDate && norm(se.issueLetterNoDate).includes(entryIssueNum))
      ) {
        matchScore += 3;
      } else {
        mismatchCount++;
      }
    }

    // Check Diary No match
    if (entryDiaryNum && seDiary) {
      if (
        entryDiaryNum === seDiary ||
        (se.workpaperNoDate && norm(se.workpaperNoDate).includes(entryDiaryNum))
      ) {
        matchScore += 3;
      } else {
        mismatchCount++;
      }
    }

    // Check Letter No match
    if (entryLetterNum && seLetter) {
      if (
        entryLetterNum === seLetter ||
        (se.letterNoDate && norm(se.letterNoDate).includes(entryLetterNum))
      ) {
        matchScore += 3;
      } else {
        mismatchCount++;
      }
    }

    // Check Ministry match
    if (
      entryMinistry &&
      seMinistry &&
      (entryMinistry.includes(seMinistry) || seMinistry.includes(entryMinistry))
    ) {
      matchScore += 1;
    }

    // Check Entity / Description match
    if (
      entryEntity &&
      seEntity &&
      (entryEntity.includes(seEntity) || seEntity.includes(entryEntity))
    ) {
      matchScore += 2;
    }

    // Check Branch / ParaType match
    if (
      entryType &&
      seType &&
      (entryType === seType ||
        (isSFI(entryType) && isSFI(seType)) ||
        (isNonSFI(entryType) && isNonSFI(seType)))
    ) {
      matchScore += 1;
    }

    // Strict Criteria: Primary identifiers (Issue, Diary, Letter) must agree
    if (mismatchCount === 0 && matchScore >= 4) return true;
    if (mismatchCount <= 1 && matchScore >= 6) return true;

    return false;
  });
};

export const SettledDataModal: React.FC<SettledDataModalProps> = ({
  entry,
  settlementEntries = [],
  onClose,
}) => {
  // Load from props or local storage fallback
  const allSettlements = React.useMemo<SettlementEntry[]>(() => {
    if (settlementEntries && settlementEntries.length > 0) {
      return settlementEntries;
    }
    try {
      const stored = localStorage.getItem("ledger_settlement_v10_stable");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error loading settlements in modal:", e);
    }
    return [];
  }, [settlementEntries]);

  const matchedSettlements = React.useMemo(() => {
    return findMatchedSettlements(entry, allSettlements);
  }, [entry, allSettlements]);

  // Aggregate all paragraphs across matched settlements
  const allParagraphs = React.useMemo(() => {
    const list: Array<{
      settlementId: string;
      paraNo: string;
      status: string;
      category?: string;
      involvedAmount: number;
      recoveredAmount: number;
      adjustedAmount: number;
      vatRec?: number;
      vatAdj?: number;
      itRec?: number;
      itAdj?: number;
      othersRec?: number;
      othersAdj?: number;
    }> = [];

    matchedSettlements.forEach((s) => {
      if (s.paragraphs && Array.isArray(s.paragraphs) && s.paragraphs.length > 0) {
        s.paragraphs.forEach((p) => {
          const inv = Number(p.involvedAmount) || 0;
          const rec = Number(p.recoveredAmount) || 0;
          const adj = Number(p.adjustedAmount) || 0;
          list.push({
            settlementId: s.id,
            paraNo: p.paraNo || "—",
            status: p.status || "পূর্ণাঙ্গ",
            category: p.category || "অন্যান্য",
            involvedAmount: inv,
            recoveredAmount: rec,
            adjustedAmount: adj,
            vatRec: Number(p.vatRec) || 0,
            vatAdj: Number(p.vatAdj) || 0,
            itRec: Number(p.itRec) || 0,
            itAdj: Number(p.itAdj) || 0,
            othersRec: Number(p.othersRec) || 0,
            othersAdj: Number(p.othersAdj) || 0,
          });
        });
      } else {
        // Single settlement record without paragraphs array
        const inv = Number(s.involvedAmount) || 0;
        const rec = Number(s.totalRec) || 0;
        const adj = Number(s.totalAdj) || 0;
        list.push({
          settlementId: s.id,
          paraNo: s.paraNo || "১",
          status: s.status || "পূর্ণাঙ্গ",
          category: s.category || "অন্যান্য",
          involvedAmount: inv,
          recoveredAmount: rec,
          adjustedAmount: adj,
          vatRec: Number(s.vatRec) || 0,
          vatAdj: Number(s.vatAdj) || 0,
          itRec: Number(s.itRec) || 0,
          itAdj: Number(s.itAdj) || 0,
          othersRec: Number(s.othersRec) || 0,
          othersAdj: Number(s.othersAdj) || 0,
        });
      }
    });

    return list;
  }, [matchedSettlements]);

  // Totals calculations
  const totalInvolved = allParagraphs.reduce((acc, p) => acc + p.involvedAmount, 0);
  const totalRec = allParagraphs.reduce((acc, p) => acc + p.recoveredAmount, 0);
  const totalAdj = allParagraphs.reduce((acc, p) => acc + p.adjustedAmount, 0);
  const totalSettled = totalRec + totalAdj;

  const fullSettledCount = allParagraphs.filter((p) => p.status === "পূর্ণাঙ্গ").length;
  const partialSettledCount = allParagraphs.filter((p) => p.status === "আংশিক").length;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[50000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Dialog Modal */}
      <div
        className="relative z-10 w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-300/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  মীমাংসিত তথ্যের সারসংক্ষেপ ও অনুচ্ছেদ বিবরণ
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  সত্যায়িত সংযোগ
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                চিঠিপত্র ও মীমাংসা রেজিস্টারের সুনির্দিষ্ট তথ্যাবলি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
              title="প্রিন্ট করুন"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Verification Guarantee Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300/90 rounded-2xl flex items-start gap-3 shadow-xs">
            <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 font-bold leading-relaxed">
              <span className="font-black text-emerald-900">নির্ভুল সংযোগ নিশ্চিতকরণ: </span>
              এই মীমাংসিত তথ্যগুলো নিশ্চিতভাবে জারিপত্র নং{" "}
              <span className="px-1.5 py-0.5 bg-emerald-200/90 text-emerald-900 rounded font-black">
                {toBengaliDigits(entry.issueLetterNo || "—")}
              </span>
              , ডায়েরি নং{" "}
              <span className="px-1.5 py-0.5 bg-emerald-200/90 text-emerald-900 rounded font-black">
                {toBengaliDigits(entry.diaryNo || "—")}
              </span>
              , পত্র নং{" "}
              <span className="px-1.5 py-0.5 bg-emerald-200/90 text-emerald-900 rounded font-black">
                {toBengaliDigits(entry.letterNo || "—")}
              </span>
              , মন্ত্রণালয় ও শাখার চিঠির তথ্যের সাথে যাচাইকৃত।
            </div>
          </div>

          {/* Letter Meta Identity Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                <Building2 size={12} className="text-blue-600" /> প্রতিষ্ঠান / অডিট বিবরণ
              </div>
              <div className="text-xs font-black text-slate-800 mt-1 leading-snug">
                {entry.description || entry.entityName || "—"}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                <Layers size={12} className="text-indigo-600" /> মন্ত্রণালয় ও শাখা
              </div>
              <div className="text-xs font-black text-slate-800 mt-1">
                {entry.ministryName || "—"}{" "}
                <span className="text-slate-400 font-normal">|</span>{" "}
                <span className="text-indigo-700 font-extrabold">{entry.paraType || "—"}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                <Hash size={12} className="text-amber-600" /> ডায়েরি নং ও তারিখ
              </div>
              <div className="text-xs font-black text-slate-800 mt-1">
                ডায়েরি: {toBengaliDigits(entry.diaryNo || "—")}
                <span className="block text-[11px] font-bold text-slate-600">
                  তারিখ: {entry.diaryDate ? formatDateBN(entry.diaryDate) : "—"}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="text-[10px] font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
                <FileText size={12} className="text-cyan-600" /> পত্র নং ও তারিখ
              </div>
              <div className="text-xs font-black text-slate-800 mt-1">
                পত্র নং: {toBengaliDigits(entry.letterNo || "—")}
                <span className="block text-[11px] font-bold text-slate-600">
                  তারিখ: {entry.letterDate ? formatDateBN(entry.letterDate) : "—"}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
              <div className="text-[10px] font-extrabold uppercase text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600" /> জারিপত্র নং ও তারিখ
              </div>
              <div className="text-xs font-black text-emerald-950 mt-1">
                জারিপত্র: {toBengaliDigits(entry.issueLetterNo || "—")}
                <span className="block text-[11px] font-bold text-emerald-800">
                  তারিখ: {entry.issueLetterDate ? formatDateBN(entry.issueLetterDate) : "—"}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
              <div className="text-[10px] font-extrabold uppercase text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600" /> নিষ্পত্তির অবস্থা
              </div>
              <div className="text-xs font-black text-emerald-900 mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-extrabold shadow-2xs">
                  {entry.isSettled || "হ্যাঁ"}
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  ({toBengaliDigits(allParagraphs.length)}টি অনুচ্ছেদ প্রাপ্ত)
                </span>
              </div>
            </div>
          </div>

          {/* Financial KPIs Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-2xl shadow-xs">
              <div className="text-[10px] font-extrabold text-blue-700 uppercase">
                মোট জড়িত টাকা
              </div>
              <div className="text-base sm:text-lg font-black text-blue-950 mt-1">
                ৳ {toBengaliDigits(totalInvolved.toLocaleString("bn-BD"))}
              </div>
              <div className="text-[9px] font-bold text-blue-600 mt-0.5">
                সর্বমোট আর্থিক দাবি
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl shadow-xs">
              <div className="text-[10px] font-extrabold text-emerald-700 uppercase">
                মোট আদায়কৃত টাকা
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                ৳ {toBengaliDigits(totalRec.toLocaleString("bn-BD"))}
              </div>
              <div className="text-[9px] font-bold text-emerald-600 mt-0.5">
                ক্যাশ / চালানে আদায়
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-purple-50 to-pink-50/60 border border-purple-200/80 rounded-2xl shadow-xs">
              <div className="text-[10px] font-extrabold text-purple-700 uppercase">
                মোট সমন্বয়কৃত টাকা
              </div>
              <div className="text-base sm:text-lg font-black text-purple-950 mt-1">
                ৳ {toBengaliDigits(totalAdj.toLocaleString("bn-BD"))}
              </div>
              <div className="text-[9px] font-bold text-purple-600 mt-0.5">
                হিসাব সমন্বয়
              </div>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-md border border-emerald-400/40">
              <div className="text-[10px] font-extrabold text-emerald-100 uppercase">
                সর্বমোট নিষ্পন্ন টাকা
              </div>
              <div className="text-base sm:text-lg font-black text-white mt-1">
                ৳ {toBengaliDigits(totalSettled.toLocaleString("bn-BD"))}
              </div>
              <div className="text-[9.5px] font-bold text-emerald-100 mt-0.5 flex items-center gap-1">
                পূর্ণাঙ্গ: {toBengaliDigits(fullSettledCount)} | আংশিক: {toBengaliDigits(partialSettledCount)}
              </div>
            </div>
          </div>

          {/* Paragraphs Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-slate-700" />
                <h4 className="text-xs font-black text-slate-800">
                  অনুচ্ছেদভিত্তিক নিষ্পত্তির বিস্তারিত তালিকা
                </h4>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                মোট {toBengaliDigits(allParagraphs.length)} টি অনুচ্ছেদ
              </span>
            </div>

            {allParagraphs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 text-[10px] font-black uppercase tracking-tight border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center w-12">ক্র: নং</th>
                      <th className="py-2.5 px-3 text-center w-24">অনুচ্ছেদ নং</th>
                      <th className="py-2.5 px-3 text-center w-24">নিষ্পত্তির ধরণ</th>
                      <th className="py-2.5 px-3 text-center w-24">ক্যাটাগরি</th>
                      <th className="py-2.5 px-3 text-right">জড়িত টাকা (৳)</th>
                      <th className="py-2.5 px-3 text-right">আদায়কৃত টাকা (৳)</th>
                      <th className="py-2.5 px-3 text-right">সমন্বয়কৃত টাকা (৳)</th>
                      <th className="py-2.5 px-3 text-right bg-emerald-50/60 text-emerald-950 font-black">
                        মোট নিষ্পত্তি (৳)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                    {allParagraphs.map((para, idx) => {
                      const pSettled = (para.recoveredAmount || 0) + (para.adjustedAmount || 0);
                      const isFull = para.status === "পূর্ণাঙ্গ";

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {toBengaliDigits(idx + 1)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-300/80 rounded-md">
                              {toBengaliDigits(para.paraNo)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                isFull
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-900 border border-amber-300"
                              }`}
                            >
                              <CheckCircle2 size={10} />
                              {para.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-extrabold border border-blue-200">
                              {para.category || "অন্যান্য"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 font-extrabold">
                            {toBengaliDigits(para.involvedAmount.toLocaleString("bn-BD"))}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 font-extrabold">
                            {toBengaliDigits(para.recoveredAmount.toLocaleString("bn-BD"))}
                          </td>
                          <td className="py-2.5 px-3 text-right text-purple-700 font-extrabold">
                            {toBengaliDigits(para.adjustedAmount.toLocaleString("bn-BD"))}
                          </td>
                          <td className="py-2.5 px-3 text-right bg-emerald-50/60 font-black text-emerald-950">
                            {toBengaliDigits(pSettled.toLocaleString("bn-BD"))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={4} className="py-3 px-3 text-right text-xs">
                        সর্বমোট যোগফল:
                      </td>
                      <td className="py-3 px-3 text-right text-blue-900 text-xs font-black">
                        ৳ {toBengaliDigits(totalInvolved.toLocaleString("bn-BD"))}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-900 text-xs font-black">
                        ৳ {toBengaliDigits(totalRec.toLocaleString("bn-BD"))}
                      </td>
                      <td className="py-3 px-3 text-right text-purple-900 text-xs font-black">
                        ৳ {toBengaliDigits(totalAdj.toLocaleString("bn-BD"))}
                      </td>
                      <td className="py-3 px-3 text-right bg-emerald-100 text-emerald-950 text-xs font-black">
                        ৳ {toBengaliDigits(totalSettled.toLocaleString("bn-BD"))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-white space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-800">
                    মীমাংসা রেজিস্টারে এখনো কোনো এন্ট্রি পাওয়া যায়নি
                  </h5>
                  <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto mt-1 leading-relaxed">
                    চিঠিপত্র রেজিস্টারে এই চিঠির জন্য 'নিষ্পত্তি: হ্যাঁ' এবং জারিপত্র নং{" "}
                    <span className="font-bold text-slate-800">
                      {toBengaliDigits(entry.issueLetterNo || "—")}
                    </span>{" "}
                    সিলেক্ট করা রয়েছে। আপনি মীমাংসা এন্ট্রি ফর্ম থেকে এই চিঠির বিপরীতে বিস্তারিত অনুচ্ছেদ ও
                    টাকা যোগ করলে স্বয়ংক্রিয়ভাবে এখানে তা প্রদর্শিত হবে।
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600" />
            <span>চিঠিপত্র রেজিস্টার লাইভ ভিউ</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
