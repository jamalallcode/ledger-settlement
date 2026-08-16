import React, { useState, useRef } from "react";
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

export interface TableColumn {
  id: string;
  label: string;
}

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

  // 2. Tika / Introductory Note Body
  const defaultLetterNo = entry.letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২";
  const defaultLetterDate = entry.letterDate ? formatDateBN(entry.letterDate) : "২৭/০৭/২০২৬";
  const defaultEntity = entry.entityName || "পাটকল সংস্থা";
  const defaultMinistry = entry.ministryName || "বস্ত্র ও পাট মন্ত্রণালয়";
  const defaultBranch = entry.branchName || "দর্শনা শাখা, চুয়াডাঙ্গা";
  const defaultAuditYear = entry.auditYear || "২০১০-১১, ২০১৪-১৫, ২০১৫-১৬, ২০১৮-১৯";

  const [tikaIntroHtml, setTikaIntroHtml] = useState<string>(() => {
    return `<p><strong>টীকা নং- ১১:</strong> উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা <strong>${defaultEntity}</strong>, প্রধান কার্যালয়ের স্মারক নং- <strong>${defaultLetterNo}</strong>, তারিখ: <strong>${defaultLetterDate} খ্রি:</strong> পত্রটি (পৃষ্ঠা নং- ২৯২) দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে <strong>${defaultMinistry}</strong> এর নিয়ন্ত্রণাধীন <strong>${defaultEntity}</strong>, ${defaultBranch} এর <strong>${defaultAuditYear}</strong> নিরীক্ষা বছরের ব্রডশীট জবাবের (পৃষ্ঠা নং- ২৬৮-২৯২) ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।</p>`;
  });

  // 3. Multi-Paragraphs State (প্রতিটি অনুচ্ছেদের জন্য পৃথক ছক, জবাব, টেবিল ও মন্তব্য)
  const defaultParaNo = entry.paraNo ? toBengaliDigits(entry.paraNo) : "১০";
  const defaultTitleAndDetails = `শিরোনাম: ${
    entry.subject || "মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ি ৫৭,৮২৫ টাকা।"
  }\nঅনুচ্ছেদের পৃষ্ঠা নং- ২৯১\nপরিশিষ্ট পৃষ্ঠা নং- ২৯০`;
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

  // Jaripatra State
  const [showJaripatraView, setShowJaripatraView] = useState<boolean>(false);
  const [jaripatraMemoNo, setJaripatraMemoNo] = useState<string>(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `০৭.০২.০০০০.৮০১.০২.${toBengaliDigits(randomSuffix)}.${new Date().getFullYear().toString().slice(-2)}`;
  });
  const [jaripatraDate, setJaripatraDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [jaripatraSubject, setJaripatraSubject] = useState<string>(() => {
    return `${entry.entityName || defaultEntity} এর ${entry.auditYear || defaultAuditYear} নিরীক্ষা বর্ষের অডিট আপত্তি নিষ্পত্তি সংক্রান্ত জারিপত্র।`;
  });
  const [jaripatraReference, setJaripatraReference] = useState<string>(() => {
    return `আপনাদের পত্র নং: ${entry.letterNo || defaultLetterNo}, তারিখ: ${formatDateBN(entry.letterDate || defaultLetterDate)}`;
  });
  const [jaripatraBody, setJaripatraBody] = useState<string>(() => {
    return `উপযুক্ত বিষয় ও সূত্রের পরিপ্রেক্ষিতে জানানো যাচ্ছে যে, আপনার কার্যালয়ের ${entry.auditYear || defaultAuditYear} নিরীক্ষা বর্ষের অডিট আপত্তির বিপরীতে প্রেরিত জবাব এবং সংযুক্ত প্রমাণকসমূহ অত্র কার্যালয়ে পরীক্ষা ও নিরীক্ষা করা হয়েছে। দাখিলকৃত রেকর্ডপত্র ও ব্যাখ্যা সন্তোষজনক প্রতীয়মান হওয়ায় নিম্নবর্ণিত বিবরণ অনুযায়ী আপত্তিটি নিষ্পত্তি করা হলো:`;
  });
  const [signatoryName] = useState<string>("উপপরিচালক");
  const [signatoryOffice] = useState<string>("বাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা");

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
    setParagraphs([...paragraphs, newPara]);
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

  // AI Run Analysis
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysisStep("নথি ও সংযুক্তি স্ক্যান করা হচ্ছে...");

    try {
      setTimeout(() => {
        setAiAnalysisStep("আপত্তির সারসংক্ষেপ ও জবাবের প্রমাণকসমূহ বিশ্লেষণ চলছে...");
      }, 700);

      setTimeout(() => {
        setAiAnalysisStep("সরকারি প্রমিত কাঠামো অনুযায়ী ড্রাফট নোট ও পৃথক অনুচ্ছেদ প্রস্তুত হচ্ছে...");
      }, 1400);

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

      if (resJson.success && resJson.data) {
        const data = resJson.data;

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

          // Handle Multi-Paragraphs payload
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
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
              {entry.entityName || 'প্রতিষ্ঠান'} | {entry.branchName || 'শাখা'} | {entry.auditYear || 'নিরীক্ষা বছর'}
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
            onClick={handlePrintNoteSheet}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={14} /> নোট শিট প্রিন্ট
          </button>

          {isNoteApproved && (
            <button
              type="button"
              onClick={() => setShowJaripatraView(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Flame size={14} /> জারিপত্র দেখুন
            </button>
          )}
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

      {/* SECTION 1: AI Analysis & Soft Copy Upload Controller */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                ১. অডিট নথি ও জবাব সংযুক্তি (AI Multi-Paragraph Analysis)
              </h2>
              <p className="text-[10.5px] text-slate-500 font-bold">
                আপত্তি ও জবাবের সফট কপি দিলে এআই স্বয়ংক্রিয়ভাবে প্রতিটি অনুচ্ছেদ ও সংশ্লিষ্ট ছক পৃথকভাবে সাজাবে
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{aiAnalysisStep || "যাচাইকরণ চলছে..."}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} /> এআই দিয়ে খসড়া নোট তৈরি করুন
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

      {/* Formatting and Action Toolbar */}
      <div className="sticky top-2 z-20 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-2 no-print border border-slate-700">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => executeCommand("bold")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Bold (Ctrl+B)"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("italic")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("underline")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Strikethrough"
            >
              <Strikethrough size={13} />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => executeCommand("justifyLeft")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyCenter")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyRight")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand("justifyFull")}
              className="p-1.5 hover:bg-slate-700 text-slate-200 rounded transition-colors"
              title="Justify"
            >
              <AlignJustify size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddParagraph}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            title="নোট শিটে আরও একটি নতুন অনুচ্ছেদ যোগ করুন"
          >
            <Plus size={13} /> + নতুন অনুচ্ছেদ যোগ করুন
          </button>
          <button
            type="button"
            onClick={handleCopyTableOnly}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              copiedTableSuccess
                ? "bg-teal-600 text-white"
                : "bg-teal-800/80 hover:bg-teal-700 text-teal-100"
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
                className={`w-4 h-4 rounded-full border ${selectedCellColor === color ? "ring-2 ring-white scale-110" : "border-slate-600"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THE OFFICIAL GOVERNMENT NOTE SHEET DOCUMENT (হুবহু সরবরাহকৃত ছবির মত)   */}
      {/* ========================================================================= */}
      <div
        ref={noteDocumentRef}
        className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-8 sm:p-14 text-slate-900 font-bengali space-y-7 print:p-0 print:m-0 print:border-none print:shadow-none"
      >
        {/* 1. Official Diary Header Exactly at the Top Center */}
        <div className="text-center pb-4 border-b border-slate-300">
          <div className="inline-block px-4 py-1.5 bg-slate-50 border border-slate-300 rounded-xl shadow-2xs print:border-none print:bg-transparent">
            <input
              type="text"
              className="text-center text-sm sm:text-base font-black text-slate-900 bg-transparent outline-none w-full max-w-lg tracking-wide border-b border-transparent focus:border-blue-500"
              value={diaryHeader}
              onChange={(e) => setDiaryHeader(e.target.value)}
              title="ডায়েরি নং ও তারিখ"
            />
          </div>
        </div>

        {/* 2. Main Note Body: Tika No. 11 & Official Introduction */}
        <div className="space-y-3">
          <div
            ref={tikaEditorRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setTikaIntroHtml(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: tikaIntroHtml }}
            className="p-3 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-xl text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-all font-bengali"
          />
        </div>

        {/* 3. MULTI-PARAGRAPH RENDER LOOP: প্রতিটি অনুচ্ছেদের জন্য পৃথক ছক, জবাব, টেবিল ও মন্তব্য */}
        <div className="space-y-10">
          {paragraphs.map((para, pIndex) => (
            <div
              key={para.id}
              className="space-y-4 pt-4 border-t-2 border-slate-200/80 first:border-t-0 first:pt-0 relative group/para"
            >
              {/* Paragraph Index Badge & Controls (No print) */}
              <div className="flex items-center justify-between no-print mb-1">
                <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black border border-slate-300">
                  অনুচ্ছেদ #{toBengaliDigits(pIndex + 1)} (অনুচ্ছেদ নং: {para.paraNo || "-"})
                </span>
                {paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteParagraph(para.id)}
                    className="px-2.5 py-1 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> অনুচ্ছেদ মুছুন
                  </button>
                )}
              </div>

              {/* ক. আপত্তি পরিচিতি ছক (Table exactly matching screenshot) */}
              <div className="overflow-x-auto rounded-lg border border-slate-900 shadow-2xs">
                <table className="w-full text-xs sm:text-[12.5px] border-collapse border border-slate-900 bg-white">
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
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
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
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed"
                          placeholder="প্রতিষ্ঠান: ...&#10;নিরীক্ষা বছর: ..."
                        />
                      </td>

                      {/* 3. Para No */}
                      <td className="border border-slate-900 p-2 text-center align-middle font-bold text-slate-900">
                        <input
                          type="text"
                          value={para.paraNo}
                          onChange={(e) => handleUpdateParagraphField(para.id, "paraNo", e.target.value)}
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
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
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed"
                          placeholder="শিরোনাম: ...&#10;অনুচ্ছেদের পৃষ্ঠা নং- ...&#10;পরিশিষ্ট পৃষ্ঠা নং- ..."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* খ. স্থানীয় প্রতিষ্ঠানের জবাব (Editable Bengali Text) */}
              <div className="space-y-2 pt-1">
                <div
                  className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-colors"
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

                {/* গ. টেবিল অন/অফ বাটন (সরবরাহকৃত ছবির মত বাটন) */}
                {!para.hasTable && (
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleParagraphTable(para.id, true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus size={13} /> আদায়ের বিবরণী ছক যুক্ত করুন (যদি হিসাবে ছক প্রয়োজন হয়)
                    </button>
                  </div>
                )}
              </div>

              {/* ঘ. Embedded Table: Loan Recovery / Breakdown Grid for this Paragraph */}
              {para.hasTable && (
                <div className="space-y-2 pt-1">
                  <div className="overflow-x-auto rounded-lg border border-slate-800 shadow-2xs">
                    <table className="w-full text-xs sm:text-[12px] border-collapse border border-slate-800 bg-white">
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
                                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 no-print transition-opacity"
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
                                    className="w-full text-center bg-transparent outline-none font-medium text-slate-900 p-1 rounded"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleApplyParagraphTableCellColor(para.id, row.id, col.id)}
                                    className="absolute right-0.5 top-0.5 opacity-0 group-hover/cell:opacity-100 p-0.5 bg-white/90 text-slate-400 hover:text-blue-600 rounded text-[8px] no-print shadow-2xs"
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
                                  className="text-rose-400 hover:text-rose-600 p-0.5"
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

                  {/* Table Row/Column Operations (No-Print) */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 no-print">
                    <button
                      type="button"
                      onClick={() => handleAddParagraphTableRow(para.id)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus size={11} /> রো যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddParagraphTableCol(para.id)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Plus size={11} /> কলাম যোগ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleParagraphTable(para.id, false)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Trash2 size={11} /> ছক বন্ধ/মুছুন
                    </button>
                  </div>
                </div>
              )}

              {/* ঙ. সমাপ্তিসূচক অনুচ্ছেদসমূহ ও মন্তব্য (হুবহু সরবরাহকৃত ছবির বিন্যাস) */}
              <div className="space-y-3.5 pt-2 text-xs sm:text-[13px] leading-relaxed">
                {/* ১. শাখার সমাপ্তিসূচক অনুরোধ */}
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateParagraphField(para.id, "branchRequestText", e.currentTarget.innerText)}
                  className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] font-medium text-slate-900 outline-none leading-relaxed text-justify"
                >
                  {para.branchRequestText}
                </div>

                {/* ২. প্রধান কার্যালয়ের মন্তব্য */}
                <div
                  className="p-2 -ml-1 bg-slate-50/70 border border-dashed border-slate-300 hover:border-slate-400 focus:border-blue-400 rounded-xl text-xs sm:text-[13px] leading-relaxed text-justify outline-none"
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
                  className="p-2 -ml-1 bg-blue-50/50 border border-dashed border-blue-300 hover:border-blue-500 focus:border-blue-600 rounded-xl text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-all shadow-2xs"
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

        {/* 4. সমাপনী অনুচ্ছেদ (সকল অনুচ্ছেদের শেষে একবারে) */}
        <div className="pt-2">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setFinalSubmissionText(e.currentTarget.innerText)}
            className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] font-black text-slate-900 outline-none text-left"
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

      {/* SECTION 4: Final Approval & Memory Purge Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check size={16} /> নোট অনুমোদন ও চূড়ান্ত করুন
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> নোট অনুমোদিত হয়েছে
              </span>
              <button
                type="button"
                onClick={() => setShowJaripatraView(true)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:opacity-95 cursor-pointer"
              >
                <Flame size={15} /> জারিপত্র দেখুন ও প্রিন্ট করুন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: Official Jaripatra Modal / View */}
      {showJaripatraView && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Flame size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">সরকারি জারিপত্র প্রিভিউ ও প্রিন্ট</h3>
                  <p className="text-[11px] font-bold text-slate-500">অনুমোদিত নোটের সিদ্ধান্তের ভিত্তিতে স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintJaripatra}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> প্রিন্ট করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSaveJaripatra) {
                      onSaveJaripatra(entry, { memoNo: jaripatraMemoNo, date: jaripatraDate });
                    }
                    setShowJaripatraView(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 size={14} /> সংরক্ষণ ও বন্ধ
                </button>
                <button
                  type="button"
                  onClick={() => setShowJaripatraView(false)}
                  className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Letter Paper */}
            <div className="p-8 sm:p-12 space-y-6 text-slate-900 font-bengali text-xs leading-relaxed print:p-0 print:m-0">
              <div className="text-center space-y-1 border-b pb-4 border-slate-300">
                <h2 className="text-base font-black tracking-tight">{OFFICE_HEADER.main}</h2>
                <p className="text-xs font-bold text-slate-700">{OFFICE_HEADER.sub}</p>
                <p className="text-[11px] text-slate-600">{OFFICE_HEADER.address}</p>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2">
                <div className="flex items-center gap-1">
                  <span>স্মারক নং:</span>
                  <input
                    type="text"
                    className="bg-transparent border-b border-dashed border-slate-400 font-black text-slate-900 outline-none w-56"
                    value={jaripatraMemoNo}
                    onChange={(e) => setJaripatraMemoNo(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span>তারিখ:</span>
                  <input
                    type="text"
                    className="bg-transparent border-b border-dashed border-slate-400 font-black text-slate-900 outline-none w-28 text-right"
                    value={formatDateBN(jaripatraDate)}
                    onChange={(e) => setJaripatraDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-0.5 font-medium">
                <p className="font-bold">প্রাপক:</p>
                <p className="font-black text-slate-900">ব্যবস্থাপনা পরিচালক / প্রধান নির্বাহী কর্মকর্তা</p>
                <p className="font-bold">{entry.entityName || defaultEntity}</p>
                <p>{entry.ministryName || defaultMinistry}</p>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-start gap-1">
                  <span className="font-black shrink-0">বিষয়:</span>
                  <span className="font-bold underline">{jaripatraSubject}</span>
                </div>
                <div className="flex items-start gap-1 text-slate-700">
                  <span className="font-bold shrink-0">সূত্র:</span>
                  <span>{jaripatraReference}</span>
                </div>
              </div>

              <div className="pt-2 text-justify">
                <p className="leading-relaxed">{jaripatraBody}</p>
              </div>

              {/* Multi-Paragraph Tables in Jaripatra */}
              {paragraphs.map((para) => (
                <div key={para.id} className="space-y-2 pt-2">
                  <p className="font-black text-slate-900">
                    অনুচ্ছেদ নং- {para.paraNo}: {para.entityReplyText}
                  </p>
                  {para.hasTable && para.tableRows.length > 0 && (
                    <table className="w-full border-collapse border border-slate-800 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-black border-b border-slate-800 text-center">
                          {para.tableColumns.map((col) => (
                            <th key={col.id} className="border border-slate-800 p-1.5">{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {para.tableRows.map((r) => (
                          <tr key={r.id} className="text-center">
                            {para.tableColumns.map((col) => (
                              <td key={col.id} className="border border-slate-800 p-1.5">{r.cells[col.id] || "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p className="text-[11px] text-slate-800 italic">
                    {para.presenterCommentText}
                  </p>
                </div>
              ))}

              <div className="pt-12 flex justify-end">
                <div className="text-center space-y-1">
                  <div className="w-44 border-b border-slate-800 mx-auto" />
                  <p className="font-black text-slate-900">{signatoryName}</p>
                  <p className="text-[11px] text-slate-600">{signatoryOffice}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-300 text-[11px] space-y-1">
                <p className="font-black">অনুলিপি সদয় অবগতি ও প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য প্রেরিত হলো:</p>
                <p>১. সচিব, {entry.ministryName || defaultMinistry}।</p>
                <p>২. মহাপরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, ঢাকা।</p>
                <p>৩. সংশ্লিষ্ট নথি / মাস্টার কপি।</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagementModule;
