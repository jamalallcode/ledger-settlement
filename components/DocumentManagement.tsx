import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  Send,
  Sparkles,
  Printer,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  Building,
  Calendar,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Columns,
  Grid,
  ShieldCheck,
  Eye,
  Sliders,
  Table as TableIcon,
} from "lucide-react";
import { CorrespondenceEntry } from "../types";
import {
  toBengaliDigits,
  toEnglishDigits,
  formatDateBN,
  cleanAndFormatBengaliAmount,
  stripAmountSlashInText,
  convertAllDatesToBengali,
} from "../utils/numberUtils";
import { OFFICE_HEADER } from "../constants";
import { parseDocumentEntry } from "./docParser";
import {
  DocumentManagementModuleProps,
  JaripatraTableRowItem,
  JaripatraColumnItem,
  JaripatraCellItem,
  JaripatraGridRowItem,
  TableColumn,
  TableRow,
  AuditParagraphBlock,
} from "./docTypes";

const DEFAULT_JARIPATRA_COLUMNS: JaripatraColumnItem[] = [
  { id: "col_1", label: "ক্রমিক নং", subLabel: "(১)", align: "center", width: "w-[6%]" },
  { id: "col_2", label: "অনুচ্ছেদ নং ও নিরীক্ষা বছর", subLabel: "(২)", align: "center", width: "w-[12%]" },
  { id: "col_3", label: "প্রতিষ্ঠানের নাম", subLabel: "(৩)", align: "justify", width: "w-[18%]" },
  { id: "col_4", label: "আপত্তির শিরোনাম", subLabel: "(৪)", align: "justify", width: "w-[24%]" },
  { id: "col_5", label: "জড়িত টাকা", subLabel: "(৫)", align: "center", width: "w-[16%]" },
  { id: "col_6", label: "এ কার্যালয়ের মন্তব্য", subLabel: "(৬)", align: "justify", width: "w-[24%]" },
];

const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: "sl", label: "ক্রমিক" },
  { id: "borrowerName", label: "ঋণগ্রহীতা/বিবরণ" },
  { id: "involvedAmount", label: "জড়িত টাকা" },
  { id: "principal", label: "আসল আদায়" },
  { id: "interest", label: "সুদ আদায়" },
  { id: "others", label: "অন্যান্য" },
  { id: "totalRecovery", label: "মোট আদায়" },
  { id: "settlementDate", label: "তারিখ" },
];

const getTodayBengaliDateFormatted = (): string => {
  const now = new Date();
  const d = toBengaliDigits(now.getDate().toString().padStart(2, '0'));
  const m = toBengaliDigits((now.getMonth() + 1).toString().padStart(2, '0'));
  const y = toBengaliDigits(now.getFullYear().toString());
  return `${d}/${m}/${y} খ্রি:`;
};

