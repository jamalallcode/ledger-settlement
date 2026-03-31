import { useState, useMemo, useRef, useEffect } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SettlementEntry } from "../types.ts";
import {
  Trash2,
  Pencil,
  Calendar,
  Printer,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Fingerprint,
  Banknote,
  ListOrdered,
  Archive,
  MapPin,
  CalendarDays,
  Sparkles,
  ClipboardList,
  Filter,
  X,
  Search,
  LayoutGrid,
  CalendarSearch,
  Check,
  ShieldCheck,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import {
  toBengaliDigits,
  parseBengaliNumber,
  formatDateBN,
  toEnglishDigits,
} from "../utils/numberUtils.ts";
import HighlightText from "./HighlightText";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { OFFICE_HEADER } from "../constants.ts";
import { getCurrentCycle, getCycleForDate } from "../utils/cycleHelper.ts";
import { format, addMonths } from "date-fns";

interface SettlementTableProps {
  entries: SettlementEntry[];
  onDelete: (id: string, paraId?: string) => void;
  onEdit: (entry: SettlementEntry) => void;
  isLayoutEditable?: boolean;
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  isAdminView?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAdmin?: boolean;
  highlightSearch?: string | null;
  onClearHighlight?: () => void;
}

const isSFI = (type: string) => {
  if (!type) return false;
  const t = type.trim();
  return t === 'এসএফআই' || t === 'SFI' || t === 'sfi' || t === 'এস-এফ-আই' || t === 'এস এফ আই';
};

const isNonSFI = (type: string) => {
  if (!type) return false;
  const t = type.trim();
  return t.includes('নন') || t.toUpperCase().includes('NON-SFI');
};

const SettlementTable = React.forwardRef<HTMLDivElement, SettlementTableProps>(
  (
    {
      entries,
      onDelete,
      onEdit,
      isLayoutEditable,
      showFilters,
      setShowFilters,
      isAdminView = false,
      onApprove,
      onReject,
      isAdmin = false,
      highlightSearch = null,
      onClearHighlight,
    },
    ref,
  ) => {
    const [showCycleStats, setShowCycleStats] = useState<
      Record<string, boolean>
    >({});
    const [showSummary, setShowSummary] = useState(false);
    const lastActiveLabel = useRef<string>("");
    const cycleRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const cycleInfo = useMemo(() => getCurrentCycle(), []);
    const tableRef = useRef<HTMLTableElement>(null);
    const cycleDropdownRef = useRef<HTMLDivElement>(null);
    const branchDropdownRef = useRef<HTMLDivElement>(null);
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const summaryRef = useRef<HTMLDivElement>(null);
    const summaryButtonRef = useRef<HTMLButtonElement>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterParaType, setFilterParaType] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedCycleDate, setSelectedCycleDate] = useState<Date | null>(
      null,
    );

    const [deleteConfirm, setDeleteConfirm] = useState<{
      id: string;
      paraId?: string;
    } | null>(null);

    const [isCycleDropdownOpen, setIsCycleDropdownOpen] = useState(false);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
      new Set(),
    );

    useEffect(() => {
      if (highlightSearch) {
        setSearchTerm(highlightSearch);
        // Reset other filters to ensure the highlighted entry is visible
        setFilterParaType("");
        setFilterType("");
        setFilterStatus("");
        setSelectedCycleDate(null);
      }
      return () => {
        if (highlightSearch) onClearHighlight?.();
      };
    }, [highlightSearch, onClearHighlight]);

    // Click outside listener to close custom dropdowns
    useEffect(() => {
      // FIX: Consolidated click-outside handler to resolve 'dropdownRef' undefined error.
      // The previous 'handleClickOutside' was redundant and contained invalid references.
      const handleGlobalClick = (e: MouseEvent) => {
        if (
          cycleDropdownRef.current &&
          !cycleDropdownRef.current.contains(e.target as Node)
        )
          setIsCycleDropdownOpen(false);
        if (
          branchDropdownRef.current &&
          !branchDropdownRef.current.contains(e.target as Node)
        )
          setIsBranchDropdownOpen(false);
        if (
          typeDropdownRef.current &&
          !typeDropdownRef.current.contains(e.target as Node)
        )
          setIsTypeDropdownOpen(false);
        if (
          statusDropdownRef.current &&
          !statusDropdownRef.current.contains(e.target as Node)
        )
          setIsStatusDropdownOpen(false);
        if (
          summaryRef.current &&
          !summaryRef.current.contains(e.target as Node) &&
          summaryButtonRef.current &&
          !summaryButtonRef.current.contains(e.target as Node)
        ) {
          setShowSummary(false);
        }
      };
      document.addEventListener("mousedown", handleGlobalClick);
      return () => document.removeEventListener("mousedown", handleGlobalClick);
    }, []);

    const resetFilters = () => {
      setSearchTerm("");
      setFilterParaType("");
      setFilterType("");
      setFilterStatus("");
      setSelectedCycleDate(null);
    };

    const cycleOptions = useMemo(() => {
      const options = [];
      const banglaMonths: Record<string, string> = {
        January: "জানুয়ারি",
        February: "ফেব্রুয়ারি",
        March: "মার্চ",
        April: "এপ্রিল",
        May: "মে",
        June: "জুন",
        July: "জুলাই",
        August: "আগস্ট",
        September: "সেপ্টেম্বর",
        October: "অক্টোবর",
        November: "নভেম্বর",
        December: "ডিসেম্বর",
      };

      const today = new Date();
      for (let i = 0; i < 24; i++) {
        const refDate = addMonths(today, -i);
        const firstOfTargetMonth = new Date(
          refDate.getFullYear(),
          refDate.getMonth(),
          1,
        );
        const cycle = getCycleForDate(firstOfTargetMonth);
        const monthNameEng = format(firstOfTargetMonth, "MMMM");
        const yearEng = format(firstOfTargetMonth, "yyyy");
        const label = `${banglaMonths[monthNameEng]} ${toBengaliDigits(yearEng)} সাইকেল`;
        options.push({
          date: firstOfTargetMonth,
          label,
          cycleLabel: cycle.label,
        });
      }
      return options;
    }, []);

    const activeCycle = useMemo(() => {
      if (!selectedCycleDate) return null;
      return getCycleForDate(selectedCycleDate);
    }, [selectedCycleDate]);

    const toggleExpand = (id: string) => {
      const next = new Set(expandedEntries);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setExpandedEntries(next);
    };

    const IDBadge = ({ id }: { id: string }) => {
      const [copied, setCopied] = useState(false);
      if (!isLayoutEditable) return null;
      const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      };
      return (
        <span
          onClick={handleCopy}
          className={`absolute -top-3 left-2 bg-black text-white text-[9px] font-black px-2 py-0.5 rounded border border-white/30 z-[300] cursor-pointer no-print shadow-xl transition-all duration-200 hover:scale-150 hover:bg-blue-600 active:scale-95 flex items-center gap-1 origin-left ${copied ? "ring-2 ring-emerald-500 bg-emerald-600" : ""}`}
        >
          {copied ? "COPIED!" : `#${id}`}
        </span>
      );
    };

    const filteredEntries = useMemo(() => {
      const activeLabelCanon = activeCycle ? toEnglishDigits(activeCycle.label).trim() : "";
      return entries
        .filter((entry) => {
          let entryDate = entry.issueDateISO;
          if (!entryDate && entry.createdAt) {
            const d = new Date(entry.createdAt);
            if (!isNaN(d.getTime())) {
              entryDate = d.toISOString().split("T")[0];
            }
          }
          if (!entryDate) entryDate = "";

          const labelMatch = activeLabelCanon && entry.cycleLabel && 
            toEnglishDigits(entry.cycleLabel).trim() === activeLabelCanon;

          const matchDate =
            !activeCycle ||
            labelMatch ||
            (entryDate !== "" &&
              entryDate >= format(activeCycle.start, "yyyy-MM-dd") &&
              entryDate <= format(activeCycle.end, "yyyy-MM-dd"));

          const normalizedSearch = toEnglishDigits(
            searchTerm.trim().toLowerCase(),
          );
          const isNumericSearch = /^\d+$/.test(normalizedSearch);

          const matchSearch =
            searchTerm === "" ||
            (() => {
              // More robust cleaning for search matching
              const cleanNumber = (str: string) => {
                return toEnglishDigits(str.toLowerCase())
                  .replace(
                    /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
                    "",
                  )
                  .trim();
              };

              const engIssue = cleanNumber(entry.issueLetterNoDate || "");
              const engLetter = cleanNumber(entry.letterNoDate || "");
              const engDiary = cleanNumber(entry.workpaperNoDate || "");
              const engWp = cleanNumber(entry.meetingWorkpaper || "");

              const isNumberMatch =
                engIssue.includes(normalizedSearch) ||
                engLetter.includes(normalizedSearch) ||
                engDiary.includes(normalizedSearch) ||
                engWp.includes(normalizedSearch);

              if (isNumericSearch) return isNumberMatch;

              // Also allow partial match on other fields for general search
              const descMatch = toEnglishDigits(
                (entry.remarks || "").toLowerCase(),
              ).includes(normalizedSearch);
              const branchMatch = toEnglishDigits(
                (entry.branchName || "").toLowerCase(),
              ).includes(normalizedSearch);
              const ministryMatch = toEnglishDigits(
                (entry.ministryName || "").toLowerCase(),
              ).includes(normalizedSearch);
              const entityMatch = toEnglishDigits(
                (entry.entityName || "").toLowerCase(),
              ).includes(normalizedSearch);

              return (
                isNumberMatch ||
                descMatch ||
                branchMatch ||
                ministryMatch ||
                entityMatch
              );
            })();

          const entryType = entry.isMeeting ? entry.meetingType : "বিএসআর";
          const matchType = filterType === "" || entryType === filterType;
          const matchParaType = (() => {
            if (filterParaType === "") return true;
            if (!entry.paraType) return false;
            
            const variations = [filterParaType, filterParaType.replace(' ', '-'), filterParaType.replace('-', ' ')];
            if (filterParaType === 'এসএফআই') variations.push('SFI', 'sfi', 'এস-এফ-আই', 'এস এফ আই');
            else if (filterParaType.includes('নন')) variations.push('NON-SFI', 'non-sfi', 'Non-SFI', 'নন-এসএফআই', 'নন-এস-এফ-আই', 'নন এস এফ আই');
            
            const normalizedEntryPara = entry.paraType.trim();
            return variations.some(v => normalizedEntryPara === v);
          })();

          const hasSettled = entry.paragraphs?.some(
            (p) => p.status === "পূর্ণাঙ্গ",
          );
          const hasUnsettled = entry.paragraphs?.some(
            (p) => p.status === "আংশিক",
          );
          const matchStatus =
            filterStatus === "" ||
            (filterStatus === "settled" && hasSettled) ||
            (filterStatus === "unsettled" && hasUnsettled) ||
            (filterStatus === "no-paras" &&
              (!entry.paragraphs || entry.paragraphs.length === 0));

          const hasRaisedCount =
            entry.manualRaisedCount !== null &&
            entry.manualRaisedCount !== "" &&
            entry.manualRaisedCount !== "0" &&
            entry.manualRaisedCount !== "০";
          const hasRaisedAmount =
            entry.manualRaisedAmount !== null && entry.manualRaisedAmount !== 0;
          const hasMeaningfulContent =
            (entry.paragraphs && entry.paragraphs.length > 0) ||
            (entry.isMeeting && (entry.meetingUnsettledAmount || 0) > 0) ||
            hasRaisedCount ||
            hasRaisedAmount;

          // If we have a search term and it matches, we should show it regardless of "meaningful content"
          if (searchTerm !== "" && matchSearch)
            return matchDate && matchType && matchParaType && matchStatus;

          // If filtering for no paragraphs, show even if it doesn't have "meaningful content"
          if (filterStatus === "no-paras" && matchStatus)
            return matchDate && matchType && matchParaType;

          if (!hasMeaningfulContent) return false;

          return (
            matchDate &&
            matchSearch &&
            matchType &&
            matchParaType &&
            matchStatus
          );
        })
        .sort((a, b) => {
          const timeB = b.issueDateISO ? new Date(b.issueDateISO).getTime() : 0;
          const timeA = a.issueDateISO ? new Date(a.issueDateISO).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;

          const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return (isNaN(createdB) ? 0 : createdB) - (isNaN(createdA) ? 0 : createdA);
        });
    }, [
      entries,
      searchTerm,
      filterParaType,
      filterType,
      filterStatus,
      activeCycle,
    ]);

    const { cycleStats, groupedEntries } = useMemo(() => {
      const groupsMap: Record<string, SettlementEntry[]> = {};
      const groupsList: { label: string; entries: SettlementEntry[] }[] = [];

      filteredEntries.forEach((entry) => {
        let label = "Unknown";
        let entryDate = entry.issueDateISO;
        if (!entryDate && entry.createdAt) {
          const d = new Date(entry.createdAt);
          if (!isNaN(d.getTime())) {
            entryDate = d.toISOString().split("T")[0];
          }
        }

        if (entryDate) {
          try {
            const dateObj = new Date(entryDate);
            if (!isNaN(dateObj.getTime())) {
              label = getCycleForDate(dateObj).label;
            }
          } catch (e) {}
        }

        if (!groupsMap[label]) {
          groupsMap[label] = [];
          groupsList.push({ label, entries: groupsMap[label] });
        }
        groupsMap[label].push(entry);
      });

      const statsMap: Record<string, any> = {};
      groupsList.forEach((group) => {
        const totalLetters = group.entries.length;
        const sfiEntries = group.entries.filter((e) => isSFI(e.paraType));
        const nonSfiEntries = group.entries.filter(
          (e) => isNonSFI(e.paraType),
        );
        const sfiBSR = sfiEntries.filter(
          (e) => !e.isMeeting || e.meetingType === "বিএসআর",
        ).length;
        const sfiTri = sfiEntries.filter(
          (e) => e.meetingType === "ত্রিপক্ষীয় সভা",
        ).length;
        const nonSfiBSR = nonSfiEntries.filter(
          (e) => !e.isMeeting || e.meetingType === "বিএসআর",
        ).length;
        const nonSfiBi = nonSfiEntries.filter(
          (e) => e.meetingType === "দ্বিপক্ষীয় সভা",
        ).length;
        const cycleSettledParasCount = group.entries.reduce(
          (acc, ent) =>
            acc +
            (ent.paragraphs?.filter((p) => p.status === "পূর্ণাঙ্গ").length ||
              0),
          0,
        );

        const getSettledDetails = (typeEntries: SettlementEntry[]) => {
          const grouped = typeEntries.reduce(
            (acc, ent) => {
              const count =
                ent.paragraphs?.filter((p) => p.status === "পূর্ণাঙ্গ")
                  .length || 0;
              if (count > 0)
                acc[ent.entityName] = (acc[ent.entityName] || 0) + count;
              return acc;
            },
            {} as Record<string, number>,
          );
          const total = Object.values(grouped).reduce((a, b) => a + b, 0);
          const details = Object.entries(grouped)
            .map(([name, count]) => `${name} ${toBengaliDigits(count)} টি`)
            .join(", ");
          return { total, details };
        };

        const sfiSettled = getSettledDetails(sfiEntries);
        const nonSfiSettled = getSettledDetails(nonSfiEntries);

        statsMap[group.label] = {
          totalLetters,
          sfiEntries,
          nonSfiEntries,
          sfiBSR,
          sfiTri,
          nonSfiBSR,
          nonSfiBi,
          cycleSettledParasCount,
          sfiSettled,
          nonSfiSettled,
        };
      });

      return { cycleStats: statsMap, groupedEntries: groupsList };
    }, [filteredEntries]);

    useEffect(() => {
      const handleScroll = () => {
        let activeLabel = "";
        const stickyTop = 80;

        for (const group of groupedEntries) {
          const el = cycleRefs.current[group.label];
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= stickyTop + 10) {
              activeLabel = group.label;
            }
          }
        }

        if (activeLabel && activeLabel !== lastActiveLabel.current) {
          lastActiveLabel.current = activeLabel;
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, [groupedEntries]);

    const grandTotals = useMemo(() => {
      return filteredEntries.reduce(
        (acc, entry) => {
          const paras = entry.paragraphs || [];
          
          // Count full settlements from paragraphs OR from meeting summary count
          const pFullCount = paras.filter((p) => p.status === "পূর্ণাঙ্গ").length;
          const mFullCount = parseBengaliNumber(entry.meetingFullSettledParaCount || "0");
          acc.paraCount += Math.max(pFullCount, mFullCount);

          // Use entry.involvedAmount if available as it includes meeting unsettled amounts
          acc.inv += entry.involvedAmount || paras.reduce((sum, p) => sum + (p.involvedAmount || 0), 0);

          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          const rCount =
            rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০"
              ? parseBengaliNumber(rCountRaw)
              : 0;
          const rAmount =
            entry.manualRaisedAmount !== null &&
            entry.manualRaisedAmount !== undefined &&
            entry.manualRaisedAmount !== 0
              ? Number(entry.manualRaisedAmount)
              : 0;
          acc.raisedCount += rCount;
          acc.raisedAmount += rAmount;
          acc.vRec += entry.vatRec || 0;
          acc.vAdj += entry.vatAdj || 0;
          acc.iRec += entry.itRec || 0;
          acc.iAdj += entry.itAdj || 0;
          acc.oRec += entry.othersRec || 0;
          acc.oAdj += entry.othersAdj || 0;
          acc.tRec += entry.totalRec || 0;
          acc.tAdj += entry.totalAdj || 0;
          return acc;
        },
        {
          paraCount: 0,
          inv: 0,
          raisedCount: 0,
          raisedAmount: 0,
          vRec: 0,
          vAdj: 0,
          iRec: 0,
          iAdj: 0,
          oRec: 0,
          oAdj: 0,
          tRec: 0,
          tAdj: 0,
        },
      );
    }, [filteredEntries]);

    const globalStats = useMemo(() => {
      const totalLetters = filteredEntries.length;
      const sfiEntries = filteredEntries.filter((e) => e.paraType === "এসএফআই");
      const nonSfiEntries = filteredEntries.filter(
        (e) => e.paraType === "নন এসএফআই",
      );

      const sfiBSR = sfiEntries.filter(
        (e) => !e.isMeeting || e.meetingType === "বিএসআর",
      ).length;
      const sfiTri = sfiEntries.filter(
        (e) => e.meetingType === "ত্রিপক্ষীয় সভা",
      ).length;
      const nonSfiBSR = nonSfiEntries.filter(
        (e) => !e.isMeeting || e.meetingType === "বিএসআর",
      ).length;
      const nonSfiBi = nonSfiEntries.filter(
        (e) => e.meetingType === "দ্বিপক্ষীয় সভা",
      ).length;

      return {
        totalLetters,
        sfi: {
          total: sfiEntries.length,
          bsr: sfiBSR,
          tri: sfiTri,
        },
        nonSfi: {
          total: nonSfiEntries.length,
          bsr: nonSfiBSR,
          bi: nonSfiBi,
        },
        settledParas: grandTotals.paraCount,
        totalInvolved: grandTotals.inv,
      };
    }, [filteredEntries, grandTotals]);

    const formatIssueInfoForDisplay = (info: string) => {
      if (!info) return "";
      const cleaned = info
        .replace(
          /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
          "",
        )
        .trim();
      return cleaned ? cleaned + " খ্রি:" : "";
    };

    const formatDiaryInfoForDisplay = (info: string) => {
      if (!info) return "";
      const cleaned = info
        .replace(
          /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
          "",
        )
        .trim();
      return cleaned ? cleaned + " খ্রি:" : "";
    };

    const formatLetterInfoForDisplay = (info: string) => {
      if (!info) return "";
      const cleaned = info
        .replace(
          /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
          "",
        )
        .trim();
      return cleaned ? cleaned + " খ্রি:" : "";
    };

    const formatWorkpaperInfoForDisplay = (info: string) => {
      if (!info) return "";
      const cleaned = info
        .replace(
          /(কার্যপত্রের|কার্যপত্র|জারিপত্রের|জারিপত্র|ডায়েরির|ডায়েরি|পত্রের|পত্র|তারিখের|তারিখ|নং|ও|ের|র)[\s:\-–—]*/g,
          "",
        )
        .trim();
      return cleaned ? cleaned + " খ্রি:" : "";
    };

    // Headers reverted to font-black
    const thBase =
      "sticky top-0 border border-slate-300 px-1 py-1 font-black text-center text-slate-900 text-[8px] leading-tight align-middle h-full bg-slate-200 z-[110] relative";
    const thBase2 =
      "sticky top-[42px] border border-slate-300 px-1 py-1 font-black text-center text-slate-900 text-[8px] leading-tight align-middle h-full bg-slate-200 z-[110] relative";
    // Body cells reverted to font-bold
    const tdBase =
      "border border-slate-300 px-0.5 py-1.5 text-center align-middle text-[9px] leading-tight font-bold text-slate-900 relative";
    const tdMoney =
      "border border-slate-300 px-0.5 py-1 text-center align-middle text-[9px] font-black text-slate-950 relative";

    const renderMetadataGrid = (entry: SettlementEntry) => {
      const paras = entry.paragraphs || [];
      const fullMoney = paras
        .filter((p) => p.status === "পূর্ণাঙ্গ")
        .reduce((s, p) => s + p.involvedAmount, 0);
      const partialMoney = paras
        .filter((p) => p.status === "আংশিক")
        .reduce((s, p) => s + p.involvedAmount, 0);

      return (
        <div className="bg-slate-50/80 p-6 border-x border-b border-slate-200 rounded-b-xl animate-in slide-in-from-top-4 duration-500 shadow-inner">
          {isAdminView && (
            <div className="mb-6 p-4 bg-white border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    এটি একটি অপেক্ষমাণ এন্ট্রি
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    অনুমোদন দিলে এটি মূল রেজিস্টারে যুক্ত করা যাবে।
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onReject?.(entry.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[11px] hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100"
                >
                  <XCircle size={14} /> প্রত্যাখ্যান করুন
                </button>
                <button
                  onClick={() => onApprove?.(entry.id)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black text-[11px] hover:bg-emerald-700 transition-all items-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <ShieldCheck size={14} /> অনুমোদন দিন
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "১. শাখা ধরণ",
                value: entry.paraType,
                icon: Fingerprint,
                col: "sky",
              },
              {
                label: "২. চিঠির ধরণ",
                value: entry.isMeeting ? entry.meetingType : "বিএসআর",
                icon: FileText,
                col: "emerald",
              },
              {
                label: "৩. মন্ত্রণালয়",
                value: entry.ministryName,
                icon: MapPin,
                col: "amber",
              },
              {
                label: "৪. সংস্থা",
                value: entry.entityName,
                icon: FileText,
                col: "purple",
              },
              {
                label: "৫. বিস্তারিত শাখা",
                value: entry.branchName,
                icon: MapPin,
                col: "sky",
              },
              {
                label: "৬. নিরীক্ষা সাল",
                value: toBengaliDigits(entry.auditYear),
                icon: Calendar,
                col: "emerald",
              },
              {
                label: "৭. পত্র নং ও তারিখ",
                value: formatLetterInfoForDisplay(entry.letterNoDate),
                icon: FileText,
                col: "amber",
              },
              {
                label: "৮. কার্যপত্র নং",
                value: formatWorkpaperInfoForDisplay(entry.meetingWorkpaper),
                icon: FileText,
                col: "purple",
              },
              {
                label: "৯. আলোচিত অনুচ্ছেদ",
                value: toBengaliDigits(entry.meetingSentParaCount || "০"),
                icon: ListOrdered,
                col: "sky",
              },
              {
                label: "১০. ডায়েরি নং ও তারিখ",
                value: formatDiaryInfoForDisplay(entry.workpaperNoDate),
                icon: FileText,
                col: "emerald",
              },
              {
                label: "১১. জারিপত্র নং",
                value: formatIssueInfoForDisplay(entry.issueLetterNoDate),
                icon: FileText,
                col: "amber",
              },
              {
                label: "১২. আর্কাইভ নং",
                value: entry.archiveNo || "N/A",
                icon: Archive,
                col: "purple",
              },
              {
                label: "১৩. প্রেরিত অনুচ্ছেদ",
                value: toBengaliDigits(entry.meetingSentParaCount || "০"),
                icon: ListOrdered,
                col: "sky",
              },
              {
                label: "১৪. সুপারিশকৃত অনুচ্ছেদ",
                value: toBengaliDigits(
                  entry.meetingRecommendedParaCount || "০",
                ),
                icon: CheckCircle2,
                col: "emerald",
              },
              {
                label: "১৫. মোট জড়িত টাকা",
                value: toBengaliDigits(entry.involvedAmount ?? 0),
                icon: Banknote,
                col: "amber",
              },
              {
                label: "১৬. অমীমাংসিত সংখ্যা",
                value: toBengaliDigits(entry.meetingUnsettledParas || "০"),
                icon: ListOrdered,
                col: "purple",
              },
              {
                label: "১৭. অমীমাংসিত টাকা",
                value: toBengaliDigits(entry.meetingUnsettledAmount ?? 0),
                icon: Banknote,
                col: "sky",
              },
              {
                label: "১৮. মীমাংসিত সংখ্যা",
                value: toBengaliDigits(
                  entry.paragraphs?.filter((p) => p.status === "পূর্ণাঙ্গ")
                    .length || 0,
                ),
                icon: CheckCircle2,
                col: "emerald",
              },
              {
                label: "১৯. সভার তারিখ",
                value: formatDateBN(entry.meetingDate) || "N/A",
                icon: Calendar,
                col: "amber",
              },
              {
                label: "২০. মন্তব্য",
                value: entry.remarks || "N/A",
                icon: MessageSquare,
                col: "purple",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3"
              >
                <div
                  className={`p-2 rounded-lg bg-${item.col}-50 text-${item.col}-600`}
                >
                  <item.icon size={14} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    {item.label}
                  </p>
                  <p className="text-[11px] font-bold text-slate-900 leading-tight">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    let lastRenderedCycle = "";
    // Footer text font-black
    const footerTdCls =
      "p-1 text-center font-black text-[10px] bg-black text-white border border-slate-400";
    const filterInputCls =
      "w-full pl-7 pr-1.5 h-[38px] bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-[11px] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-bold";
    const customDropdownCls = (isOpen: boolean) =>
      `relative flex items-center gap-1.5 px-2 h-[38px] bg-white border rounded-lg cursor-pointer transition-all duration-300 ${isOpen ? "border-blue-600 ring-4 ring-blue-50 shadow-md z-[1010]" : "border-slate-300 shadow-sm hover:border-slate-400"}`;

    return (
      <div
        id="table-register-container"
        className="w-full relative animate-premium-page"
      >
        <IDBadge id="view-register-table" />
        {!isAdminView && (
          <div
            id="section-register-top-header"
            className="relative mb-6 no-print z-[99999]"
          >
            <IDBadge id="section-register-top-header" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative group transition-all duration-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-emerald-50 rounded-[1.2rem] text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100/50 group-hover:scale-105 transition-transform duration-500">
                  <ClipboardList size={28} strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    মীমাংসা রেজিস্টার
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full font-bold text-[10px] shadow-lg shadow-emerald-200 border border-emerald-400/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm"></div>
                      <span>চলমান মাস: {toBengaliDigits(cycleInfo.label)}</span>
                    </div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em]">
                      Settlement Ledger
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <button
                    ref={summaryButtonRef}
                    onClick={() => setShowSummary(!showSummary)}
                    className={`px-5 py-3 rounded-xl font-black text-[12px] flex items-center gap-2 transition-all shadow-2xl ${showSummary ? "bg-blue-600 text-white shadow-blue-200" : "bg-[#f0f7ff] text-blue-700 border border-blue-100/50 hover:bg-blue-100 shadow-blue-500/10"}`}
                  >
                    <Sparkles
                      size={16}
                      className={
                        showSummary ? "text-blue-100" : "text-blue-500"
                      }
                    />{" "}
                    রেজিস্টার সারসংক্ষেপ
                  </button>

                  <AnimatePresence>
                    {showSummary && (
                      <div
                        ref={summaryRef}
                        className="absolute top-[calc(100%+12px)] right-0 z-[9999999]"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            duration: 0.25,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          style={{
                            width: "450px",
                          }}
                          className="bg-white rounded-[2rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-slate-200 overflow-hidden no-print text-left"
                        >
                          <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                                <Sparkles size={22} className="text-white" />
                              </div>
                              <div>
                                <h4 className="text-base font-black tracking-tight">
                                  রেজিস্টার সারসংক্ষেপ
                                </h4>
                                <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em]">
                                  Settlement Summary Overview
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowSummary(false)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full text-white transition-all duration-300"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>

                          <div className="p-6 space-y-6">
                            {/* Total Letters Card */}
                            <div className="relative overflow-hidden bg-slate-50 rounded-2xl p-5 border border-slate-200 group">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
                              <div className="relative flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    সর্বমোট চিঠিপত্র
                                  </p>
                                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {toBengaliDigits(globalStats.totalLetters)}{" "}
                                    <span className="text-sm font-bold text-slate-500">
                                      টি
                                    </span>
                                  </h2>
                                </div>
                                <Archive
                                  className="text-emerald-200"
                                  size={40}
                                />
                              </div>
                            </div>

                            {/* SFI Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-emerald-100"></div>
                                <h5 className="text-[11px] font-black text-emerald-700 uppercase tracking-[0.15em] flex items-center gap-2">
                                  <CheckCircle2 size={14} /> এসএফআই (SFI)
                                </h5>
                                <div className="h-[2px] flex-1 bg-emerald-100"></div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3 hover:bg-emerald-50 transition-colors">
                                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">
                                    বিএসআর
                                  </p>
                                  <p className="text-base font-black text-slate-800">
                                    {toBengaliDigits(globalStats.sfi.bsr)} টি
                                  </p>
                                </div>
                                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-xl p-3 hover:bg-emerald-50 transition-colors">
                                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">
                                    ত্রিপক্ষীয় সভা
                                  </p>
                                  <p className="text-base font-black text-slate-800">
                                    {toBengaliDigits(globalStats.sfi.tri)} টি
                                  </p>
                                </div>
                              </div>
                              <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-center">
                                <span className="text-xs font-black">
                                  মোট এসএফআই:{" "}
                                  {toBengaliDigits(globalStats.sfi.total)} টি
                                </span>
                              </div>
                            </div>

                            {/* Non-SFI Section */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="h-[2px] flex-1 bg-amber-100"></div>
                                <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-[0.15em] flex items-center gap-2">
                                  <FileText size={14} /> নন এসএফআই (Non-SFI)
                                </h5>
                                <div className="h-[2px] flex-1 bg-amber-100"></div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-3 hover:bg-amber-50 transition-colors">
                                  <p className="text-[10px] font-bold text-amber-600/70 uppercase mb-1">
                                    বিএসআর
                                  </p>
                                  <p className="text-base font-black text-slate-800">
                                    {toBengaliDigits(globalStats.nonSfi.bsr)} টি
                                  </p>
                                </div>
                                <div className="bg-amber-50/40 border border-amber-100/50 rounded-xl p-3 hover:bg-amber-50 transition-colors">
                                  <p className="text-[10px] font-bold text-amber-600/70 uppercase mb-1">
                                    দ্বিপক্ষীয় সভা
                                  </p>
                                  <p className="text-base font-black text-slate-800">
                                    {toBengaliDigits(globalStats.nonSfi.bi)} টি
                                  </p>
                                </div>
                              </div>
                              <div className="bg-amber-600 text-white px-4 py-2 rounded-xl text-center">
                                <span className="text-xs font-black">
                                  মোট নন এসএফআই:{" "}
                                  {toBengaliDigits(globalStats.nonSfi.total)} টি
                                </span>
                              </div>
                            </div>

                            {/* Settled Paras & Amount */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">
                                  মীমাংসিত অনুচ্ছেদ
                                </p>
                                <p className="text-xl font-black text-slate-900">
                                  {toBengaliDigits(globalStats.settledParas)} টি
                                </p>
                              </div>
                              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">
                                  জড়িত টাকা
                                </p>
                                <p className="text-xl font-black text-slate-900">
                                  {toBengaliDigits(
                                    Math.round(globalStats.totalInvolved),
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-900 p-4 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                              Ledger Management System
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {showFilters && !isAdminView && (
          <div
            id="register-filters"
            className="!bg-white p-2.5 md:p-3 rounded-xl border border-slate-200 shadow-lg space-y-3 no-print mb-6 animate-in slide-in-from-top-4 duration-300 relative z-[1000] isolate"
          >
            <IDBadge id="register-filters" />
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {/* Cycle Selection */}
              <div className="space-y-1" ref={cycleDropdownRef}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">
                  সাইকেল
                </label>
                <div
                  onClick={() => setIsCycleDropdownOpen(!isCycleDropdownOpen)}
                  className={customDropdownCls(isCycleDropdownOpen)}
                >
                  <CalendarDays size={14} className="text-blue-600 shrink-0" />
                  <span className="font-bold text-[11px] text-slate-900 truncate">
                    {!selectedCycleDate
                      ? "সকল সাইকেল"
                      : cycleOptions.find(
                          (o) => o.cycleLabel === activeCycle?.label,
                        )?.label || toBengaliDigits(activeCycle?.label || "")}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isCycleDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                  />

                  {isCycleDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                      <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <CalendarSearch size={12} /> সাইকেল নির্বাচন
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          <div
                            key="all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCycleDate(null);
                              setIsCycleDropdownOpen(false);
                            }}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${!selectedCycleDate ? "!bg-blue-600 !text-white shadow-lg" : "hover:bg-slate-100 text-slate-700 font-bold bg-white"}`}
                          >
                            <span className="text-[13px]">সকল সাইকেল</span>
                            {!selectedCycleDate && (
                              <Check size={16} strokeWidth={3} />
                            )}
                          </div>
                          {cycleOptions.map((opt, idx) => (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCycleDate(opt.date);
                                setIsCycleDropdownOpen(false);
                              }}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${opt.cycleLabel === activeCycle?.label ? "!bg-blue-600 !text-white shadow-lg" : "hover:bg-slate-100 text-slate-700 font-bold bg-white"}`}
                            >
                              <span className="text-[13px]">{opt.label}</span>
                              {opt.cycleLabel === activeCycle?.label && (
                                <Check size={16} strokeWidth={3} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Selection */}
              <div className="space-y-1" ref={branchDropdownRef}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">
                  শাখা ধরণ
                </label>
                <div
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className={customDropdownCls(isBranchDropdownOpen)}
                >
                  <LayoutGrid className="text-blue-600 shrink-0" size={14} />
                  <span className="font-bold text-[11px] text-slate-900 truncate">
                    {filterParaType === "" ? "সকল শাখা" : filterParaType}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isBranchDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                  />

                  {isBranchDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] left-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                      <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid size={12} /> শাখা ধরণ নির্বাচন
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          {[
                            { val: "", label: "সকল শাখা" },
                            { val: "এসএফআই", label: "এসএফআই" },
                            { val: "নন এসএফআই", label: "নন এসএফআই" },
                          ].map((opt, idx) => (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterParaType(opt.val);
                                setFilterType("");
                                setIsBranchDropdownOpen(false);
                              }}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${filterParaType === opt.val ? "!bg-blue-600 !text-white shadow-lg" : "hover:bg-slate-100 text-slate-700 font-bold bg-white"}`}
                            >
                              <span className="text-[13px]">{opt.label}</span>
                              {filterParaType === opt.val && (
                                <Check size={16} strokeWidth={3} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Letter Type Selection */}
              <div className="space-y-1" ref={typeDropdownRef}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">
                  চিঠির ধরণ
                </label>
                <div
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className={customDropdownCls(isTypeDropdownOpen)}
                >
                  <FileText className="text-blue-600 shrink-0" size={14} />
                  <span className="font-bold text-[11px] text-slate-900 truncate">
                    {filterType === ""
                      ? "সকল ধরণ"
                      : filterType === "বিএসআর"
                        ? "বিএসআর (BSR)"
                        : filterType}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isTypeDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                  />

                  {isTypeDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] right-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                      <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={12} /> ধরণ নির্বাচন
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          {[
                            { val: "", label: "সকল ধরণ", show: true },
                            {
                              val: "বিএসআর",
                              label: "বিএসআর (BSR)",
                              show: true,
                            },
                            {
                              val: "ত্রিপক্ষীয় সভা",
                              label: "ত্রিপক্ষীয় সভা",
                              show:
                                filterParaType === "এসএফআই" ||
                                filterParaType === "",
                            },
                            {
                              val: "দ্বিপক্ষীয় সভা",
                              label: "দ্বিপক্ষীয় সভা",
                              show:
                                filterParaType === "নন এসএফআই" ||
                                filterParaType === "",
                            },
                          ]
                            .filter((o) => o.show)
                            .map((opt, idx) => (
                              <div
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFilterType(opt.val);
                                  setIsTypeDropdownOpen(false);
                                }}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${filterType === opt.val ? "!bg-blue-600 !text-white shadow-lg" : "hover:bg-slate-100 text-slate-700 font-bold bg-white"}`}
                              >
                                <span className="text-[13px]">{opt.label}</span>
                                {filterType === opt.val && (
                                  <Check size={16} strokeWidth={3} />
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-1" ref={statusDropdownRef}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">
                  অবস্থা
                </label>
                <div
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={customDropdownCls(isStatusDropdownOpen)}
                >
                  <CheckCircle2 className="text-blue-600 shrink-0" size={14} />
                  <span className="font-bold text-[11px] text-slate-900 truncate">
                    {filterStatus === ""
                      ? "সকল অবস্থা"
                      : filterStatus === "settled"
                        ? "পূর্ণাঙ্গ"
                        : filterStatus === "no-paras"
                          ? "উত্থাপিত (অনুচ্ছেদ নেই)"
                          : "আংশিক"}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 ml-auto transition-transform duration-300 shrink-0 ${isStatusDropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                  />

                  {isStatusDropdownOpen && (
                    <div className="absolute top-[calc(100%+12px)] right-0 w-full min-w-[220px] !bg-white border-2 border-slate-200 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-[2000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300 ease-out">
                      <div className="max-h-[320px] overflow-y-auto no-scrollbar !bg-white !bg-opacity-100 flex flex-col">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-center sticky top-0 !bg-white !bg-opacity-100 z-[2010]">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} /> অবস্থা নির্বাচন
                          </span>
                        </div>
                        <div className="p-2 space-y-1">
                          {[
                            { val: "", label: "সকল অবস্থা" },
                            { val: "settled", label: "পূর্ণাঙ্গ নিষ্পত্তি" },
                            { val: "unsettled", label: "আংশিক/অনিষ্পত্তি" },
                            {
                              val: "no-paras",
                              label: "উত্থাপিত (অনুচ্ছেদ নেই)",
                            },
                          ].map((opt, idx) => (
                            <div
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterStatus(opt.val);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all !bg-opacity-100 ${filterStatus === opt.val ? "!bg-blue-600 !text-white shadow-lg" : "hover:bg-slate-100 text-slate-700 font-bold bg-white"}`}
                            >
                              <span className="text-[13px]">{opt.label}</span>
                              {filterStatus === opt.val && (
                                <Check size={16} strokeWidth={3} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">
                  অনুসন্ধান
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-600"
                    size={12}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="জারিপত্র নং..."
                    className={filterInputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="table-container border border-slate-300 rounded-sm overflow-auto relative z-[1]">
          <IDBadge id="table-main-ledger" />
          <table
            id="table-main-ledger"
            ref={tableRef}
            className="w-full border-separate border-spacing-0"
          >
            <colgroup>
              <col className="w-[30px]" />
              <col className="w-[130px]" />
              <col className="w-[45px]" />
              <col className="w-[65px]" />
              <col className="w-[40px]" />
              <col className="w-[65px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
              <col className="w-[50px]" />
            </colgroup>
            <thead>
              <tr className="h-[42px]">
                <th rowSpan={2} className={thBase}>
                  ক্র: নং
                </th>
                <th rowSpan={2} className={thBase}>
                  বিস্তারিত বিবরণ (২০ ফিল্ড দেখতে ক্লিক)
                </th>
                <th rowSpan={2} className={thBase}>
                  অনু: নং
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
              <tr className="h-[38px]">
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
            </thead>
            <tbody>
              {groupedEntries.length > 0 ? (
                groupedEntries.map((group) => {
                  const stats = cycleStats[group.label];
                  return (
                    <React.Fragment key={group.label}>
                      {/* Sticky Cycle Header */}
                      <tr className="sticky top-[80px] z-[90] no-print">
                        <td
                          colSpan={14}
                          className="p-0 border border-slate-300"
                        >
                          <div
                            ref={(el) => {
                              cycleRefs.current[group.label] = el;
                            }}
                            onClick={() => {
                              const nextState = !showCycleStats[group.label];
                              setShowCycleStats({
                                ...showCycleStats,
                                [group.label]: nextState,
                              });
                            }}
                            className="bg-slate-100/95 backdrop-blur-sm border-b border-slate-300 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-all group/cycle-header shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md group-hover/cycle-header:scale-110 transition-transform">
                                <CalendarDays size={18} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-[13px] text-slate-800 tracking-tight uppercase">
                                  সময়কাল:{" "}
                                  <span className="text-blue-700 font-black">
                                    {toBengaliDigits(group.label)}
                                  </span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Cycle Statistics
                                  </span>
                                  <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                                  <span className="text-[9px] font-black text-blue-600">
                                    মোট {toBengaliDigits(stats.totalLetters)} টি
                                    চিঠি
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div
                                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 ${showCycleStats[group.label] ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-blue-600 border border-blue-200 hover:border-blue-400"}`}
                              >
                                {showCycleStats[group.label]
                                  ? "সংক্ষিপ্ত করুন"
                                  : "বিস্তারিত দেখুন"}
                                <ChevronDown
                                  size={12}
                                  className={`transition-transform duration-300 ${showCycleStats[group.label] ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {showCycleStats[group.label] && (
                        <tr className="sticky top-[128px] z-[85] no-print">
                          <td
                            colSpan={14}
                            className="p-0 border border-slate-300"
                          >
                            <div className="bg-white p-4 border-b border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200 shadow-md">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-start gap-12">
                                  <div className="hidden md:flex items-center gap-4 text-[12px] font-bold text-slate-700">
                                    <span className="px-4 py-1.5 bg-white border border-slate-300 rounded-full shadow-sm flex items-center gap-2">
                                      মোট চিঠি:{" "}
                                      <span className="text-blue-700 font-black text-[13px]">
                                        {toBengaliDigits(stats.totalLetters)} টি
                                      </span>
                                    </span>
                                    <div className="w-[1.5px] h-5 bg-slate-300 mx-1"></div>
                                    <span className="flex items-center gap-2">
                                      এসএফআই:{" "}
                                      <span className="text-emerald-700 font-black text-[13px]">
                                        {toBengaliDigits(
                                          stats.sfiEntries.length,
                                        )}{" "}
                                        টি
                                      </span>
                                      <span className="text-slate-500 text-[11px] font-bold">
                                        (বিএসআর {toBengaliDigits(stats.sfiBSR)},
                                        সভা {toBengaliDigits(stats.sfiTri)})
                                      </span>
                                    </span>
                                    <div className="w-[1.5px] h-4 bg-slate-300 mx-1"></div>
                                    <span className="flex items-center gap-2">
                                      নন এসএফআই:{" "}
                                      <span className="text-indigo-700 font-black text-[13px]">
                                        {toBengaliDigits(
                                          stats.nonSfiEntries.length,
                                        )}{" "}
                                        টি
                                      </span>
                                      <span className="text-slate-500 text-[11px] font-bold">
                                        (বিএসআর{" "}
                                        {toBengaliDigits(stats.nonSfiBSR)}, সভা{" "}
                                        {toBengaliDigits(stats.nonSfiBi)})
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 px-4 py-2 bg-white/60 rounded-xl border border-slate-200 text-[11px] font-black shadow-inner">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2
                                      size={14}
                                      className="text-emerald-600"
                                    />
                                    <span>মোট মীমাংসিত অনুচ্ছেদ:</span>
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      {toBengaliDigits(
                                        stats.cycleSettledParasCount,
                                      )}{" "}
                                      টি
                                    </span>
                                  </div>
                                  <div className="w-[1px] h-4 bg-slate-300"></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500">
                                      এসএফআই:
                                    </span>
                                    <span className="text-blue-700">
                                      {toBengaliDigits(stats.sfiSettled.total)}{" "}
                                      টি
                                    </span>
                                    {stats.sfiSettled.details && (
                                      <span className="text-slate-400 font-bold">
                                        ({stats.sfiSettled.details})
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-[1px] h-4 bg-slate-300"></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500">
                                      নন এসএফআই:
                                    </span>
                                    <span className="text-indigo-700">
                                      {toBengaliDigits(
                                        stats.nonSfiSettled.total,
                                      )}{" "}
                                      টি
                                    </span>
                                    {stats.nonSfiSettled.details && (
                                      <span className="text-slate-400 font-bold">
                                        ({stats.nonSfiSettled.details})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Print-only cycle header */}
                      <tr className="hidden print:table-row bg-slate-100 border-y border-slate-300">
                        <td
                          colSpan={14}
                          className="px-4 py-2 border border-slate-300"
                        >
                          <span className="font-black text-[13px] text-slate-800 tracking-tight uppercase">
                            সময়কাল:{" "}
                            <span className="text-blue-700 font-black">
                              {toBengaliDigits(group.label)}
                            </span>
                          </span>
                        </td>
                      </tr>

                      {group.entries.map((entry, idx) => {
                        const isExpanded = expandedEntries.has(entry.id);
                        const paras = entry.paragraphs || [];
                        const entrySettledCount = paras.filter(
                          (p) => p.status === "পূর্ণাঙ্গ",
                        ).length;
                        const entryInvolvedAmount = paras.reduce(
                          (sum, p) => sum + (p.involvedAmount || 0),
                          0,
                        );
                        const mRaisedCountRaw =
                          entry.manualRaisedCount?.toString().trim() || "";
                        const mRaisedCount =
                          mRaisedCountRaw === "" ||
                          mRaisedCountRaw === "0" ||
                          mRaisedCountRaw === "০"
                            ? "০"
                            : toBengaliDigits(mRaisedCountRaw);
                        const mRaisedAmount =
                          entry.manualRaisedAmount !== null &&
                          entry.manualRaisedAmount !== undefined &&
                          entry.manualRaisedAmount !== 0
                            ? entry.manualRaisedAmount
                            : 0;

                        return (
                          <React.Fragment key={entry.id}>
                            {paras.length > 0 ? (
                              paras.map((p, pIdx) => (
                                <tr
                                  key={p.id}
                                  className={`transition-colors group bg-white ${isAdminView ? "hover:bg-amber-100/50" : "hover:bg-blue-50/30"}`}
                                >
                                  {pIdx === 0 && (
                                    <>
                                      <td
                                        rowSpan={paras.length}
                                        className={tdBase + " font-black"}
                                      >
                                        {toBengaliDigits(idx + 1)}
                                      </td>
                                      <td
                                        rowSpan={paras.length}
                                        onClick={() => toggleExpand(entry.id)}
                                        className={
                                          tdBase +
                                          " cursor-pointer group-hover:bg-blue-50/50 transition-all text-left p-3"
                                        }
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-1 text-left flex-1">
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                মন্ত্রণালয়:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={entry.ministryName}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                এনটিটি:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={entry.entityName}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                শাখা:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={entry.branchName}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                নিরীক্ষা সাল:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={toBengaliDigits(
                                                    entry.auditYear,
                                                  )}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                পত্র নং ও তারিখ:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={formatLetterInfoForDisplay(
                                                    entry.letterNoDate,
                                                  )}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                ডায়েরি নং ও তারিখ:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={formatDiaryInfoForDisplay(
                                                    entry.workpaperNoDate,
                                                  )}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                            <p className="text-[10px] leading-tight">
                                              <span className="font-black text-emerald-700">
                                                জারিপত্র নং ও তারিখ:
                                              </span>{" "}
                                              <span className="font-bold text-slate-900">
                                                <HighlightText
                                                  text={formatIssueInfoForDisplay(
                                                    entry.issueLetterNoDate,
                                                  )}
                                                  searchTerm={searchTerm}
                                                />
                                              </span>
                                            </p>
                                          </div>
                                          <div className="p-1 bg-slate-100 rounded-md text-slate-400 group-hover:text-blue-500 self-center">
                                            {isExpanded ? (
                                              <ChevronUp size={12} />
                                            ) : (
                                              <ChevronDown size={12} />
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </>
                                  )}
                                  <td className={tdBase}>
                                    <span className="font-bold">
                                      {toBengaliDigits(p.paraNo)}
                                    </span>
                                    <br />
                                    <span
                                      className={`px-1 text-[8px] text-white font-black rounded ${p.status === "পূর্ণাঙ্গ" ? "bg-emerald-600" : "bg-red-600"}`}
                                    >
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(p.involvedAmount),
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
                                          Math.round(mRaisedAmount),
                                        )}
                                      </td>
                                    </>
                                  )}
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "ভ্যাট"
                                          ? p.recoveredAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "ভ্যাট"
                                          ? p.adjustedAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "আয়কর"
                                          ? p.recoveredAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "আয়কর"
                                          ? p.adjustedAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "অন্যান্য"
                                          ? p.recoveredAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(
                                        p.category === "অন্যান্য"
                                          ? p.adjustedAmount
                                          : 0,
                                      ),
                                    )}
                                  </td>
                                  <td className={tdMoney}>
                                    {toBengaliDigits(
                                      Math.round(p.recoveredAmount),
                                    )}
                                  </td>
                                  <td className={tdMoney + " relative"}>
                                    {toBengaliDigits(
                                      Math.round(p.adjustedAmount),
                                    )}
                                    {!isAdminView && isAdmin && (
                                      <div className="absolute right-0 bottom-0.5 flex opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto gap-0.5 no-print p-0.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(entry);
                                          }}
                                          className="p-1 text-blue-600 bg-white border rounded shadow-sm hover:bg-blue-50"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm({
                                              id: entry.id,
                                              paraId: p.id,
                                            });
                                          }}
                                          className="p-1 text-red-600 bg-white border rounded shadow-sm ml-0.5 hover:bg-red-50"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    )}
                                    {isAdminView && (
                                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto flex-col gap-1.5 no-print z-[100] animate-in fade-in slide-in-from-right-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onApprove?.(entry.id);
                                          }}
                                          className="w-7 h-7 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                          title="অনুমোদন দিন"
                                        >
                                          <Check size={16} strokeWidth={3} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onReject?.(entry.id);
                                          }}
                                          className="w-7 h-7 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                          title="বাতিল করুন"
                                        >
                                          <XCircle size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr
                                className={`transition-colors group bg-white ${isAdminView ? "hover:bg-amber-100/50" : "hover:bg-blue-50/30"}`}
                              >
                                <td className={tdBase + " font-black"}>
                                  {toBengaliDigits(idx + 1)}
                                </td>
                                <td
                                  onClick={() => toggleExpand(entry.id)}
                                  className={
                                    tdBase +
                                    " cursor-pointer group-hover:bg-blue-50/50 transition-all text-left p-3"
                                  }
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 text-left flex-1">
                                      <p className="text-[10px] leading-tight font-black text-red-600 underline underline-offset-2 tracking-tighter">
                                        উত্থাপিত এন্ট্রি (কোন অনুচ্ছেদ নেই)
                                      </p>
                                      <p className="text-[10px] leading-tight">
                                        <span className="font-black text-emerald-700">
                                          সংস্থা:
                                        </span>{" "}
                                        <span className="font-bold text-slate-900">
                                          <HighlightText
                                            text={entry.entityName}
                                            searchTerm={searchTerm}
                                          />
                                        </span>
                                      </p>
                                      <p className="text-[10px] leading-tight">
                                        <span className="font-black text-emerald-700">
                                          জারিপত্র:
                                        </span>{" "}
                                        <span className="font-bold text-slate-900">
                                          <HighlightText
                                            text={formatIssueInfoForDisplay(
                                              entry.issueLetterNoDate,
                                            )}
                                            searchTerm={searchTerm}
                                          />
                                        </span>
                                      </p>
                                    </div>
                                    <div className="p-1 bg-slate-100 rounded-md text-slate-400 group-hover:text-blue-500 self-center">
                                      {isExpanded ? (
                                        <ChevronUp size={12} />
                                      ) : (
                                        <ChevronDown size={12} />
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className={tdBase}>-</td>
                                <td className={tdMoney}>০</td>
                                <td
                                  className={
                                    tdBase + " text-blue-700 font-black"
                                  }
                                >
                                  {mRaisedCount}
                                </td>
                                <td className={tdMoney + " text-blue-800"}>
                                  {toBengaliDigits(Math.round(mRaisedAmount))}
                                </td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney}>০</td>
                                <td className={tdMoney + " relative"}>
                                  ০
                                  {!isAdminView && isAdmin && (
                                    <div className="absolute right-0 bottom-0.5 flex opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto gap-0.5 no-print p-0.5">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(entry);
                                        }}
                                        className="p-1 text-blue-600 bg-white border rounded shadow-sm hover:bg-blue-50"
                                      >
                                        <Pencil size={11} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirm({ id: entry.id });
                                        }}
                                        className="p-1 text-red-600 bg-white border rounded shadow-sm ml-0.5 hover:bg-red-50"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                  {isAdminView && (
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto flex-col gap-1.5 no-print z-[100] animate-in fade-in slide-in-from-right-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onApprove?.(entry.id);
                                        }}
                                        className="w-7 h-7 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                        title="অনুমোদন দিন"
                                      >
                                        <Check size={16} strokeWidth={3} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onReject?.(entry.id);
                                        }}
                                        className="w-7 h-7 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-sm"
                                        title="বাতিল করুন"
                                      >
                                        <XCircle size={16} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                            <tr
                              className={`${isAdminView ? "bg-amber-100/40" : "bg-blue-50/60"} font-black border-t border-slate-300 h-[38px]`}
                            >
                              <td
                                colSpan={2}
                                className="px-4 text-left italic text-[10px] text-blue-900 border border-slate-300"
                              >
                                মোট মিমাংসিত অনুচ্ছেদ:{" "}
                                <span className="text-emerald-700">
                                  {toBengaliDigits(entrySettledCount)} টি
                                </span>{" "}
                                | মোট জড়িত টাকা:{" "}
                                <span className="text-blue-700">
                                  {toBengaliDigits(
                                    Math.round(entryInvolvedAmount),
                                  )}
                                </span>
                              </td>
                              <td className="text-center text-[10px] text-emerald-800 border border-slate-300 bg-emerald-50/30">
                                {toBengaliDigits(entrySettledCount)}
                              </td>
                              <td className="text-center text-[10px] text-blue-800 border border-slate-300 bg-blue-50/30">
                                {toBengaliDigits(
                                  Math.round(entryInvolvedAmount),
                                )}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {mRaisedCount}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(Math.round(mRaisedAmount))}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(Math.round(entry.vatRec || 0))}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(Math.round(entry.vatAdj || 0))}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(Math.round(entry.itRec || 0))}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(Math.round(entry.itAdj || 0))}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(
                                  Math.round(entry.othersRec || 0),
                                )}
                              </td>
                              <td className="text-center text-[10px] text-slate-700 border border-slate-300 bg-white/50">
                                {toBengaliDigits(
                                  Math.round(entry.othersAdj || 0),
                                )}
                              </td>
                              <td className="text-center text-[10px] text-blue-900 border border-slate-300 bg-emerald-100/30 font-black">
                                {toBengaliDigits(Math.round(entry.totalRec))}
                              </td>
                              <td className="text-center text-[10px] text-blue-900 border border-slate-300 bg-emerald-100/30 font-black">
                                {toBengaliDigits(Math.round(entry.totalAdj))}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="no-print">
                                <td colSpan={14} className="p-0 border-none">
                                  {renderMetadataGrid(entry)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={14} className="py-20 text-center bg-white">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Archive size={40} />
                      <p className="text-sm font-black text-slate-900 tracking-widest">
                        রেজিস্টার খালি
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {!isAdminView && (
              <tfoot className="z-[100]">
                <tr className="h-[45px] bg-black text-white shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                  <td
                    colSpan={2}
                    className={
                      footerTdCls + " text-white uppercase tracking-wider"
                    }
                  >
                    সর্বমোট (ফিল্টার ডাটা):
                  </td>
                  <td className={footerTdCls + " text-amber-400"}>
                    {toBengaliDigits(grandTotals.paraCount)}
                  </td>
                  <td className={footerTdCls + " text-amber-400"}>
                    {toBengaliDigits(Math.round(grandTotals.inv))}
                  </td>
                  <td className={footerTdCls + " text-amber-400"}>
                    {toBengaliDigits(grandTotals.raisedCount)}
                  </td>
                  <td className={footerTdCls + " text-amber-400"}>
                    {toBengaliDigits(Math.round(grandTotals.raisedAmount))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.vRec))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.vAdj))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.iRec))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.iAdj))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.oRec))}
                  </td>
                  <td className={footerTdCls + " text-white"}>
                    {toBengaliDigits(Math.round(grandTotals.oAdj))}
                  </td>
                  <td className={footerTdCls + " text-amber-400 font-black"}>
                    {toBengaliDigits(Math.round(grandTotals.tRec))}
                  </td>
                  <td className={footerTdCls + " text-amber-400 font-black"}>
                    {toBengaliDigits(Math.round(grandTotals.tAdj))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <DeleteConfirmationModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm) {
              onDelete(deleteConfirm.id, deleteConfirm.paraId);
            }
          }}
          message={
            deleteConfirm?.paraId
              ? "আপনি কি নিশ্চিতভাবে এই অনুচ্ছেদটি মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব হবে না।"
              : "আপনি কি নিশ্চিতভাবে সম্পূর্ণ এন্ট্রিটি মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা সম্ভব হবে না।"
          }
        />
      </div>
    );
  },
);

export default SettlementTable;
