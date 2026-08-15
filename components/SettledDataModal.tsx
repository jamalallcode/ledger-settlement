import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { CorrespondenceEntry, SettlementEntry } from "../types";
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

const splitCombinedInfo = (info: string, noPrefix: string, datePrefix: string) => {
  if (!info) return { no: "-", date: "-" };
  const parts = info.split(",");
  if (parts.length < 2) {
    const cleaned = info
      .replace(
        /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
        ""
      )
      .trim();
    return { no: cleaned || "-", date: "-" };
  }
  let no =
    parts[0].replace(new RegExp(`.*${noPrefix}[\\s:\\-–—]*`), "").trim() || "-";
  let date = parts[1]
    .replace(new RegExp(`.*${datePrefix}[\\s:\\-–—]*`), "")
    .trim();
  if (date) {
    date = date + " খ্রি:";
  } else {
    date = "-";
  }
  return { no, date };
};

const formatArchiveNoForTable = (val: string | undefined | null) => {
  if (!val || val.trim() === "") return "-";

  const trimmed = val.trim();
  let prefix = "";
  let rest = trimmed;

  if (trimmed.toLowerCase().startsWith("kg-")) {
    const dashIdx = trimmed.indexOf("-");
    prefix = trimmed.substring(0, dashIdx + 1).trim() + " ";
    rest = trimmed.substring(dashIdx + 1).trim();
  }

  if (!rest) return prefix ? prefix.trim() : "-";

  const parts = rest
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  if (parts.length === 0) return prefix ? prefix.trim() : "-";

  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += 3) {
    const chunk = parts.slice(i, i + 3);
    lines.push(chunk.join(", "));
  }

  return prefix + lines.join("\n");
};

/**
 * Helper to check if a settlement entry actually has settled paragraphs or settlement recovery/adjustment data.
 */
export const hasSettledParagraphs = (se: SettlementEntry): boolean => {
  if (!se) return false;
  if (se.paragraphs && se.paragraphs.length > 0) {
    return se.paragraphs.some(
      (p) =>
        p.status === "পূর্ণাঙ্গ" ||
        p.status === "আংশিক" ||
        (p.recoveredAmount !== undefined && Number(p.recoveredAmount) > 0) ||
        (p.adjustedAmount !== undefined && Number(p.adjustedAmount) > 0) ||
        (p.vatRec !== undefined && Number(p.vatRec) > 0) ||
        (p.vatAdj !== undefined && Number(p.vatAdj) > 0) ||
        (p.itRec !== undefined && Number(p.itRec) > 0) ||
        (p.itAdj !== undefined && Number(p.itAdj) > 0) ||
        (p.othersRec !== undefined && Number(p.othersRec) > 0) ||
        (p.othersAdj !== undefined && Number(p.othersAdj) > 0)
    );
  }
  const totalSettledMoney =
    (Number(se.totalRec) || 0) +
    (Number(se.totalAdj) || 0) +
    (Number(se.vatRec) || 0) +
    (Number(se.vatAdj) || 0) +
    (Number(se.itRec) || 0) +
    (Number(se.itAdj) || 0) +
    (Number(se.othersRec) || 0) +
    (Number(se.othersAdj) || 0);
  const fullCount = parseInt(String(se.meetingFullSettledParaCount || "0"), 10) || 0;
  const partialCount = parseInt(String(se.meetingPartialSettledParaCount || "0"), 10) || 0;
  const settledCount = parseInt(String(se.meetingSettledParaCount || "0"), 10) || 0;

  return (
    totalSettledMoney > 0 ||
    fullCount > 0 ||
    partialCount > 0 ||
    settledCount > 0
  );
};

/**
 * Strict Matching Algorithm to guarantee the displayed settlement data
 * strictly belongs to the specific letter (Diary No, Letter No, Digital File No, Issue No, Ministry, Entity).
 */
