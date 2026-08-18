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
  RotateCcw,
  Building,
  Calendar,
  Hash,
  Coins,
  ShieldCheck,
  Flame,
  Info,
  X,
  Check,
  Copy,
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
  cellColors?: Record<string, string>;
}

export interface ObjectionSummaryRow {
  id: string;
  sl: string;
  entityAndAuditYear: string;
  paraNo: string;
  titleAndDetails: string;
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
  const defaultEntity = entry.entityName || "সোনালী ব্যাংক পিএলসি";
  const defaultMinistry = entry.ministryName || "আর্থিক প্রতিষ্ঠান বিভাগ, অর্থ মন্ত্রণালয়";
  const defaultBranch = entry.branchName || "দর্শনা শাখা, চুয়াডাঙ্গা";
  const defaultAuditYear = entry.auditYear || "২০১১-১৪";

  const [tikaIntroHtml, setTikaIntroHtml] = useState<string>(() => {
    return `<p><strong>টীকা নং- ১১:</strong> উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা <strong>${defaultEntity}</strong>, প্রধান কার্যালয়ের স্মারক নং- <strong>${defaultLetterNo}</strong>, তারিখ: <strong>${defaultLetterDate} খ্রি:</strong> পত্রটি (পৃষ্ঠা নং- ২৯২) দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে <strong>${defaultMinistry}</strong> এর নিয়ন্ত্রণাধীন <strong>${defaultEntity}</strong>, ${defaultBranch} এর <strong>${defaultAuditYear}</strong> নিরীক্ষা বছরের ব্রডশীট জবাবের (পৃষ্ঠা নং- ২৬৮-২৯২) ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।</p>`;
  });

  // 3. Objection Summary Table (ক্রমিক নং, প্রতিষ্ঠানের নাম ও নিরীক্ষা বছর, অনুচ্ছেদ নং, শিরোনাম ও অন্যান্য)
  const defaultParaNo = entry.paraNo ? toBengaliDigits(entry.paraNo) : "১০";
  const defaultTitleAndDetails = `শিরোনাম: ${
    entry.subject || "মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ি ৫৭,৮২৫ টাকা।"
  }\nঅনুচ্ছেদের পৃষ্ঠা নং- ২৯১\nপরিশিষ্ট পৃষ্ঠা নং- ২৯০`;
  const defaultEntityAndAuditYear = `প্রতিষ্ঠান: ${defaultEntity}${
    entry.branchName ? `,\n${entry.branchName}` : defaultBranch ? `,\n${defaultBranch}` : ""
  }\nনিরীক্ষা বছর: ${entry.auditYear || defaultAuditYear}`;

  const [hasObjectionSummaryTable, setHasObjectionSummaryTable] = useState<boolean>(true);
  const [objectionSummaryRows, setObjectionSummaryRows] = useState<ObjectionSummaryRow[]>([
    {
      id: "obj-1",
      sl: "১",
      entityAndAuditYear: defaultEntityAndAuditYear,
      paraNo: defaultParaNo,
      titleAndDetails: defaultTitleAndDetails,
    },
  ]);

  const handleAddObjectionRow = () => {
    const nextSl = toBengaliDigits(objectionSummaryRows.length + 1);
    setObjectionSummaryRows([
      ...objectionSummaryRows,
      {
        id: `obj-${Date.now()}`,
        sl: nextSl,
        entityAndAuditYear: `প্রতিষ্ঠান: ${defaultEntity}\nনিরীক্ষা বছর: ${entry.auditYear || defaultAuditYear}`,
        paraNo: "",
        titleAndDetails: "শিরোনাম: \nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশিষ্ট পৃষ্ঠা নং- ",
      },
    ]);
  };

  const handleDeleteObjectionRow = (id: string) => {
    if (objectionSummaryRows.length <= 1) return;
    setObjectionSummaryRows(objectionSummaryRows.filter((r) => r.id !== id));
  };

