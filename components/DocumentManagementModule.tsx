import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  Printer,
  Download,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Highlighter,
  Palette,
  RotateCcw,
  Send,
  HelpCircle,
  Check,
  Building,
  Calendar,
  Hash,
  Coins,
  FileCheck2,
  Table as TableIcon,
  ShieldCheck,
  Eye,
  Copy,
  Edit3,
  Flame,
  Info,
  X,
} from "lucide-react";
import { CorrespondenceEntry } from "../types";
import { toBengaliDigits, formatDateBN, toEnglishDigits } from "../utils/numberUtils";
import { OFFICE_HEADER } from "../constants";

interface DocumentManagementModuleProps {
  entry: CorrespondenceEntry;
  onBack: () => void;
  isAdmin?: boolean;
  onSaveJaripatra?: (entry: CorrespondenceEntry, jaripatraData: any) => void;
}

interface TableColumn {
  id: string;
  label: string;
}

interface TableRow {
  id: string;
  cells: Record<string, string>;
  cellColors?: Record<string, string>; // cellId -> color
}

export const DocumentManagementModule: React.FC<DocumentManagementModuleProps> = ({
  entry,
  onBack,
  isAdmin = false,
  onSaveJaripatra,
}) => {
  // In-Memory Uploaded Files (Will be permanently purged upon note approval)
  const [objectionFile, setObjectionFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [objectionText, setObjectionText] = useState<string>("");
  const [replyFile, setReplyFile] = useState<{ name: string; size: string; base64: string; mimeType: string } | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [isFilesPurged, setIsFilesPurged] = useState<boolean>(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState<string>("");
  const [needsClarification, setNeedsClarification] = useState<boolean>(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [userClarificationAnswers, setUserClarificationAnswers] = useState<Record<number, string>>({});

  // Note Sheet State
  const [noteSubject, setNoteSubject] = useState<string>(() => {
    return `${entry.entityName || 'সংশ্লিষ্ট প্রতিষ্ঠান'} এর ${entry.auditYear || '২০২৩-২৪'} নিরীক্ষা বর্ষের অডিট আপত্তির জবাব ও প্রমাণক পর্যালোচনাপূর্বক নিষ্পত্তি প্রসঙ্গে।`;
  });
  const [noteContentHtml, setNoteContentHtml] = useState<string>(() => {
    const totalParas = entry.totalParas || "১";
    const totalAmount = entry.totalAmount || "০";
    return `<p><strong>১. বিষয় উপস্থাপনা:</strong> ${entry.ministryName || 'সংশ্লিষ্ট মন্ত্রণালয়'}-এর আওতাধীন <strong>${entry.entityName || 'প্রতিষ্ঠান'}</strong> এর ${entry.auditYear || '২০২৩-২৪'} নিরীক্ষা বর্ষের মোট <strong>${toBengaliDigits(totalParas)}</strong> টি অনুচ্ছেদে জড়িত <strong>${toBengaliDigits(totalAmount)}</strong> টাকার অডিট আপত্তির বিপরীতে প্রতিষ্ঠান কর্তৃপক্ষ পত্র নং: ${entry.letterNo || 'প্রযোজ্য নয়'}, তারিখ: ${formatDateBN(entry.letterDate)} মূলে জবাব ও প্রয়োজনীয় প্রমাণক দাখিল করেছে (ডায়েরি নং: ${entry.diaryNo || 'নাই'}, তারিখ: ${formatDateBN(entry.diaryDate)})।</p>
<p><strong>২. আপত্তির সংক্ষিপ্ত বিবরণ:</strong> উক্ত নিরীক্ষা বর্ষে নিরীক্ষিত প্রতিষ্ঠানের আর্থিক ব্যয়ের সপক্ষে যথাযথ অনুমোদন, ট্রেজারি চালান ও সমন্বয় সংক্রান্ত সন্তোষজনক ভাউচার না থাকায় অডিট আপত্তি উত্থাপিত হয়েছিল।</p>
<p><strong>৩. প্রতিষ্ঠানের জবাব ও দাখিলকৃত রেকর্ডপত্র পর্যালোচনা:</strong> প্রতিষ্ঠান কর্তৃক দাখিলকৃত বিস্তারিত জবাব, ব্যাংক হিসাব বিবরণী, ট্রেজারি চালানের সত্যায়িত কপি এবং সমন্বয় সংক্রান্ত দলিলপত্র অত্র কার্যালয়ে সূক্ষ্মভাবে পরীক্ষা ও যাচাই করা হলো। পর্যালোচনায় দেখা যায় যে, আপত্তি সংশ্লিষ্ট আর্থিক ব্যয়ের বৈধতা ও রাজস্ব জমা সংক্রান্ত দলিলাদি সন্তোষজনক রয়েছে।</p>
<p><strong>৪. অডিট পর্যালোচনা ও চূড়ান্ত সুপারিশ:</strong> দাখিলকৃত প্রমাণক ও হিসাব সন্তোষজনক প্রতীয়মান হওয়ায় বর্ণিত <strong>${toBengaliDigits(totalParas)}</strong> টি অনুচ্ছেদ <strong>${entry.paraType === 'এসএফআই' ? 'দ্বিপাক্ষিক সভা ও মহাপরিচালক মহোদয়ের অনুমোদন সাপেক্ষে চূড়ান্ত নিষ্পত্তি' : 'পূর্ণাঙ্গ নিষ্পত্তি'}</strong> করার জন্য সুপারিশ পেশ করা হলো।</p>`;
  });

  const [settlementStatus, setSettlementStatus] = useState<string>("পূর্ণাঙ্গ নিষ্পত্তি");
  const [recommendationSummary, setRecommendationSummary] = useState<string>("দাখিলকৃত রেকর্ডপত্র সঠিক থাকায় অনুচ্ছেদটি শর্তহীনভাবে নিষ্পত্তির জন্য সুপারিশ করা হলো।");
  const [isNoteApproved, setIsNoteApproved] = useState<boolean>(false);

  // Dynamic Table Builder State
  const [hasTable, setHasTable] = useState<boolean>(true);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { id: "sl", label: "ক্রমিক" },
    { id: "paraNo", label: "অনুচ্ছেদ নং" },
    { id: "subject", label: "আপত্তির বিষয়বস্তু" },
    { id: "involvedAmount", label: "জড়িত টাকা" },
    { id: "recoveredAmount", label: "আদায়কৃত টাকা" },
    { id: "adjustedAmount", label: "সমন্বয়কৃত টাকা" },
    { id: "unsettledAmount", label: "অনিষ্পন্ন টাকা" },
    { id: "comments", label: "অডিট মন্তব্য ও সুপারিশ" },
  ]);

  const [tableRows, setTableRows] = useState<TableRow[]>([
    {
      id: "row-1",
      cells: {
        sl: "১",
        paraNo: "০১(ক)",
        subject: `${entry.entityName || 'প্রতিষ্ঠান'} এর সংশ্লিষ্ট আর্থিক বছরের ব্যয় সংক্রান্ত`,
        involvedAmount: entry.totalAmount || "০",
        recoveredAmount: entry.totalAmount || "০",
        adjustedAmount: "০",
        unsettledAmount: "০",
        comments: "দাখিলকৃত চালানের ভিত্তিতে পূর্ণাঙ্গ নিষ্পত্তির সুপারিশ।",
      },
      cellColors: {},
    },
  ]);

  // Active cell formatting
  const [selectedCellColor, setSelectedCellColor] = useState<string>("#ecfdf5"); // light emerald default
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // Jaripatra State
  const [showJaripatraView, setShowJaripatraView] = useState<boolean>(false);
  const [jaripatraMemoNo, setJaripatraMemoNo] = useState<string>(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `০৭.০২.০০০০.৮০১.০২.${randomSuffix}.${new Date().getFullYear().toString().slice(-2)}`;
  });
  const [jaripatraDate, setJaripatraDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [jaripatraSubject, setJaripatraSubject] = useState<string>(() => {
    return `${entry.entityName || 'সংশ্লিষ্ট প্রতিষ্ঠান'} এর ${entry.auditYear || '২০২৩-২৪'} নিরীক্ষা বর্ষের অডিট আপত্তি নিষ্পত্তি সংক্রান্ত জারিপত্র।`;
  });
  const [jaripatraReference, setJaripatraReference] = useState<string>(() => {
    return `আপনাদের পত্র নং: ${entry.letterNo || 'প্রযোজ্য নয়'}, তারিখ: ${formatDateBN(entry.letterDate)}`;
  });
  const [jaripatraBody, setJaripatraBody] = useState<string>(() => {
    return `উপযুক্ত বিষয় ও সূত্রের পরিপ্রেক্ষিতে জানানো যাচ্ছে যে, আপনার কার্যালয়ের ${entry.auditYear || '২০২৩-২৪'} নিরীক্ষা বর্ষের অডিট আপত্তির বিপরীতে প্রেরিত জবাব এবং সংযুক্ত প্রমাণকসমূহ অত্র কার্যালয়ে পরীক্ষা ও নিরীক্ষা করা হয়েছে। দাখিলকৃত রেকর্ডপত্র ও ব্যাখ্যা সন্তোষজনক প্রতীয়মান হওয়ায় নিম্নবর্ণিত বিবরণ অনুযায়ী আপত্তিটি নিষ্পত্তি করা হলো:`;
  });
  const [signatoryName, setSignatoryName] = useState<string>("উপপরিচালক");
  const [signatoryOffice, setSignatoryOffice] = useState<string>("বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা");

  // Rich Text Editor Ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Helper to format commands in rich editor
  const executeCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      setNoteContentHtml(editorRef.current.innerHTML);
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
          setObjectionText(`[সংযুক্ত ফাইল: ${file.name}] মূল আপত্তির বিস্তারিত রেকর্ডপত্র।`);
        }
      } else {
        setReplyFile(fileData);
        if (!replyText) {
          setReplyText(`[সংযুক্ত ফাইল: ${file.name}] প্রতিষ্ঠানের জবাব, ট্রেজারি চালান ও নিষ্পত্তির রেকর্ডপত্র।`);
        }
      }
      setIsFilesPurged(false);
    };
    reader.readAsDataURL(file);
  };

  // Call AI Document Analysis
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysisStep("নথি ও সংযুক্তি স্ক্যান করা হচ্ছে...");

    try {
      setTimeout(() => {
        setAiAnalysisStep("আপত্তির সারসংক্ষেপ ও জবাবের প্রমাণকসমূহ বিশ্লেষণ চলছে...");
      }, 700);

      setTimeout(() => {
        setAiAnalysisStep("সরকারি প্রমিত কাঠামো অনুযায়ী ড্রাফট নোট ও টেবিল প্রস্তুত হচ্ছে...");
      }, 1500);

      const response = await fetch("/api/document-management/analyze-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      if (resJson.success && resJson.data) {
        const data = resJson.data;

        if (data.needsClarification && data.clarificationQuestions && data.clarificationQuestions.length > 0) {
          setNeedsClarification(true);
          setClarificationQuestions(data.clarificationQuestions);
        } else {
          setNeedsClarification(false);
          if (data.noteSubject) setNoteSubject(data.noteSubject);
          if (data.noteContentHtml) {
            setNoteContentHtml(data.noteContentHtml);
            if (editorRef.current) {
              editorRef.current.innerHTML = data.noteContentHtml;
            }
          }
          if (data.proposedStatus) setSettlementStatus(data.proposedStatus);
          if (data.recommendationSummary) setRecommendationSummary(data.recommendationSummary);

          if (data.hasTable && data.tableHeaders && data.tableRows) {
            setHasTable(true);
            const cols: TableColumn[] = data.tableHeaders.map((h: string, i: number) => ({
              id: `col-${i}`,
              label: h,
            }));
            setTableColumns(cols);

            const rows: TableRow[] = data.tableRows.map((r: string[], rIdx: number) => {
              const cells: Record<string, string> = {};
              cols.forEach((col, cIdx) => {
                cells[col.id] = r[cIdx] || "";
              });
              return { id: `row-${rIdx + 1}`, cells, cellColors: {} };
            });
            setTableRows(rows);
          }

          if (data.suggestedIssueLetter) {
            if (data.suggestedIssueLetter.subject) setJaripatraSubject(data.suggestedIssueLetter.subject);
            if (data.suggestedIssueLetter.reference) setJaripatraReference(data.suggestedIssueLetter.reference);
            if (data.suggestedIssueLetter.bodyHtml) setJaripatraBody(data.suggestedIssueLetter.bodyHtml);
          }
        }
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
      setAiAnalysisStep("");
    }
  };

  // Approval and In-Memory Discard
  const handleApproveNoteAndPurge = () => {
    setIsNoteApproved(true);
    // Discard & Purge raw files immediately from memory to save DB space
    setObjectionFile(null);
    setReplyFile(null);
    setIsFilesPurged(true);
  };

  // Add Table Row
  const handleAddTableRow = () => {
    const nextIdx = tableRows.length + 1;
    const newCells: Record<string, string> = {};
    tableColumns.forEach((col, i) => {
      if (col.label.includes("ক্রমিক") || col.id === "sl") newCells[col.id] = toBengaliDigits(nextIdx);
      else if (col.label.includes("অনুচ্ছেদ") || col.id === "paraNo") newCells[col.id] = `০${toBengaliDigits(nextIdx)}`;
      else if (col.label.includes("টাকা")) newCells[col.id] = "০";
      else newCells[col.id] = "";
    });
    setTableRows([...tableRows, { id: `row-${Date.now()}`, cells: newCells, cellColors: {} }]);
  };

  // Delete Table Row
  const handleDeleteTableRow = (rowId: string) => {
    if (tableRows.length <= 1) return;
    setTableRows(tableRows.filter((r) => r.id !== rowId));
  };

  // Add Table Column
  const handleAddTableColumn = () => {
    const colName = prompt("নতুন কলামের শিরোনাম লিখুন:", "নতুন কলাম");
    if (!colName) return;
    const newColId = `col-${Date.now()}`;
    const updatedCols = [...tableColumns, { id: newColId, label: colName }];
    setTableColumns(updatedCols);

    setTableRows(
      tableRows.map((r) => ({
        ...r,
        cells: { ...r.cells, [newColId]: "" },
      }))
    );
  };

  // Delete Table Column
  const handleDeleteTableColumn = (colId: string) => {
    if (tableColumns.length <= 2) {
      alert("কমপক্ষে দুটি কলাম থাকা আবশ্যক।");
      return;
    }
    setTableColumns(tableColumns.filter((c) => c.id !== colId));
  };

  // Update Cell Value
  const handleUpdateCell = (rowId: string, colId: string, val: string) => {
    setTableRows(
      tableRows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: val } } : r))
    );
  };

  // Toggle Cell Color
  const handleApplyCellColor = (rowId: string, colId: string) => {
    setTableRows(
      tableRows.map((r) => {
        if (r.id !== rowId) return r;
        const currentColors = { ...(r.cellColors || {}) };
        if (currentColors[colId] === selectedCellColor) {
          delete currentColors[colId];
        } else {
          currentColors[colId] = selectedCellColor;
        }
        return { ...r, cellColors: currentColors };
      })
    );
  };

  // Calculate Table Totals
  const calculateTotal = (keyword: string) => {
    const col = tableColumns.find((c) => c.label.includes(keyword) || c.id.includes(keyword));
    if (!col) return null;
    let sum = 0;
    tableRows.forEach((r) => {
      const val = parseFloat(toEnglishDigits(r.cells[col.id] || "0").replace(/[^\d.]/g, "")) || 0;
      sum += val;
    });
    return sum;
  };

  const totalInvolved = calculateTotal("জড়িত");
  const totalRecovered = calculateTotal("আদায়");
  const totalAdjusted = calculateTotal("সমন্বয়");
  const totalUnsettled = calculateTotal("অনিষ্পন্ন");

  // Print Jaripatra
  const handlePrintJaripatra = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 pb-16 font-bengali">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors flex items-center gap-1.5 font-black text-xs border border-slate-200 cursor-pointer shadow-2xs"
            title="চিঠিপত্র রেজিস্টারে ফিরে যান"
          >
            <ArrowLeft size={16} /> ফিরে যান
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-black text-slate-900 tracking-tight">নথি ব্যবস্থাপনা ও স্মার্ট অডিট ড্রাফটার</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full border border-blue-200 flex items-center gap-1">
                  <Bot size={11} className="text-blue-600" /> এআই সম্বলিত
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500">
                ডায়েরি নং: <span className="text-blue-700 font-black">{toBengaliDigits(entry.diaryNo || "-")}</span> | 
                এনটিটি: <span className="text-slate-900 font-black">{entry.entityName || "-"}</span> | 
                অনুচ্ছেদ: <span className="text-emerald-700 font-black">{toBengaliDigits(entry.totalParas || "১")}টি</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNoteApproved && (
            <button
              onClick={() => setShowJaripatraView(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/25 hover:opacity-95 active:scale-95 transition-all cursor-pointer ring-2 ring-amber-300 animate-pulse"
            >
              <Flame size={15} /> জারিপত্র তৈরি করুন
            </button>
          )}

          <button
            onClick={() => {
              if (editorRef.current) {
                setNoteContentHtml(editorRef.current.innerHTML);
              }
              alert("নথি এবং ড্রাফট তথ্য সাময়িকভাবে সংরক্ষিত হয়েছে।");
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 size={14} /> খসড়া সংরক্ষণ
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5 space-y-6">
        {/* Letter Snapshot Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Hash size={11} className="text-blue-600" /> ডায়েরি নং ও তারিখ
            </span>
            <p className="text-xs font-black text-slate-900 mt-1">
              {entry.diaryNo ? `${toBengaliDigits(entry.diaryNo)}, ${formatDateBN(entry.diaryDate)}` : "-"}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <FileText size={11} className="text-emerald-600" /> মূল পত্র নং ও তারিখ
            </span>
            <p className="text-xs font-black text-slate-900 mt-1">
              {entry.letterNo ? `${toBengaliDigits(entry.letterNo)}, ${formatDateBN(entry.letterDate)}` : "-"}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Building size={11} className="text-indigo-600" /> এনটিটি ও মন্ত্রণালয়
            </span>
            <p className="text-xs font-black text-slate-900 mt-1 truncate" title={entry.entityName}>
              {entry.entityName || "-"}
            </p>
            <span className="text-[9px] font-bold text-slate-400 truncate block">{entry.ministryName || ""}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Calendar size={11} className="text-amber-600" /> নিরীক্ষা বর্ষ ও শাখা
            </span>
            <p className="text-xs font-black text-slate-900 mt-1">
              {entry.auditYear || "-"} ({entry.paraType || "নন এসএফআই"})
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Coins size={11} className="text-rose-600" /> জড়িত মোট টাকা
            </span>
            <p className="text-xs font-black text-rose-700 mt-1">
              {entry.totalAmount ? `${toBengaliDigits(entry.totalAmount)} ৳` : "০ ৳"}
            </p>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <ShieldCheck size={11} className="text-purple-600" /> নিষ্পত্তির বর্তমান অবস্থা
            </span>
            <p className={`text-xs font-black mt-1 ${entry.isSettled === 'হ্যাঁ' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {entry.isSettled === 'হ্যাঁ' ? 'নিষ্পন্ন' : 'প্রক্রিয়াধীন'}
            </p>
          </div>
        </div>

        {/* SECTION 1: Dual Document Upload & In-Memory AI Engine */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                  ১. মূল আপত্তি ও প্রেরিত জবাব আপলোড (AI ইন-মেমরি বিশ্লেষণ)
                </h2>
                <p className="text-[10.5px] text-slate-300 font-bold">
                  মূল আপত্তি এবং প্রতিষ্ঠান কর্তৃক দাখিলকৃত জবাবপত্র আপলোড বা পেস্ট করে এআই দিয়ে স্বয়ংক্রিয় যাচাই করুন
                </p>
              </div>
            </div>

            {isFilesPurged ? (
              <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-[11px] font-black flex items-center gap-1.5">
                <CheckCircle2 size={13} /> আপলোডকৃত ফাইল মেমরি থেকে স্বয়ংক্রিয় মুছে ফেলা হয়েছে (Purged)
              </div>
            ) : (
              <div className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-[10.5px] font-bold flex items-center gap-1.5">
                <ShieldCheck size={13} /> ডাটাবেজ সুরক্ষায় অনুমোদন শেষে ফাইল স্বয়ংক্রিয়ভাবে ডিসকার্ড হবে
              </div>
            )}
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Upload 1: Original Objection */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-rose-600" /> ক. মূল আপত্তি / অডিট অনুচ্ছেদ
                  </span>
                  {objectionFile && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {objectionFile.name} ({objectionFile.size})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 hover:text-blue-700 shadow-2xs">
                    <Upload size={14} /> মূল আপত্তি ফাইল আপলোড (PDF/Image/Word)
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "objection")}
                    />
                  </label>
                  {objectionFile && (
                    <button
                      type="button"
                      onClick={() => setObjectionFile(null)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      title="ফাইল মুছুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="অথবা মূল আপত্তির মূল বিষয়বস্তু/টেক্সট এখানে সরাসরি লিখুন বা পেস্ট করুন..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-500 outline-none leading-relaxed"
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                  />
                </div>
              </div>

              {/* Upload 2: Entity Reply & Settlement Proofs */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 size={14} className="text-emerald-600" /> খ. প্রতিষ্ঠানের জবাব ও দাখিলকৃত প্রমাণক
                  </span>
                  {replyFile && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {replyFile.name} ({replyFile.size})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 hover:text-emerald-700 shadow-2xs">
                    <Upload size={14} /> প্রেরিত জবাব ও প্রমাণক ফাইল আপলোড
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "reply")}
                    />
                  </label>
                  {replyFile && (
                    <button
                      type="button"
                      onClick={() => setReplyFile(null)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                      title="ফাইল মুছুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    rows={4}
                    placeholder="অথবা প্রতিষ্ঠানের জবাব, চালানের তথ্য ও ভাউচার বিবরণী এখানে সরাসরি পেস্ট করুন..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-emerald-500 outline-none leading-relaxed"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* AI Execution Button & Clarification Flow */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-[11.5px] text-slate-500 font-bold flex items-center gap-1.5">
                <Info size={14} className="text-blue-500 shrink-0" />
                <span>এআই অনুমান নির্ভর কোনো মন্তব্য করবে না; লেখা অস্পষ্ট হলে প্রশ্ন করে নিশ্চিত হবে।</span>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{aiAnalysisStep || "যাচাইকরণ চলছে..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> এআই দিয়ে যাচাই ও খসড়া নোট তৈরি করুন
                  </>
                )}
              </button>
            </div>

            {/* Interactive Human-In-The-Loop Clarification Box */}
            {needsClarification && clarificationQuestions.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <AlertTriangle size={16} className="text-amber-600 animate-bounce" />
                  <span>এআই পর্যবেক্ষণ: কিছু তথ্য অস্পষ্ট থাকায় আপনার স্পষ্টীকরণ প্রয়োজন (Human-in-the-loop):</span>
                </div>

                <div className="space-y-2">
                  {clarificationQuestions.map((q, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200 space-y-1.5">
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

                <div className="flex justify-end gap-2 pt-1">
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
        </div>

        {/* SECTION 2: MS Word-like Note-Sheet Rich Text Editor */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                <Edit3 size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  ২. সরকারি নোট-শিট ও অডিট মন্তব্য এডিটর (MS Word Style)
                </h2>
                <p className="text-[10.5px] text-slate-500 font-bold">
                  সরকারি নোট শিটের প্রমিত ফরম্যাটে বিষয় উপস্থাপনা, আপত্তি বিশ্লেষণ ও চূড়ান্ত মন্তব্য
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">প্রস্তাবিত নিষ্পত্তি:</span>
              <select
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                value={settlementStatus}
                onChange={(e) => setSettlementStatus(e.target.value)}
              >
                <option value="পূর্ণাঙ্গ নিষ্পত্তি">পূর্ণাঙ্গ নিষ্পত্তি</option>
                <option value="আংশিক নিষ্পত্তি">আংশিক নিষ্পত্তি</option>
                <option value="অনিষ্পন্ন / আপত্তি বহাল">অনিষ্পন্ন / আপত্তি বহাল</option>
              </select>
            </div>
          </div>

          {/* MS Word Format Toolbar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 no-print">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand("bold")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("italic")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("underline")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Underline (Ctrl+U)"
              >
                <Underline size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("strikeThrough")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Strikethrough"
              >
                <Strikethrough size={13} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-0.5" />

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand("justifyLeft")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("justifyCenter")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Align Center"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("justifyRight")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("justifyFull")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Justify"
              >
                <AlignJustify size={13} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-0.5" />

            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => executeCommand("insertUnorderedList")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Bullet List"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => executeCommand("insertOrderedList")}
                className="p-1.5 hover:bg-slate-100 text-slate-700 rounded transition-colors"
                title="Numbered List"
              >
                <ListOrdered size={13} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-0.5" />

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-2xs">
              <Highlighter size={12} className="text-amber-500" />
              <span className="text-[10px] font-bold text-slate-600">হাইলাইট:</span>
              {["#fef08a", "#bbf7d0", "#fecdd3", "#bae6fd"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => executeCommand("hiliteColor", color)}
                  className="w-4 h-4 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => executeCommand("removeFormat")}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 shadow-2xs"
              title="ফরম্যাটিং মুছুন"
            >
              <RotateCcw size={11} /> রিসেট
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Note Subject */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                নোটের বিষয়বস্তু:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
              />
            </div>

            {/* Note Sheet Paper View (Official Styling) */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-amber-50/20 shadow-inner space-y-4">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h3 className="text-sm font-black text-slate-900">{OFFICE_HEADER.main}</h3>
                <p className="text-xs font-bold text-slate-600">{OFFICE_HEADER.sub}, {OFFICE_HEADER.address}</p>
                <span className="inline-block mt-1 px-3 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded-md">
                  নথি / খসড়া নোট শিট
                </span>
              </div>

              {/* Note Body Editable */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={() => {
                  if (editorRef.current) {
                    setNoteContentHtml(editorRef.current.innerHTML);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: noteContentHtml }}
                className="min-h-[220px] p-4 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 leading-relaxed font-bengali shadow-2xs"
              />

              {/* Recommendation Box */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <label className="text-[11px] font-black text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> চূড়ান্ত অডিট মন্তব্য ও নিষ্পত্তি সুপারিশ:
                </label>
                <textarea
                  rows={2}
                  className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  value={recommendationSummary}
                  onChange={(e) => setRecommendationSummary(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Dynamic Breakdown & Recovery Table (Optional & Full Admin Settable) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <TableIcon size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">
                  ৩. আর্থিক ও অনুচ্ছেদভিত্তিক ব্রেকডাউন টেবিল (ঐচ্ছিক ও কাস্টমাইজযোগ্য)
                </h2>
                <p className="text-[10.5px] text-slate-500 font-bold">
                  যেসব চিঠির ক্ষেত্রে বিস্তারিত হিসাব বা অনুচ্ছেদ রয়েছে কেবল সেখানে টেবিল যুক্ত করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-black text-slate-700">টেবিল যুক্ত করুন:</span>
                <input
                  type="checkbox"
                  checked={hasTable}
                  onChange={(e) => setHasTable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </label>
            </div>
          </div>

          {hasTable && (
            <div className="p-5 space-y-4 animate-in fade-in duration-300">
              {/* Table Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 no-print">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddTableRow}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus size={13} /> রো যোগ করুন
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTableColumn}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus size={13} /> কলাম যোগ করুন
                  </button>
                </div>

                {/* Cell Marking Color Palette */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[10.5px] font-black text-slate-600 flex items-center gap-1">
                    <Palette size={12} className="text-indigo-600" /> সেল মার্কিং রং:
                  </span>
                  {[
                    { color: "#ecfdf5", name: "সবুজ (আদায়)" },
                    { color: "#fef3c7", name: "হলুদ (সমন্বয়)" },
                    { color: "#ffe4e6", name: "লাল (জড়িত/অনিষ্পন্ন)" },
                    { color: "#eff6ff", name: "নীল (সাধারণ)" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setSelectedCellColor(c.color)}
                      className={`w-5 h-5 rounded-md border text-[9px] transition-transform ${
                        selectedCellColor === c.color ? "ring-2 ring-indigo-500 scale-110" : "opacity-80"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                  <span className="text-[9px] font-bold text-slate-400 ml-1">
                    (যে কোনো সেলে ডাবল ক্লিক করে রং লাগান)
                  </span>
                </div>
              </div>

              {/* Dynamic Responsive Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-2xs bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      {tableColumns.map((col) => (
                        <th
                          key={col.id}
                          className="px-3 py-2.5 text-xs font-black border-r border-slate-300 relative group"
                        >
                          <div className="flex items-center justify-between gap-1">
                            {editingColumnId === col.id ? (
                              <input
                                type="text"
                                className="w-full px-1 py-0.5 text-xs font-black bg-white border border-blue-400 rounded outline-none"
                                value={col.label}
                                autoFocus
                                onBlur={() => setEditingColumnId(null)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTableColumns(
                                    tableColumns.map((c) => (c.id === col.id ? { ...c, label: val } : c))
                                  );
                                }}
                              />
                            ) : (
                              <span
                                onDoubleClick={() => setEditingColumnId(col.id)}
                                className="cursor-pointer hover:text-blue-700"
                                title="ডাবল ক্লিক করে কলামের নাম পরিবর্তন করুন"
                              >
                                {col.label}
                              </span>
                            )}

                            {tableColumns.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTableColumn(col.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-500 hover:text-rose-700 transition-opacity no-print"
                                title="কলাম মুছুন"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center text-xs font-black w-12 no-print">মুছুন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rIdx) => (
                      <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                        {tableColumns.map((col) => {
                          const cellVal = row.cells[col.id] || "";
                          const cellBg = row.cellColors?.[col.id] || "transparent";

                          return (
                            <td
                              key={col.id}
                              style={{ backgroundColor: cellBg }}
                              onDoubleClick={() => handleApplyCellColor(row.id, col.id)}
                              className="px-2 py-1.5 text-xs border-r border-slate-200 transition-colors"
                              title="ডাবল ক্লিক করে নির্বাচিত রং দিন/মুছুন"
                            >
                              <input
                                type="text"
                                className="w-full px-1.5 py-1 bg-transparent text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                                value={cellVal}
                                onChange={(e) => handleUpdateCell(row.id, col.id, e.target.value)}
                              />
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center no-print">
                          {tableRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="রো মুছুন"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Auto Calculation Total Row */}
                    {(totalInvolved !== null || totalRecovered !== null || totalAdjusted !== null) && (
                      <tr className="bg-slate-100/80 font-black border-t-2 border-slate-300">
                        {tableColumns.map((col, cIdx) => {
                          if (cIdx === 0) {
                            return (
                              <td key={col.id} className="px-3 py-2 text-xs text-blue-900 border-r border-slate-300">
                                সর্বমোট
                              </td>
                            );
                          }
                          if (col.label.includes("জড়িত") && totalInvolved !== null) {
                            return (
                              <td key={col.id} className="px-3 py-2 text-xs text-rose-700 border-r border-slate-300">
                                {toBengaliDigits(totalInvolved.toString())} ৳
                              </td>
                            );
                          }
                          if (col.label.includes("আদায়") && totalRecovered !== null) {
                            return (
                              <td key={col.id} className="px-3 py-2 text-xs text-emerald-700 border-r border-slate-300">
                                {toBengaliDigits(totalRecovered.toString())} ৳
                              </td>
                            );
                          }
                          if (col.label.includes("সমন্বয়") && totalAdjusted !== null) {
                            return (
                              <td key={col.id} className="px-3 py-2 text-xs text-amber-700 border-r border-slate-300">
                                {toBengaliDigits(totalAdjusted.toString())} ৳
                              </td>
                            );
                          }
                          if (col.label.includes("অনিষ্পন্ন") && totalUnsettled !== null) {
                            return (
                              <td key={col.id} className="px-3 py-2 text-xs text-slate-900 border-r border-slate-300">
                                {toBengaliDigits(totalUnsettled.toString())} ৳
                              </td>
                            );
                          }
                          return <td key={col.id} className="border-r border-slate-300"></td>;
                        })}
                        <td className="no-print"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Approval & Jaripatra Floating Action Area */}
        <div className="p-6 bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              ৪. অডিট মন্তব্য চূড়ান্ত অনুমোদন ও জারিপত্র প্রণয়ন
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              মন্তব্য চূড়ান্ত অনুমোদন করলে আপলোডকৃত ফাইল দুটি মেমরি থেকে স্বয়ংক্রিয় মুছে ফেলা হবে এবং জারিপত্র প্রস্তুত হবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isNoteApproved ? (
              <button
                type="button"
                onClick={handleApproveNoteAndPurge}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={3} /> মন্তব্য চূড়ান্ত অনুমোদন ও মেমরি নিষ্কাশন (Approve & Purge)
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> নোট অনুমোদিত
                </span>
                <button
                  type="button"
                  onClick={() => setShowJaripatraView(true)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-orange-500/25 active:scale-95 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer ring-2 ring-amber-300 animate-pulse"
                >
                  <Flame size={16} /> জারিপত্র তৈরি করুন
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Full Official Jaripatra (Issue Letter) Preview & Export */}
      {showJaripatraView && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">সরকারি জারিপত্র ফরম্যাট (Issue Letter)</h3>
                  <p className="text-[10px] text-slate-300 font-bold">স্মারক নং: {jaripatraMemoNo}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintJaripatra}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> প্রিন্ট
                </button>
                <button
                  onClick={() => setShowJaripatraView(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Jaripatra Printable Document Canvas */}
            <div className="p-8 sm:p-12 overflow-y-auto bg-white space-y-6 text-slate-900 font-bengali text-xs leading-relaxed printable-jaripatra">
              {/* Top Government Crest & Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <p className="text-xs font-bold text-slate-600">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                <h2 className="text-base font-black text-slate-900">{OFFICE_HEADER.main}</h2>
                <h3 className="text-sm font-black text-slate-800">{OFFICE_HEADER.sub}</h3>
                <p className="text-xs font-bold text-slate-600">{OFFICE_HEADER.address}</p>
              </div>

              {/* Memo No and Date Row */}
              <div className="flex justify-between items-center text-xs font-bold pt-2">
                <div>
                  <span>স্মারক নং: </span>
                  <input
                    type="text"
                    value={jaripatraMemoNo}
                    onChange={(e) => setJaripatraMemoNo(e.target.value)}
                    className="font-black text-slate-900 border-b border-dotted border-slate-400 outline-none w-64 bg-transparent"
                  />
                </div>
                <div>
                  <span>তারিখ: </span>
                  <span className="font-black text-slate-900">{formatDateBN(jaripatraDate)}</span>
                </div>
              </div>

              {/* Recipient Block */}
              <div className="space-y-1 font-bold pt-2">
                <p>প্রাপক,</p>
                <p className="font-black text-slate-900">ব্যবস্থাপনা পরিচালক / প্রধান নির্বাহী কর্মকর্তা</p>
                <p>{entry.entityName || "সংশ্লিষ্ট প্রতিষ্ঠান"}</p>
                <p>{entry.ministryName || "সংশ্লিষ্ট মন্ত্রণালয়"}</p>
              </div>

              {/* Subject & Reference */}
              <div className="space-y-1 pt-2">
                <p>
                  <span className="font-black text-slate-900">বিষয়: </span>
                  <input
                    type="text"
                    value={jaripatraSubject}
                    onChange={(e) => setJaripatraSubject(e.target.value)}
                    className="font-black text-slate-900 border-b border-dotted border-slate-400 outline-none w-full bg-transparent"
                  />
                </p>
                <p>
                  <span className="font-bold text-slate-700">সূত্র: </span>
                  <input
                    type="text"
                    value={jaripatraReference}
                    onChange={(e) => setJaripatraReference(e.target.value)}
                    className="font-medium text-slate-800 border-b border-dotted border-slate-400 outline-none w-full bg-transparent"
                  />
                </p>
              </div>

              {/* Main Body */}
              <div className="pt-2">
                <textarea
                  rows={4}
                  value={jaripatraBody}
                  onChange={(e) => setJaripatraBody(e.target.value)}
                  className="w-full p-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-xl leading-relaxed outline-none focus:border-blue-400"
                />
              </div>

              {/* Breakdown Table if Included */}
              {hasTable && (
                <div className="pt-2">
                  <p className="text-[11px] font-black text-slate-800 mb-1">নিষ্পত্তিকৃত অনুচ্ছেদের বিবরণী:</p>
                  <table className="w-full border-collapse border border-slate-400 text-center text-[11px]">
                    <thead>
                      <tr className="bg-slate-100">
                        {tableColumns.map((col) => (
                          <th key={col.id} className="border border-slate-400 px-2 py-1 font-black">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.id}>
                          {tableColumns.map((col) => (
                            <td key={col.id} className="border border-slate-400 px-2 py-1 font-medium">
                              {row.cells[col.id] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatory Block */}
              <div className="pt-8 flex justify-end">
                <div className="text-center space-y-1 font-bold">
                  <div className="h-10"></div>
                  <p className="font-black text-slate-900">(স্বাক্ষরিত)</p>
                  <p className="font-black text-slate-900">{signatoryName}</p>
                  <p className="text-[11px] text-slate-600">{signatoryOffice}</p>
                </div>
              </div>

              {/* Copy / Onulipi Block */}
              <div className="pt-6 border-t border-slate-300 space-y-1 text-[11px] text-slate-700">
                <p className="font-black text-slate-900">অনুলিপি সদয় অবগতি ও প্রয়োজনীয় কার্যার্থে প্রেরিত হলো:</p>
                <p>১. মহাপরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, অডিট ভবন, সেগুনবাগিচা, ঢাকা।</p>
                <p>২. সিনিয়র ফাইন্যান্স কন্ট্রোলার / সচিব, {entry.ministryName || 'সংশ্লিষ্ট মন্ত্রণালয়'}।</p>
                <p>৩. গার্ড ফাইল / মাস্টার কপি।</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
              <span className="text-xs text-slate-500 font-bold">
                জারিপত্রটি চূড়ান্ত হলে প্রিন্ট বা সংরক্ষণ করুন
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJaripatraView(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black border border-slate-300 transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  onClick={() => {
                    if (onSaveJaripatra) {
                      onSaveJaripatra(entry, {
                        memoNo: jaripatraMemoNo,
                        date: jaripatraDate,
                        subject: jaripatraSubject,
                        reference: jaripatraReference,
                        body: jaripatraBody,
                      });
                    }
                    alert("জারিপত্র সফলভাবে সিস্টেমে নিবন্ধিত হয়েছে!");
                    setShowJaripatraView(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  <CheckCircle2 size={14} className="inline mr-1" /> জারিপত্র নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagementModule;