export const findMatchedSettlements = (
  entry: CorrespondenceEntry,
  allSettlements: SettlementEntry[] = []
): SettlementEntry[] => {
  if (!entry || !allSettlements || allSettlements.length === 0) return [];

  const cleanStr = (val?: any) => {
    if (val === undefined || val === null) return "";
    return toEnglishDigits(String(val))
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]/g, "")
      .trim();
  };

  const extractCleanNumber = (val?: any) => {
    if (val === undefined || val === null) return "";
    const eng = toEnglishDigits(String(val));
    const digitsOnly = eng.replace(/[^\d]/g, "");
    return digitsOnly;
  };

  const cleanFileNo = (val?: any) => {
    if (val === undefined || val === null) return "";
    return toEnglishDigits(String(val))
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF]/g, "")
      .trim();
  };

  const entryId = entry.id;
  const cLetterNo = extractCleanNumber(entry.letterNo);
  const cDiaryNo = extractCleanNumber(entry.diaryNo);
  const cDigitalFileNo = cleanFileNo(entry.digitalFileNo);
  const cIssueNo = extractCleanNumber(entry.issueLetterNo);
  const cMinistry = cleanStr(entry.ministryName || (entry as any).ministry);
  const cEntity = cleanStr(
    entry.entityName || entry.description || (entry as any).organization
  );

  return allSettlements.filter((se: any) => {
    // 1. Direct ID relationship (100% definitive)
    if (se.correspondenceId && se.correspondenceId === entryId) return true;
    if (se.letterId && se.letterId === entryId) return true;
    if (se.id && se.id === entryId) return true;

    // 2. Extract values accurately from SettlementEntry
    const seLetterParts = splitCombinedInfo(
      se.letterNoDate || "",
      "পত্র নং",
      "পত্রের তারিখ"
    );
    const seDiaryParts = splitCombinedInfo(
      se.workpaperNoDate || "",
      "ডায়েরি নং",
      "ডায়েরির তারিখ"
    );
    const seIssueParts = splitCombinedInfo(
      se.issueLetterNoDate || "",
      "জারিপত্র নং",
      "জারিপত্রের তারিখ"
    );

    const seLetterNo = extractCleanNumber(se.letterNo || seLetterParts.no);
    const seDiaryNo = extractCleanNumber(se.diaryNo || seDiaryParts.no);
    const seDigitalFileNo = cleanFileNo(se.digitalFileNo);
    const seIssueNo = extractCleanNumber(
      se.issueNo || se.issueLetterNo || seIssueParts.no
    );

    const seMinistry = cleanStr(se.ministryName || se.ministry);
    const seEntity = cleanStr(
      se.entityName ||
        se.branchName ||
        (se.details && (se.details.entityName || se.details.entity))
    );

    // =========================================================================
    // STRICT CONFLICT PREVENTION (Strict Disqualification)
    // =========================================================================

    // If both records specify a Diary Number, they MUST NOT contradict each other
    if (cDiaryNo && seDiaryNo && cDiaryNo !== seDiaryNo) {
      return false;
    }

    // If both records specify a Letter Number, they MUST NOT contradict each other
    if (cLetterNo && seLetterNo && cLetterNo !== seLetterNo) {
      return false;
    }

    // If both records specify a Digital File Number, they MUST NOT contradict each other
    if (cDigitalFileNo && seDigitalFileNo && cDigitalFileNo !== seDigitalFileNo) {
      return false;
    }

    // If both records specify an Issue Letter Number (and not dummy 100), they MUST NOT contradict
    if (
      cIssueNo &&
      seIssueNo &&
      cIssueNo !== "100" &&
      seIssueNo !== "100" &&
      cIssueNo !== seIssueNo
    ) {
      return false;
    }

    // Ministry conflict check: if both specified and conflict, reject
    if (cMinistry && seMinistry) {
      if (!cMinistry.includes(seMinistry) && !seMinistry.includes(cMinistry)) {
        return false;
      }
    }

    // Organization conflict check: if both specified and known to differ, reject
    if (cEntity && seEntity) {
      const isKnownDifferentOrg =
        (cEntity.includes("সাধারণবীমা") && !seEntity.includes("সাধারণবীমা")) ||
        (cEntity.includes("কর্মসংস্থান") && !seEntity.includes("কর্মসংস্থান")) ||
        (cEntity.includes("কৃষি") && !seEntity.includes("কৃষি")) ||
        (cEntity.includes("সোনালী") && !seEntity.includes("সোনালী")) ||
        (cEntity.includes("জনতা") && !seEntity.includes("জনতা")) ||
        (cEntity.includes("অগ্রণী") && !seEntity.includes("অগ্রণী")) ||
        (cEntity.includes("রূপালী") && !seEntity.includes("রূপালী")) ||
        (cEntity.includes("বিডিবিএল") && !seEntity.includes("বিডিবিএল")) ||
        (cEntity.includes("ইনভেস্টমেন্ট") && !seEntity.includes("ইনভেস্টমেন্ট"));

      if (isKnownDifferentOrg) {
        return false;
      }
    }

    // =========================================================================
    // STRICT POSITIVE MULTI-FIELD MATCHING
    // =========================================================================

    // Multi-Match 1: Both Letter No and Diary No match exactly
    if (cLetterNo && seLetterNo && cDiaryNo && seDiaryNo) {
      if (cLetterNo === seLetterNo && cDiaryNo === seDiaryNo) {
        return true;
      }
    }

    // Multi-Match 2: Digital File No matches AND (Letter No OR Diary No matches)
    if (cDigitalFileNo && seDigitalFileNo && cDigitalFileNo === seDigitalFileNo) {
      if ((cLetterNo && seLetterNo && cLetterNo === seLetterNo) || (cDiaryNo && seDiaryNo && cDiaryNo === seDiaryNo)) {
        return true;
      }
      if (cEntity && seEntity && (cEntity.includes(seEntity) || seEntity.includes(cEntity))) {
        return true;
      }
    }

    // Multi-Match 3: Issue Letter No (real) matches AND (Letter No OR Diary No matches)
    if (
      cIssueNo &&
      seIssueNo &&
      cIssueNo !== "100" &&
      seIssueNo !== "100" &&
      cIssueNo === seIssueNo
    ) {
      if ((cLetterNo && seLetterNo && cLetterNo === seLetterNo) || (cDiaryNo && seDiaryNo && cDiaryNo === seDiaryNo)) {
        return true;
      }
    }

    // Multi-Match 4: If Diary No is missing on one side, Letter No matches + Entity matches + Ministry matches
    if ((!cDiaryNo || !seDiaryNo) && cLetterNo && seLetterNo && cLetterNo === seLetterNo) {
      if (
        cEntity &&
        seEntity &&
        (cEntity.includes(seEntity) || seEntity.includes(cEntity)) &&
        (!cMinistry || !seMinistry || cMinistry.includes(seMinistry) || seMinistry.includes(cMinistry))
      ) {
        return true;
      }
    }

    // Multi-Match 5: If Letter No is missing on one side, Diary No matches + Entity matches + Ministry matches
    if ((!cLetterNo || !seLetterNo) && cDiaryNo && seDiaryNo && cDiaryNo === seDiaryNo) {
      if (
        cEntity &&
        seEntity &&
        (cEntity.includes(seEntity) || seEntity.includes(cEntity)) &&
        (!cMinistry || !seMinistry || cMinistry.includes(seMinistry) || seMinistry.includes(cMinistry))
      ) {
        return true;
      }
    }

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

  const handlePrint = () => {
    window.print();
  };

  // 20-field bullet list renderer matching SettlementTable
  const renderCellDescription = (se: SettlementEntry) => {
    const hasNoParas = !se.paragraphs || se.paragraphs.length === 0;
    const isBsr = !se.isMeeting && se.meetingType === "বিএসআর";

    const letterParts = splitCombinedInfo(
      se.letterNoDate || "",
      "পত্র নং",
      "পত্রের তারিখ"
    );
    const diaryParts = splitCombinedInfo(
      se.workpaperNoDate || "",
      "ডায়েরি নং",
      "ডায়েরির তারিখ"
    );
    const issueParts = splitCombinedInfo(
      se.issueLetterNoDate || "",
      "জারিপত্র নং",
      "জারিপত্রের তারিখ"
    );
    const wpParts = splitCombinedInfo(
      se.meetingWorkpaper || "",
      "কার্যপত্র নং",
      "কার্যপত্রের তারিখ"
    );

    let currentSl = 1;
    const getNextLabel = (title: string) => {
      const num = toBengaliDigits(currentSl++);
      return `${num}. ${title}`;
    };

    const fields: Array<{
      label: string;
      value: string;
      isBold?: boolean;
    }> = [
      { label: getNextLabel("শাখা ধরণ"), value: se.paraType || "-" },
      {
        label: getNextLabel("চিঠির ধরণ"),
        value: se.isMeeting ? se.meetingType : "বিএসআর",
      },
      { label: getNextLabel("মন্ত্রণালয়"), value: se.ministryName || "-" },
      { label: getNextLabel("এনটিটি/সংস্থা"), value: se.entityName || "-" },
      {
        label: getNextLabel("শাখা (বিস্তারিত বিবরণ)"),
        value: se.branchName || "-",
      },
      {
        label: getNextLabel("নিরীক্ষা সাল"),
        value: toBengaliDigits(se.auditYear) || "-",
      },
      { label: getNextLabel("পত্র নং"), value: letterParts.no || "-" },
      { label: getNextLabel("পত্রের তারিখ"), value: letterParts.date || "-" },
    ];

    if (isBsr) {
      fields.push(
        { label: getNextLabel("ডায়েরি নং"), value: diaryParts.no || "-" },
        {
          label: getNextLabel("ডায়েরি তারিখ"),
          value: diaryParts.date || "-",
        },
        { label: getNextLabel("জারিপত্র নং"), value: issueParts.no || "-" },
        {
          label: getNextLabel("জারিপত্র তারিখ"),
          value: issueParts.date || "-",
        }
      );
    } else {
      fields.push(
        { label: getNextLabel("জারিপত্র নং"), value: issueParts.no || "-" },
        {
          label: getNextLabel("জারিপত্র তারিখ"),
          value: issueParts.date || "-",
        }
      );
    }

    fields.push({
      label: getNextLabel("প্রেরিত অনুচ্ছেদ সংখ্যা"),
      value: toBengaliDigits(se.meetingSentParaCount || "০") + " টি",
    });

    fields.push({
      label: getNextLabel("অনলাইন/অফলাইন স্ট্যাটাস"),
      value: se.isSentOnline || "না",
    });

    fields.push({
      label: getNextLabel("আর্কাইভ নং"),
      value: formatArchiveNoForTable(se.archiveNo) || "-",
    });

    if (isBsr) {
      fields.push({
        label: getNextLabel("মন্তব্য"),
        value: se.remarks || "-",
        isBold: false,
      });
    } else {
      fields.push(
        {
          label: getNextLabel("সভার তারিখ"),
          value: formatDateBN(se.meetingDate) || "-",
        },
        {
          label: getNextLabel("আলোচিত অনুচ্ছেদ সংখ্যা"),
          value:
            toBengaliDigits(se.meetingDiscussedParaCount || "০") + " টি",
        },
        {
          label: getNextLabel("সুপারিশকৃত অনুচ্ছেদ সংখ্যা"),
          value:
            toBengaliDigits(se.meetingRecommendedParaCount || "০") + " টি",
        },
        { label: getNextLabel("কার্যপত্র নং"), value: wpParts.no || "-" },
        {
          label: getNextLabel("কার্যপত্র তারিখ"),
          value: wpParts.date || "-",
        },
        {
          label: getNextLabel("কার্যবিবরণী প্রাপ্তির তারিখ"),
          value: se.meetingResponseDate || "-",
        },
        {
          label: getNextLabel("মন্তব্য"),
          value: se.remarks || "-",
          isBold: false,
        }
      );
    }

    return (
      <div className="w-full space-y-1 text-left">
        {hasNoParas && (
          <p className="text-[10px] leading-tight font-black text-red-600 underline underline-offset-2 tracking-tighter mb-1.5">
            উত্থাপিত এন্ট্রি (কোন অনুচ্ছেদ নেই)
          </p>
        )}
        {fields.map((f, idx) => {
          const displayVal = f.value === "-" || !f.value ? "" : f.value;
          return (
            <p key={idx} className="text-[10px] leading-tight">
              <span className="font-black text-emerald-700">
                {f.label}
                {f.label.includes("নং") ? "-" : ":"}
              </span>{" "}
              <span
                className={
                  f.isBold === false
                    ? "font-medium text-slate-800 italic whitespace-pre-wrap"
                    : "font-bold text-slate-900"
                }
              >
                {displayVal}
              </span>
            </p>
          );
        })}
      </div>
    );
  };

  const thBase =
    "border border-slate-300 px-1 py-1 font-black text-center text-slate-900 text-[8.5px] leading-tight align-middle bg-slate-200";
  const thBase2 =
    "border border-slate-300 px-1 py-1 font-black text-center text-slate-900 text-[8.5px] leading-tight align-middle bg-slate-200";
  const thBase3 =
    "border border-slate-300 px-1 py-0.5 font-black text-center text-slate-900 text-[8.5px] leading-tight align-middle bg-slate-200";
  const tdBase =
    "border border-slate-300 px-1 py-1.5 text-center align-middle text-[9.5px] leading-tight font-bold text-slate-900";
  const tdMoney =
    "border border-slate-300 px-1 py-1 text-center align-middle text-[9.5px] font-black text-slate-950";

  return createPortal(
    <div className="fixed inset-0 z-[50000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Main Dialog Modal */}
      <div
        className="relative z-10 w-full max-w-[96vw] xl:max-w-7xl bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-300/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  মীমাংসা রেজিস্টারের ডাটা ভিউ (হুবহু লেজার ফরম্যাট)
                </h3>
                <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  মীমাংসা রেজিস্টার হতে সংগৃহীত
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                চিঠিপত্র ও মীমাংসা রেজিস্টারের সুনির্দিষ্ট মিলকৃত তথ্যাবলি
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 px-2.5 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
              title="প্রিন্ট করুন"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded-lg transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Info Banner */}
        <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-emerald-950 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>চিঠিপত্রের বিবরণ:</span>
            <span className="font-extrabold text-slate-800">
              {entry.description || entry.entityName || "—"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>
              পত্র নং:{" "}
              <strong className="text-emerald-800">
                {toBengaliDigits(entry.letterNo || "—")}
              </strong>
            </span>
            <span>|</span>
            <span>
              ডায়েরি নং:{" "}
              <strong className="text-emerald-800">
                {toBengaliDigits(entry.diaryNo || "—")}
              </strong>
            </span>
            <span>|</span>
            <span>
              জারিপত্র নং:{" "}
              <strong className="text-emerald-800">
                {toBengaliDigits(entry.issueLetterNo || "—")}
              </strong>
            </span>
          </div>
        </div>

        {/* Modal Body Content (Scrollable) - Exact 14 Column Table */}
        <div className="p-4 overflow-y-auto bg-slate-50 flex-1">
          {matchedSettlements.length > 0 ? (
            <div className="w-full bg-white border border-slate-300 rounded-xl shadow-xs overflow-x-auto">
              <table className="w-full border-collapse text-center">
                <colgroup>
                  <col className="w-[35px]" />
                  <col className="w-[180px]" />
                  <col className="w-[50px]" />
                  <col className="w-[70px]" />
                  <col className="w-[45px]" />
                  <col className="w-[70px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                  <col className="w-[55px]" />
                </colgroup>
                <thead>
                  <tr className="h-[38px]">
                    <th rowSpan={2} className={thBase}>
                      ক্র: নং-
                    </th>
                    <th rowSpan={2} className={thBase}>
                      বিস্তারিত বিবরণ (২০ ফিল্ড)
                    </th>
                    <th rowSpan={2} className={thBase}>
                      অনু: নং-
                    </th>
                    <th rowSpan={2} className={thBase}>
                      জড়িত টাকা
                    </th>
                    <th colSpan={2} className={thBase}>
                      উত্থাপিত আপত্তি
                    </th>
                    <th colSpan={2} className={thBase}>
                      ভ্যাট
                    </th>
                    <th colSpan={2} className={thBase}>
                      আয়কর
                    </th>
                    <th colSpan={2} className={thBase}>
                      অন্যান্য
                    </th>
                    <th colSpan={2} className={thBase}>
                      মোট মীমাংসিত
                    </th>
                  </tr>
                  <tr className="h-[34px]">
                    <th className={thBase2}>সংখ্যা</th>
                    <th className={thBase2}>টাকা</th>
                    <th className={thBase2}>আদায়</th>
                    <th className={thBase2}>সমন্বয়</th>
                    <th className={thBase2}>আদায়</th>
                    <th className={thBase2}>সমন্বয়</th>
                    <th className={thBase2}>আদায়</th>
                    <th className={thBase2}>সমন্বয়</th>
                    <th className={thBase2}>আদায়</th>
                    <th className={thBase2}>সমন্বয়</th>
                  </tr>
                  <tr className="h-[22px]">
                    <th className={thBase3}>১</th>
                    <th className={thBase3}>২</th>
                    <th className={thBase3}>৩</th>
                    <th className={thBase3}>৪</th>
                    <th className={thBase3}>৫</th>
                    <th className={thBase3}>৬</th>
                    <th className={thBase3}>৭</th>
                    <th className={thBase3}>৮</th>
                    <th className={thBase3}>৯</th>
                    <th className={thBase3}>১০</th>
                    <th className={thBase3}>১১</th>
                    <th className={thBase3}>১২</th>
                    <th className={thBase3}>১৩</th>
                    <th className={thBase3}>১৪</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedSettlements.map((se, seIdx) => {
                    const paras = se.paragraphs || [];
                    const entrySettledCount = paras.filter(
                      (p) => p.status === "পূর্ণাঙ্গ"
                    ).length;
                    const entryInvolvedAmount = paras.reduce(
                      (sum, p) => sum + (p.involvedAmount || 0),
                      0
                    );
                    const mRaisedCountRaw =
                      se.manualRaisedCount?.toString().trim() || "";
                    const mRaisedCount =
                      mRaisedCountRaw === "" ||
                      mRaisedCountRaw === "0" ||
                      mRaisedCountRaw === "০"
                        ? "০"
                        : toBengaliDigits(mRaisedCountRaw);
                    const mRaisedAmount =
                      se.manualRaisedAmount !== null &&
                      se.manualRaisedAmount !== undefined &&
                      se.manualRaisedAmount !== 0
                        ? se.manualRaisedAmount
                        : 0;

                    return (
                      <React.Fragment key={se.id || seIdx}>
                        {paras.length > 0 ? (
                          paras.map((p, pIdx) => {
                            return (
                              <tr
                                key={p.id || pIdx}
                                className="bg-white hover:bg-emerald-50/30 transition-colors"
                              >
                                {pIdx === 0 && (
                                  <>
                                    <td
                                      rowSpan={paras.length}
                                      className={tdBase + " font-black"}
                                    >
                                      {toBengaliDigits(seIdx + 1)}
                                    </td>
                                    <td
                                      rowSpan={paras.length}
                                      className={tdBase + " text-left p-3"}
                                    >
                                      {renderCellDescription(se)}
                                    </td>
                                  </>
                                )}
                                <td className={tdBase}>
                                  <span className="font-black text-slate-900">
                                    {toBengaliDigits(p.paraNo)}
                                  </span>
                                  <br />
                                  <span
                                    className={`px-1 text-[8px] text-white font-black rounded ${
                                      p.status === "পূর্ণাঙ্গ"
                                        ? "bg-emerald-600"
                                        : "bg-red-600"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(p.involvedAmount || 0)
                                  )}
                                </td>
                                {pIdx === 0 && (
                                  <>
                                    <td
                                      rowSpan={paras.length}
                                      className={tdBase + " text-blue-700"}
                                    >
                                      {mRaisedCount}
                                    </td>
                                    <td
                                      rowSpan={paras.length}
                                      className={tdMoney + " text-blue-800"}
                                    >
                                      {toBengaliDigits(
                                        Math.round(mRaisedAmount)
                                      )}
                                    </td>
                                  </>
                                )}
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "ভ্যাট"
                                        ? p.recoveredAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "ভ্যাট"
                                        ? p.adjustedAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "আয়কর"
                                        ? p.recoveredAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "আয়কর"
                                        ? p.adjustedAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "অন্যান্য"
                                        ? p.recoveredAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(
                                      p.category === "অন্যান্য"
                                        ? p.adjustedAmount
                                        : 0
                                    )
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(p.recoveredAmount || 0)
                                  )}
                                </td>
                                <td className={tdMoney}>
                                  {toBengaliDigits(
                                    Math.round(p.adjustedAmount || 0)
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr className="bg-white hover:bg-emerald-50/30 transition-colors">
                            <td className={tdBase + " font-black"}>
                              {toBengaliDigits(seIdx + 1)}
                            </td>
                            <td className={tdBase + " text-left p-3"}>
                              {renderCellDescription(se)}
                            </td>
                            <td className={tdBase}>
                              <span className="font-bold text-slate-900">
                                {toBengaliDigits(se.paraNo || "১")}
                              </span>
                              <br />
                              <span
                                className={`px-1 text-[8px] text-white font-black rounded ${
                                  se.status === "পূর্ণাঙ্গ"
                                    ? "bg-emerald-600"
                                    : "bg-red-600"
                                }`}
                              >
                                {se.status || "পূর্ণাঙ্গ"}
                              </span>
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(se.involvedAmount || 0)
                              )}
                            </td>
                            <td className={tdBase + " text-blue-700"}>
                              {mRaisedCount}
                            </td>
                            <td className={tdMoney + " text-blue-800"}>
                              {toBengaliDigits(Math.round(mRaisedAmount))}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "ভ্যাট"
                                    ? se.totalRec
                                    : se.vatRec || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "ভ্যাট"
                                    ? se.totalAdj
                                    : se.vatAdj || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "আয়কর"
                                    ? se.totalRec
                                    : se.itRec || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "আয়কর"
                                    ? se.totalAdj
                                    : se.itAdj || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "অন্যান্য"
                                    ? se.totalRec
                                    : se.othersRec || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(
                                  se.category === "অন্যান্য"
                                    ? se.totalAdj
                                    : se.othersAdj || 0
                                )
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(se.totalRec || 0)
                              )}
                            </td>
                            <td className={tdMoney}>
                              {toBengaliDigits(
                                Math.round(se.totalAdj || 0)
                              )}
                            </td>
                          </tr>
                        )}

                        {/* Summary Bottom Row for the settlement entry */}
                        <tr className="bg-blue-50/70 font-black border-t border-slate-300 h-[36px]">
                          <td
                            colSpan={2}
                            className="px-4 text-left italic text-[10px] text-blue-900 border border-slate-300"
                          >
                            মোট মীমাংসিত অনুচ্ছেদ:{" "}
                            <span className="text-emerald-700">
                              {toBengaliDigits(entrySettledCount)} টি
                            </span>{" "}
                            | মোট জড়িত টাকা:{" "}
                            <span className="text-blue-700">
                              {toBengaliDigits(
                                Math.round(entryInvolvedAmount)
                              )}
                            </span>
                          </td>
                          <td className="text-center text-[10px] text-emerald-800 border border-slate-300 bg-emerald-50/30">
                            {toBengaliDigits(entrySettledCount)}
                          </td>
                          <td className="text-center text-[10px] text-blue-800 border border-slate-300 bg-blue-50/30">
                            {toBengaliDigits(
                              Math.round(entryInvolvedAmount)
                            )}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {mRaisedCount}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(Math.round(mRaisedAmount))}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(Math.round(se.vatRec || 0))}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(Math.round(se.vatAdj || 0))}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(Math.round(se.itRec || 0))}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(Math.round(se.itAdj || 0))}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(
                              Math.round(se.othersRec || 0)
                            )}
                          </td>
                          <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                            {toBengaliDigits(
                              Math.round(se.othersAdj || 0)
                            )}
                          </td>
                          <td className="text-center text-[10px] text-blue-900 border border-slate-300 bg-emerald-100/40 font-black">
                            {toBengaliDigits(Math.round(se.totalRec || 0))}
                          </td>
                          <td className="text-center text-[10px] text-blue-900 border border-slate-300 bg-emerald-100/40 font-black">
                            {toBengaliDigits(Math.round(se.totalAdj || 0))}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
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
                  সিলেক্ট করা রয়েছে। মীমাংসা এন্ট্রি ফর্ম থেকে এই চিঠির বিপরীতে বিস্তারিত অনুচ্ছেদ ও
                  টাকা এন্ট্রি করা হলে স্বয়ংক্রিয়ভাবে এখানে তা প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600" />
            <span>চিঠিপত্র রেজিস্টার থেকে সরাসরি মীমাংসা লেজার ভিউ</span>
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