export const DocumentManagementModule: React.FC<DocumentManagementModuleProps> = ({
  entry,
  onBack,
  isAdmin = false,
  onSaveJaripatra,
  onRegisterBackHandler,
}) => {
  // Extract and parse dynamic metadata from entry without hardcoded fallbacks
  const meta = parseDocumentEntry(entry);

  // Active view tab: 'note' | 'jaripatra' | 'ai'
  const [activeTab, setActiveTab] = useState<'note' | 'jaripatra' | 'ai'>('note');

  // AI & Upload State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState<string>("");
  
  // 1. Original Audit Paragraph / Objection
  const [originalObjectionTextInput, setOriginalObjectionTextInput] = useState<string>("");
  const [originalObjectionFile, setOriginalObjectionFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // 2. Original Audit Appendix / Annexure
  const [originalAppendixTextInput, setOriginalAppendixTextInput] = useState<string>("");
  const [originalAppendixFile, setOriginalAppendixFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // 3. Entity Broadsheet Reply & Forwarding
  const [entityReplyTextInput, setEntityReplyTextInput] = useState<string>("");
  const [entityReplyFile, setEntityReplyFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // 4. Evidence (Challan, Voucher, Reconciliation)
  const [evidenceTextInput, setEvidenceTextInput] = useState<string>("");
  const [evidenceFile, setEvidenceFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // Comparative Review Flag ("হ্যাঁ" / "না")
  const [verifyAgainstOriginalObjectionAndAppendix, setVerifyAgainstOriginalObjectionAndAppendix] = useState<boolean>(true);
  const [crossVerificationData, setCrossVerificationData] = useState<any>(null);

  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // 1. Official Header (Top Center)
  const [diaryHeader, setDiaryHeader] = useState<string>(() => {
    if (meta.diaryNo && meta.diaryDate) {
      return `ডায়েরি নং- ${meta.diaryNo}, তারিখ: ${meta.diaryDate} খ্রি:`;
    }
    if (meta.diaryNo) {
      return `ডায়েরি নং- ${meta.diaryNo}`;
    }
    return `ডায়েরি নং- ..., তারিখ: ${getTodayBengaliDateFormatted()}`;
  });

  // 2. Toka / Introductory Note Body
  const [tikaIntroHtml, setTikaIntroHtml] = useState<string>(() => {
    const ministryPart = meta.ministryName ? `<strong>${meta.ministryName}</strong> এর নিয়ন্ত্রণাধীন ` : "";
    const branchPart = meta.branchName ? `, ${meta.branchName}` : "";
    const auditYearPart = meta.auditYear ? ` এর <strong>${meta.auditYear}</strong> নিরীক্ষা বছরের` : "";
    return `<p><strong>টোকা নং- ১১:</strong> উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা <strong>${meta.entityName}</strong>, প্রধান কার্যালয়ের স্মারক নং- <strong>${meta.letterNo || "..."}</strong>, তারিখ: <strong>${meta.letterDate ? `${meta.letterDate} খ্রি:` : "..."}</strong> দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে ${ministryPart}<strong>${meta.entityName}</strong>${branchPart}${auditYearPart} ব্রডশীট জবাবের <strong>(পৃষ্ঠা নং- )</strong> ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।</p>`;
  });

  // 3. Multi-Paragraphs State
  const defaultParaNo = meta.paraNo || "০১";
  const defaultTitleAndDetails = `শিরোনাম: ${entry.subject || `অনুচ্ছেদ নং ${defaultParaNo}`}\nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশিষ্ট পৃষ্ঠা নং- `;
  const defaultEntityAndAuditYear = meta.entityAndAuditYearFormatted;

  const [paragraphs, setParagraphs] = useState<AuditParagraphBlock[]>([
    {
      id: "para-1",
      sl: "১",
      entityAndAuditYear: defaultEntityAndAuditYear,
      paraNo: defaultParaNo,
      titleAndDetails: defaultTitleAndDetails,
      entityReplyText: `${meta.entityName}${meta.branchName ? `, ${meta.branchName}` : ""} কর্তৃক প্রেরিত জবাব ও সংশ্লিষ্ট প্রমাণক নিম্নে উপস্থাপন করা হলো:`,
      hasTable: false,
      tableColumns: [...DEFAULT_TABLE_COLUMNS],
      tableRows: [
        {
          id: "row-1",
          cells: {
            sl: "১",
            borrowerName: meta.branchName || "শাখা",
            involvedAmount: meta.formattedAmount || "০",
            principal: "০",
            interest: "০",
            others: "-",
            totalRecovery: "০",
            settlementDate: "-",
          }
        }
      ],
      branchRequestText: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
      headOfficeCommentText: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
      presenterCommentText: "দাখিলকৃত জবাব ও প্রমাণক পর্যালোচনাপূর্বক আপত্তিটি নিষ্পত্তি করা যেতে পারে।",
      status: "পূর্ণাঙ্গ নিষ্পত্তি",
    }
  ]);

  // Overall Note Conclusion
  const [noteConclusionFinal, setNoteConclusionFinal] = useState<string>("সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।");

  // JARIPATRA (Issue Letter / Settlement Order Draft) State
  const [jaripatraMemoNo, setJaripatraMemoNo] = useState<string>("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
  const [jaripatraDate, setJaripatraDate] = useState<string>(() => getTodayBengaliDateFormatted());

  // Recipient
  const [jaripatraRecipientDesignation, setJaripatraRecipientDesignation] = useState<string>("ব্যবস্থাপনা পরিচালক / প্রধান নির্বাহী");
  const [jaripatraRecipientEntity, setJaripatraRecipientEntity] = useState<string>(() => meta.entityName);
  const [jaripatraRecipientAddress, setJaripatraRecipientAddress] = useState<string>("প্রধান কার্যালয়");
  const [jaripatraRecipientCity, setJaripatraRecipientCity] = useState<string>("ঢাকা");

  // Subject & Reference & Intro Text
  const [jaripatraSubject, setJaripatraSubject] = useState<string>(() => {
    return `বিষয়: ${meta.fullLocationTitle}${meta.auditYear ? ` এর ${meta.auditYear} সালের` : ""} বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ${meta.paraNo} এর জবাবের উপর মন্তব্য প্রেরণ।`;
  });
  const [jaripatraReference, setJaripatraReference] = useState<string>(() => {
    return `সূত্র: ${meta.entityName} এর পত্র নং ${meta.letterNo || "..."}, তারিখ: ${meta.letterDate || "..."}`;
  });
  const [jaripatraIntroText, setJaripatraIntroText] = useState<string>(() => {
    return `উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${meta.fullLocationTitle}${meta.auditYear ? ` এর ${meta.auditYear} সালের` : ""} নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ${meta.paraNo} এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:`;
  });

  // Dynamic Columns & Grid Rows for Jaripatra
  const [jaripatraColumns, setJaripatraColumns] = useState<JaripatraColumnItem[]>(DEFAULT_JARIPATRA_COLUMNS);
  const [jaripatraGridRows, setJaripatraGridRows] = useState<JaripatraGridRowItem[]>([
    {
      id: "j-row-1",
      cells: {
        col_1: { text: "১", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_2: { text: `${meta.paraNo}${meta.auditYear ? `, ${meta.auditYear}` : ""}`, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_3: { text: `${meta.entityName}${meta.branchName ? `,\n${meta.branchName}।` : "।"}`, align: "justify", colSpan: 1, rowSpan: 1 },
        col_4: { text: entry.subject || `অনুচ্ছেদ নং ${meta.paraNo}`, align: "justify", colSpan: 1, rowSpan: 1 },
        col_5: { text: meta.formattedAmount || "০", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_6: { text: "দাখিলকৃত জবাব ও সংশ্লিষ্ট প্রমাণক সন্তোষজনক হওয়ায় আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 }
      }
    }
  ]);

  // Signatory
  const [jaripatraSignatoryName, setJaripatraSignatoryName] = useState<string>("নাসিফ কবির");
  const [jaripatraSignatoryTitle, setJaripatraSignatoryTitle] = useState<string>("উপ-পরিচালক");
  const [jaripatraSignatoryPhone, setJaripatraSignatoryPhone] = useState<string>("ফোন: ০২৪৭৭৭২২৬৫৬");

  // Bottom Memo & Date
  const [jaripatraBottomMemoNo, setJaripatraBottomMemoNo] = useState<string>("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
  const [jaripatraBottomDate, setJaripatraBottomDate] = useState<string>("       /      /২০২৬ খ্রি:");

  // Onulipi (Distribution) State
  const [jaripatraOnulipiHeader, setJaripatraOnulipiHeader] = useState<string>("অনুলিপি জ্ঞাতার্থ ও কার্যার্থে প্রেরণ করা হলো: (জ্যেষ্ঠতার ভিত্তিতে নয়)");
  const [jaripatraOnulipiItems, setJaripatraOnulipiItems] = useState<string[]>([
    `১. উপমহাব্যবস্থাপক / প্রধান, ${meta.entityName}, সংশ্লিষ্ট বিভাগ/কার্যালয়। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)`,
    "২. পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কার্যালয়, সেগুনবাগিচা, ঢাকা।",
    "৩. অফিস কপি।"
  ]);

  // Sync Note to Jaripatra
  const handleSyncParagraphsToJaripatra = () => {
    const newGridRows: JaripatraGridRowItem[] = paragraphs.map((para, idx) => {
      const col1Text = toBengaliDigits(idx + 1);
      const col2Text = `${para.paraNo ? toBengaliDigits(para.paraNo) : toBengaliDigits(idx + 1)}${meta.auditYear ? `, ${meta.auditYear}` : ""}`;
      const col3Text = `${meta.entityName}${meta.branchName ? `,\n${meta.branchName}।` : "।"}`;
      const col4Text = para.titleAndDetails ? para.titleAndDetails.split('\n')[0].replace(/^শিরোনাম:\s*/, '') : `অনুচ্ছেদ নং ${para.paraNo ? toBengaliDigits(para.paraNo) : toBengaliDigits(idx + 1)}`;
      const col5Text = meta.formattedAmount || "০";
      const col6Text = para.presenterCommentText || "দাখিলকৃত প্রমাণক সন্তোষজনক হওয়ায় আপত্তিটি নিষ্পত্তির সুপারিশ করা হলো।";

      return {
        id: `j-row-sync-${para.id}-${Date.now()}`,
        cells: {
          col_1: { text: col1Text, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_2: { text: col2Text, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_3: { text: col3Text, align: "justify", colSpan: 1, rowSpan: 1 },
          col_4: { text: col4Text, align: "justify", colSpan: 1, rowSpan: 1 },
          col_5: { text: col5Text, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_6: { text: col6Text, align: "justify", colSpan: 1, rowSpan: 1 },
        }
      };
    });
    setJaripatraGridRows(newGridRows);
    setSavedSuccessMsg("নোটশীট থেকে সফলভাবে জারিপত্রে তথ্য সিঙ্ক করা হয়েছে!");
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // Handle Add Paragraph
  const handleAddParagraph = () => {
    const nextIdx = paragraphs.length + 1;
    const newPara: AuditParagraphBlock = {
      id: `para-${Date.now()}`,
      sl: toBengaliDigits(nextIdx),
      entityAndAuditYear: meta.entityAndAuditYearFormatted,
      paraNo: toBengaliDigits(Number(toEnglishDigits(meta.paraNo) || "1") + paragraphs.length),
      titleAndDetails: "শিরোনাম: \nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশিষ্ট পৃষ্ঠা নং- ",
      entityReplyText: "",
      hasTable: false,
      tableColumns: [...DEFAULT_TABLE_COLUMNS],
      tableRows: [
        {
          id: `row-${Date.now()}`,
          cells: {
            sl: "১",
            borrowerName: "",
            involvedAmount: "০",
            principal: "০",
            interest: "০",
            others: "-",
            totalRecovery: "০",
            settlementDate: "-",
          }
        }
      ],
      branchRequestText: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
      headOfficeCommentText: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
      presenterCommentText: "দাখিলকৃত জবাব ও প্রমাণক সন্তোষজনক হওয়ায় আপত্তিটি নিষ্পত্তির সুপারিশ করা হলো।",
      status: "পূর্ণাঙ্গ নিষ্পত্তি",
    };
    setParagraphs([...paragraphs, newPara]);
  };

  // Handle Remove Paragraph
  const handleRemoveParagraph = (paraId: string) => {
    if (paragraphs.length <= 1) return;
    setParagraphs(paragraphs.filter(p => p.id !== paraId));
  };

  // Update specific paragraph field
  const handleUpdateParagraph = (paraId: string, field: keyof AuditParagraphBlock, value: any) => {
    setParagraphs(paragraphs.map(p => {
      if (p.id === paraId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Add row to a paragraph table
  const handleAddTableRow = (paraId: string) => {
    setParagraphs(paragraphs.map(p => {
      if (p.id === paraId) {
        const nextSl = toBengaliDigits(p.tableRows.length + 1);
        const newRow: TableRow = {
          id: `r-${Date.now()}`,
          cells: {
            sl: nextSl,
            borrowerName: "",
            involvedAmount: "০",
            principal: "০",
            interest: "০",
            others: "-",
            totalRecovery: "০",
            settlementDate: "-",
          }
        };
        return { ...p, tableRows: [...p.tableRows, newRow] };
      }
      return p;
    }));
  };

  // AI Auto-Analyze Note Handler
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysisStep(
      (originalObjectionFile || originalObjectionTextInput || originalAppendixFile || originalAppendixTextInput) && verifyAgainstOriginalObjectionAndAppendix
        ? "মূল অনুচ্ছেদ ও পরিশিষ্টের অনিয়মের সাথে জবাবের গভীর ক্রস-যাচাই চলছে..."
        : "নথি ও প্রমাণক পর্যালোচনা করা হচ্ছে..."
    );

    try {
      const payload = {
        originalObjectionText: originalObjectionTextInput,
        originalObjectionFile: originalObjectionFile,
        originalAppendixText: originalAppendixTextInput,
        originalAppendixFile: originalAppendixFile,
        entityReplyText: entityReplyTextInput,
        entityReplyFile: entityReplyFile,
        evidenceText: evidenceTextInput,
        evidenceFile: evidenceFile,
        verifyAgainstOriginalObjectionAndAppendix: verifyAgainstOriginalObjectionAndAppendix,
        letterMetadata: {
          diaryNo: meta.diaryNo,
          diaryDate: meta.diaryDate,
          letterNo: meta.letterNo,
          letterDate: meta.letterDate,
          entityName: meta.entityName,
          ministryName: meta.ministryName,
          auditYear: meta.auditYear,
          branchName: meta.branchName,
          paraType: entry.paraType || "নন-এসএফআই",
          totalParas: entry.totalParas || "১",
          totalAmount: meta.formattedAmount,
        }
      };

      const res = await fetch("/api/document-management/analyze-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`সার্ভার ত্রুটি: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && data.data) {
        const parsed = data.data;
        if (parsed.diaryHeader) setDiaryHeader(parsed.diaryHeader);
        if (parsed.noteTikaText) setTikaIntroHtml(parsed.noteTikaText);
        if (parsed.conclusionFinal) setNoteConclusionFinal(parsed.conclusionFinal);

        if (Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0) {
          const mappedParas: AuditParagraphBlock[] = parsed.paragraphs.map((p: any, idx: number) => {
            const tableCols: TableColumn[] = Array.isArray(p.tableHeaders)
              ? p.tableHeaders.map((h: string, cIdx: number) => ({ id: `col_${cIdx}`, label: h }))
              : DEFAULT_TABLE_COLUMNS;

            const tableRows: TableRow[] = Array.isArray(p.tableRows)
              ? p.tableRows.map((r: string[], rIdx: number) => {
                  const cells: Record<string, string> = {};
                  tableCols.forEach((col, cIdx) => {
                    cells[col.id] = r[cIdx] || "";
                  });
                  return { id: `row-${rIdx + 1}`, cells };
                })
              : [];

            return {
              id: `para-${idx + 1}`,
              sl: toBengaliDigits(idx + 1),
              entityAndAuditYear: p.entityAndAuditYear || meta.entityAndAuditYearFormatted,
              paraNo: p.paraNo || meta.paraNo,
              titleAndDetails: p.titleAndDetails || defaultTitleAndDetails,
              entityReplyText: p.entityReplyHeader || p.entityReplyText || "",
              hasTable: p.hasTable || tableRows.length > 0,
              tableColumns: tableCols,
              tableRows: tableRows.length > 0 ? tableRows : [
                {
                  id: "row-1",
                  cells: {
                    col_0: "১",
                    col_1: meta.branchName || "শাখা",
                    col_2: meta.formattedAmount || "০",
                    col_3: "০",
                    col_4: "০",
                    col_5: "-",
                    col_6: "০",
                    col_7: "-"
                  }
                }
              ],
              branchRequestText: p.conclusionBranch || "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
              headOfficeCommentText: p.conclusionHeadOffice || "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
              presenterCommentText: p.conclusionPresenter || "দাখিলকৃত জবাব ও প্রমাণক সন্তোষজনক হওয়ায় আপত্তিটি নিষ্পত্তির সুপারিশ করা হলো।",
              status: p.status || "পূর্ণাঙ্গ নিষ্পত্তি",
              crossVerification: p.crossVerification || null,
            };
          });
          setParagraphs(mappedParas);
          if (mappedParas[0]?.crossVerification) {
            setCrossVerificationData(mappedParas[0].crossVerification);
          }
        }

        // Suggested issue letter auto-fill
        if (parsed.suggestedIssueLetter) {
          const sil = parsed.suggestedIssueLetter;
          if (sil.memoNo) setJaripatraMemoNo(sil.memoNo);
          if (sil.date) setJaripatraDate(sil.date);
          if (sil.recipient) {
            if (sil.recipient.designation) setJaripatraRecipientDesignation(sil.recipient.designation);
            if (sil.recipient.entityName) setJaripatraRecipientEntity(sil.recipient.entityName);
            if (sil.recipient.address) setJaripatraRecipientAddress(sil.recipient.address);
            if (sil.recipient.city) setJaripatraRecipientCity(sil.recipient.city);
          }
          if (sil.subject) setJaripatraSubject(sil.subject);
          if (sil.reference) setJaripatraReference(sil.reference);
          if (sil.introText) setJaripatraIntroText(sil.introText);
          if (sil.signatoryName) setJaripatraSignatoryName(sil.signatoryName);
          if (sil.signatoryTitle) setJaripatraSignatoryTitle(sil.signatoryTitle);
          if (sil.signatoryPhone) setJaripatraSignatoryPhone(sil.signatoryPhone);
          if (Array.isArray(sil.onulipiList)) setJaripatraOnulipiItems(sil.onulipiList);
        }

        setActiveTab('note');
        setSavedSuccessMsg("মূল অনুচ্ছেদ, পরিশিষ্ট ও জবাব পর্যালোচনাপূর্বক ড্রাফটিং সফলভাবে সম্পন্ন হয়েছে!");
        setTimeout(() => setSavedSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      console.error("AI analysis failed:", err);
      setAnalysisError("বিশ্লেষণ সম্পন্ন করতে সাময়িক ত্রুটি হয়েছে। আপনি সরাসরি নোটশীট ও জারিপত্র এডিট করতে পারেন।");
    } finally {
      setIsAnalyzing(false);
      setAiAnalysisStep("");
    }
  };

  // Save Jaripatra and Note draft
  const handleSaveDraft = () => {
    const jaripatraData = {
      memoNo: jaripatraMemoNo,
      date: jaripatraDate,
      subject: jaripatraSubject,
      reference: jaripatraReference,
      gridRows: jaripatraGridRows,
      signatory: {
        name: jaripatraSignatoryName,
        title: jaripatraSignatoryTitle,
        phone: jaripatraSignatoryPhone,
      },
      onulipi: jaripatraOnulipiItems,
    };

    if (onSaveJaripatra) {
      onSaveJaripatra(entry, jaripatraData);
    }
    setSavedSuccessMsg("খসড়া সফলভাবে সংরক্ষিত হয়েছে!");
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // File Upload Helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'objection' | 'appendix' | 'reply' | 'evidence'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const fileData = {
        name: file.name,
        base64,
        mimeType: file.type || "application/pdf"
      };
      if (type === 'objection') {
        setOriginalObjectionFile(fileData);
      } else if (type === 'appendix') {
        setOriginalAppendixFile(fileData);
      } else if (type === 'reply') {
        setEntityReplyFile(fileData);
      } else {
        setEvidenceFile(fileData);
      }
    };
    reader.readAsDataURL(file);
  };

  // Print Window
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="document-management-root" className="w-full min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="doc-back-button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ফিরে যান</span>
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>নথি ব্যবস্থাপনা (Note-sheet & জারিপত্র খসড়া)</span>
            </h1>
            <p className="text-xs text-slate-500">
              {meta.entityName} {meta.branchName ? `(${meta.branchName})` : ''} | অনুচ্ছেদ: {meta.paraNo} | নিরীক্ষা বছর: {meta.auditYear || '২০১১-১২'}
            </p>
          </div>
        </div>

        {/* Action Tabs & Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="tab-note-sheet"
              onClick={() => setActiveTab('note')}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'note'
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>নোটশীট</span>
            </button>
            <button
              id="tab-jaripatra"
              onClick={() => setActiveTab('jaripatra')}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'jaripatra'
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>জারিপত্র</span>
            </button>
            <button
              id="tab-ai-draft"
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                  : "text-emerald-700 hover:text-emerald-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI অটো-ড্রাফটার</span>
            </button>
          </div>

          <button
            id="doc-sync-jaripatra-btn"
            onClick={handleSyncParagraphsToJaripatra}
            title="নোটশীটের তথ্য সরাসরি জারিপত্রে আপডেট করুন"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">নোটশীট হতে জারিপত্র সিঙ্ক</span>
          </button>

          <button
            id="doc-save-btn"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>সংরক্ষণ করুন</span>
          </button>

          <button
            id="doc-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-700 text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট</span>
          </button>
        </div>
      </header>

      {/* Success Notification Alert */}
      {savedSuccessMsg && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-2 text-center text-sm font-medium animate-in fade-in flex items-center justify-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* TAB 1: NOTESHEET VIEW */}
        {/* ========================================================= */}
        {activeTab === 'note' && (
          <div id="notesheet-container" className="bg-white rounded-xl shadow-md border border-slate-200 p-6 md:p-10 flex flex-col gap-8">
            {/* Header: Office and Diary */}
            <div className="flex flex-col items-center justify-center text-center border-b border-slate-200 pb-6 gap-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">{OFFICE_HEADER.main}</h2>
              <h3 className="text-base font-semibold text-slate-800">{OFFICE_HEADER.sub}</h3>
              <p className="text-xs md:text-sm text-slate-600">{OFFICE_HEADER.address}</p>

              {/* Editable Diary Header */}
              <div className="mt-4 w-full max-w-md">
                <input
                  type="text"
                  value={diaryHeader}
                  onChange={(e) => setDiaryHeader(e.target.value)}
                  className="w-full text-center font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ডায়েরি নং- ..., তারিখ: ... খ্রি:"
                />
              </div>
            </div>

            {/* Note Tika / Introductory Paragraph */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>টোকা / উপস্থাপনা ভূমিকা:</span>
              </label>
              <textarea
                value={tikaIntroHtml.replace(/<[^>]+>/g, '')}
                onChange={(e) => setTikaIntroHtml(`<p>${e.target.value}</p>`)}
                rows={3}
                className="w-full text-sm leading-relaxed text-slate-800 p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-normal"
              />
            </div>

            {/* Paragraphs List */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>অনুচ্ছেদসমূহ ও বিশদ যাচাই ছক:</span>
                </h4>
                <button
                  onClick={handleAddParagraph}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন অনুচ্ছেদ যোগ করুন</span>
                </button>
              </div>

              {paragraphs.map((para, idx) => (
                <div key={para.id} className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 flex flex-col gap-4 shadow-sm">
                  {/* Para Header Controls */}
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                        অনুচ্ছেদ #{toBengaliDigits(idx + 1)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">অনুচ্ছেদ নং:</span>
                        <input
                          type="text"
                          value={para.paraNo}
                          onChange={(e) => handleUpdateParagraph(para.id, 'paraNo', toBengaliDigits(e.target.value))}
                          className="w-16 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded px-1.5 py-1 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={para.status}
                        onChange={(e) => handleUpdateParagraph(para.id, 'status', e.target.value)}
                        className="text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700"
                      >
                        <option value="পূর্ণাঙ্গ নিষ্পত্তি">পূর্ণাঙ্গ নিষ্পত্তি</option>
                        <option value="আংশিক নিষ্পত্তি">আংশিক নিষ্পত্তি</option>
                        <option value="মন্তব্য বিচারাধীন">মন্তব্য বিচারাধীন</option>
                        <option value="জবাব গ্রহণযোগ্য নয়">জবাব গ্রহণযোগ্য নয়</option>
                      </select>
                      {paragraphs.length > 1 && (
                        <button
                          onClick={() => handleRemoveParagraph(para.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="অনুচ্ছেদ মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Column Paragraph Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">প্রতিষ্ঠান ও নিরীক্ষা বছর:</label>
                      <textarea
                        value={para.entityAndAuditYear}
                        onChange={(e) => handleUpdateParagraph(para.id, 'entityAndAuditYear', e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">শিরোনাম ও পৃষ্ঠা বিবরণী:</label>
                      <textarea
                        value={para.titleAndDetails}
                        onChange={(e) => handleUpdateParagraph(para.id, 'titleAndDetails', e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Entity Reply Text */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>প্রতিষ্ঠানের ব্রডশীট জবাব ও প্রমাণকের বিবরণ:</span>
                      <button
                        onClick={() => handleUpdateParagraph(para.id, 'hasTable', !para.hasTable)}
                        className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100"
                      >
                        {para.hasTable ? "হিসাব ছক লুকান" : "+ হিসাব ছক যুক্ত করুন"}
                      </button>
                    </label>
                    <textarea
                      value={para.entityReplyText}
                      onChange={(e) => handleUpdateParagraph(para.id, 'entityReplyText', e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                      placeholder="প্রতিষ্ঠানের প্রেরিত জবাব ও সংশ্লিষ্ট প্রমাণকের সারাংশ..."
                    />

                    {/* Table If enabled */}
                    {para.hasTable && (
                      <div className="overflow-x-auto mt-2 border border-slate-300 rounded-md">
                        <table className="w-full text-xs text-center border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-700">
                            <tr>
                              {para.tableColumns.map((col) => (
                                <th key={col.id} className="p-2 border-r border-slate-300 last:border-r-0">
                                  {col.label}
                                </th>
                              ))}
                              <th className="p-2 w-10">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody>
                            {para.tableRows.map((r, rIdx) => (
                              <tr key={r.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                                {para.tableColumns.map((col) => (
                                  <td key={col.id} className="p-1.5 border-r border-slate-200 last:border-r-0">
                                    <input
                                      type="text"
                                      value={r.cells[col.id] || ""}
                                      onChange={(e) => {
                                        const newRows = [...para.tableRows];
                                        newRows[rIdx].cells[col.id] = toBengaliDigits(e.target.value);
                                        handleUpdateParagraph(para.id, 'tableRows', newRows);
                                      }}
                                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs"
                                    />
                                  </td>
                                ))}
                                <td className="p-1">
                                  {para.tableRows.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newRows = para.tableRows.filter((_, i) => i !== rIdx);
                                        handleUpdateParagraph(para.id, 'tableRows', newRows);
                                      }}
                                      className="text-red-500 hover:text-red-700 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="bg-slate-50 p-1.5 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => handleAddTableRow(para.id)}
                            className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3 h-3" />
                            <span>সারি যোগ করুন</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Presenter / Head Office / Deputy Director Comments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">শাখা ও প্রধান কার্যালয়ের অনুরোধ:</label>
                      <textarea
                        value={`${para.branchRequestText}\n${para.headOfficeCommentText}`}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          handleUpdateParagraph(para.id, 'branchRequestText', lines[0] || '');
                          handleUpdateParagraph(para.id, 'headOfficeCommentText', lines.slice(1).join('\n') || '');
                        }}
                        rows={2}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-emerald-800 block mb-1">এ কার্যালয়ের নিরীক্ষা মন্তব্য / সুপারিশ:</label>
                      <textarea
                        value={para.presenterCommentText}
                        onChange={(e) => handleUpdateParagraph(para.id, 'presenterCommentText', e.target.value)}
                        rows={2}
                        className="w-full text-xs p-2 bg-emerald-50/40 border border-emerald-300 rounded focus:bg-white font-medium text-emerald-950"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note Bottom Conclusion */}
            <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">নোট উপস্থাপন সমাপ্তি বাক্য:</label>
              <input
                type="text"
                value={noteConclusionFinal}
                onChange={(e) => setNoteConclusionFinal(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded p-2.5 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: JARIPATRA (ISSUE LETTER) VIEW */}
        {/* ========================================================= */}
        {activeTab === 'jaripatra' && (
          <div id="jaripatra-container" className="bg-white rounded-xl shadow-md border border-slate-200 p-6 md:p-10 flex flex-col gap-6">
            {/* Header: Office & Memo */}
            <div className="flex flex-col items-center justify-center text-center border-b border-slate-200 pb-6 gap-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">{OFFICE_HEADER.main}</h2>
              <h3 className="text-base font-semibold text-slate-800">{OFFICE_HEADER.sub}</h3>
              <p className="text-xs md:text-sm text-slate-600">{OFFICE_HEADER.address}</p>
            </div>

            {/* Memo No & Date */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs md:text-sm font-semibold border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span>স্মারক নং:</span>
                <input
                  type="text"
                  value={jaripatraMemoNo}
                  onChange={(e) => setJaripatraMemoNo(toBengaliDigits(e.target.value))}
                  className="font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs md:text-sm focus:bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>তারিখ:</span>
                <input
                  type="text"
                  value={jaripatraDate}
                  onChange={(e) => setJaripatraDate(toBengaliDigits(e.target.value))}
                  className="font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs md:text-sm focus:bg-white"
                />
              </div>
            </div>

            {/* Recipient Details */}
            <div className="flex flex-col gap-1.5 text-xs md:text-sm bg-slate-50/50 p-4 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-600">প্রাপক:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={jaripatraRecipientDesignation}
                  onChange={(e) => setJaripatraRecipientDesignation(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium"
                  placeholder="পদবী (যেমন: ব্যবস্থাপনা পরিচালক)"
                />
                <input
                  type="text"
                  value={jaripatraRecipientEntity}
                  onChange={(e) => setJaripatraRecipientEntity(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium"
                  placeholder="প্রতিষ্ঠানের নাম"
                />
                <input
                  type="text"
                  value={jaripatraRecipientAddress}
                  onChange={(e) => setJaripatraRecipientAddress(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium"
                  placeholder="ঠিকানা (যেমন: প্রধান কার্যালয়)"
                />
                <input
                  type="text"
                  value={jaripatraRecipientCity}
                  onChange={(e) => setJaripatraRecipientCity(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium"
                  placeholder="শহর / এলাকা"
                />
              </div>
            </div>

            {/* Subject, Reference, Intro Text */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">বিষয়:</label>
                <input
                  type="text"
                  value={jaripatraSubject}
                  onChange={(e) => setJaripatraSubject(e.target.value)}
                  className="w-full text-xs md:text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded p-2 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">সূত্র:</label>
                <input
                  type="text"
                  value={jaripatraReference}
                  onChange={(e) => setJaripatraReference(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded p-2 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ভূমিকা:</label>
                <textarea
                  value={jaripatraIntroText}
                  onChange={(e) => setJaripatraIntroText(e.target.value)}
                  rows={2}
                  className="w-full text-xs leading-relaxed text-slate-800 bg-slate-50 border border-slate-300 rounded p-2 focus:bg-white"
                />
              </div>
            </div>

            {/* Main Jaripatra Dynamic Table */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">জারিপত্র মন্তব্য ছক:</span>
                <button
                  onClick={() => {
                    const nextSl = toBengaliDigits(jaripatraGridRows.length + 1);
                    const newRow: JaripatraGridRowItem = {
                      id: `j-row-${Date.now()}`,
                      cells: {
                        col_1: { text: nextSl, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
                        col_2: { text: `${meta.paraNo}${meta.auditYear ? `, ${meta.auditYear}` : ""}`, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
                        col_3: { text: `${meta.entityName}।`, align: "justify", colSpan: 1, rowSpan: 1 },
                        col_4: { text: `অনুচ্ছেদ নং ${meta.paraNo}`, align: "justify", colSpan: 1, rowSpan: 1 },
                        col_5: { text: "০", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
                        col_6: { text: "আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 },
                      }
                    };
                    setJaripatraGridRows([...jaripatraGridRows, newRow]);
                  }}
                  className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>সারি যোগ করুন</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
                    <tr>
                      {jaripatraColumns.map((col) => (
                        <th key={col.id} className={`p-2.5 border-r border-slate-300 last:border-r-0 ${col.width || ''}`}>
                          <div>{col.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{col.subLabel}</div>
                        </th>
                      ))}
                      <th className="p-2 w-10">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jaripatraGridRows.map((r, rIdx) => (
                      <tr key={r.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50/50">
                        {jaripatraColumns.map((col) => {
                          const cell = r.cells[col.id] || { text: "", align: "justify" };
                          return (
                            <td key={col.id} className="p-2 border-r border-slate-200 last:border-r-0 align-top">
                              <textarea
                                value={cell.text}
                                onChange={(e) => {
                                  const newRows = [...jaripatraGridRows];
                                  newRows[rIdx].cells[col.id] = {
                                    ...cell,
                                    text: toBengaliDigits(e.target.value)
                                  };
                                  setJaripatraGridRows(newRows);
                                }}
                                rows={col.id === 'col_6' ? 3 : 2}
                                className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 text-xs ${
                                  cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : 'text-left'
                                } ${cell.isBold ? 'font-bold' : 'font-normal'}`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-1 align-middle text-center">
                          {jaripatraGridRows.length > 1 && (
                            <button
                              onClick={() => {
                                setJaripatraGridRows(jaripatraGridRows.filter((_, i) => i !== rIdx));
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatory Area */}
            <div className="flex justify-end pt-4">
              <div className="flex flex-col items-center text-center gap-1 w-64 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                <input
                  type="text"
                  value={jaripatraSignatoryName}
                  onChange={(e) => setJaripatraSignatoryName(e.target.value)}
                  className="w-full text-center font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  placeholder="স্বাক্ষরকারীর নাম"
                />
                <input
                  type="text"
                  value={jaripatraSignatoryTitle}
                  onChange={(e) => setJaripatraSignatoryTitle(e.target.value)}
                  className="w-full text-center text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  placeholder="পদবী"
                />
                <input
                  type="text"
                  value={jaripatraSignatoryPhone}
                  onChange={(e) => setJaripatraSignatoryPhone(toBengaliDigits(e.target.value))}
                  className="w-full text-center text-xs bg-white border border-slate-300 rounded px-2 py-1"
                  placeholder="ফোন নম্বর"
                />
              </div>
            </div>

            {/* Onulipi (Distribution) Area */}
            <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={jaripatraOnulipiHeader}
                  onChange={(e) => setJaripatraOnulipiHeader(e.target.value)}
                  className="font-bold text-xs text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-emerald-500 rounded p-1 w-3/4"
                />
                <button
                  onClick={() => {
                    const nextNum = toBengaliDigits(jaripatraOnulipiItems.length + 1);
                    setJaripatraOnulipiItems([...jaripatraOnulipiItems, `${nextNum}. অফিস কপি।`]);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>অনুলিপি যোগ করুন</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {jaripatraOnulipiItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...jaripatraOnulipiItems];
                        newItems[idx] = e.target.value;
                        setJaripatraOnulipiItems(newItems);
                      }}
                      className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-1.5 focus:bg-white"
                    />
                    {jaripatraOnulipiItems.length > 1 && (
                      <button
                        onClick={() => setJaripatraOnulipiItems(jaripatraOnulipiItems.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AI AUTO-DRAFTER VIEW */}
        {/* ========================================================= */}
        {activeTab === 'ai' && (
          <div id="ai-draft-container" className="bg-white rounded-xl shadow-md border border-slate-200 p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-start md:items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">
                    AI স্বয়ংক্রিয় ড্রাফটিং ও মূল অনুচ্ছেদ/পরিশিষ্ট ভিত্তিক জবাব বিশ্লেষক
                  </h3>
                  <p className="text-xs text-slate-500">
                    মূল অনুচ্ছেদ ও পরিশিষ্টের অনিয়মের সাথে প্রতিষ্ঠানের জবাব ও প্রমাণকের গভীর তুলনামূলক পর্যালোচনা করে মন্তব্য প্রস্তুত করুন।
                  </p>
                </div>
              </div>

              {/* Comparative Analysis Toggle ("হ্যাঁ" / "না") */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">মূল অনুচ্ছেদ/পরিশিষ্ট ভিত্তিক পর্যালোচনা:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-200">
                  <button
                    type="button"
                    onClick={() => setVerifyAgainstOriginalObjectionAndAppendix(true)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                      verifyAgainstOriginalObjectionAndAppendix
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    হ্যাঁ (সক্রিয়)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyAgainstOriginalObjectionAndAppendix(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      !verifyAgainstOriginalObjectionAndAppendix
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    না
                  </button>
                </div>
              </div>
            </div>

            {verifyAgainstOriginalObjectionAndAppendix && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">তুলনামূলক পর্যালোচনা সক্রিয়:</span> মূল অনুচ্ছেদ ও পরিশিষ্টে বর্ণিত প্রতিটি অনিয়ম, আর্থিক অংক এবং হিসাবের বিপরীতে প্রতিষ্ঠান যে জবাব ও প্রমাণক পাঠিয়েছে তা যথাযথ ও সন্তোষজনক কিনা এআই প্রতিটি পয়েন্ট আলাদাভাবে যাচাই করে নির্ভুল নিরীক্ষা মন্তব্য ও সিদ্ধান্ত লিখে দিবে।
                </div>
              </div>
            )}

            {analysisError && (
              <div className="bg-amber-50 border border-amber-300 text-amber-800 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* 4-Input Grid for Original Objection, Original Appendix, Entity Reply, Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Original Audit Paragraph / Objection */}
              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 flex flex-col gap-3">
                <label className="text-xs font-bold text-blue-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    ১. মূল অনুচ্ছেদ (অডিট আপত্তির বিবরণী):
                  </span>
                  {originalObjectionFile && (
                    <span className="text-[11px] font-normal text-blue-700 truncate max-w-[150px]">
                      সংযুক্ত: {originalObjectionFile.name}
                    </span>
                  )}
                </label>
                <textarea
                  value={originalObjectionTextInput}
                  onChange={(e) => setOriginalObjectionTextInput(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  placeholder="মূল নিরীক্ষা প্রতিবেদনের অনুচ্ছেদ বা আপত্তির মূল বিবরণ এখানে পেস্ট করুন (ঐচ্ছিক)..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-white border border-blue-300 text-blue-800 rounded-md hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>মূল অনুচ্ছেদ ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'objection')}
                      className="hidden"
                    />
                  </label>
                  {originalObjectionFile && (
                    <button
                      onClick={() => setOriginalObjectionFile(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      ফাইল সরান
                    </button>
                  )}
                </div>
              </div>

              {/* Box 2: Original Appendix / Annexure */}
              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 flex flex-col gap-3">
                <label className="text-xs font-bold text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    ২. মূল পরিশিষ্ট (পরিশিষ্টের অনিয়ম ও হিসাব):
                  </span>
                  {originalAppendixFile && (
                    <span className="text-[11px] font-normal text-purple-700 truncate max-w-[150px]">
                      সংযুক্ত: {originalAppendixFile.name}
                    </span>
                  )}
                </label>
                <textarea
                  value={originalAppendixTextInput}
                  onChange={(e) => setOriginalAppendixTextInput(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                  placeholder="মূল পরিশিষ্টের তালিকা, হিসাব বা বিবরণ এখানে পেস্ট করুন (ঐচ্ছিক)..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-white border border-purple-300 text-purple-800 rounded-md hover:bg-purple-100 flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>মূল পরিশিষ্ট ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'appendix')}
                      className="hidden"
                    />
                  </label>
                  {originalAppendixFile && (
                    <button
                      onClick={() => setOriginalAppendixFile(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      ফাইল সরান
                    </button>
                  )}
                </div>
              </div>

              {/* Box 3: Entity Reply & Forwarding */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    ৩. ফরওয়ার্ডিং পত্র ও প্রতিষ্ঠানের জবাব:
                  </span>
                  {entityReplyFile && (
                    <span className="text-[11px] font-normal text-emerald-700 truncate max-w-[150px]">
                      সংযুক্ত: {entityReplyFile.name}
                    </span>
                  )}
                </label>
                <textarea
                  value={entityReplyTextInput}
                  onChange={(e) => setEntityReplyTextInput(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="প্রতিষ্ঠানের চিঠি বা ব্রডশীট জবাবের মূল বক্তব্য এখানে পেস্ট করুন..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>জবাবের ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'reply')}
                      className="hidden"
                    />
                  </label>
                  {entityReplyFile && (
                    <button
                      onClick={() => setEntityReplyFile(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      ফাইল সরান
                    </button>
                  )}
                </div>
              </div>

              {/* Box 4: Evidence Input */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    ৪. সংযুক্ত প্রমাণক (ভাউচার/স্টেটমেন্ট/চালান):
                  </span>
                  {evidenceFile && (
                    <span className="text-[11px] font-normal text-emerald-700 truncate max-w-[150px]">
                      সংযুক্ত: {evidenceFile.name}
                    </span>
                  )}
                </label>
                <textarea
                  value={evidenceTextInput}
                  onChange={(e) => setEvidenceTextInput(e.target.value)}
                  rows={5}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="প্রমাণকের বিবরণ (যেমন: জমা ভাউচার নং, চালানের তারিখ ও টাকার পরিমাণ) এখানে লিখুন..."
                />
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 flex items-center gap-1.5 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>প্রমাণক ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, 'evidence')}
                      className="hidden"
                    />
                  </label>
                  {evidenceFile && (
                    <button
                      onClick={() => setEvidenceFile(null)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      ফাইল সরান
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cross Verification Results Display (if available) */}
            {crossVerificationData && (
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    সর্বশেষ মূল অনুচ্ছেদ বনাম জবাবের পুঙ্খানুপুঙ্খ পর্যালোচনা ফলাফল:
                  </h4>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                    পর্যালোচিত
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {crossVerificationData.originalObjectionSummary && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">মূল আপত্তির অনিয়ম:</span>
                      <p className="text-slate-600">{crossVerificationData.originalObjectionSummary}</p>
                    </div>
                  )}
                  {crossVerificationData.appendixSummary && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">পরিশিষ্টের অনিয়ম/হিসাব:</span>
                      <p className="text-slate-600">{crossVerificationData.appendixSummary}</p>
                    </div>
                  )}
                  {crossVerificationData.replyAdequacyAnalysis && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">জবাব ও প্রমাণকের পর্যাপ্ততা:</span>
                      <p className="text-slate-600">{crossVerificationData.replyAdequacyAnalysis}</p>
                    </div>
                  )}
                  {crossVerificationData.finalRecommendation && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">নিরীক্ষা মন্তব্য ও সুপারিশ:</span>
                      <p className="text-slate-600 font-medium">{crossVerificationData.finalRecommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Action Button */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t border-slate-200">
              <button
                id="run-ai-draft-btn"
                disabled={isAnalyzing}
                onClick={handleRunAiAnalysis}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center gap-2.5 shadow-md transition-all ${
                  isAnalyzing
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{aiAnalysisStep || "বিশ্লেষণ ও ড্রাফট তৈরি হচ্ছে..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {verifyAgainstOriginalObjectionAndAppendix
                        ? "মূল অনুচ্ছেদ, পরিশিষ্ট ও জবাব পর্যালোচনা করে ড্রাফট তৈরি করুন"
                        : "স্বয়ংক্রিয় ড্রাফট তৈরি করুন"}
                    </span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                * ড্রাফট প্রস্তুতের পর স্বয়ংক্রিয়ভাবে নির্ভুল টোকা, অনুচ্ছেদভিত্তিক মন্তব্য, ছক ও জারিপত্রে ডেটা সিঙ্ক হবে।
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentManagementModule;
