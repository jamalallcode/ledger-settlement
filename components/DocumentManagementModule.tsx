import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Printer,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Building,
  Calendar,
  Hash,
  Coins,
  Flame,
  X,
  Check,
  Copy,
  Table,
  RotateCcw,
  FileCheck,
  Edit3,
  Columns,
  Rows,
  Split,
  Combine,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ChevronDown,
  Info,
  Layers,
} from "lucide-react";
import { CorrespondenceEntry } from "../types";
import { toBengaliDigits, formatDateBN, toEnglishDigits } from "../utils/numberUtils";
import { OFFICE_HEADER } from "../constants";

interface DocumentManagementModuleProps {
  entry: CorrespondenceEntry;
  onBack: () => void;
  isAdmin?: boolean;
  onSaveJaripatra?: (entry: CorrespondenceEntry, jaripatraData: any) => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
}

export interface JaripatraTableRowItem {
  id: string;
  sl: string;
  paraAndYear: string;
  entityName: string;
  paraTitle: string;
  involvedAmount: string;
  officeComment: string;
}

export interface JaripatraColumnItem {
  id: string;
  label: string;
  subLabel: string;
  align?: 'left' | 'center' | 'justify' | 'right';
  width?: string;
}

export interface JaripatraCellItem {
  text: string;
  colSpan?: number;
  rowSpan?: number;
  isHidden?: boolean;
  align?: 'left' | 'center' | 'justify' | 'right';
  isBold?: boolean;
}

export interface JaripatraGridRowItem {
  id: string;
  cells: Record<string, JaripatraCellItem>;
}

export interface TableColumn {
  id: string;
  label: string;
}

const DEFAULT_JARIPATRA_COLUMNS: JaripatraColumnItem[] = [
  { id: "col_1", label: "ক্রমিক নং", subLabel: "(১)", align: "center", width: "w-[6%]" },
  { id: "col_2", label: "অনু: নং ও নিরীক্ষা বছর", subLabel: "(২)", align: "center", width: "w-[14%]" },
  { id: "col_3", label: "প্রতিষ্ঠানের নাম", subLabel: "(৩)", align: "justify", width: "w-[22%]" },
  { id: "col_4", label: "অনুচ্ছেদের শিরোনাম", subLabel: "(৪)", align: "justify", width: "w-[22%]" },
  { id: "col_5", label: "জড়িত টাকা", subLabel: "(৫)", align: "center", width: "w-[12%]" },
  { id: "col_6", label: "এ কার্যালয়ের মন্তব্য", subLabel: "(৬)", align: "justify", width: "w-[24%]" },
];

export interface TableRow {
  id: string;
  cells: Record<string, string>;
  cellColors?: Record<string, string>;
}

export interface AuditParagraphBlock {
  id: string;
  sl: string;
  entityAndAuditYear: string;
  paraNo: string;
  titleAndDetails: string;
  entityReplyText: string;
  hasTable: boolean;
  tableColumns: TableColumn[];
  tableRows: TableRow[];
  branchRequestText: string;
  headOfficeCommentText: string;
  presenterCommentText: string;
  status: string;
}

const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { id: "sl", label: "ক্রমিক" },
  { id: "borrowerName", label: "ঋণগ্রহীতার নাম" },
  { id: "involvedAmount", label: "আপত্তিতে জড়িত টাকা" },
  { id: "principal", label: "আসল" },
  { id: "interest", label: "সুদ" },
  { id: "others", label: "অন্যান্য" },
  { id: "totalRecovered", label: "মোট আদায়" },
  { id: "adjustmentDate", label: "সমন্বয়ের তারিখ" },
];