  const handleUpdateObjectionRow = (id: string, field: keyof ObjectionSummaryRow, value: string) => {
    setObjectionSummaryRows(
      objectionSummaryRows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // 4. Entity Reply Statement
  const [entityReplyText, setEntityReplyText] = useState<string>(
    `আপত্তিতে উল্লেখিত ৪ টি মাইক্রো ক্রেডিট “জাগো নারী” ঋণ আসল ও সুদসহ আদায় করা হয়েছে (প্রমাণক সংযুক্ত) যা নিচে উপস্থাপন করা হলো:`
  );

  // 5. Dynamic Embedded Table (Loan Recovery / Breakdown)
  const [hasTable, setHasTable] = useState<boolean>(true);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { id: "sl", label: "ক্রমিক" },
    { id: "borrowerName", label: "ঋণগ্রহীতার নাম" },
    { id: "involvedAmount", label: "আপত্তিতে জড়িত টাকা" },
    { id: "principal", label: "আসল" },
    { id: "interest", label: "সুদ" },
    { id: "others", label: "অন্যান্য" },
    { id: "totalRecovered", label: "মোট আদায়" },
    { id: "adjustmentDate", label: "সমন্বয়ের তারিখ" },
  ]);

  const [tableRows, setTableRows] = useState<TableRow[]>([
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
    {
      id: "row-3",
      cells: {
        sl: "৩",
        borrowerName: "মুরশিদা বেগম",
        involvedAmount: "১৪৫০৬",
        principal: "৬৮০০",
        interest: "৭৭০৬",
        others: "-",
        totalRecovered: "১৪৫০৬",
        adjustmentDate: "০৯-০৮-১৬",
      },
      cellColors: {},
    },
    {
      id: "row-4",
      cells: {
        sl: "৪",
        borrowerName: "মো: সাইদ হোসেন",
        involvedAmount: "১৪৩০৭",
        principal: "৩০০০",
        interest: "১১৩০৭",
        others: "-",
        totalRecovered: "১৪৩০৭",
        adjustmentDate: "২২-০৯-১৫",
      },
      cellColors: {},
    },
  ]);

  // 5. Official Conclusion Paragraphs
  const [branchRequestText, setBranchRequestText] = useState<string>(
    "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।"
  );
  const [headOfficeCommentText, setHeadOfficeCommentText] = useState<string>(
    "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।"
  );
  const [presenterCommentText, setPresenterCommentText] = useState<string>(
    "আপত্তিকৃত সমুদয় টাকা আদায় হওয়ায় ও আদায়ের স্বপক্ষে প্রমাণক (২৬৮-২৮৮) সংযুক্ত থাকায় আপত্তিটি নিষ্পত্তি করা যেতে পারে।"
  );
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

  // Helper to execute formatting commands
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

  // AI Run Analysis
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysisStep("নথি ও সংযুক্তি স্ক্যান করা হচ্ছে...");

    try {
      setTimeout(() => {
        setAiAnalysisStep("আপত্তির সারসংক্ষেপ ও জবাবের প্রমাণকসমূহ বিশ্লেষণ চলছে...");
      }, 700);

      setTimeout(() => {
        setAiAnalysisStep("সরকারি প্রমিত কাঠামো অনুযায়ী ড্রাফট নোট ও টেবিল প্রস্তুত হচ্ছে...");
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
          if (data.objectionSummary && Array.isArray(data.objectionSummary) && data.objectionSummary.length > 0) {
            setHasObjectionSummaryTable(true);
            setObjectionSummaryRows(
              data.objectionSummary.map((item: any, i: number) => ({
                id: `obj-ai-${i + 1}`,
                sl: item.sl || toBengaliDigits(i + 1),
                entityAndAuditYear: item.entityAndAuditYear || defaultEntityAndAuditYear,
                paraNo: item.paraNo ? toBengaliDigits(item.paraNo) : defaultParaNo,
                titleAndDetails: item.titleAndDetails || defaultTitleAndDetails,
              }))
            );
          }

          if (data.entityReplyHeader) {
            setEntityReplyText(data.entityReplyHeader.replace(/^স্থানীয় প্রতিষ্ঠানের জবাব:\s*/, ''));
          }
          if (data.conclusionBranch) setBranchRequestText(data.conclusionBranch);
          if (data.conclusionHeadOffice) {
            setHeadOfficeCommentText(data.conclusionHeadOffice.replace(/^প্রধান কার্যালয়ের মন্তব্য:\s*/, ''));
          }
          if (data.conclusionPresenter) {
            setPresenterCommentText(data.conclusionPresenter.replace(/^উপস্থাপনকারীর মন্তব্য:\s*/, ''));
          }
          if (data.conclusionFinal) setFinalSubmissionText(data.conclusionFinal);

          if (data.proposedStatus) setSettlementStatus(data.proposedStatus);

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
    setObjectionFile(null);
    setReplyFile(null);
    setIsFilesPurged(true);
  };

  // Table Handlers
  const handleAddTableRow = () => {
    const nextIdx = tableRows.length + 1;
    const newCells: Record<string, string> = {};
    tableColumns.forEach((col) => {
      if (col.id === "sl" || col.label.includes("ক্রমিক")) newCells[col.id] = toBengaliDigits(nextIdx);
      else if (col.id === "borrowerName" || col.label.includes("নাম")) newCells[col.id] = "";
      else if (col.label.includes("টাকা") || col.id.includes("Amount") || col.id === "principal" || col.id === "interest") newCells[col.id] = "০";
      else newCells[col.id] = "-";
    });
    setTableRows([...tableRows, { id: `row-${Date.now()}`, cells: newCells, cellColors: {} }]);
  };

  const handleDeleteTableRow = (rowId: string) => {
    if (tableRows.length <= 1) return;
    setTableRows(tableRows.filter((r) => r.id !== rowId));
  };

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

  const handleDeleteTableColumn = (colId: string) => {
    if (tableColumns.length <= 2) {
      alert("কমপক্ষে দুটি কলাম থাকা আবশ্যক।");
      return;
    }
    setTableColumns(tableColumns.filter((c) => c.id !== colId));
  };

  const handleUpdateCell = (rowId: string, colId: string, val: string) => {
    setTableRows(
      tableRows.map((r) => (r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: val } } : r))
    );
  };

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

  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [copiedTableSuccess, setCopiedTableSuccess] = useState<boolean>(false);
  const noteDocumentRef = useRef<HTMLDivElement>(null);