export const DocumentManagementModule: React.FC<DocumentManagementModuleProps> = ({
  entry,
  onBack,
  onSaveJaripatra,
  onRegisterBackHandler,
}) => {
  // In-Memory Uploaded Files (Permanently purged on note approval)
  const [objectionFile, setObjectionFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [objectionText, setObjectionText] = useState<string>("");
  const [replyFile, setReplyFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [, setIsFilesPurged] = useState<boolean>(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState<string>("");
  const [needsClarification, setNeedsClarification] = useState<boolean>(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [userClarificationAnswers, setUserClarificationAnswers] = useState<Record<number, string>>({});

  // 1. Official Header (Top Center)
  const defaultDiaryNo = entry.diaryNo ? toBengaliDigits(entry.diaryNo) : "২৩৯";
  const defaultDiaryDate = entry.diaryDate ? formatDateBN(entry.diaryDate) : "৩০/০৭/২০২৬";
  const [diaryHeader, setDiaryHeader] = useState<string>(`ডায়েরি নং- ${defaultDiaryNo}, তারিখ: ${defaultDiaryDate} খ্রি:`);

  // 2. Toka / Introductory Note Body
  const defaultLetterNo = entry.letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২";
  const defaultLetterDate = entry.letterDate ? formatDateBN(entry.letterDate) : "২৭/০৭/২০২৬";
  const defaultEntity = entry.entityName || "পাটকল সংস্থা";
  const defaultMinistry = entry.ministryName || "বস্ত্র ও পাট মন্ত্রণালয়";
  const defaultBranch = entry.branchName || "দর্শনা শাখা, চুয়াডাঙ্গা";
  const defaultAuditYear = entry.auditYear || "২০১০-১১, ২০১৪-১৫, ২০১৫-১৬, ২০১৮-১৯";

  const [tikaIntroHtml, setTikaIntroHtml] = useState<string>(() => {
    return `<p><strong>টোকা নং- ১১:</strong> উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা <strong>${defaultEntity}</strong>, প্রধান কার্যালয়ের স্মারক নং- <strong>${defaultLetterNo}</strong>, তারিখ: <strong>${defaultLetterDate} খ্রি:</strong> পত্রটি <strong>(পৃষ্ঠা নং- )</strong> দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে <strong>${defaultMinistry}</strong> এর নিয়ন্ত্রণাধীন <strong>${defaultEntity}</strong>, ${defaultBranch} এর <strong>${defaultAuditYear}</strong> নিরীক্ষা বছরের ব্রডশীট জবাবের <strong>(পৃষ্ঠা নং- )</strong> ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।</p>`;
  });

  // 3. Multi-Paragraphs State (প্রতিটি অনুচ্ছেদের জন্য পৃথক ছক, জবাব, টেবিল ও মন্তব্য)
  const defaultParaNo = entry.paraNo ? toBengaliDigits(entry.paraNo) : "১০";
  const defaultTitleAndDetails = "শিরোনাম: \nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশিষ্ট পৃষ্ঠা নং- ";
  const defaultEntityAndAuditYear = `প্রতিষ্ঠান: ${defaultEntity}${
    entry.branchName ? `,\n${entry.branchName}` : defaultBranch ? `,\n${defaultBranch}` : ""
  }\nনিরীক্ষা বছর: ${entry.auditYear || defaultAuditYear}`;

  const [paragraphs, setParagraphs] = useState<AuditParagraphBlock[]>([
    {
      id: "para-1",
      sl: "১",
      entityAndAuditYear: defaultEntityAndAuditYear,
      paraNo: defaultParaNo,
      titleAndDetails: defaultTitleAndDetails,
      entityReplyText: "আপত্তিতে উল্লেখিত ৪ টি মাইক্রো ক্রেডিট “জাগো নারী” ঋণ আসল ও সুদসহ আদায় করা হয়েছে (প্রমাণক সংযুক্ত) যা নিচে উপস্থাপন করা হলো:",
      hasTable: false, // Initially user can click button or AI detects table
      tableColumns: [...DEFAULT_TABLE_COLUMNS],
      tableRows: [
        {
          id: "row-1",
          cells: {
            sl: "১",
            borrowerName: "ফেরদৌসী বেগম",
            involvedAmount: "১৪৫০৬",
            principal: "৬৮০০",
            interest: "৭৭০৬",
            others: "-",
            totalRecovered: "১৪৫০৬",
            adjustmentDate: "২০-০২-১৭",
          },
          cellColors: {},
        },
        {
          id: "row-2",
          cells: {
            sl: "২",
            borrowerName: "শারমিন আক্তার",
            involvedAmount: "১৪৫০৬",
            principal: "৬৮০০",
            interest: "৭৭০৬",
            others: "-",
            totalRecovered: "১৪৫০৬",
            adjustmentDate: "২২-১০-১৭",
          },
          cellColors: {},
        },
      ],
      branchRequestText: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
      headOfficeCommentText: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
      presenterCommentText: "আপত্তিকৃত সমুদয় টাকা আদায় হওয়ায় ও আদায়ের স্বপক্ষে প্রমাণক (২৬৮-২৮৮) সংযুক্ত থাকায় আপত্তিটি নিষ্পত্তি করা যেতে পারে।",
      status: "পূর্ণাঙ্গ নিষ্পত্তি",
    },
  ]);

  // 4. Overall Closing Submission
  const [finalSubmissionText, setFinalSubmissionText] = useState<string>(
    "সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।"
  );

  // Approval & Status
  const [settlementStatus, setSettlementStatus] = useState<string>("পূর্ণাঙ্গ নিষ্পত্তি");
  const [isNoteApproved, setIsNoteApproved] = useState<boolean>(false);
  const [selectedCellColor, setSelectedCellColor] = useState<string>("#ecfdf5");

  // Document Validation, Confirmation & Toast States
  const [validationErrorModal, setValidationErrorModal] = useState<{
    open: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  const [documentConfirmationModal, setDocumentConfirmationModal] = useState<{
    open: boolean;
    prompt: string;
    missingFields: string[];
    pendingPayload?: any;
  } | null>(null);

  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  // Jaripatra State (Strict Government Layout Matching Commercial Audit Format)
  const getTodayBengaliDateFormatted = (): string => {
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear().toString();
    return `${toBengaliDigits(`${d}/${m}/${y}`)} খ্রি:`;
  };

  const [showJaripatraView, setShowJaripatraView] = useState<boolean>(false);
  const [isJaripatraEditable, setIsJaripatraEditable] = useState<boolean>(true);
  const [jaripatraCopiedSuccess, setJaripatraCopiedSuccess] = useState<boolean>(false);
  const [jaripatraSavedSuccess, setJaripatraSavedSuccess] = useState<boolean>(false);
  
  // Header 5 Lines
  const [jaripatraHeaderLine1, setJaripatraHeaderLine1] = useState<string>("মহাপরিচালকের কার্যালয়");
  const [jaripatraHeaderLine2, setJaripatraHeaderLine2] = useState<string>("বাণিজ্যিক অডিট অধিদপ্তর");
  const [jaripatraHeaderLine3, setJaripatraHeaderLine3] = useState<string>("আঞ্চলিক কার্যালয় (সেক্টর-৬)");
  const [jaripatraHeaderLine4, setJaripatraHeaderLine4] = useState<string>("বিডিবিএল ভবন (৯ম ও ১০ম তলা)");
  const [jaripatraHeaderLine5, setJaripatraHeaderLine5] = useState<string>("খুলনা – ৯০০০");

  // Top Memo & Date
  const [jaripatraMemoNo, setJaripatraMemoNo] = useState<string>("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
  const [jaripatraDate, setJaripatraDate] = useState<string>(() => getTodayBengaliDateFormatted());

  // Recipient
  const [jaripatraRecipientDesignation, setJaripatraRecipientDesignation] = useState<string>("ব্যবস্থাপনা পরিচালক");
  const [jaripatraRecipientEntity, setJaripatraRecipientEntity] = useState<string>(() => entry.entityName || "সোনালী ব্যাংক পিএলসি");
  const [jaripatraRecipientAddress, setJaripatraRecipientAddress] = useState<string>("প্রধান কার্যালয়, ৩৫-৪২, ৪৪ মতিঝিল বা/এ");
  const [jaripatraRecipientCity, setJaripatraRecipientCity] = useState<string>("ঢাকা – ১০০০");

  // Subject & Reference & Intro Text
  const [jaripatraSubject, setJaripatraSubject] = useState<string>(() => {
    const branchPart = entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা';
    const auditYr = entry.auditYear || "২০১১-১৪";
    return `বিষয়: ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${branchPart} এর ${auditYr} সালের বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ১০ এর জবাবের উপর মন্তব্য প্রেরণ।`;
  });
  const [jaripatraReference, setJaripatraReference] = useState<string>(() => {
    const letterN = entry.letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২";
    const letterD = entry.letterDate ? formatDateBN(entry.letterDate) : "২৭/০৭/২০২৬";
    return `সূত্র: ${entry.entityName || "সোনালী ব্যাংক পিএলসি"} এর পত্র নং ${letterN}, তারিখ: ${letterD}`;
  });
  const [jaripatraIntroText, setJaripatraIntroText] = useState<string>(() => {
    const branchPart = entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা';
    const auditYr = entry.auditYear || "২০১১-২০১৪";
    return `উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${branchPart} এর ${auditYr} সালের নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ১০ এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:`;
  });

  // Dynamic Columns & Grid Rows (Flexible Government Settlement Format with Add/Delete/Merge capabilities)
  const [jaripatraColumns, setJaripatraColumns] = useState<JaripatraColumnItem[]>(DEFAULT_JARIPATRA_COLUMNS);
  const [jaripatraGridRows, setJaripatraGridRows] = useState<JaripatraGridRowItem[]>([
    {
      id: "j-row-1",
      cells: {
        col_1: { text: "১", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_2: { text: `১০, ${entry.auditYear || "২০১১-১৪"}`, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_3: { text: `${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা।'}`, align: "justify", colSpan: 1, rowSpan: 1 },
        col_4: { text: `মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ী ${entry.totalAmount ? toBengaliDigits(entry.totalAmount) : "৫৭,৮২৫"} টাকা।`, align: "justify", colSpan: 1, rowSpan: 1 },
        col_5: { text: entry.totalAmount ? toBengaliDigits(entry.totalAmount) : "৫৭,৮২৫", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
        col_6: { text: "আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 }
      }
    }
  ]);
  const [activeCellMenu, setActiveCellMenu] = useState<{ rowId: string; colId: string; rowIndex: number; colIndex: number } | null>(null);
  const [showTableGuide, setShowTableGuide] = useState<boolean>(false);

  // Signatory
  const [jaripatraSignatoryName, setJaripatraSignatoryName] = useState<string>("নাসিফ কবির");
  const [jaripatraSignatoryTitle, setJaripatraSignatoryTitle] = useState<string>("উপ-পরিচালক");
  const [jaripatraSignatoryPhone, setJaripatraSignatoryPhone] = useState<string>("ফোন: ০২৪৭৭৭২২৬৫৬");

  // Bottom Memo & Date
  const [jaripatraBottomMemoNo, setJaripatraBottomMemoNo] = useState<string>("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
  const [jaripatraBottomDate, setJaripatraBottomDate] = useState<string>(() => getTodayBengaliDateFormatted());

  // Onulipi
  const [jaripatraOnulipiHeader, setJaripatraOnulipiHeader] = useState<string>("সদয় অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুলিপি প্রেরণ করা হলো: (জ্যেষ্ঠতার ভিত্তিতে নয়)");
  const [jaripatraOnulipiItems, setJaripatraOnulipiItems] = useState<string[]>([
    `১. উপমহাব্যবস্থাপক, ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}, জিএম অফিস, খুলনা। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)`,
    "২. পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কাযায়, অডিট কমপ্লেক্স (৮ম ও ৯ ম তলা), সেগুনবাগিচা, ঢাকা।",
    "৩. অফিস কপি।"
  ]);
  const [newlyAddedParaId, setNewlyAddedParaId] = useState<string | null>(null);

  // Automatically scroll to top when switching to Jaripatra view
  useEffect(() => {
    if (showJaripatraView) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const mainContainer = document.getElementById("official-jaripatra-container");
      if (mainContainer) {
        mainContainer.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, [showJaripatraView]);

  // Hook into the main back button so that when in Jaripatra view, it returns to Note Sheet, and from Note Sheet back to Register
  useEffect(() => {
    if (onRegisterBackHandler) {
      if (showJaripatraView) {
        onRegisterBackHandler(() => {
          setShowJaripatraView(false);
          return true;
        });
      } else {
        onRegisterBackHandler(() => {
          onBack();
          return true;
        });
      }
    }
    return () => {
      if (onRegisterBackHandler) {
        onRegisterBackHandler(null);
      }
    };
  }, [showJaripatraView, onRegisterBackHandler, onBack]);

  // Synchronize Jaripatra summary rows directly from the note sheet paragraphs
  const handleSyncJaripatraFromParagraphs = () => {
    if (paragraphs.length === 0) return;
    const newGridRows: JaripatraGridRowItem[] = paragraphs.map((para, idx) => {
      const col1Text = toBengaliDigits(idx + 1);
      const col2Text = `${para.paraNo || "১০"}, ${entry.auditYear || "২০১১-১৪"}`;
      const col3Text = `${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা।'}`;
      const col4Text = para.titleAndDetails 
        ? para.titleAndDetails.split("\n")[0].replace(/^শিরোনাম:\s*/, "") 
        : `মাইক্রো ক্রেডিট ঋণের মেয়াদোত্তীর্ণ অনাদায়ী টাকা।`;
      
      let totalAmt = entry.totalAmount ? toBengaliDigits(entry.totalAmount) : "-";
      if (para.hasTable) {
        const recovered = calculateParagraphTotal(para, "আদায়");
        const involved = calculateParagraphTotal(para, "জড়িত");
        if (recovered > 0) totalAmt = toBengaliDigits(recovered);
        else if (involved > 0) totalAmt = toBengaliDigits(involved);
      }
      const col5Text = totalAmt;
      const col6Text = para.presenterCommentText || "আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।";

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
  };

  // Rich Text Editor Ref for Tika
  const tikaEditorRef = useRef<HTMLDivElement>(null);

  const executeCommand = (command: string, value: string = "") => {
    if (tikaEditorRef.current) {
      tikaEditorRef.current.focus();
      document.execCommand(command, false, value);
      setTikaIntroHtml(tikaEditorRef.current.innerHTML);
    }
  };

  // Convert File to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "objection" | "reply") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const fileData = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        base64,
        mimeType: file.type || "application/octet-stream",
      };

      if (type === "objection") {
        setObjectionFile(fileData);
        if (!objectionText) {
          setObjectionText(`[সংযুক্ত ফাইল: ${file.name}] মূল আপত্তির রেকর্ডপত্র।`);
        }
      } else {
        setReplyFile(fileData);
        if (!replyText) {
          setReplyText(`[সংযুক্ত ফাইল: ${file.name}] প্রতিষ্ঠানের জবাব ও প্রমাণক।`);
        }
      }
      setIsFilesPurged(false);
    };
    reader.readAsDataURL(file);
  };

  // Paragraph Operations
  const handleAddParagraph = () => {
    const nextSl = toBengaliDigits(paragraphs.length + 1);
    const nextParaId = `para-${Date.now()}`;
    const newPara: AuditParagraphBlock = {
      id: nextParaId,
      sl: nextSl,
      entityAndAuditYear: `প্রতিষ্ঠান: ${defaultEntity}${entry.branchName ? `,\n${entry.branchName}` : ''}\nনিরীক্ষা বছর: ${entry.auditYear || defaultAuditYear}`,
      paraNo: toBengaliDigits(Number(toEnglishDigits(defaultParaNo) || "10") + paragraphs.length),
      titleAndDetails: "শিরোনাম: \nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশিষ্ট পৃষ্ঠা নং- ",
      entityReplyText: "আপত্তিতে উল্লেখিত দাবিকৃত অর্থ ও চালানের প্রেক্ষিতে জবাব নিম্নরূপ:",
      hasTable: false,
      tableColumns: [...DEFAULT_TABLE_COLUMNS],
      tableRows: [
        {
          id: `row-${Date.now()}-1`,
          cells: {
            sl: "১",
            borrowerName: "",
            involvedAmount: "০",
            principal: "০",
            interest: "০",
            others: "-",
            totalRecovered: "০",
            adjustmentDate: "-",
          },
          cellColors: {},
        },
      ],
      branchRequestText: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
      headOfficeCommentText: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
      presenterCommentText: "দাখিলকৃত প্রমাণক সঠিক থাকায় অনুচ্ছেদটি নিষ্পত্তি করা যেতে পারে।",
      status: "পূর্ণাঙ্গ নিষ্পত্তি",
    };

    setParagraphs((prev) => [...prev, newPara]);
    setNewlyAddedParaId(nextParaId);

    // Smoothly scroll the newly created paragraph into view so the user is immediately taken to it
    setTimeout(() => {
      const el = document.getElementById(nextParaId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);

    // Keep highlight active for 4 seconds so the user clearly notices it
    setTimeout(() => {
      setNewlyAddedParaId((prev) => (prev === nextParaId ? null : prev));
    }, 4000);
  };

  const handleDeleteParagraph = (paraId: string) => {
    if (paragraphs.length <= 1) {
      alert("কমপক্ষে একটি অনুচ্ছেদ থাকা আবশ্যক।");
      return;
    }
    setParagraphs(paragraphs.filter((p) => p.id !== paraId));
  };

  const handleUpdateParagraphField = (
    paraId: string,
    field: keyof AuditParagraphBlock,
    val: any
  ) => {
    setParagraphs(
      paragraphs.map((p) => (p.id === paraId ? { ...p, [field]: val } : p))
    );
  };

  const handleToggleParagraphTable = (paraId: string, forcedState?: boolean) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          const nextState = forcedState !== undefined ? forcedState : !p.hasTable;
          return { ...p, hasTable: nextState };
        }
        return p;
      })
    );
  };

  const handleAddParagraphTableRow = (paraId: string) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          const nextIdx = p.tableRows.length + 1;
          const newCells: Record<string, string> = {};
          p.tableColumns.forEach((col) => {
            if (col.id === "sl" || col.label.includes("ক্রমিক")) newCells[col.id] = toBengaliDigits(nextIdx);
            else if (col.id === "borrowerName" || col.label.includes("নাম")) newCells[col.id] = "";
            else if (col.label.includes("টাকা") || col.id.includes("Amount") || col.id === "principal" || col.id === "interest") newCells[col.id] = "০";
            else newCells[col.id] = "-";
          });
          return {
            ...p,
            tableRows: [...p.tableRows, { id: `row-${Date.now()}`, cells: newCells, cellColors: {} }],
          };
        }
        return p;
      })
    );
  };

  const handleDeleteParagraphTableRow = (paraId: string, rowId: string) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          if (p.tableRows.length <= 1) return p;
          return {
            ...p,
            tableRows: p.tableRows.filter((r) => r.id !== rowId),
          };
        }
        return p;
      })
    );
  };

  const handleAddParagraphTableCol = (paraId: string) => {
    const colName = prompt("নতুন কলামের শিরোনাম লিখুন:", "নতুন কলাম");
    if (!colName) return;
    const newColId = `col-${Date.now()}`;
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          const updatedCols = [...p.tableColumns, { id: newColId, label: colName }];
          const updatedRows = p.tableRows.map((r) => ({
            ...r,
            cells: { ...r.cells, [newColId]: "" },
          }));
          return { ...p, tableColumns: updatedCols, tableRows: updatedRows };
        }
        return p;
      })
    );
  };

  const handleDeleteParagraphTableCol = (paraId: string, colId: string) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          if (p.tableColumns.length <= 2) {
            alert("কমপক্ষে দুটি কলাম থাকা আবশ্যক।");
            return p;
          }
          return {
            ...p,
            tableColumns: p.tableColumns.filter((c) => c.id !== colId),
          };
        }
        return p;
      })
    );
  };

  const handleUpdateParagraphTableCell = (
    paraId: string,
    rowId: string,
    colId: string,
    val: string
  ) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          return {
            ...p,
            tableRows: p.tableRows.map((r) =>
              r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: val } } : r
            ),
          };
        }
        return p;
      })
    );
  };

  const handleApplyParagraphTableCellColor = (
    paraId: string,
    rowId: string,
    colId: string
  ) => {
    setParagraphs(
      paragraphs.map((p) => {
        if (p.id === paraId) {
          return {
            ...p,
            tableRows: p.tableRows.map((r) => {
              if (r.id !== rowId) return r;
              const currentColors = { ...(r.cellColors || {}) };
              if (currentColors[colId] === selectedCellColor) {
                delete currentColors[colId];
              } else {
                currentColors[colId] = selectedCellColor;
              }
              return { ...r, cellColors: currentColors };
            }),
          };
        }
        return p;
      })
    );
  };

  const applyParsedDataToNote = (data: any) => {
    if (data.needsClarification && data.clarificationQuestions && data.clarificationQuestions.length > 0) {
      setNeedsClarification(true);
      setClarificationQuestions(data.clarificationQuestions);
    } else {
      setNeedsClarification(false);
      if (data.diaryHeader) setDiaryHeader(data.diaryHeader);
      if (data.noteTikaText || data.noteContentHtml) {
        const html = data.noteContentHtml || `<p>${data.noteTikaText}</p>`;
        setTikaIntroHtml(html);
        if (tikaEditorRef.current) {
          tikaEditorRef.current.innerHTML = html;
        }
      }
      if (data.conclusionFinal) setFinalSubmissionText(data.conclusionFinal);
      if (data.proposedStatus) setSettlementStatus(data.proposedStatus);

      // Handle Multi-Paragraphs payload and paste into respective paragraph slots
      if (Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
        const parsedParas: AuditParagraphBlock[] = data.paragraphs.map((pItem: any, pIdx: number) => {
          const cols: TableColumn[] = Array.isArray(pItem.tableHeaders) && pItem.tableHeaders.length > 0
            ? pItem.tableHeaders.map((h: string, i: number) => ({ id: `col-${i}`, label: h }))
            : [...DEFAULT_TABLE_COLUMNS];

          const rows: TableRow[] = Array.isArray(pItem.tableRows) && pItem.tableRows.length > 0
            ? pItem.tableRows.map((r: string[], rIdx: number) => {
                const cells: Record<string, string> = {};
                cols.forEach((col, cIdx) => {
                  cells[col.id] = r[cIdx] || "";
                });
                return { id: `row-${pIdx}-${rIdx + 1}`, cells, cellColors: {} };
              })
            : [];

          return {
            id: `para-ai-${pIdx + 1}`,
            sl: pItem.sl || toBengaliDigits(pIdx + 1),
            entityAndAuditYear: pItem.entityAndAuditYear || defaultEntityAndAuditYear,
            paraNo: pItem.paraNo ? toBengaliDigits(pItem.paraNo) : toBengaliDigits(10 + pIdx),
            titleAndDetails: pItem.titleAndDetails || defaultTitleAndDetails,
            entityReplyText: (pItem.entityReplyHeader || pItem.entityReplyText || "").replace(/^স্থানীয় প্রতিষ্ঠানের জবাব:\s*/, ''),
            hasTable: !!pItem.hasTable && rows.length > 0,
            tableColumns: cols,
            tableRows: rows.length > 0 ? rows : [
              {
                id: `row-${pIdx}-1`,
                cells: { sl: "১", borrowerName: "", involvedAmount: "০", principal: "০", interest: "০", others: "-", totalRecovered: "০", adjustmentDate: "-" },
                cellColors: {}
              }
            ],
            branchRequestText: pItem.conclusionBranch || "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
            headOfficeCommentText: (pItem.conclusionHeadOffice || "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।").replace(/^প্রধান কার্যালয়ের মন্তব্য:\s*/, ''),
            presenterCommentText: (pItem.conclusionPresenter || "আপত্তিকৃত সমুদয় টাকা আদায় হওয়ায় ও আদায়ের স্বপক্ষে প্রমাণক সংযুক্ত থাকায় আপত্তিটি নিষ্পত্তি করা যেতে পারে।").replace(/^উপস্থাপনকারীর মন্তব্য:\s*/, ''),
            status: pItem.status || "পূর্ণাঙ্গ নিষ্পত্তি",
          };
        });
        setParagraphs(parsedParas);

        // Auto-generate Jaripatra rows from parsed paragraphs
        const jRows: JaripatraGridRowItem[] = parsedParas.map((para, idx) => {
          let title = para.titleAndDetails.split("\n")[0] || "মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ী টাকা।";
          title = title.replace(/^শিরোনাম:\s*/, '');
          return {
            id: `j-row-ai-${idx + 1}`,
            cells: {
              col_1: { text: para.sl || toBengaliDigits(idx + 1), align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_2: { text: `${para.paraNo}, ${entry.auditYear || "২০১১-১৪"}`, align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_3: { text: `${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${entry.branchName ? `,\n${entry.branchName}` : ',\nদর্শনা শাখা, চুয়াডাঙ্গা।'}`, align: "justify", colSpan: 1, rowSpan: 1 },
              col_4: { text: title, align: "justify", colSpan: 1, rowSpan: 1 },
              col_5: { text: entry.totalAmount ? toBengaliDigits(entry.totalAmount) : "৫৭,৮২৫", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_6: { text: para.presenterCommentText || "আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 }
            }
          };
        });
        if (jRows.length > 0) {
          setJaripatraGridRows(jRows);
        }
      }

      if (data.suggestedIssueLetter) {
        const sil = data.suggestedIssueLetter;
        if (sil.memoNo) setJaripatraMemoNo(sil.memoNo);
        if (sil.date) setJaripatraDate(sil.date);
        if (sil.recipient) {
          if (typeof sil.recipient === "object") {
            if (sil.recipient.designation) setJaripatraRecipientDesignation(sil.recipient.designation);
            if (sil.recipient.entityName) setJaripatraRecipientEntity(sil.recipient.entityName);
            if (sil.recipient.address) setJaripatraRecipientAddress(sil.recipient.address);
            if (sil.recipient.city) setJaripatraRecipientCity(sil.recipient.city);
          }
        }
        if (sil.subject) setJaripatraSubject(sil.subject);
        if (sil.reference) setJaripatraReference(sil.reference);
        if (sil.introText) setJaripatraIntroText(sil.introText);
        if (sil.tableRows && Array.isArray(sil.tableRows) && sil.tableRows.length > 0) {
          setJaripatraGridRows(sil.tableRows.map((r: any, idx: number) => ({
            id: `j-row-${idx + 1}`,
            cells: {
              col_1: { text: r.sl || toBengaliDigits(idx + 1), align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_2: { text: r.paraAndYear || "১০, ২০১১-১৪", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_3: { text: r.entityName || `${entry.entityName || "সোনালী ব্যাংক পিএলসি"},\nদর্শনা শাখা, চুয়াডাঙ্গা।`, align: "justify", colSpan: 1, rowSpan: 1 },
              col_4: { text: r.paraTitle || "মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ী টাকা।", align: "justify", colSpan: 1, rowSpan: 1 },
              col_5: { text: r.involvedAmount || "৫৭,৮২৫", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
              col_6: { text: r.officeComment || "আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 }
            }
          })));
        }
        if (sil.signatoryName) setJaripatraSignatoryName(sil.signatoryName);
        if (sil.signatoryTitle) setJaripatraSignatoryTitle(sil.signatoryTitle);
        if (sil.signatoryPhone) setJaripatraSignatoryPhone(sil.signatoryPhone);
        if (sil.onulipiList && Array.isArray(sil.onulipiList) && sil.onulipiList.length > 0) {
          setJaripatraOnulipiItems(sil.onulipiList);
        }
      }

      // Show success toast & smooth scroll to note sheet
      setAiSuccessToast("এআই সফলভাবে অডিট তথ্য যাচাই করে সংশ্লিষ্ট ছক ও ফিল্ডসমূহে পেস্ট করেছে!");
      setTimeout(() => setAiSuccessToast(null), 5000);

      setTimeout(() => {
        const el = document.getElementById("document-notesheet-content");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  };

  // AI Run Analysis with Validation & Auto-placement
  const handleRunAiAnalysis = async (confirmedProceed: boolean = false) => {
    // 1. Initial local emptiness check
    const hasObjection = !!(objectionText.trim() || objectionFile);
    const hasReply = !!(replyText.trim() || replyFile);

    if (!hasObjection && !hasReply) {
      setValidationErrorModal({
        open: true,
        message: "আপনি কোনো অডিট ডকুমেন্ট বা জবাব প্রদান করেননি।",
        details: [
          "অনুগ্রহ করে ক. মূল অডিট আপত্তি / অনুচ্ছেদসমূহ অথবা খ. প্রতিষ্ঠানের জবাব ও প্রমাণক সংযুক্ত করুন বা লিখুন।",
          "নথিতে প্রতিষ্ঠান, নিরীক্ষা বছর ও অনুচ্ছেদ নম্বর সংক্রান্ত তথ্য থাকা আবশ্যক।"
        ]
      });
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysisStep("ডকুমেন্টের বিষয়বস্তু ও অডিট তথ্যাদি স্ক্যান করা হচ্ছে...");

    try {
      setTimeout(() => {
        setAiAnalysisStep("অনুচ্ছেদ নং, নিরীক্ষা সাল ও প্রতিষ্ঠান যাচাই চলছে...");
      }, 700);

      setTimeout(() => {
        setAiAnalysisStep("যাচাইকরণ শেষ করে সংশ্লিষ্ট ঘরে তথ্য সাজানো হচ্ছে...");
      }, 1500);

      const response = await fetch("/api/document-management/analyze-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userConfirmedProceed: confirmedProceed,
          originalObjectionText: objectionText,
          originalObjectionFile: objectionFile,
          entityReplyText: replyText,
          entityReplyFile: replyFile,
          letterMetadata: {
            diaryNo: entry.diaryNo,
            diaryDate: entry.diaryDate,
            letterNo: entry.letterNo,
            letterDate: entry.letterDate,
            entityName: entry.entityName,
            ministryName: entry.ministryName,
            auditYear: entry.auditYear,
            branchName: entry.branchName,
            paraType: entry.paraType,
            totalParas: entry.totalParas,
            totalAmount: entry.totalAmount,
          },
          userClarifications: Object.entries(userClarificationAnswers).map(([idx, ans]) => ({
            question: clarificationQuestions[Number(idx)] || "",
            answer: ans,
          })),
        }),
      });

      const resJson = await response.json();

      // Check if document was marked invalid by AI
      if (resJson.isValid === false || resJson.data?.isValidAuditDocument === false) {
        setValidationErrorModal({
          open: true,
          message: resJson.errorMessage || resJson.data?.errorMessage || "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।",
          details: resJson.validationErrors || resJson.data?.validationErrors || [
            "প্রদত্ত ডকুমেন্টে প্রাসঙ্গিক অডিট আপত্তি, অনুচ্ছেদ নম্বর বা নিরীক্ষা সালের কোনো রেকর্ড খুঁজে পাওয়া যায়নি।",
            "দয়া করে এলোমেলো কোনো লেখা না দিয়ে সঠিক অডিট আপত্তি বা জবাব সংযুক্ত করুন।"
          ]
        });
        return;
      }

      // Check if user confirmation is required due to missing fields
      if (resJson.requiresConfirmation && !confirmedProceed) {
        setDocumentConfirmationModal({
          open: true,
          prompt: resJson.confirmationPrompt || "প্রদত্ত নথিতে কিছু অডিট তথ্য সরাসরি পাওয়া যায়নি। এটিই কি আপনার কাঙ্ক্ষিত সঠিক অডিট ডকুমেন্ট?",
          missingFields: resJson.missingFields || [],
          pendingPayload: resJson.data
        });
        return;
      }

      if (resJson.success && resJson.data) {
        applyParsedDataToNote(resJson.data);
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      setValidationErrorModal({
        open: true,
        message: "ডকুমেন্ট বিশ্লেষণ ও যাচাইকরণে ত্রুটি দেখা দিয়েছে।",
        details: ["দয়া করে নেটওয়ার্ক সংযোগ চেক করুন অথবা ফাইল ফরম্যাটটি পরিবর্তন করে পুনরায় চেষ্টা করুন।"]
      });
    } finally {
      setIsAnalyzing(false);
      setAiAnalysisStep("");
    }
  };

  // Approval and In-Memory Discard
  const handleApproveNoteAndPurge = () => {
    setIsNoteApproved(true);
    setObjectionFile(null);
    setReplyFile(null);
    setIsFilesPurged(true);
  };

  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [copiedTableSuccess, setCopiedTableSuccess] = useState<boolean>(false);
  const noteDocumentRef = useRef<HTMLDivElement>(null);

  // Numeric totals calculation for a specific paragraph table
  const calculateParagraphTotal = (para: AuditParagraphBlock, identifier: string): number => {
    return para.tableRows.reduce((acc, row) => {
      let cellVal = "";
      Object.entries(row.cells).forEach(([colId, v]) => {
        const col = para.tableColumns.find((c) => c.id === colId);
        if (col && (col.id === identifier || col.label.includes(identifier))) {
          cellVal = String(v || "");
        }
      });
      const num = parseFloat(toEnglishDigits(cellVal || "0").replace(/,/g, "")) || 0;
      return acc + num;
    }, 0);
  };

  // Generate MS Word / Excel Compatible HTML for a specific Paragraph's Table
  const generateWordCompatibleParagraphTableHtml = (para: AuditParagraphBlock) => {
    if (!para.hasTable || para.tableRows.length === 0) return "";

    const getColWidth = (label: string) => {
      if (label.includes("ক্রমিক")) return "6%";
      if (label.includes("নাম") || label.includes("বিবরণ")) return "24%";
      if (label.includes("জড়িত")) return "12%";
      if (label.includes("আসল")) return "11%";
      if (label.includes("সুদ")) return "11%";
      if (label.includes("অন্যান্য")) return "8%";
      if (label.includes("মোট") || label.includes("আদায়")) return "13%";
      if (label.includes("তারিখ")) return "15%";
      return `${Math.round(100 / (para.tableColumns.length || 1))}%`;
    };

    const headerCells = para.tableColumns
      .map(
        (c) => `
        <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: center; vertical-align: middle; padding: 6pt 5pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; width: ${getColWidth(
          c.label
        )}; mso-border-alt: solid black .75pt;">
          ${c.label}
        </th>`
      )
      .join("");

    const bodyRows = para.tableRows
      .map(
        (r) => `
        <tr style="page-break-inside: avoid; mso-yfti-irow: 1;">
          ${para.tableColumns
            .map((c, idx) => {
              const isCenter = idx === 0 || c.label.includes("ক্রমিক") || c.label.includes("তারিখ");
              const isRight =
                c.label.includes("টাকা") ||
                c.label.includes("আসল") ||
                c.label.includes("সুদ") ||
                c.label.includes("আদায়") ||
                c.label.includes("জড়িত");
              const align = isCenter ? "center" : isRight ? "right" : "left";
              const bgColor = (r.cellColors && r.cellColors[c.id]) || "#ffffff";
              return `
              <td style="border: 1.0pt solid #000000; background-color: ${bgColor}; padding: 5pt 6pt; text-align: ${align}; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .5pt; word-break: break-word; white-space: normal;">
                ${r.cells[c.id] || "-"}
              </td>`;
            })
            .join("")}
        </tr>`
      )
      .join("");

    const totalInvolved = calculateParagraphTotal(para, "জড়িত");
    const totalPrincipal = calculateParagraphTotal(para, "আসল");
    const totalInterest = calculateParagraphTotal(para, "সুদ");
    const totalRecovered = calculateParagraphTotal(para, "আদায়");

    const totalRow = `
      <tr style="font-weight: bold; background-color: #F1F5F9; page-break-inside: avoid; mso-yfti-irow: 2; mso-yfti-lastrow: yes;">
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">সর্বমোট</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">-</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: right; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">${
          totalInvolved ? toBengaliDigits(totalInvolved) : "-"
        }</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: right; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">${
          totalPrincipal ? toBengaliDigits(totalPrincipal) : "০"
        }</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: right; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">${
          totalInterest ? toBengaliDigits(totalInterest) : "০"
        }</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">-</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: right; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">${
          totalRecovered ? toBengaliDigits(totalRecovered) : "-"
        }</td>
        <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .75pt;">-</td>
      </tr>`;

    return `
      <table border="1" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; border: 1.0pt solid #000000; mso-border-alt: solid black .75pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 12pt 0;">
        <thead>
          <tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes; page-break-inside: avoid;">
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
          ${totalRow}
        </tbody>
      </table>
    `;
  };

  // Generate Word Compatible Single Paragraph Objection Info Row Table
  const generateWordCompatibleObjectionRowHtml = (para: AuditParagraphBlock) => {
    return `
      <table border="1" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; border: 1.0pt solid #000000; mso-border-alt: solid black .75pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 10pt 0;">
        <thead>
          <tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes; page-break-inside: avoid;">
            <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: center; vertical-align: middle; padding: 6pt 5pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; width: 10%; mso-border-alt: solid black .75pt;">
              ক্রমিক নং
            </th>
            <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: left; vertical-align: middle; padding: 6pt 8pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; width: 35%; mso-border-alt: solid black .75pt;">
              প্রতিষ্ঠানের নাম ও নিরীক্ষা বছর
            </th>
            <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: center; vertical-align: middle; padding: 6pt 5pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; width: 14%; mso-border-alt: solid black .75pt;">
              অনুচ্ছেদ নং
            </th>
            <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: left; vertical-align: middle; padding: 6pt 8pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; width: 41%; mso-border-alt: solid black .75pt;">
              শিরোনাম ও অন্যান্য
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style="page-break-inside: avoid; mso-yfti-irow: 1;">
            <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; font-weight: bold; mso-border-alt: solid black .5pt;">
              ${para.sl}
            </td>
            <td style="border: 1.0pt solid #000000; padding: 6pt 8pt; text-align: left; vertical-align: top; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .5pt; line-height: 1.5; white-space: pre-line;">
              ${para.entityAndAuditYear.replace(/\n/g, "<br/>")}
            </td>
            <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; font-weight: bold; mso-border-alt: solid black .5pt;">
              ${para.paraNo}
            </td>
            <td style="border: 1.0pt solid #000000; padding: 6pt 8pt; text-align: left; vertical-align: top; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .5pt; line-height: 1.5; white-space: pre-line;">
              ${para.titleAndDetails.replace(/\n/g, "<br/>")}
            </td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // Copy Only Tables (MS Word / Excel)
  const handleCopyTableOnly = async () => {
    try {
      const activeTables = paragraphs.filter((p) => p.hasTable && p.tableRows.length > 0);
      if (activeTables.length === 0) {
        alert("কোনো আদায় ছক চালু নেই।");
        return;
      }

      let allTablesHtml = "";
      let allTablesText = "";

      activeTables.forEach((para, idx) => {
        allTablesHtml += `<p><b>অনুচ্ছেদ ${para.paraNo} - আদায়ের বিবরণী ছক:</b></p>${generateWordCompatibleParagraphTableHtml(para)}<br/>`;
        allTablesText += `[অনুচ্ছেদ ${para.paraNo} - আদায়ের বিবরণী ছক]\n` +
          para.tableColumns.map((c) => c.label).join("\t") + "\n" +
          para.tableRows.map((r) => para.tableColumns.map((c) => r.cells[c.id] || "-").join("\t")).join("\n") + "\n\n";
      });

      const richHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <style>
            body { font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', Arial, sans-serif; font-size: 11pt; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          ${allTablesHtml}
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richHtml], { type: "text/html" });
        const blobText = new Blob([allTablesText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(allTablesText);
      }

      setCopiedTableSuccess(true);
      setTimeout(() => setCopiedTableSuccess(false), 3000);
    } catch (err) {
      console.error("Table copy error:", err);
    }
  };

  // Copy Complete Multi-Paragraph Note Sheet (MS Word / Docs)
  const handleCopyNoteSheet = async () => {
    try {
      let fullNoteHtml = "";
      let fullNotePlain = "";

      fullNotePlain += `${diaryHeader}\n\n${tikaIntroHtml.replace(/<[^>]+>/g, "").trim()}\n\n`;

      fullNoteHtml += `
        <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 15pt;">
          ${diaryHeader}
        </div>
        <div style="text-align: justify; font-size: 11pt; line-height: 1.6; margin-bottom: 14pt;">
          ${tikaIntroHtml}
        </div>
      `;

      paragraphs.forEach((para, idx) => {
        // Plain text version
        fullNotePlain += `[আপত্তি পরিচিতি ছক - অনুচ্ছেদ ${para.paraNo}]\n`;
        fullNotePlain += `ক্রমিক নং\tপ্রতিষ্ঠানের নাম ও নিরীক্ষা বছর\tঅনুচ্ছেদ নং\tশিরোনাম ও অন্যান্য\n`;
        fullNotePlain += `${para.sl}\t${para.entityAndAuditYear.replace(/\n/g, " ")}\t${para.paraNo}\t${para.titleAndDetails.replace(/\n/g, " ")}\n\n`;
        fullNotePlain += `স্থানীয় প্রতিষ্ঠানের জবাব: ${para.entityReplyText}\n\n`;

        if (para.hasTable && para.tableRows.length > 0) {
          fullNotePlain += `[আদায়ের বিবরণী ছক]\n`;
          fullNotePlain += para.tableColumns.map((c) => c.label).join("\t") + "\n";
          fullNotePlain += para.tableRows.map((r) => para.tableColumns.map((c) => r.cells[c.id] || "-").join("\t")).join("\n") + "\n";
        }

        fullNotePlain += `${para.branchRequestText}\n\n`;
        fullNotePlain += `প্রধান কার্যালয়ের মন্তব্য: ${para.headOfficeCommentText}\n\n`;
        fullNotePlain += `উপস্থাপনকারীর মন্তব্য: ${para.presenterCommentText}\n\n`;

        // HTML version
        fullNoteHtml += `
          <div style="margin-top: 15pt; margin-bottom: 15pt;">
            ${generateWordCompatibleObjectionRowHtml(para)}
            
            <div style="margin: 10pt 0; text-align: justify; line-height: 1.6;">
              <strong>স্থানীয় প্রতিষ্ঠানের জবাব: </strong><span>${para.entityReplyText}</span>
            </div>

            ${para.hasTable ? generateWordCompatibleParagraphTableHtml(para) : ""}

            <div style="margin: 10pt 0; text-align: justify; line-height: 1.6;">
              ${para.branchRequestText}
            </div>

            <div style="margin: 10pt 0; text-align: justify; line-height: 1.6;">
              <strong>প্রধান কার্যালয়ের মন্তব্য: </strong><span>${para.headOfficeCommentText}</span>
            </div>

            <div style="margin: 10pt 0; text-align: justify; line-height: 1.6; background-color: #f8fafc; padding: 6pt; border: 1pt dashed #cbd5e1;">
              <strong>উপস্থাপনকারীর মন্তব্য: </strong><span>${para.presenterCommentText}</span>
            </div>
          </div>
        `;
      });

      fullNotePlain += `${finalSubmissionText}\n`;
      fullNoteHtml += `
        <div style="text-align: left; font-weight: bold; margin-top: 16pt;">
          ${finalSubmissionText}
        </div>
      `;

      const richHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <style>
            body { font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.6; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          <div style="max-width: 750pt; margin: 0 auto; padding: 20pt;">
            ${fullNoteHtml}
          </div>
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richHtml], { type: "text/html" });
        const blobText = new Blob([fullNotePlain], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(fullNotePlain);
      }

      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3500);
    } catch (err) {
      console.error("Clipboard copy error:", err);
      if (noteDocumentRef.current) {
        navigator.clipboard.writeText(noteDocumentRef.current.innerText);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 3500);
      }
    }
  };

  const handlePrintNoteSheet = () => {
    window.print();
  };

  const handlePrintJaripatra = () => {
    window.print();
  };

  // Cell Text update
  const handleUpdateCellText = (rowId: string, colId: string, text: string) => {
    setJaripatraGridRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || { text: "", colSpan: 1, rowSpan: 1 };
      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            text,
          }
        }
      };
    }));
  };

  // Cell Alignment toggle
  const handleSetCellAlign = (rowId: string, colId: string, align: 'left' | 'center' | 'justify' | 'right') => {
    setJaripatraGridRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || { text: "", colSpan: 1, rowSpan: 1 };
      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            align,
          }
        }
      };
    }));
  };

  // Cell Bold toggle
  const handleToggleCellBold = (rowId: string, colId: string) => {
    setJaripatraGridRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const currentCell = r.cells[colId] || { text: "", colSpan: 1, rowSpan: 1 };
      return {
        ...r,
        cells: {
          ...r.cells,
          [colId]: {
            ...currentCell,
            isBold: !currentCell.isBold,
          }
        }
      };
    }));
  };

  // Add dynamic column
  const handleAddColumn = (targetColIndex?: number, position: 'left' | 'right' = 'right') => {
    const newColId = `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const insertIdx = targetColIndex !== undefined
      ? (position === 'left' ? targetColIndex : targetColIndex + 1)
      : jaripatraColumns.length;

    const newCol: JaripatraColumnItem = {
      id: newColId,
      label: "নতুন কলাম",
      subLabel: `(${toBengaliDigits(insertIdx + 1)})`,
      align: "justify",
      width: "w-[16%]"
    };

    const newCols = [...jaripatraColumns];
    newCols.splice(insertIdx, 0, newCol);
    const updatedCols = newCols.map((c, i) => ({
      ...c,
      subLabel: `(${toBengaliDigits(i + 1)})`
    }));
    setJaripatraColumns(updatedCols);

    setJaripatraGridRows(prev => prev.map(row => ({
      ...row,
      cells: {
        ...row.cells,
        [newColId]: { text: "", align: "justify", colSpan: 1, rowSpan: 1 }
      }
    })));
  };

  // Delete column
  const handleDeleteColumn = (colId: string) => {
    if (jaripatraColumns.length <= 1) return;
    const updatedCols = jaripatraColumns.filter(c => c.id !== colId).map((c, i) => ({
      ...c,
      subLabel: `(${toBengaliDigits(i + 1)})`
    }));
    setJaripatraColumns(updatedCols);

    setJaripatraGridRows(prev => prev.map(row => {
      const copyCells = { ...row.cells };
      delete copyCells[colId];
      // Reset any cell colSpans that might be affected
      (Object.values(copyCells) as JaripatraCellItem[]).forEach(c => {
        if (c.colSpan && c.colSpan > 1) c.colSpan = 1;
      });
      return { ...row, cells: copyCells };
    }));
  };

  // Move column left/right
  const handleMoveColumn = (colIndex: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? colIndex - 1 : colIndex + 1;
    if (targetIdx < 0 || targetIdx >= jaripatraColumns.length) return;

    const updatedCols = [...jaripatraColumns];
    const temp = updatedCols[colIndex];
    updatedCols[colIndex] = updatedCols[targetIdx];
    updatedCols[targetIdx] = temp;

    const reindexedCols = updatedCols.map((c, i) => ({
      ...c,
      subLabel: `(${toBengaliDigits(i + 1)})`
    }));
    setJaripatraColumns(reindexedCols);
  };

  // Update column header label or subLabel
  const handleUpdateColumnHeader = (colId: string, label: string, subLabel?: string) => {
    setJaripatraColumns(prev => prev.map(c => {
      if (c.id !== colId) return c;
      return {
        ...c,
        label,
        ...(subLabel !== undefined ? { subLabel } : {})
      };
    }));
  };

  // Add dynamic row
  const handleAddRow = (targetRowIndex?: number, position: 'above' | 'below' = 'below') => {
    const newRowId = `j-row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const insertIdx = targetRowIndex !== undefined
      ? (position === 'above' ? targetRowIndex : targetRowIndex + 1)
      : jaripatraGridRows.length;

    const newCells: Record<string, JaripatraCellItem> = {};
    jaripatraColumns.forEach((col, cIdx) => {
      let initialText = "";
      let isBold = false;
      let align: 'left' | 'center' | 'justify' | 'right' = col.align || 'left';

      if (cIdx === 0) {
        initialText = toBengaliDigits(insertIdx + 1);
        isBold = true;
        align = "center";
      }

      newCells[col.id] = {
        text: initialText,
        align,
        isBold,
        colSpan: 1,
        rowSpan: 1
      };
    });

    const newRow: JaripatraGridRowItem = {
      id: newRowId,
      cells: newCells
    };

    const nextRows = [...jaripatraGridRows];
    nextRows.splice(insertIdx, 0, newRow);
    setJaripatraGridRows(nextRows);
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    if (jaripatraGridRows.length <= 1) return;
    setJaripatraGridRows(prev => {
      const filtered = prev.filter(r => r.id !== rowId);
      // Reset any broken rowSpans
      filtered.forEach(row => {
        (Object.values(row.cells) as JaripatraCellItem[]).forEach(c => {
          if (c.rowSpan && c.rowSpan > 1) c.rowSpan = 1;
        });
      });
      return filtered;
    });
  };

  // Move row up/down
  const handleMoveRow = (rowIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (targetIdx < 0 || targetIdx >= jaripatraGridRows.length) return;

    const updatedRows = [...jaripatraGridRows];
    const temp = updatedRows[rowIndex];
    updatedRows[rowIndex] = updatedRows[targetIdx];
    updatedRows[targetIdx] = temp;
    setJaripatraGridRows(updatedRows);
  };

  // Auto-number first column
  const handleAutoNumberRows = () => {
    if (jaripatraColumns.length === 0) return;
    const firstColId = jaripatraColumns[0].id;
    setJaripatraGridRows(prev => prev.map((row, idx) => ({
      ...row,
      cells: {
        ...row.cells,
        [firstColId]: {
          ...(row.cells[firstColId] || { align: "center", isBold: true, colSpan: 1, rowSpan: 1 }),
          text: toBengaliDigits(idx + 1)
        }
      }
    })));
  };

  // Merge Cell to Right
  const handleMergeRight = (rowIndex: number, colIndex: number) => {
    setJaripatraGridRows(prev => {
      const nextRows = JSON.parse(JSON.stringify(prev)) as JaripatraGridRowItem[];
      const row = nextRows[rowIndex];
      if (!row) return prev;

      const currentCol = jaripatraColumns[colIndex];
      if (!currentCol) return prev;

      const currentCell = row.cells[currentCol.id] || { text: "", colSpan: 1, rowSpan: 1 };
      const currentSpan = currentCell.colSpan || 1;
      const nextColIdx = colIndex + currentSpan;

      if (nextColIdx >= jaripatraColumns.length) return prev;

      const nextCol = jaripatraColumns[nextColIdx];
      const nextCell = row.cells[nextCol.id] || { text: "", colSpan: 1, rowSpan: 1 };

      currentCell.colSpan = currentSpan + (nextCell.colSpan || 1);
      if (nextCell.text && nextCell.text.trim()) {
        currentCell.text = currentCell.text ? `${currentCell.text} ${nextCell.text}` : nextCell.text;
      }
      nextCell.isHidden = true;
      nextCell.colSpan = 1;
      row.cells[currentCol.id] = currentCell;
      row.cells[nextCol.id] = nextCell;

      return nextRows;
    });
  };

  // Merge Cell Down
  const handleMergeDown = (rowIndex: number, colIndex: number) => {
    setJaripatraGridRows(prev => {
      const nextRows = JSON.parse(JSON.stringify(prev)) as JaripatraGridRowItem[];
      const row = nextRows[rowIndex];
      if (!row) return prev;

      const currentCol = jaripatraColumns[colIndex];
      if (!currentCol) return prev;

      const currentCell = row.cells[currentCol.id] || { text: "", colSpan: 1, rowSpan: 1 };
      const currentRowSpan = currentCell.rowSpan || 1;
      const belowRowIdx = rowIndex + currentRowSpan;

      if (belowRowIdx >= nextRows.length) return prev;

      const belowRow = nextRows[belowRowIdx];
      const belowCell = belowRow.cells[currentCol.id] || { text: "", colSpan: 1, rowSpan: 1 };

      currentCell.rowSpan = currentRowSpan + (belowCell.rowSpan || 1);
      if (belowCell.text && belowCell.text.trim()) {
        currentCell.text = currentCell.text ? `${currentCell.text}\n${belowCell.text}` : belowCell.text;
      }
      belowCell.isHidden = true;
      belowCell.rowSpan = 1;
      row.cells[currentCol.id] = currentCell;
      belowRow.cells[currentCol.id] = belowCell;

      return nextRows;
    });
  };

  // Unmerge Cell
  const handleUnmergeCell = (rowIndex: number, colIndex: number) => {
    setJaripatraGridRows(prev => {
      const nextRows = JSON.parse(JSON.stringify(prev)) as JaripatraGridRowItem[];
      const row = nextRows[rowIndex];
      if (!row) return prev;

      const currentCol = jaripatraColumns[colIndex];
      if (!currentCol) return prev;

      const currentCell = row.cells[currentCol.id];
      if (!currentCell) return prev;

      const cSpan = currentCell.colSpan || 1;
      const rSpan = currentCell.rowSpan || 1;

      currentCell.colSpan = 1;
      currentCell.rowSpan = 1;

      for (let r = rowIndex; r < rowIndex + rSpan && r < nextRows.length; r++) {
        for (let c = colIndex; c < colIndex + cSpan && c < jaripatraColumns.length; c++) {
          const colId = jaripatraColumns[c].id;
          if (nextRows[r].cells[colId]) {
            nextRows[r].cells[colId].isHidden = false;
            nextRows[r].cells[colId].colSpan = 1;
            nextRows[r].cells[colId].rowSpan = 1;
          }
        }
      }

      return nextRows;
    });
  };

  const handleAddOnulipiItem = () => {
    const newIdx = jaripatraOnulipiItems.length + 1;
    setJaripatraOnulipiItems(prev => [...prev, `${toBengaliDigits(newIdx)}. নতুন অনুলিপি প্রাপকের নাম ও ঠিকানা।`]);
  };

  const handleUpdateOnulipiItem = (idx: number, val: string) => {
    setJaripatraOnulipiItems(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleDeleteOnulipiItem = (idx: number) => {
    if (jaripatraOnulipiItems.length <= 1) return;
    setJaripatraOnulipiItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleResetJaripatraToDemo = () => {
    setJaripatraHeaderLine1("মহাপরিচালকের কার্যালয়");
    setJaripatraHeaderLine2("বাণিজ্যিক অডিট অধিদপ্তর");
    setJaripatraHeaderLine3("আঞ্চলিক কার্যালয় (সেক্টর-৬)");
    setJaripatraHeaderLine4("বিডিবিএল ভবন (৯ম ও ১০ম তলা)");
    setJaripatraHeaderLine5("খুলনা – ৯০০০");

    setJaripatraMemoNo("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
    setJaripatraDate(getTodayBengaliDateFormatted());

    setJaripatraRecipientDesignation("ব্যবস্থাপনা পরিচালক");
    setJaripatraRecipientEntity(entry.entityName || "সোনালী ব্যাংক পিএলসি");
    setJaripatraRecipientAddress("প্রধান কার্যালয়, ৩৫-৪২, ৪৪ মতিঝিল বা/এ");
    setJaripatraRecipientCity("ঢাকা – ১০০০");

    setJaripatraSubject(`বিষয়: ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা'} এর ${entry.auditYear || "২০১১-১৪"} সালের বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ১০ এর জবাবের উপর মন্তব্য প্রেরণ।`);
    setJaripatraReference(`সূত্র: ${entry.entityName || "সোনালী ব্যাংক পিএলসি"} এর পত্র নং ${entry.letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২"}, তারিখ: ${entry.letterDate ? formatDateBN(entry.letterDate) : "২৭/০৭/২০২৬"}`);
    setJaripatraIntroText(`উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}${entry.branchName ? `, ${entry.branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা'} এর ${entry.auditYear || "২০১১-২০১৪"} সালের নিরীক্ষা প্রতিবেদনের ${entry.paraType || "নন-এসএফআই"} অনুচ্ছেদ নং ১০ এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:`);

    setJaripatraColumns(DEFAULT_JARIPATRA_COLUMNS);
    setJaripatraGridRows([
      {
        id: "j-row-demo-1",
        cells: {
          col_1: { text: "১", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_2: { text: "১০, ২০১১-১৪", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_3: { text: "সোনালী ব্যাংক পিএলসি, দর্শনা শাখা, চুয়াডাঙ্গা।", align: "justify", colSpan: 1, rowSpan: 1 },
          col_4: { text: "মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ী ৫৭,৮২৫ টাকা।", align: "justify", colSpan: 1, rowSpan: 1 },
          col_5: { text: "৫৭,৮২৫", align: "center", isBold: true, colSpan: 1, rowSpan: 1 },
          col_6: { text: "আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।", align: "justify", colSpan: 1, rowSpan: 1 }
        }
      }
    ]);

    setJaripatraSignatoryName("নাসিফ কবির");
    setJaripatraSignatoryTitle("উপ-পরিচালক");
    setJaripatraSignatoryPhone("ফোন: ০২৪৭৭৭২২৬৫৬");

    setJaripatraBottomMemoNo("৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬");
    setJaripatraBottomDate(getTodayBengaliDateFormatted());

    setJaripatraOnulipiHeader("সদয় অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য অনুলিপি প্রেরণ করা হলো: (জ্যেষ্ঠতার ভিত্তিতে নয়)");
    setJaripatraOnulipiItems([
      `১. উপমহাব্যবস্থাপক, ${entry.entityName || "সোনালী ব্যাংক পিএলসি"}, জিএম অফিস, খুলনা। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)`,
      "২. পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কাযায়, অডিট কমপ্লেক্স (৮ম ও ৯ ম তলা), সেগুনবাগিচা, ঢাকা।",
      "৩. অফিস কপি।"
    ]);
  };

  const handleCopyJaripatraWord = async () => {
    try {
      const tableHeadersHtml = jaripatraColumns.map(col => `
        <th style="border: 1.0pt solid #000000; padding: 6pt; text-align: center; font-weight: bold;">${col.label}</th>
      `).join("");

      const tableSubHeadersHtml = jaripatraColumns.map(col => `
        <th style="border: 1.0pt solid #000000; padding: 3pt; text-align: center; font-size: 9.5pt; font-weight: bold;">${col.subLabel}</th>
      `).join("");

      const tableRowsHtml = jaripatraGridRows.map((row) => {
        const rowCellsHtml = jaripatraColumns.map((col) => {
          const cell = row.cells[col.id];
          if (!cell || cell.isHidden) return "";
          const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : "";
          const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : "";
          const align = cell.align || col.align || "left";
          const weight = cell.isBold ? "font-weight: bold;" : "";
          return `<td${colSpanAttr}${rowSpanAttr} style="border: 1.0pt solid #000000; padding: 5pt; text-align: ${align}; vertical-align: top; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', Arial, sans-serif; font-size: 10pt; line-height: 1.5; ${weight}">${(cell.text || '').replace(/\n/g, '<br/>')}</td>`;
        }).join("");

        return `<tr style="page-break-inside: avoid;">${rowCellsHtml}</tr>`;
      }).join("");

      const onulipiHtml = jaripatraOnulipiItems.map(item => `<p style="margin: 3pt 0; line-height: 1.4;">${item}</p>`).join("");

      const richJaripatraHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <style>
            body { font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.5; }
            table { border-collapse: collapse; width: 100%; border: 1.0pt solid #000000; }
            th, td { border: 1.0pt solid #000000; padding: 5pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', Arial, sans-serif; font-size: 10pt; }
          </style>
        </head>
        <body>
          <div style="text-align: center; line-height: 1.3; margin-bottom: 12pt;">
            <p style="margin: 0; font-size: 12pt; font-weight: bold;">${jaripatraHeaderLine1}</p>
            <p style="margin: 0; font-size: 11pt; font-weight: bold;">${jaripatraHeaderLine2}</p>
            <p style="margin: 0; font-size: 10.5pt;">${jaripatraHeaderLine3}</p>
            <p style="margin: 0; font-size: 10.5pt;">${jaripatraHeaderLine4}</p>
            <p style="margin: 0; font-size: 10.5pt;">${jaripatraHeaderLine5}</p>
          </div>

          <table style="width: 100%; border: none; margin-bottom: 10pt;">
            <tr>
              <td style="border: none; text-align: left; font-weight: bold;">নং- ${jaripatraMemoNo}</td>
              <td style="border: none; text-align: right; font-weight: bold;">তারিখ: ${jaripatraDate}</td>
            </tr>
          </table>

          <div style="margin-bottom: 10pt; line-height: 1.4;">
            <p style="margin: 0; font-weight: bold;">${jaripatraRecipientDesignation}</p>
            <p style="margin: 0; font-weight: bold;">${jaripatraRecipientEntity}</p>
            <p style="margin: 0;">${jaripatraRecipientAddress}</p>
            <p style="margin: 0;">${jaripatraRecipientCity}</p>
          </div>

          <p style="margin: 8pt 0; font-weight: bold; line-height: 1.5;">${jaripatraSubject}</p>
          <p style="margin: 8pt 0; font-weight: bold; line-height: 1.5;">${jaripatraReference}</p>
          <p style="margin: 10pt 0; text-align: justify; line-height: 1.6;">${jaripatraIntroText}</p>

          <table border="1" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1.0pt solid #000000; margin: 10pt 0;">
            <thead>
              <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center;">
                ${tableHeadersHtml}
              </tr>
              <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center; font-size: 9.5pt;">
                ${tableSubHeadersHtml}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <table style="width: 100%; border: none; margin-top: 25pt;">
            <tr>
              <td style="border: none; width: 60%;"></td>
              <td style="border: none; width: 40%; text-align: center; line-height: 1.3;">
                <p style="margin: 0; font-weight: bold;">${jaripatraSignatoryName}</p>
                <p style="margin: 0;">${jaripatraSignatoryTitle}</p>
                <p style="margin: 0;">${jaripatraSignatoryPhone}</p>
              </td>
            </tr>
          </table>

          <table style="width: 100%; border: none; margin-top: 15pt;">
            <tr>
              <td style="border: none; text-align: left; font-weight: bold;">নং- ${jaripatraBottomMemoNo}</td>
              <td style="border: none; text-align: right; font-weight: bold;">তারিখ: ${jaripatraBottomDate}</td>
            </tr>
          </table>

          <div style="margin-top: 10pt; line-height: 1.4;">
            <p style="margin: 0 0 4pt 0; font-weight: bold; text-decoration: underline;">${jaripatraOnulipiHeader}</p>
            ${onulipiHtml}
          </div>
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richJaripatraHtml], { type: "text/html" });
        const plainText = `${jaripatraHeaderLine1}\n${jaripatraHeaderLine2}\n${jaripatraHeaderLine3}\n${jaripatraHeaderLine4}\n${jaripatraHeaderLine5}\n\nনং- ${jaripatraMemoNo}    তারিখ: ${jaripatraDate}\n\n${jaripatraRecipientDesignation}\n${jaripatraRecipientEntity}\n${jaripatraRecipientAddress}\n${jaripatraRecipientCity}\n\n${jaripatraSubject}\n${jaripatraReference}\n\n${jaripatraIntroText}\n\n[ছক]\n\n${jaripatraSignatoryName}\n${jaripatraSignatoryTitle}\n${jaripatraSignatoryPhone}\n\nনং- ${jaripatraBottomMemoNo}    তারিখ: ${jaripatraBottomDate}\n\n${jaripatraOnulipiHeader}\n${jaripatraOnulipiItems.join('\n')}`;
        const blobText = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(richJaripatraHtml);
      }

      setJaripatraCopiedSuccess(true);
      setTimeout(() => setJaripatraCopiedSuccess(false), 3500);
    } catch (err) {
      console.error("Jaripatra copy error:", err);
    }
  };

  const handleSaveJaripatra = () => {
    if (onSaveJaripatra) {
      onSaveJaripatra(entry, { 
        memoNo: jaripatraMemoNo, 
        date: jaripatraDate,
        columns: jaripatraColumns,
        gridRows: jaripatraGridRows,
        subject: jaripatraSubject,
        reference: jaripatraReference,
        onulipi: jaripatraOnulipiItems,
      });
    }
    setIsJaripatraEditable(false);
    setJaripatraSavedSuccess(true);
    setTimeout(() => setJaripatraSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-20 animate-in fade-in duration-300">
      {showJaripatraView ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Jaripatra Top Action Header Bar - Sticky Top, Compact, Rounded-none, Rectangular */}
          <div className="sticky top-0 z-40 bg-slate-900 text-white rounded-none border border-slate-700 shadow-md px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-none bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Flame size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white leading-tight">সরকারি জারিপত্র (অফিসিয়াল ফরম্যাট)</h3>
                  <p className="text-[10px] font-bold text-slate-300 hidden md:block leading-none">বাণিজ্যিক অডিট অধিদপ্তরের নির্ধারিত ৬ কলাম ছক ও কাঠামো অনুযায়ী</p>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleResetJaripatraToDemo}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-none text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="নমুনা জারিপত্র ফরম্যাটে রিসেট করুন"
              >
                <RotateCcw size={12} /> নমুনা ফরম্যাট লোড
              </button>
              <button
                type="button"
                onClick={handleCopyJaripatraWord}
                className={`px-2.5 py-1 rounded-none text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  jaripatraCopiedSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title="MS Word বা নথিতে সরাসরি পেস্ট করার জন্য ফরম্যাটসহ কপি করুন"
              >
                {jaripatraCopiedSuccess ? <Check size={12} /> : <Copy size={12} />}
                {jaripatraCopiedSuccess ? "ওয়ার্ডে কপি হয়েছে!" : "ওয়ার্ডে কপি করুন"}
              </button>
              <button
                type="button"
                onClick={handlePrintJaripatra}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-none text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
              >
                <Printer size={12} /> প্রিন্ট
              </button>
              {isJaripatraEditable ? (
                <button
                  type="button"
                  onClick={handleSaveJaripatra}
                  className={`px-3 py-1 rounded-none text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all ${
                    jaripatraSavedSuccess
                      ? "bg-emerald-700 ring-2 ring-emerald-400 font-black text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  title="জারিপত্র তথ্য সংরক্ষণ করুন ও ভিউ মোডে রাখুন"
                >
                  <CheckCircle2 size={13} />
                  <span>{jaripatraSavedSuccess ? "সংরক্ষিত হয়েছে!" : "সংরক্ষণ"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsJaripatraEditable(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                  title="জারিপত্র তথ্য এডিট করুন"
                >
                  <Edit3 size={13} />
                  <span>এডিট করুন</span>
                </button>
              )}
            </div>
          </div>

          {/* Printable Official Government Letter Sheet - Reduced side padding by more than half */}
          <div className="bg-white rounded-none border border-slate-300 shadow-md px-4 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10 text-black font-bengali text-xs sm:text-[13px] leading-relaxed space-y-4 print:p-0 print:m-0 print:border-none print:shadow-none">
            <div 
              id="official-jaripatra-container" 
              className="space-y-4 w-full"
              style={{ fontFamily: "'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', Arial, sans-serif" }}
            >
              {/* 1. Header (5 Centered Lines) */}
              <div className="text-center space-y-0.5 pb-2">
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-center font-bold text-sm sm:text-base text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraHeaderLine1}
                  onChange={(e) => setJaripatraHeaderLine1(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-center font-bold text-xs sm:text-sm text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraHeaderLine2}
                  onChange={(e) => setJaripatraHeaderLine2(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-center text-xs sm:text-[13px] text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraHeaderLine3}
                  onChange={(e) => setJaripatraHeaderLine3(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-center text-xs sm:text-[13px] text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraHeaderLine4}
                  onChange={(e) => setJaripatraHeaderLine4(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-center text-xs sm:text-[13px] text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraHeaderLine5}
                  onChange={(e) => setJaripatraHeaderLine5(e.target.value)}
                />
              </div>

              {/* 2. Memo No & Date Row */}
              <div className="flex items-baseline justify-between pt-2 text-xs sm:text-[13px] font-bold">
                <div className="flex items-center gap-1 flex-1 max-w-[55%] sm:max-w-[60%]">
                  <span>নং-</span>
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`font-bold text-black bg-transparent outline-none w-full ${
                      isJaripatraEditable
                        ? "border-b border-dashed border-slate-400 focus:border-blue-600"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraMemoNo}
                    onChange={(e) => setJaripatraMemoNo(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 w-60 sm:w-72 pl-2">
                  <span>তারিখ:</span>
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`font-bold text-black bg-transparent outline-none flex-1 text-left ${
                      isJaripatraEditable
                        ? "border-b border-dashed border-slate-400 focus:border-blue-600"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraDate}
                    onChange={(e) => setJaripatraDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Recipient (Prápak) */}
              <div className="space-y-0.5 pt-2 text-xs sm:text-[13px]">
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full font-bold text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraRecipientDesignation}
                  onChange={(e) => setJaripatraRecipientDesignation(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full font-bold text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraRecipientEntity}
                  onChange={(e) => setJaripatraRecipientEntity(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraRecipientAddress}
                  onChange={(e) => setJaripatraRecipientAddress(e.target.value)}
                />
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraRecipientCity}
                  onChange={(e) => setJaripatraRecipientCity(e.target.value)}
                />
              </div>

              {/* 4. Subject & Reference */}
              <div className="space-y-1.5 pt-2 text-xs sm:text-[13px]">
                <textarea
                  rows={2}
                  readOnly={!isJaripatraEditable}
                  className={`w-full font-bold text-black underline bg-transparent p-1 outline-none resize-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden leading-normal ${
                    isJaripatraEditable
                      ? "border border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraSubject}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${t.scrollHeight}px`;
                  }}
                  onChange={(e) => setJaripatraSubject(e.target.value)}
                />
                <textarea
                  rows={2}
                  readOnly={!isJaripatraEditable}
                  className={`w-full font-bold text-black bg-transparent p-1 outline-none resize-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden leading-normal ${
                    isJaripatraEditable
                      ? "border border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraReference}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${t.scrollHeight}px`;
                  }}
                  onChange={(e) => setJaripatraReference(e.target.value)}
                />
              </div>

              {/* 5. Intro Narrative */}
              <div className="pt-1 text-xs sm:text-[13px] text-justify">
                <textarea
                  rows={3}
                  readOnly={!isJaripatraEditable}
                  className={`w-full text-black bg-transparent p-1 outline-none resize-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden leading-relaxed text-justify ${
                    isJaripatraEditable
                      ? "border border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraIntroText}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${t.scrollHeight}px`;
                  }}
                  onChange={(e) => setJaripatraIntroText(e.target.value)}
                />
              </div>

              {/* 6. Dynamic Table - Official 6-Column Government Settlement Table (Clean & Print-Ready) */}
              <div className="pt-2 space-y-2">
                {/* Main Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-2 border-black text-xs sm:text-[12px]">
                    <thead>
                      {/* Column Header Titles */}
                      <tr className="bg-slate-100 font-bold border-b border-black text-center">
                        {jaripatraColumns.map((col) => (
                          <th
                            key={col.id}
                            className={`border border-black p-2 text-center text-black font-bold ${col.width || ''}`}
                          >
                            <input
                              type="text"
                              readOnly={!isJaripatraEditable}
                              className={`w-full text-center font-bold text-black bg-transparent outline-none ${
                                isJaripatraEditable
                                  ? "hover:bg-slate-200/70 focus:bg-blue-50 focus:border-b focus:border-blue-500"
                                  : "cursor-default select-text"
                              }`}
                              value={col.label}
                              onChange={(e) => handleUpdateColumnHeader(col.id, e.target.value, col.subLabel)}
                            />
                          </th>
                        ))}
                      </tr>

                      {/* Column Sub-Header Numbers e.g. (১), (২) */}
                      <tr className="bg-slate-50 font-bold border-b border-black text-center text-[11px]">
                        {jaripatraColumns.map((col) => (
                          <th key={`sub-${col.id}`} className="border border-black p-1 text-center text-black">
                            <input
                              type="text"
                              readOnly={!isJaripatraEditable}
                              className={`w-full text-center font-bold text-black bg-transparent outline-none ${
                                isJaripatraEditable
                                  ? "hover:bg-slate-200 focus:bg-blue-50"
                                  : "cursor-default select-text"
                              }`}
                              value={col.subLabel}
                              onChange={(e) => handleUpdateColumnHeader(col.id, col.label, e.target.value)}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {(jaripatraGridRows.filter(row => jaripatraColumns.some(col => (row.cells[col.id]?.text || '').trim() !== '')).length > 0 
                        ? jaripatraGridRows.filter(row => jaripatraColumns.some(col => (row.cells[col.id]?.text || '').trim() !== '')) 
                        : jaripatraGridRows.slice(0, 1)
                      ).map((row) => (
                        <tr key={row.id} className="align-top hover:bg-slate-50/40">
                          {jaripatraColumns.map((col, cIdx) => {
                            const cell = row.cells[col.id];
                            if (!cell || cell.isHidden) return null;

                            const alignClass =
                              cell.align === 'center'
                                ? 'text-center'
                                : cell.align === 'justify'
                                ? 'text-justify'
                                : cell.align === 'right'
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : col.align === 'justify'
                                ? 'text-justify'
                                : 'text-left';

                            const isSerialCol = cIdx === 0 && jaripatraColumns.length > 1;

                            return (
                              <td
                                key={`${row.id}-${col.id}`}
                                colSpan={cell.colSpan || 1}
                                rowSpan={cell.rowSpan || 1}
                                className="border border-black p-1.5 sm:p-2 align-top text-black"
                              >
                                <textarea
                                  rows={
                                    isSerialCol
                                      ? 1
                                      : Math.max(
                                          1,
                                          Math.ceil(((cell.text || '').length || 1) / (cell.colSpan && cell.colSpan > 1 ? 45 : 28)),
                                          (cell.text || '').split('\n').length
                                        )
                                  }
                                  readOnly={!isJaripatraEditable}
                                  className={`w-full bg-transparent outline-none text-black resize-none overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden leading-normal ${alignClass} ${
                                    cell.isBold ? "font-bold" : "font-normal"
                                  } ${
                                    isJaripatraEditable
                                      ? "hover:bg-slate-100/60 focus:bg-blue-50/50"
                                      : "cursor-default select-text"
                                  }`}
                                  value={cell.text || ""}
                                  onInput={(e) => {
                                    const t = e.currentTarget;
                                    t.style.height = "auto";
                                    t.style.height = `${t.scrollHeight}px`;
                                  }}
                                  onChange={(e) => handleUpdateCellText(row.id, col.id, e.target.value)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7. Signatory Block (Right Aligned) */}
              <div className="pt-4 sm:pt-6 flex justify-end">
                <div className="text-center space-y-0.5 w-60 sm:w-64">
                  <div className="w-40 border-b border-black mx-auto mb-2" />
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`w-full text-center font-bold text-black bg-transparent outline-none ${
                      isJaripatraEditable
                        ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraSignatoryName}
                    onChange={(e) => setJaripatraSignatoryName(e.target.value)}
                  />
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`w-full text-center text-xs text-black bg-transparent outline-none ${
                      isJaripatraEditable
                        ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraSignatoryTitle}
                    onChange={(e) => setJaripatraSignatoryTitle(e.target.value)}
                  />
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`w-full text-center text-xs text-black bg-transparent outline-none ${
                      isJaripatraEditable
                        ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraSignatoryPhone}
                    onChange={(e) => setJaripatraSignatoryPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* 8. Bottom Memo No & Date Row */}
              <div className="flex items-baseline justify-between pt-4 text-xs sm:text-[13px] font-bold">
                <div className="flex items-center gap-1 flex-1 max-w-[55%] sm:max-w-[60%]">
                  <span>নং-</span>
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`font-bold text-black bg-transparent outline-none w-full ${
                      isJaripatraEditable
                        ? "border-b border-dashed border-slate-400 focus:border-blue-600"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraBottomMemoNo}
                    onChange={(e) => setJaripatraBottomMemoNo(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1 w-60 sm:w-72 pl-2">
                  <span>তারিখ:</span>
                  <input
                    type="text"
                    readOnly={!isJaripatraEditable}
                    className={`font-bold text-black bg-transparent outline-none flex-1 text-left ${
                      isJaripatraEditable
                        ? "border-b border-dashed border-slate-400 focus:border-blue-600"
                        : "border-none cursor-default select-text"
                    }`}
                    value={jaripatraBottomDate}
                    onChange={(e) => setJaripatraBottomDate(e.target.value)}
                  />
                </div>
              </div>

              {/* 9. Onulipi Section */}
              <div className="pt-2 text-xs sm:text-[13px] space-y-1">
                <input
                  type="text"
                  readOnly={!isJaripatraEditable}
                  className={`w-full font-bold underline text-black bg-transparent outline-none ${
                    isJaripatraEditable
                      ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                      : "border-none cursor-default select-text"
                  }`}
                  value={jaripatraOnulipiHeader}
                  onChange={(e) => setJaripatraOnulipiHeader(e.target.value)}
                />

                <div className="space-y-1 pt-1">
                  {jaripatraOnulipiItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <input
                        type="text"
                        readOnly={!isJaripatraEditable}
                        className={`w-full text-black bg-transparent outline-none ${
                          isJaripatraEditable
                            ? "border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                            : "border-none cursor-default select-text"
                        }`}
                        value={item}
                        onChange={(e) => handleUpdateOnulipiItem(idx, e.target.value)}
                      />
                      {isJaripatraEditable && jaripatraOnulipiItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOnulipiItem(idx)}
                          className="no-print opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 cursor-pointer transition-opacity"
                          title="মুছুন"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isJaripatraEditable && (
                  <div className="pt-1 no-print">
                    <button
                      type="button"
                      onClick={handleAddOnulipiItem}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> + নতুন অনুলিপি প্রাপক যোগ করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="ফিরে যান"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <span>নথি ও নোট শিট ব্যবস্থাপনা (বহু-অনুচ্ছেদ বিশিষ্ট)</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10.5px] font-black">
                {entry.diaryNo ? `ডায়েরি নং: ${toBengaliDigits(entry.diaryNo)}` : 'চিঠিপত্র মডিউল'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-bold">
              {entry.entityName || 'প্রতিষ্ঠান'} | {entry.branchName || ' শাখা'} | {entry.auditYear || 'নিরীক্ষা বছর'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyNoteSheet}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              copiedSuccess
                ? "bg-emerald-600 text-white shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-200"
            }`}
            title="সম্পূর্ণ নোট শিট ক্লিপবোর্ডে কপি করুন (MS Word বা অন্য যেকোনো জায়গায় সরাসরি পেস্ট করা যাবে)"
          >
            {copiedSuccess ? (
              <>
                <Check size={14} /> সম্পূর্ণ নোট শিট কপি হয়েছে!
              </>
            ) : (
              <>
                <Copy size={14} /> সম্পূর্ণ নোট শিট কপি করুন
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowJaripatraView(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="সরকারি জারিপত্রের নির্ধারিত ছক ও ফরম্যাট দেখুন ও প্রিন্ট করুন"
          >
            <Flame size={14} /> সরকারি জারিপত্র
          </button>
        </div>
      </div>

      {/* Metadata Quick Glance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building size={15} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400">প্রতিষ্ঠান ও শাখা</p>
            <p className="text-xs font-black text-slate-800 truncate">{entry.entityName || '-'}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Hash size={15} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400">স্মারক নং ও ডায়েরি নং</p>
            <p className="text-xs font-black text-slate-800 truncate">{entry.letterNo || '-'}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Calendar size={15} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400">নিরীক্ষা বছর</p>
            <p className="text-xs font-black text-slate-800 truncate">{entry.auditYear || '-'}</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Coins size={15} />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-slate-400">মোট অনুচ্ছেদ</p>
            <p className="text-xs font-black text-slate-800 truncate">{toBengaliDigits(paragraphs.length)} টি অনুচ্ছেদ</p>
          </div>
        </div>
      </div>

      {/* AI Success Toast Banner */}
      {aiSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-none shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 no-print border-2 border-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-100" />
            <span className="text-xs sm:text-sm font-black">{aiSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiSuccessToast(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: AI Analysis & Soft Copy Upload Controller */}
      <div className="bg-white rounded-none border-2 border-slate-300 shadow-sm p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-indigo-600 text-white flex items-center justify-center font-black">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>১. অডিট নথি ও জবাব সংযুক্তি (AI Smart Validation & Multi-Paragraph Analysis)</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black border border-indigo-300">
                  অটো-যাচাই ও পেস্ট সক্রিয়
                </span>
              </h2>
              <p className="text-[10.5px] text-slate-500 font-bold">
                এআই প্রথমে অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান যাচাই করবে; সঠিক হলে সরাসরি সংশ্লিষ্ট ঘরে লেখাগুলো পেস্ট করে দেবে
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-none text-xs font-black flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 border border-indigo-700"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{aiAnalysisStep || "যাচাইকরণ চলছে..."}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} /> খসড়া তৈরি করুন
              </>
            )}
          </button>
        </div>

        {/* Upload Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box A: Original Objection */}
          <div className="p-3.5 bg-blue-50/40 rounded-2xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <FileText size={13} className="text-blue-600" /> ক. মূল অডিট আপত্তি / অনুচ্ছেদসমূহ
              </span>
              <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-[10.5px] font-black border border-blue-200 shadow-2xs flex items-center gap-1">
                <Upload size={11} /> {objectionFile ? "ফাইল পরিবর্তন" : "সফটকপি আপলোড"}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,image/*" onChange={(e) => handleFileUpload(e, "objection")} />
              </label>
            </div>
            {objectionFile && (
              <div className="px-2 py-1 bg-blue-100/70 text-blue-900 rounded-md text-[10px] font-bold flex items-center justify-between">
                <span className="truncate">সংযুক্ত: {objectionFile.name}</span>
                <button type="button" onClick={() => setObjectionFile(null)} className="text-rose-500 hover:text-rose-700">
                  <Trash2 size={11} />
                </button>
              </div>
            )}
            <textarea
              rows={2}
              placeholder="অথবা মূল আপত্তির অনুচ্ছেদসমূহ এখানে লিখুন বা পেস্ট করুন..."
              className="w-full p-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
              value={objectionText}
              onChange={(e) => setObjectionText(e.target.value)}
            />
          </div>

          {/* Box B: Entity Reply */}
          <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-600" /> খ. প্রতিষ্ঠানের জবাব ও চালানের প্রমাণক
              </span>
              <label className="cursor-pointer px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg text-[10.5px] font-black border border-emerald-200 shadow-2xs flex items-center gap-1">
                <Upload size={11} /> {replyFile ? "ফাইল পরিবর্তন" : "সফটকপি আপলোড"}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,image/*" onChange={(e) => handleFileUpload(e, "reply")} />
              </label>
            </div>
            {replyFile && (
              <div className="px-2 py-1 bg-emerald-100/70 text-emerald-900 rounded-md text-[10px] font-bold flex items-center justify-between">
                <span className="truncate">সংযুক্ত: {replyFile.name}</span>
                <button type="button" onClick={() => setReplyFile(null)} className="text-rose-500 hover:text-rose-700">
                  <Trash2 size={11} />
                </button>
              </div>
            )}
            <textarea
              rows={2}
              placeholder="অথবা প্রতিষ্ঠানের জবাব ও চালানের বিবরণ এখানে সরাসরি পেস্ট করুন..."
              className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        </div>

        {/* Interactive Human-In-The-Loop Clarification Box */}
        {needsClarification && clarificationQuestions.length > 0 && (
          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
              <AlertTriangle size={15} className="text-amber-600 animate-bounce" />
              <span>এআই পর্যবেক্ষণ: কিছু তথ্য অস্পষ্ট থাকায় আপনার স্পষ্টীকরণ প্রয়োজন:</span>
            </div>

            <div className="space-y-2">
              {clarificationQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200 space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {toBengaliDigits(idx + 1)}. {q}
                  </p>
                  <input
                    type="text"
                    placeholder="আপনার স্পষ্টীকরণ লিখুন..."
                    className="w-full h-7 px-2.5 bg-amber-50/40 border border-amber-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-400"
                    value={userClarificationAnswers[idx] || ""}
                    onChange={(e) =>
                      setUserClarificationAnswers({
                        ...userClarificationAnswers,
                        [idx]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNeedsClarification(false);
                  handleRunAiAnalysis();
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                স্পষ্টীকরণ জমা দিয়ে পুনরায় ড্রাফট করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Formatting and Action Toolbar - Strictly Rectangular & Opaque Fixed at top-0 */}
      <div className="sticky top-0 z-30 px-4 py-2.5 bg-slate-900 text-white rounded-none shadow-md flex flex-wrap items-center justify-between gap-2 no-print border-b-2 border-slate-700 w-full">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-800 rounded-none p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Strikethrough"
            >
              <Strikethrough size={13} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          <div className="flex items-center bg-slate-800 rounded-none p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => executeCommand("justifyLeft")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyCenter")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyRight")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyFull")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-none transition-colors"
              title="Justify"
            >
              <AlignJustify size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTableOnly}
            className={`px-3 py-1.5 rounded-none text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              copiedTableSuccess
                ? "bg-teal-600 text-white"
                : "bg-teal-800/90 hover:bg-teal-700 text-teal-100 border border-teal-600"
            }`}
            title="সবগুলো আদায় ছক ওয়ার্ড/এক্সেলে পেস্ট করার উপযোগী করে কপি করুন"
          >
            {copiedTableSuccess ? <Check size={12} className="text-white" /> : <Table size={12} />}
            <span>{copiedTableSuccess ? "ছক কপি হয়েছে!" : "ছক কপি (Word)"}</span>
          </button>
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold">মার্কার:</span>
            {["#ecfdf5", "#fef3c7", "#fee2e2", "#e0e7ff"].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedCellColor(color)}
                className={`w-4 h-4 rounded-none border ${selectedCellColor === color ? "ring-2 ring-white scale-110" : "border-slate-600"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE OFFICIAL GOVERNMENT NOTE SHEET DOCUMENT (চারকোনা ও নিখুঁত সরকারি বিন্যাস) */}
      {/* ========================================================================= */}
      <div
        id="document-notesheet-content"
        ref={noteDocumentRef}
        className="bg-white rounded-none border-2 border-slate-400 shadow-md p-8 sm:p-14 text-slate-900 font-bengali space-y-7 print:p-0 print:m-0 print:border-none print:shadow-none scroll-mt-16"
      >
        {/* 1. Official Diary Header Exactly at the Top Center */}
        <div className="text-center pb-4 border-b border-slate-300">
          <div className="inline-block px-6 py-2 bg-slate-50 border border-slate-400 rounded-none shadow-2xs print:border-none print:bg-transparent max-w-full">
            <input
              type="text"
              className="text-center text-sm sm:text-base font-black text-slate-900 bg-transparent outline-none w-auto min-w-[340px] sm:min-w-[480px] max-w-full tracking-wide border-b border-transparent focus:border-blue-500"
              value={diaryHeader}
              onChange={(e) => setDiaryHeader(e.target.value)}
              title="ডায়েরি নং ও তারিখ"
            />
          </div>
        </div>

        {/* 2. Main Note Body: Toka No. 11 & Official Introduction */}
        <div className="space-y-3">
          <div
            ref={tikaEditorRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setTikaIntroHtml(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: tikaIntroHtml }}
            className="p-3 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-none text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-all font-bengali"
          />
        </div>

        {/* 3. MULTI-PARAGRAPH RENDER LOOP: প্রতিটি অনুচ্ছেদের জন্য পৃথক ছক, জবাব, টেবিল ও মন্তব্য */}
        <div className="space-y-10">
          {paragraphs.map((para, pIndex) => (
            <div
              id={para.id}
              key={para.id}
              className={`space-y-4 pt-4 border-t-2 border-slate-300 first:border-t-0 first:pt-0 relative group/para rounded-none transition-all duration-700 scroll-mt-24 ${
                newlyAddedParaId === para.id
                  ? "ring-2 ring-blue-500 bg-blue-50/30 p-3 shadow-sm"
                  : ""
              }`}
            >
              {/* Paragraph Index Badge & Controls (No print) */}
              <div className="flex items-center justify-between no-print mb-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-none text-xs font-black border border-slate-400">
                    অনুচ্ছেদ #{toBengaliDigits(pIndex + 1)} (অনুচ্ছেদ নং: {para.paraNo || "-"})
                  </span>
                  {newlyAddedParaId === para.id && (
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-none text-[10.5px] font-black animate-pulse flex items-center gap-1">
                      <Sparkles size={11} /> নতুন তৈরি হয়েছে
                    </span>
                  )}
                </div>
                {paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteParagraph(para.id)}
                    className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> অনুচ্ছেদ মুছুন
                  </button>
                )}
              </div>

              {/* ক. আপত্তি পরিচিতি ছক (Table exactly matching screenshot - Strictly Rectangular) */}
              <div className="overflow-x-auto rounded-none border border-slate-900 shadow-2xs">
                <table className="w-full text-xs sm:text-[12.5px] border-collapse border border-slate-900 bg-white rounded-none">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-900">
                      <th className="border border-slate-900 p-2 text-center w-[10%]">
                        ক্রমিক নং
                      </th>
                      <th className="border border-slate-900 p-2 text-left w-[35%]">
                        প্রতিষ্ঠানের নাম ও নিরীক্ষা বছর
                      </th>
                      <th className="border border-slate-900 p-2 text-center w-[14%]">
                        অনুচ্ছেদ নং
                      </th>
                      <th className="border border-slate-900 p-2 text-left w-[41%]">
                        শিরোনাম ও অন্যান্য
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900 hover:bg-slate-50/60 transition-colors">
                      {/* 1. SL */}
                      <td className="border border-slate-900 p-2 text-center align-middle font-bold text-slate-900">
                        <input
                          type="text"
                          value={para.sl}
                          onChange={(e) => handleUpdateParagraphField(para.id, "sl", e.target.value)}
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900 rounded-none"
                        />
                      </td>

                      {/* 2. Entity & Audit Year */}
                      <td className="border border-slate-900 p-2 text-left align-top leading-relaxed text-slate-900">
                        <textarea
                          rows={3}
                          value={para.entityAndAuditYear}
                          onChange={(e) =>
                            handleUpdateParagraphField(para.id, "entityAndAuditYear", e.target.value)
                          }
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed rounded-none"
                          placeholder="প্রতিষ্ঠান: ...&#10;নিরীক্ষা বছর: ..."
                        />
                      </td>

                      {/* 3. Para No */}
                      <td className="border border-slate-900 p-2 text-center align-middle font-bold text-slate-900">
                        <input
                          type="text"
                          value={para.paraNo}
                          onChange={(e) => handleUpdateParagraphField(para.id, "paraNo", e.target.value)}
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900 rounded-none"
                          placeholder="১০"
                        />
                      </td>

                      {/* 4. Title & Details */}
                      <td className="border border-slate-900 p-2 text-left align-top leading-relaxed text-slate-900">
                        <textarea
                          rows={3}
                          value={para.titleAndDetails}
                          onChange={(e) =>
                            handleUpdateParagraphField(para.id, "titleAndDetails", e.target.value)
                          }
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed rounded-none"
                          placeholder="শিরোনাম: ...&#10;অনুচ্ছেদের পৃষ্ঠা নং- ...&#10;পরিশिष्ट পৃষ্ঠা নং- ..."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* খ. স্থানীয় প্রতিষ্ঠানের জবাব (Editable Bengali Text) */}
              <div className="space-y-2 pt-1">
                <div
                  className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-none text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-colors"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText;
                    handleUpdateParagraphField(para.id, "entityReplyText", text.replace(/^স্থানীয় প্রতিষ্ঠানের জবাব:\s*/, ''));
                  }}
                >
                  <span className="font-black text-slate-900">স্থানীয় প্রতিষ্ঠানের জবাব: </span>
                  <span className="font-bold text-slate-900">{para.entityReplyText}</span>
                </div>

                {/* গ. টেবিল অন/অফ বাটন (চারকোনা বাটন) */}
                {!para.hasTable && (
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleParagraphTable(para.id, true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-400 rounded-none px-3 py-1.5 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus size={13} /> আদায়ের বিবরণী ছক যুক্ত করুন (যদি হিসাবে ছক প্রয়োজন হয়)
                    </button>
                  </div>
                )}
              </div>

              {/* ঘ. Embedded Table: Loan Recovery / Breakdown Grid for this Paragraph (Strictly Rectangular) */}
              {para.hasTable && (
                <div className="space-y-2 pt-1">
                  <div className="overflow-x-auto rounded-none border border-slate-800 shadow-2xs">
                    <table className="w-full text-xs sm:text-[12px] border-collapse border border-slate-800 bg-white rounded-none">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-black text-center border-b border-slate-800">
                          {para.tableColumns.map((col) => (
                            <th key={col.id} className="border border-slate-800 p-2 text-center relative group">
                              <div className="flex items-center justify-center gap-1">
                                <span>{col.label}</span>
                                {para.tableColumns.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteParagraphTableCol(para.id, col.id)}
                                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 no-print transition-opacity rounded-none"
                                    title="কলাম মুছুন"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="p-1 text-center w-8 no-print border border-slate-800">মুছুন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {para.tableRows.map((row) => (
                          <tr key={row.id} className="text-center hover:bg-slate-50 transition-colors">
                            {para.tableColumns.map((col) => {
                              const cellColor = (row.cellColors || {})[col.id];
                              return (
                                <td
                                  key={col.id}
                                  style={{ backgroundColor: cellColor || undefined }}
                                  className="border border-slate-800 p-1 relative group/cell"
                                >
                                  <input
                                    type="text"
                                    value={row.cells[col.id] || ""}
                                    onChange={(e) =>
                                      handleUpdateParagraphTableCell(para.id, row.id, col.id, e.target.value)
                                    }
                                    className="w-full text-center bg-transparent outline-none font-medium text-slate-900 p-1 rounded-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleApplyParagraphTableCellColor(para.id, row.id, col.id)}
                                    className="absolute right-0.5 top-0.5 opacity-0 group-hover/cell:opacity-100 p-0.5 bg-white/90 text-slate-400 hover:text-blue-600 rounded-none text-[8px] no-print shadow-2xs border border-slate-300"
                                    title="রঙ দিন"
                                  >
                                    <Palette size={9} />
                                  </button>
                                </td>
                              );
                            })}
                            <td className="p-1 text-center no-print border border-slate-800">
                              {para.tableRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParagraphTableRow(para.id, row.id)}
                                  className="text-rose-400 hover:text-rose-600 p-0.5 rounded-none"
                                  title="রো মুছুন"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}

                        {/* Totals Row */}
                        <tr className="font-black bg-slate-100/90 text-center border-t-2 border-slate-800 text-slate-900">
                          {para.tableColumns.map((col, idx) => {
                            const totalInvolved = calculateParagraphTotal(para, "জড়িত");
                            const totalPrincipal = calculateParagraphTotal(para, "আসল");
                            const totalInterest = calculateParagraphTotal(para, "সুদ");
                            const totalRecovered = calculateParagraphTotal(para, "আদায়");

                            if (idx === 0) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">সর্বমোট</td>;
                            if (col.id === "borrowerName" || col.label.includes("নাম")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">-</td>;
                            if (col.id === "involvedAmount" || col.label.includes("জড়িত")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">{totalInvolved ? toBengaliDigits(totalInvolved) : "-"}</td>;
                            if (col.id === "principal" || col.label.includes("আসল")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">{toBengaliDigits(totalPrincipal || 0)}</td>;
                            if (col.id === "interest" || col.label.includes("সুদ")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">{toBengaliDigits(totalInterest || 0)}</td>;
                            if (col.id === "others" || col.label.includes("অন্যান্য")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">-</td>;
                            if (col.id === "totalRecovered" || col.label.includes("আদায়")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">{totalRecovered ? toBengaliDigits(totalRecovered) : "-"}</td>;
                            if (col.id === "adjustmentDate" || col.label.includes("তারিখ")) return <td key={col.id} className="border border-slate-800 p-1.5 text-center">-</td>;
                            return <td key={col.id} className="border border-slate-800 p-1.5 text-center">-</td>;
                          })}
                          <td className="no-print border border-slate-800"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Table Row/Column Operations (No-Print) - Strictly Rectangular Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 no-print">
                    <button
                      type="button"
                      onClick={() => handleAddParagraphTableRow(para.id)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-none text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus size={11} /> রো যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddParagraphTableCol(para.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-none text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus size={11} /> কলাম যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleParagraphTable(para.id, false)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-none text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Trash2 size={11} /> ছক বন্ধ/মুছুন
                    </button>
                  </div>
                </div>
              )}

              {/* ঙ. সমাপ্তিসূচক অনুচ্ছেদসমূহ ও মন্তব্য (হুবহু সরবরাহকৃত ছবির বিন্যাস - চারকোনা) */}
              <div className="space-y-3.5 pt-2 text-xs sm:text-[13px] leading-relaxed">
                {/* ১. শাখার সমাপ্তিসূচক অনুরোধ */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateParagraphField(para.id, "branchRequestText", e.currentTarget.innerText)}
                  className="p-2 sm:p-2.5 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-none text-xs sm:text-[13px] font-medium text-slate-900 outline-none leading-relaxed text-justify"
                >
                  {para.branchRequestText}
                </div>

                {/* ২. প্রধান কার্যালয়ের মন্তব্য */}
                <div
                  className="p-2.5 sm:p-3 bg-slate-50 border border-dashed border-slate-300 hover:border-slate-400 focus:border-blue-400 rounded-none text-xs sm:text-[13px] leading-relaxed text-justify outline-none"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText;
                    handleUpdateParagraphField(para.id, "headOfficeCommentText", text.replace(/^প্রধান কার্যালয়ের মন্তব্য:\s*/, ''));
                  }}
                >
                  <span className="font-black text-slate-900">প্রধান কার্যালয়ের মন্তব্য: </span>
                  <span className="font-bold text-slate-900">{para.headOfficeCommentText}</span>
                </div>

                {/* ৩. উপস্থাপনকারীর মন্তব্য */}
                <div
                  className="p-2.5 sm:p-3 bg-blue-50/70 border border-dashed border-blue-300 hover:border-blue-500 focus:border-blue-600 rounded-none text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-all shadow-2xs"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const text = e.currentTarget.innerText;
                    handleUpdateParagraphField(para.id, "presenterCommentText", text.replace(/^উপস্থাপনকারীর মন্তব্য:\s*/, ''));
                  }}
                >
                  <span className="font-black text-slate-900">উপস্থাপনকারীর মন্তব্য: </span>
                  <span className="font-bold text-slate-900">{para.presenterCommentText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* নতুন অনুচ্ছেদ বাটনটি নিচে যুক্ত করা হলো (Strictly Rectangular, No-Print) */}
        <div className="no-print pt-2 pb-2 flex items-center justify-center border-t border-dashed border-slate-300">
          <button
            type="button"
            onClick={handleAddParagraph}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-none text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border border-blue-500"
            title="নোট শিটে আরও একটি নতুন অনুচ্ছেদ যোগ করুন"
          >
            <Plus size={16} /> + নতুন অনুচ্ছেদ যোগ করুন (অনুচ্ছেদ #{toBengaliDigits(paragraphs.length + 1)})
          </button>
        </div>

        {/* 4. সমাপনী অনুচ্ছেদ (সকল অনুচ্ছেদের শেষে একবারে) */}
        <div className="pt-2">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setFinalSubmissionText(e.currentTarget.innerText)}
            className="p-2.5 sm:p-3 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-none text-xs sm:text-[13px] font-black text-slate-900 outline-none text-left"
          >
            {finalSubmissionText}
          </div>
        </div>

        {/* 5. Signature Block */}
        <div className="pt-10 flex justify-between items-end text-xs">
          <div className="text-slate-600 font-bold space-y-1">
            <p>সার্বিক পরিস্থিতি: <span className="text-emerald-700 font-black">{settlementStatus}</span></p>
            <p className="text-[10.5px]">নথি প্রস্তুতকারক: অডিট অফিসার</p>
          </div>
          <div className="text-center space-y-1">
            <div className="w-36 border-b border-slate-700 mx-auto" />
            <p className="font-black text-slate-900">উপপরিচালক / মহাপরিচালক</p>
            <p className="text-[10px] text-slate-500">বাণিজ্যিক অডিট অধিদপ্তর</p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Final Approval & Memory Purge Bar (Strictly Square / rounded-none) */}
      <div className="bg-white rounded-none border-2 border-slate-300 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> নোটশিট অনুমোদন ও ডাটাবেজ স্পেস সুরক্ষা
          </h3>
          <p className="text-xs font-bold text-slate-500">
            নোট অনুমোদনের সাথে সাথে অস্থায়ী আপলোড ফাইলগুলো মেমরি থেকে মুছে (Purge) যাবে এবং জারিপত্র প্রস্তুত হবে।
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isNoteApproved ? (
            <button
              type="button"
              onClick={handleApproveNoteAndPurge}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-black flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer border border-emerald-500"
            >
              <Check size={16} /> নোট অনুমোদন ও চূড়ান্ত করুন
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-none text-xs font-black border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> নোট অনুমোদিত হয়েছে
              </span>
              <button
                type="button"
                onClick={() => setShowJaripatraView(true)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-none text-xs font-black flex items-center gap-2 shadow-sm hover:opacity-95 cursor-pointer border border-amber-600"
              >
                <Flame size={15} /> জারিপত্র দেখুন ও প্রিন্ট করুন
              </button>
            </div>
          )}
        </div>
      </div>
      </>
    )}

      {/* AI Document Validation Error Alert Modal - Strictly Rectangular */}
      {validationErrorModal && validationErrorModal.open && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-none border-2 border-rose-600 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-rose-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={20} className="text-rose-200 shrink-0 animate-pulse" />
                <h3 className="text-sm font-black tracking-wide">
                  অডিট ডকুমেন্ট যাচাইকরণে ত্রুটি!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setValidationErrorModal(null)}
                className="text-rose-200 hover:text-white p-1 rounded-none cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 font-bengali text-slate-800">
              <div className="p-3.5 bg-rose-50 border-l-4 border-rose-600">
                <p className="text-sm font-black text-rose-900 leading-relaxed">
                  {validationErrorModal.message}
                </p>
              </div>

              {validationErrorModal.details && validationErrorModal.details.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-black text-slate-700">শনাক্তকৃত কারণসমূহ:</p>
                  <ul className="space-y-1.5 pl-2 text-xs text-slate-600">
                    {validationErrorModal.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold shrink-0">✕</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-slate-50 p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-700">সঠিক অডিট ডকুমেন্টের জন্য যা প্রয়োজন:</p>
                <p>১. নির্দিষ্ট অডিট আপত্তি বা অনুচ্ছেদ নম্বর (যেমন: অনুচ্ছেদ নং- ১০, ১৫)</p>
                <p>২. নিরীক্ষা সাল ও অডিটকৃত প্রতিষ্ঠানের নাম</p>
                <p>৩. আদায় বা সমন্বয়ের স্বপক্ষে চালানের বিবরণ ও জবাবের সফটকপি</p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setValidationErrorModal(null);
                }}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-none text-xs font-black cursor-pointer shadow-sm transition-colors"
              >
                পুনরায় চেষ্টা করুন
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Missing Info Clarification / Confirmation Modal */}
      {documentConfirmationModal && documentConfirmationModal.open && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-none border-2 border-amber-600 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 font-bengali">
            {/* Header */}
            <div className="bg-amber-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={20} className="text-amber-200 shrink-0 animate-bounce" />
                <h3 className="text-sm font-black tracking-wide">
                  অডিট-তথ্য নিশ্চিতকরণ ও যাচাইকরণ প্রশ্ন
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDocumentConfirmationModal(null)}
                className="text-amber-200 hover:text-white p-1 rounded-none cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-slate-800">
              <div className="p-3.5 bg-amber-50 border-l-4 border-amber-600">
                <p className="text-sm font-bold text-amber-950 leading-relaxed">
                  {documentConfirmationModal.prompt}
                </p>
              </div>

              {documentConfirmationModal.missingFields && documentConfirmationModal.missingFields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-700">নথিতে সরাসরি পাওয়া যায়নি বা অমিল রয়েছে এমন তথ্যাদি:</p>
                  <ul className="space-y-1.5 pl-2 text-xs text-slate-700">
                    {documentConfirmationModal.missingFields.map((field, idx) => (
                      <li key={idx} className="flex items-center gap-2 bg-amber-50/60 p-2 border border-amber-200">
                        <span className="text-amber-700 font-black text-sm">⚠</span>
                        <span className="font-bold text-amber-900">{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 border border-slate-200">
                <strong>ব্যবহারকারীর করণীয়:</strong> যদি এটিই আপনার কাঙ্ক্ষিত সঠিক নথি হয়ে থাকে, তবে <strong>'হ্যাঁ, এটিই সঠিক নথি (এগিয়ে যান)'</strong> বাটনে ক্লিক করুন। এআই রেজিস্ট্রি তথ্যের সমন্বয়ে বাকি অংশ প্রস্তুত করবে এবং আপনি পরবর্তীতে ম্যানুয়ালি সম্পাদন করতে পারবেন।
              </p>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDocumentConfirmationModal(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-none text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল / নতুন ফাইল দিন
              </button>
              <button
                type="button"
                onClick={() => {
                  const pending = documentConfirmationModal.pendingPayload;
                  setDocumentConfirmationModal(null);
                  if (pending) {
                    applyParsedDataToNote(pending);
                  } else {
                    handleRunAiAnalysis(true);
                  }
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-none text-xs font-black cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>হ্যাঁ, এটিই সঠিক নথি (এগিয়ে যান)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentManagementModule;