  // Numeric totals calculation
  const calculateTotal = (identifier: string): number => {
    return tableRows.reduce((acc, row) => {
      let cellVal = "";
      Object.entries(row.cells).forEach(([colId, v]) => {
        const col = tableColumns.find((c) => c.id === colId);
        if (col && (col.id === identifier || col.label.includes(identifier))) {
          cellVal = String(v || "");
        }
      });
      const num = parseFloat(toEnglishDigits(cellVal || "0").replace(/,/g, "")) || 0;
      return acc + num;
    }, 0);
  };

  const totalInvolved = calculateTotal("জড়িত");
  const totalPrincipal = calculateTotal("আসল");
  const totalInterest = calculateTotal("সুদ");
  const totalRecovered = calculateTotal("আদায়");

  // Generate 100% MS Word & Excel Compatible Objection Information Table
  const generateWordCompatibleObjectionTableHtml = () => {
    if (!hasObjectionSummaryTable || objectionSummaryRows.length === 0) return "";

    const headerCells = `
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
    `;

    const bodyRows = objectionSummaryRows
      .map(
        (r) => `
        <tr style="page-break-inside: avoid; mso-yfti-irow: 1;">
          <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; font-weight: bold; mso-border-alt: solid black .5pt;">
            ${r.sl}
          </td>
          <td style="border: 1.0pt solid #000000; padding: 6pt 8pt; text-align: left; vertical-align: top; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .5pt; line-height: 1.5; white-space: pre-line;">
            ${r.entityAndAuditYear.replace(/\n/g, "<br/>")}
          </td>
          <td style="border: 1.0pt solid #000000; padding: 6pt 5pt; text-align: center; vertical-align: middle; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 11pt; font-weight: bold; mso-border-alt: solid black .5pt;">
            ${r.paraNo}
          </td>
          <td style="border: 1.0pt solid #000000; padding: 6pt 8pt; text-align: left; vertical-align: top; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; mso-border-alt: solid black .5pt; line-height: 1.5; white-space: pre-line;">
            ${r.titleAndDetails.replace(/\n/g, "<br/>")}
          </td>
        </tr>`
      )
      .join("");

    return `
      <table border="1" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; border: 1.0pt solid #000000; mso-border-alt: solid black .75pt; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 10pt 0;">
        <thead>
          <tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes; page-break-inside: avoid;">
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  };

  // Generate 100% MS Word & Excel Compatible HTML Table
  const generateWordCompatibleTableHtml = () => {
    if (!hasTable || tableRows.length === 0) return "";

    const getColWidth = (label: string) => {
      if (label.includes("ক্রমিক")) return "6%";
      if (label.includes("নাম") || label.includes("বিবরণ")) return "24%";
      if (label.includes("জড়িত")) return "12%";
      if (label.includes("আসল")) return "11%";
      if (label.includes("সুদ")) return "11%";
      if (label.includes("অন্যান্য")) return "8%";
      if (label.includes("মোট") || label.includes("আদায়")) return "13%";
      if (label.includes("তারিখ")) return "15%";
      return `${Math.round(100 / (tableColumns.length || 1))}%`;
    };

    const headerCells = tableColumns
      .map(
        (c) => `
        <th style="border: 1.0pt solid #000000; background-color: #E2E8F0; font-weight: bold; text-align: center; vertical-align: middle; padding: 6pt 5pt; font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', 'Arial', sans-serif; font-size: 10.5pt; width: ${getColWidth(
          c.label
        )}; mso-border-alt: solid black .75pt;">
          ${c.label}
        </th>`
      )
      .join("");

    const bodyRows = tableRows
      .map(
        (r) => `
        <tr style="page-break-inside: avoid; mso-yfti-irow: 1;">
          ${tableColumns
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

  // Copy Only Table (Directly for MS Word & Excel)
  const handleCopyTableOnly = async () => {
    try {
      const tablePlainText =
        tableColumns.map((c) => c.label).join("\t") +
        "\n" +
        tableRows
          .map((r) => tableColumns.map((c) => r.cells[c.id] || "-").join("\t"))
          .join("\n") +
        `\nসর্বমোট\t-\t${totalInvolved ? toBengaliDigits(totalInvolved) : "-"}\t${
          totalPrincipal ? toBengaliDigits(totalPrincipal) : "০"
        }\t${totalInterest ? toBengaliDigits(totalInterest) : "০"}\t-\t${
          totalRecovered ? toBengaliDigits(totalRecovered) : "-"
        }\t-`;

      const htmlTable = generateWordCompatibleTableHtml();
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
          ${htmlTable}
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richHtml], { type: "text/html" });
        const blobText = new Blob([tablePlainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tablePlainText);
      }

      setCopiedTableSuccess(true);
      setTimeout(() => setCopiedTableSuccess(false), 3000);
    } catch (err) {
      console.error("Table copy error:", err);
    }
  };

  // Copy Complete Note Sheet (One-click Rich Text & Table copy for MS Word / Docs)
  const handleCopyNoteSheet = async () => {
    try {
      let objectionPlainText = "";
      if (hasObjectionSummaryTable && objectionSummaryRows.length > 0) {
        objectionPlainText =
          "\n[আপত্তি পরিচিতি ছক]\n" +
          "ক্রমিক নং\tপ্রতিষ্ঠানের নাম ও নিরীক্ষা বছর\tঅনুচ্ছেদ নং\tশিরোনাম ও অন্যান্য\n" +
          objectionSummaryRows
            .map(
              (r) =>
                `${r.sl}\t${r.entityAndAuditYear.replace(/\n/g, " ")}\t${r.paraNo}\t${r.titleAndDetails.replace(/\n/g, " ")}`
            )
            .join("\n") +
          "\n";
      }

      let tablePlainText = "";
      if (hasTable && tableRows.length > 0) {
        tablePlainText =
          "\n[আদায়ের বিবরণী ছক]\n" +
          tableColumns.map((c) => c.label).join("\t") +
          "\n" +
          tableRows
            .map((r) => tableColumns.map((c) => r.cells[c.id] || "-").join("\t"))
            .join("\n") +
          `\nসর্বমোট\t-\t${totalInvolved ? toBengaliDigits(totalInvolved) : "-"}\t${
            totalPrincipal ? toBengaliDigits(totalPrincipal) : "০"
          }\t${totalInterest ? toBengaliDigits(totalInterest) : "০"}\t-\t${
            totalRecovered ? toBengaliDigits(totalRecovered) : "-"
          }\t-`;
      }

      const plainText = `${diaryHeader}

${tikaIntroHtml.replace(/<[^>]+>/g, "").trim()}
${objectionPlainText}
স্থানীয় প্রতিষ্ঠানের জবাব: ${entityReplyText}
${tablePlainText}

${branchRequestText}

প্রধান কার্যালয়ের মন্তব্য: ${headOfficeCommentText}

উপস্থাপনকারীর মন্তব্য: ${presenterCommentText}

${finalSubmissionText}`;

      const htmlObjectionTable = generateWordCompatibleObjectionTableHtml();
      const htmlTable = generateWordCompatibleTableHtml();

      const richHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
           <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
           </w:WordDocument>
          </xml>
          <![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <style>
            body, p, div, table { font-family: 'SolaimanLipi', 'Kalpurush', 'Nikosh', 'Vrinda', Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #000000; }
            table { border-collapse: collapse; width: 100%; border: 1.0pt solid #000000; }
            th, td { border: 1.0pt solid #000000; padding: 5pt 6pt; font-size: 10.5pt; }
            th { background-color: #E2E8F0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; margin: 0 auto; padding: 10pt;">
            <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 14pt; border-bottom: 1.0pt solid #000000; padding-bottom: 6pt;">
              ${diaryHeader}
            </div>
            <div style="text-align: justify; margin-bottom: 10pt; line-height: 1.6;">
              ${tikaIntroHtml}
            </div>
            ${htmlObjectionTable}
            <div style="text-align: justify; margin-bottom: 10pt; line-height: 1.6;">
              <strong>স্থানীয় প্রতিষ্ঠানের জবাব: </strong><span>${entityReplyText}</span>
            </div>
            ${htmlTable}
            <div style="text-align: justify; margin-bottom: 10pt; line-height: 1.6;">
              ${branchRequestText}
            </div>
            <div style="text-align: justify; margin-bottom: 10pt; line-height: 1.6;">
              <strong>প্রধান কার্যালয়ের মন্তব্য: </strong><span>${headOfficeCommentText}</span>
            </div>
            <div style="text-align: justify; margin-bottom: 12pt; line-height: 1.6;">
              <strong>উপস্থাপনকারীর মন্তব্য: </strong><span>${presenterCommentText}</span>
            </div>
            <div style="text-align: left; font-weight: bold; margin-top: 14pt;">
              ${finalSubmissionText}
            </div>
          </div>
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([richHtml], { type: "text/html" });
        const blobText = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
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

  // Print Note Sheet
  const handlePrintNoteSheet = () => {
    window.print();
  };

  // Print Jaripatra
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
              <span>নথি ও নোট শিট ব্যবস্থাপনা</span>
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
            <p className="text-[10px] font-bold text-slate-400">জড়িত টাকা</p>
            <p className="text-xs font-black text-slate-800 truncate">{toBengaliDigits(entry.totalAmount || "০")} টাকা</p>
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
                ১. অডিট নথি ও জবাব সংযুক্তি (AI Analysis)
              </h2>
              <p className="text-[10.5px] text-slate-500 font-bold">
                আপত্তি ও জবাবের সফট কপি দিলে এআই স্বয়ংক্রিয়ভাবে প্রমিত নোট ও টেবিল প্রস্তুত করবে
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
                <FileText size={13} className="text-blue-600" /> ক. মূল অডিট আপত্তি / অনুচ্ছেদ
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
              placeholder="অথবা মূল আপত্তির বিবরণ এখানে লিখুন বা পেস্ট করুন..."
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

      {/* MS Word Format Floating Toolbar */}
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
            onClick={handleCopyNoteSheet}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              copiedSuccess
                ? "bg-emerald-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-100"
            }`}
            title="সম্পূর্ণ নোট শিট কপি করুন"
          >
            {copiedSuccess ? <Check size={12} className="text-white" /> : <Copy size={12} />}
            <span>{copiedSuccess ? "নোট কপি হয়েছে!" : "নোট কপি"}</span>
          </button>
          {hasTable && (
            <button
              type="button"
              onClick={handleCopyTableOnly}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                copiedTableSuccess
                  ? "bg-teal-600 text-white"
                  : "bg-teal-800/80 hover:bg-teal-700 text-teal-100"
              }`}
              title="শুধু আদায়ের ছকটি এমএস ওয়ার্ড/এক্সেলে পেস্ট করার উপযোগী করে কপি করুন"
            >
              {copiedTableSuccess ? <Check size={12} className="text-white" /> : <Copy size={12} />}
              <span>{copiedTableSuccess ? "ছক কপি হয়েছে!" : "ছক কপি (Word)"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleAddObjectionRow}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            title="আপত্তি পরিচিতি ছকে নতুন রো যোগ করুন"
          >
            <Plus size={12} /> আপত্তি রো যোগ
          </button>
          <button
            type="button"
            onClick={handleAddTableRow}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            title="আদায়ের বিবরণী ছকে নতুন রো যোগ করুন"
          >
            <Plus size={12} /> আদায় রো যোগ
          </button>
          <button
            type="button"
            onClick={handleAddTableColumn}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Plus size={12} /> কলাম যোগ
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
      {/* THE OFFICIAL GOVERNMENT NOTE SHEET DOCUMENT (সরাসরি ফাইলে লিখন ও প্রিন্ট) */}
      {/* ========================================================================= */}
      <div
        ref={noteDocumentRef}
        className="bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-8 sm:p-14 text-slate-900 font-bengali space-y-6 print:p-0 print:m-0 print:border-none print:shadow-none"
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

        {/* 3. Objection Summary Table (আপত্তি পরিচিতি ছক) */}
        {hasObjectionSummaryTable && objectionSummaryRows.length > 0 && (
          <div className="space-y-2 pt-1">
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
                  {objectionSummaryRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-50/60 transition-colors group">
                      {/* 1. SL */}
                      <td className="border border-slate-900 p-2 text-center align-middle font-bold text-slate-900">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={row.sl}
                            onChange={(e) => handleUpdateObjectionRow(row.id, "sl", e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                          />
                          {objectionSummaryRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteObjectionRow(row.id)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 no-print transition-opacity p-0.5"
                              title="রো মুছুন"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 2. Entity & Audit Year */}
                      <td className="border border-slate-900 p-2 text-left align-top leading-relaxed text-slate-900">
                        <textarea
                          rows={3}
                          value={row.entityAndAuditYear}
                          onChange={(e) =>
                            handleUpdateObjectionRow(row.id, "entityAndAuditYear", e.target.value)
                          }
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed"
                          placeholder="প্রতিষ্ঠান: ...&#10;নিরীক্ষা বছর: ..."
                        />
                      </td>

                      {/* 3. Para No */}
                      <td className="border border-slate-900 p-2 text-center align-middle font-bold text-slate-900">
                        <input
                          type="text"
                          value={row.paraNo}
                          onChange={(e) => handleUpdateObjectionRow(row.id, "paraNo", e.target.value)}
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                          placeholder="১০"
                        />
                      </td>

                      {/* 4. Title & Details */}
                      <td className="border border-slate-900 p-2 text-left align-top leading-relaxed text-slate-900">
                        <textarea
                          rows={3}
                          value={row.titleAndDetails}
                          onChange={(e) =>
                            handleUpdateObjectionRow(row.id, "titleAndDetails", e.target.value)
                          }
                          className="w-full bg-transparent outline-none resize-none font-bengali text-xs sm:text-[12.5px] leading-relaxed"
                          placeholder="শিরোনাম: ...&#10;অনুচ্ছেদের পৃষ্ঠা নং- ...&#10;পরিশিষ্ট পৃষ্ঠা নং- ..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Entity Reply Statement (হুবহু জবাব, বানান শুদ্ধ ও মূল কথা বজায় রেখে) */}
        <div className="space-y-2 pt-1">
          <div
            className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-colors"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const text = e.currentTarget.innerText;
              setEntityReplyText(text.replace(/^স্থানীয় প্রতিষ্ঠানের জবাব:\s*/, ''));
            }}
          >
            <span className="font-black text-slate-900">স্থানীয় প্রতিষ্ঠানের জবাব: </span>
            <span className="font-bold text-slate-900">{entityReplyText}</span>
          </div>
        </div>

        {/* 4. Embedded Table: Loan Recovery / Breakdown Grid */}
        {hasTable && (
          <div className="space-y-2 pt-1">
            <div className="overflow-x-auto rounded-lg border border-slate-800 shadow-2xs">
              <table className="w-full text-xs sm:text-[12px] border-collapse border border-slate-800 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-black text-center border-b border-slate-800">
                    {tableColumns.map((col) => (
                      <th key={col.id} className="border border-slate-800 p-2 text-center relative group">
                        <div className="flex items-center justify-center gap-1">
                          <span>{col.label}</span>
                          {tableColumns.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTableColumn(col.id)}
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
                  {tableRows.map((row) => (
                    <tr key={row.id} className="text-center hover:bg-slate-50 transition-colors">
                      {tableColumns.map((col) => {
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
                              onChange={(e) => handleUpdateCell(row.id, col.id, e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-medium text-slate-900 p-1 rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCellColor(row.id, col.id)}
                              className="absolute right-0.5 top-0.5 opacity-0 group-hover/cell:opacity-100 p-0.5 bg-white/90 text-slate-400 hover:text-blue-600 rounded text-[8px] no-print shadow-2xs"
                              title="রঙ দিন"
                            >
                              <Palette size={9} />
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-1 text-center no-print border border-slate-800">
                        {tableRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTableRow(row.id)}
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
                    {tableColumns.map((col, idx) => {
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
          </div>
        )}

        {/* 5. Conclusions Flow in Exact Sequence as Images */}
        <div className="space-y-3.5 pt-3 text-xs sm:text-[13px] leading-relaxed">
          {/* Branch Request */}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setBranchRequestText(e.currentTarget.innerText)}
            className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] font-medium text-slate-900 outline-none leading-relaxed text-justify"
          >
            {branchRequestText}
          </div>

          {/* Head Office Comment: Exact baseline alignment */}
          <div
            className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] leading-relaxed text-justify outline-none"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const text = e.currentTarget.innerText;
              setHeadOfficeCommentText(text.replace(/^প্রধান কার্যালয়ের মন্তব্য:\s*/, ''));
            }}
          >
            <span className="font-black text-slate-900">প্রধান কার্যালয়ের মন্তব্য: </span>
            <span className="font-bold text-slate-900">{headOfficeCommentText}</span>
          </div>

          {/* Presenter Comment: Highlighted Core AI Task & Exact baseline alignment */}
          <div
            className="p-2 -ml-1 bg-indigo-50/50 border border-dashed border-indigo-300 hover:border-indigo-500 focus:border-indigo-600 rounded-xl text-xs sm:text-[13px] leading-relaxed text-justify outline-none transition-all shadow-2xs relative group/presenter"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const text = e.currentTarget.innerText;
              setPresenterCommentText(text.replace(/^উপস্থাপনকারীর মন্তব্য:\s*/, ''));
            }}
          >
            <span className="font-black text-slate-900">উপস্থাপনকারীর মন্তব্য: </span>
            <span className="font-bold text-slate-900">{presenterCommentText}</span>
          </div>

          {/* Final Submission: Left-aligned with standard note margin */}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => setFinalSubmissionText(e.currentTarget.innerText)}
            className="p-1 -ml-1 bg-transparent border border-dashed border-transparent hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs sm:text-[13px] font-black text-slate-900 outline-none text-left"
          >
            {finalSubmissionText}
          </div>
        </div>

        {/* 6. Signature Block */}
        <div className="pt-10 flex justify-between items-end text-xs">
          <div className="text-slate-600 font-bold space-y-1">
            <p>পরিস্থিতি: <span className="text-emerald-700 font-black">{settlementStatus}</span></p>
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

              {hasTable && (
                <div className="pt-2">
                  <table className="w-full border-collapse border border-slate-800 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-black border-b border-slate-800 text-center">
                        {tableColumns.map((col) => (
                          <th key={col.id} className="border border-slate-800 p-1.5">{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((r) => (
                        <tr key={r.id} className="text-center">
                          {tableColumns.map((col) => (
                            <td key={col.id} className="border border-slate-800 p-1.5">{r.cells[col.id] || "-"}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="font-black bg-slate-50 text-center border-t-2 border-slate-800">
                        <td className="border border-slate-800 p-1.5">সর্বমোট</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                        <td className="border border-slate-800 p-1.5">{totalInvolved ? toBengaliDigits(totalInvolved) : "-"}</td>
                        <td className="border border-slate-800 p-1.5">{toBengaliDigits(totalPrincipal || 0)}</td>
                        <td className="border border-slate-800 p-1.5">{toBengaliDigits(totalInterest || 0)}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                        <td className="border border-slate-800 p-1.5">{totalRecovered ? toBengaliDigits(totalRecovered) : "-"}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-1">
                <p className="font-black text-slate-900">এ কার্যালয়ের চূড়ান্ত মন্তব্য:</p>
                <p className="font-bold text-emerald-800">{presenterCommentText}</p>
              </div>

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
