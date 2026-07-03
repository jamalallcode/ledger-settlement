import React, { useMemo } from 'react';
import { Printer, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber } from '../utils/numberUtils';
import { format, subMonths, addMonths, setDate, format as dateFnsFormat } from 'date-fns';
import HighlightText from './HighlightText';
import { SettlementEntry } from '../types';
import { MINISTRY_ENTITY_MAP, ENTRY_START_DATE } from '../constants';

interface QRProps {
  entries: SettlementEntry[];
  prevStats: any;
  activeCycle: any;
  IDBadge: React.FC<{ id: string }>;
  onBack?: () => void;
  searchTerm?: string;
  filterMinistry?: string;
  monthPickerElement?: React.ReactNode;
  customTitle?: string;
}

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

// Categorization helper
const isFinancialInstitution = (ministryName: string) => {
  return robustNormalize(ministryName).includes(robustNormalize('আর্থিক প্রতিষ্ঠান বিভাগ'));
};

const QR_3: React.FC<QRProps> = ({ entries, prevStats, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle }) => {
  // Standard calendar quarter date calculation:
  // Quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
  // Each quarter start date is the 16th of the month preceding the quarter's start month.
  // Each quarter end date is the 15th of the quarter's end month.
  const getQuarterInfo = (date: Date) => {
    const cycleEndMonth = date.getMonth(); // 0 to 11
    const year = date.getFullYear();
    let quarterStartMonth = 0;
    let quarterEndMonth = 2;
    let quarterYear = year;

    if (cycleEndMonth >= 0 && cycleEndMonth <= 2) {
      quarterStartMonth = 0; // Jan
      quarterEndMonth = 2;   // Mar
    } else if (cycleEndMonth >= 3 && cycleEndMonth <= 5) {
      quarterStartMonth = 3; // Apr
      quarterEndMonth = 5;   // Jun
    } else if (cycleEndMonth >= 6 && cycleEndMonth <= 8) {
      quarterStartMonth = 6; // Jul
      quarterEndMonth = 8;   // Sep
    } else {
      quarterStartMonth = 9; // Oct
      quarterEndMonth = 11;  // Dec
    }

    const start = new Date(quarterYear, quarterStartMonth, 1);
    const end = new Date(quarterYear, quarterEndMonth + 1, 0);
    
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const startMonthName = months[quarterStartMonth];
    const endMonthName = months[quarterEndMonth];
    
    const startYearShort = format(new Date(quarterYear, quarterStartMonth, 1), 'yy');
    const endYearShort = format(new Date(quarterYear, quarterEndMonth, 1), 'yy');

    const formattedRange = `${startMonthName}/${toBengaliDigits(startYearShort)} হতে ${endMonthName}/${toBengaliDigits(endYearShort)}`;
    
    return {
      startDate: start,
      endDate: end,
      startMonthName,
      endMonthName,
      formattedRange
    };
  };

  const { startDate, endDate, startMonthName, endMonthName, formattedRange } = getQuarterInfo(activeCycle.end);
  const prevMonthDate = subMonths(startDate, 1);

  const getPrevQuarterEndInfo = () => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const cycleEndMonth = activeCycle.end.getMonth(); // 0 to 11
    const quarterYear = activeCycle.end.getFullYear();
    
    let quarterStartMonth = 0;
    if (cycleEndMonth >= 0 && cycleEndMonth <= 2) {
      quarterStartMonth = 0; // Jan
    } else if (cycleEndMonth >= 3 && cycleEndMonth <= 5) {
      quarterStartMonth = 3; // Apr
    } else if (cycleEndMonth >= 6 && cycleEndMonth <= 8) {
      quarterStartMonth = 6; // Jul
    } else {
      quarterStartMonth = 9; // Oct
    }
    
    let prevMonthIdx = 0;
    let prevYear = quarterYear;
    
    if (quarterStartMonth === 0) { // Jan
      prevMonthIdx = 11; // Dec
      prevYear = quarterYear - 1;
    } else if (quarterStartMonth === 3) { // Apr
      prevMonthIdx = 2; // Mar
    } else if (quarterStartMonth === 6) { // Jul
      prevMonthIdx = 5; // Jun
    } else if (quarterStartMonth === 9) { // Oct
      prevMonthIdx = 8; // Sep
    }
    
    return {
      monthName: months[prevMonthIdx],
      year: toBengaliDigits(prevYear.toString())
    };
  };
  
  const prevQuarterEnd = getPrevQuarterEndInfo();

  // Dynamic extraction of all Table 1 entities from MINISTRY_ENTITY_MAP
  const table1EntitiesList = useMemo(() => {
    const list: { ministryName: string; entityName: string }[] = [];
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (!isFinancialInstitution(mName)) {
        entities.forEach(ent => {
          list.push({ ministryName: mName, entityName: ent });
        });
      }
    });
    return list;
  }, []);

  // Dynamic extraction of all Table 2 entities from MINISTRY_ENTITY_MAP
  const table2EntitiesList = useMemo(() => {
    const list: { ministryName: string; entityName: string }[] = [];
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (isFinancialInstitution(mName)) {
        entities.forEach(ent => {
          list.push({ ministryName: mName, entityName: ent });
        });
      }
    });
    return list;
  }, []);

  const [isPrevLedgerOpen, setIsPrevLedgerOpen] = React.useState(false);
  const [isPrevLedgerTable2Open, setIsPrevLedgerTable2Open] = React.useState(false);

  // Helper to get base starting values from prevStats
  const getEntityStats = (entName: string) => {
    const baseMap = prevStats?.entitiesNonSFI || {};
    let stats = baseMap[entName];
    if (!stats) {
      const keys = Object.keys(baseMap);
      const foundKey = keys.find(k => robustNormalize(k).includes(robustNormalize(entName)) || robustNormalize(entName).includes(robustNormalize(k)));
      if (foundKey) {
        stats = baseMap[foundKey];
      }
    }
    return stats || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
  };

  const [prevLedgerTable1Data, setPrevLedgerTable1Data] = React.useState<Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }>>(() => {
    const saved = localStorage.getItem('qr3_table1_prev_ledger_june2025');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
    table1EntitiesList.forEach(({ entityName }) => {
      const base = getEntityStats(entityName);
      defaults[entityName] = {
        june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
        june25Settled: (base?.settledCount || 0),
        june25UnsettledAmount: (base?.unsettledAmount || 0)
      };
    });
    return defaults;
  });

  const [prevLedgerTable2Data, setPrevLedgerTable2Data] = React.useState<Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }>>(() => {
    const saved = localStorage.getItem('qr3_table2_prev_ledger_june2025');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
    table2EntitiesList.forEach(({ entityName }) => {
      const base = getEntityStats(entityName);
      defaults[entityName] = {
        june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
        june25Settled: (base?.settledCount || 0),
        june25UnsettledAmount: (base?.unsettledAmount || 0)
      };
    });
    return defaults;
  });

  const handleSavePrevLedgerTable1 = (updated: typeof prevLedgerTable1Data) => {
    setPrevLedgerTable1Data(updated);
    localStorage.setItem('qr3_table1_prev_ledger_june2025', JSON.stringify(updated));
  };

  const handleSavePrevLedgerTable2 = (updated: typeof prevLedgerTable2Data) => {
    setPrevLedgerTable2Data(updated);
    localStorage.setItem('qr3_table2_prev_ledger_june2025', JSON.stringify(updated));
  };

  const handleInputChangeTable1 = (entName: string, field: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount', value: number) => {
    const updated = {
      ...prevLedgerTable1Data,
      [entName]: {
        ...(prevLedgerTable1Data[entName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 }),
        [field]: value
      }
    };
    handleSavePrevLedgerTable1(updated);
  };

  const handleInputChangeTable2 = (entName: string, field: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount', value: number) => {
    const updated = {
      ...prevLedgerTable2Data,
      [entName]: {
        ...(prevLedgerTable2Data[entName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 }),
        [field]: value
      }
    };
    handleSavePrevLedgerTable2(updated);
  };

  const prevLedgerRows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    table1EntitiesList.forEach(({ ministryName, entityName }) => {
      const ledger = prevLedgerTable1Data[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
      
      // Calculate transition settled and raised from July 1, 2025 up to cycle start
      const cycleStartStr = dateFnsFormat(startDate, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

        const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        return entryDate !== '' && entryDate >= '2025-07-01' && entryDate < cycleStartStr;
      });

      let transitionRaisedCount = 0;
      let transitionRaisedAmount = 0;
      let transitionSettledCount = 0;
      let transitionSettledAmount = 0;
      const processedParaIds = new Set<string>();

      transitionEntries.forEach(entry => {
        const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          transitionRaisedCount += parseBengaliNumber(rCountRaw);
        }
        if (entry.manualRaisedAmount) transitionRaisedAmount += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

        if (entry.paragraphs) {
          entry.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                transitionSettledCount++; 
                transitionSettledAmount += settledAmt;
              }
            }
          });
        }
      });

      const unsettledCountJune25 = Math.max(0, ledger.june25Raised - ledger.june25Settled);
      const totalSettledCount = ledger.june25Settled + transitionSettledCount;
      const totalUnsettledCount = Math.max(0, ledger.june25Raised + transitionRaisedCount - totalSettledCount);
      const totalUnsettledAmount = Math.max(0, ledger.june25UnsettledAmount + transitionRaisedAmount - transitionSettledAmount);

      rows.push({
        sl,
        ministryName,
        entityName,
        june25Raised: ledger.june25Raised,
        june25Settled: ledger.june25Settled,
        unsettledCountJune25,
        june25UnsettledAmount: ledger.june25UnsettledAmount,
        transitionRaisedCount,
        transitionRaisedAmount,
        transitionSettledCount,
        transitionSettledAmount,
        totalSettledCount,
        totalUnsettledCount,
        totalUnsettledAmount
      });
      
      sl++;
    });

    return rows;
  }, [prevLedgerTable1Data, entries, startDate, table1EntitiesList]);

  const prevLedgerTable2Rows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    table2EntitiesList.forEach(({ ministryName, entityName }) => {
      const ledger = prevLedgerTable2Data[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
      
      // Calculate transition settled and raised from July 1, 2025 up to cycle start
      const cycleStartStr = dateFnsFormat(startDate, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize('নন এসএফআই')) return false;

        const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
        return entryDate !== '' && entryDate >= '2025-07-01' && entryDate < cycleStartStr;
      });

      let transitionRaisedCount = 0;
      let transitionRaisedAmount = 0;
      let transitionSettledCount = 0;
      let transitionSettledAmount = 0;
      const processedParaIds = new Set<string>();

      transitionEntries.forEach(entry => {
        const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          transitionRaisedCount += parseBengaliNumber(rCountRaw);
        }
        if (entry.manualRaisedAmount) transitionRaisedAmount += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

        if (entry.paragraphs) {
          entry.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                transitionSettledCount++; 
                transitionSettledAmount += settledAmt;
              }
            }
          });
        }
      });

      const unsettledCountJune25 = Math.max(0, ledger.june25Raised - ledger.june25Settled);
      const totalSettledCount = ledger.june25Settled + transitionSettledCount;
      const totalUnsettledCount = Math.max(0, ledger.june25Raised + transitionRaisedCount - totalSettledCount);
      const totalUnsettledAmount = Math.max(0, ledger.june25UnsettledAmount + transitionRaisedAmount - transitionSettledAmount);

      rows.push({
        sl,
        ministryName,
        entityName,
        june25Raised: ledger.june25Raised,
        june25Settled: ledger.june25Settled,
        unsettledCountJune25,
        june25UnsettledAmount: ledger.june25UnsettledAmount,
        transitionRaisedCount,
        transitionRaisedAmount,
        transitionSettledCount,
        transitionSettledAmount,
        totalSettledCount,
        totalUnsettledCount,
        totalUnsettledAmount
      });
      
      sl++;
    });

    return rows;
  }, [prevLedgerTable2Data, entries, startDate, table2EntitiesList]);

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRowIndex: number,
    startColField: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) {
      return;
    }

    e.preventDefault();

    const pastedRows = text
      .split(/\r?\n/)
      .map(row => row.split('\t'))
      .filter(row => row.length > 0 && !(row.length === 1 && row[0] === ''));

    if (pastedRows.length === 0) return;

    const fields: Array<'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'> = [
      'june25Raised',
      'june25Settled',
      'june25UnsettledAmount'
    ];
    const startColIndex = fields.indexOf(startColField);

    const updated = { ...prevLedgerTable1Data };

    for (let r = 0; r < pastedRows.length; r++) {
      const rowIndex = startRowIndex + r;
      if (rowIndex >= prevLedgerRows.length) break;

      const entityName = prevLedgerRows[rowIndex].entityName;
      if (!entityName) continue;

      const pastedCols = pastedRows[r];
      for (let c = 0; c < pastedCols.length; c++) {
        const colIndex = startColIndex + c;
        if (colIndex >= fields.length) break;

        const field = fields[colIndex];
        const rawValue = pastedCols[c].trim();
        const value = parseBengaliNumber(rawValue);

        if (!updated[entityName]) {
          updated[entityName] = { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        }
        updated[entityName][field] = value;
      }
    }

    handleSavePrevLedgerTable1(updated);
  };

  const handlePasteTable2 = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRowIndex: number,
    startColField: 'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) {
      return;
    }

    e.preventDefault();

    const pastedRows = text
      .split(/\r?\n/)
      .map(row => row.split('\t'))
      .filter(row => row.length > 0 && !(row.length === 1 && row[0] === ''));

    if (pastedRows.length === 0) return;

    const fields: Array<'june25Raised' | 'june25Settled' | 'june25UnsettledAmount'> = [
      'june25Raised',
      'june25Settled',
      'june25UnsettledAmount'
    ];
    const startColIndex = fields.indexOf(startColField);

    const updated = { ...prevLedgerTable2Data };

    for (let r = 0; r < pastedRows.length; r++) {
      const rowIndex = startRowIndex + r;
      if (rowIndex >= prevLedgerTable2Rows.length) break;

      const entityName = prevLedgerTable2Rows[rowIndex].entityName;
      if (!entityName) continue;

      const pastedCols = pastedRows[r];
      for (let c = 0; c < pastedCols.length; c++) {
        const colIndex = startColIndex + c;
        if (colIndex >= fields.length) break;

        const field = fields[colIndex];
        const rawValue = pastedCols[c].trim();
        const value = parseBengaliNumber(rawValue);

        if (!updated[entityName]) {
          updated[entityName] = { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
        }
        updated[entityName][field] = value;
      }
    }

    handleSavePrevLedgerTable2(updated);
  };

  const prevLedgerGrandTotals = useMemo(() => {
    return prevLedgerRows.reduce((acc, row) => {
      acc.june25Raised += row.june25Raised;
      acc.june25Settled += row.june25Settled;
      acc.unsettledCountJune25 += row.unsettledCountJune25;
      acc.june25UnsettledAmount += row.june25UnsettledAmount;
      acc.transitionRaisedCount += row.transitionRaisedCount;
      acc.transitionRaisedAmount += row.transitionRaisedAmount;
      acc.transitionSettledCount += row.transitionSettledCount;
      acc.transitionSettledAmount += row.transitionSettledAmount;
      acc.totalSettledCount += row.totalSettledCount;
      acc.totalUnsettledCount += row.totalUnsettledCount;
      acc.totalUnsettledAmount += row.totalUnsettledAmount;
      return acc;
    }, {
      june25Raised: 0, june25Settled: 0, unsettledCountJune25: 0, june25UnsettledAmount: 0,
      transitionRaisedCount: 0, transitionRaisedAmount: 0, transitionSettledCount: 0, transitionSettledAmount: 0,
      totalSettledCount: 0, totalUnsettledCount: 0, totalUnsettledAmount: 0
    });
  }, [prevLedgerRows]);

  const prevLedgerTable2GrandTotals = useMemo(() => {
    return prevLedgerTable2Rows.reduce((acc, row) => {
      acc.june25Raised += row.june25Raised;
      acc.june25Settled += row.june25Settled;
      acc.unsettledCountJune25 += row.unsettledCountJune25;
      acc.june25UnsettledAmount += row.june25UnsettledAmount;
      acc.transitionRaisedCount += row.transitionRaisedCount;
      acc.transitionRaisedAmount += row.transitionRaisedAmount;
      acc.transitionSettledCount += row.transitionSettledCount;
      acc.transitionSettledAmount += row.transitionSettledAmount;
      acc.totalSettledCount += row.totalSettledCount;
      acc.totalUnsettledCount += row.totalUnsettledCount;
      acc.totalUnsettledAmount += row.totalUnsettledAmount;
      return acc;
    }, {
      june25Raised: 0, june25Settled: 0, unsettledCountJune25: 0, june25UnsettledAmount: 0,
      transitionRaisedCount: 0, transitionRaisedAmount: 0, transitionSettledCount: 0, transitionSettledAmount: 0,
      totalSettledCount: 0, totalUnsettledCount: 0, totalUnsettledAmount: 0
    });
  }, [prevLedgerTable2Rows]);

  const downloadPrevLedgerExcel = () => {
    const tableElement = document.getElementById('prev-ledger-table-modal');
    if (!tableElement) return;

    const clonedTable = tableElement.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    // Replace inputs with text values in the cloned table
    const inputs = clonedTable.querySelectorAll('input');
    inputs.forEach(input => {
      const parent = input.parentNode;
      if (parent) {
        parent.textContent = input.value;
      }
    });
    interactiveElements.forEach(el => el.remove());

    const filename = `পূর্ব_জের_টেবিল_১_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">টেবিল-১ এর পূর্ব জের (জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত)</h2>
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPrevLedgerTable2Excel = () => {
    const tableElement = document.getElementById('prev-ledger-table-2-modal');
    if (!tableElement) return;

    const clonedTable = tableElement.cloneNode(true) as HTMLTableElement;
    const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
    // Replace inputs with text values in the cloned table
    const inputs = clonedTable.querySelectorAll('input');
    inputs.forEach(input => {
      const parent = input.parentNode;
      if (parent) {
        parent.textContent = input.value;
      }
    });
    interactiveElements.forEach(el => el.remove());

    const filename = `পূর্ব_জের_টেবিল_২_${dateFnsFormat(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">টেবিল-২ এর পূর্ব জের (জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত)</h2>
        ${clonedTable.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumberSimple = (val: number | undefined | null) => {
    if (val === undefined || val === null || val === 0) return '০';
    return toBengaliDigits(Math.round(val).toString());
  };

  const renderPrevLedgerModal = () => {
    if (!isPrevLedgerOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left">
              <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                টেবিল-১ এর পূর্ব জের সেটআপ ও গণনা তালিকা
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                ১৯৭১-৭২ হতে জুন/২০২৫ পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। জুলাই/২০২৫ হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem('qr3_table1_prev_ledger_june2025');
                    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
                    table1EntitiesList.forEach(({ entityName }) => {
                      const base = getEntityStats(entityName);
                      defaults[entityName] = {
                        june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
                        june25Settled: (base?.settledCount || 0),
                        june25UnsettledAmount: (base?.unsettledAmount || 0)
                      };
                    });
                    setPrevLedgerTable1Data(defaults);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black text-[10px] border border-rose-200 transition-all cursor-pointer"
              >
                রিসেট করুন
              </button>
              <button
                type="button"
                onClick={downloadPrevLedgerExcel}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsPrevLedgerOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white relative">
            <div className="p-6 pt-0">
              <table id="prev-ledger-table-modal" className="w-full border-separate border-spacing-0 border-l border-t border-slate-400 !table-auto text-center">
                <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className={`${thCls} w-[45px]`} rowSpan={2}>ক্র নং</th>
                    <th className={`${thCls} w-[150px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                    <th className={`${thCls} w-[180px]`} rowSpan={2}>সংস্থার নাম</th>
                    <th className={`${thCls} w-[130px]`} colSpan={3}>জুন/২০২৫ পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className={`${thCls} w-[240px]`} colSpan={4}>জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className={`${thCls} w-[300px]`} colSpan={3}>১৯৭১-৭২ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ উত্থাপিত</th>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ নিষ্পত্তিকৃত</th>
                    <th className={thCls}>জুন/২৫ অমীমাংসিত টাকা</th>
                    <th className={thCls}>উত্থাপিত সংখ্যা</th>
                    <th className={thCls}>উত্থাপিত টাকা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত টাকা</th>
                    <th className={thCls}>মোট নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন টাকা</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-500">
                    {["১", "২", "৩", "৪ (ইনপুট)", "৫ (ইনপুট)", "৬ (ইনপুট)", "৭ (উত্থাপন)", "৮ (উত্থাপন)", "৯ (মীমাংসা)", "১০ (মীমাংসা)", "১১=৫+৯", "১২=৪+৭-১১", "১৩=৬+৮-১০"].map((l, i) => (
                      <th key={i} className={thCls + " py-1"}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prevLedgerRows.map((row, idx) => {
                    const showMinistry = idx === 0 || prevLedgerRows[idx - 1].ministryName !== row.ministryName;
                    const rowSpan = prevLedgerRows.filter(r => r.ministryName === row.ministryName).length;

                    return (
                      <tr key={row.entityName} className="hover:bg-slate-50 transition-colors">
                        <td className={numTdCls}>{toBengaliDigits(row.sl.toString())}</td>
                        {showMinistry && (
                          <td rowSpan={rowSpan} className={tdCls + " text-[10px] font-black text-center bg-slate-50/10"}>
                            {row.ministryName}
                          </td>
                        )}
                        <td className={tdCls + " text-[10px] font-bold text-left"}>{row.entityName}</td>
                        
                        {/* Input fields with copy-paste listeners */}
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Raised === 0 ? '' : toBengaliDigits(row.june25Raised.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable1(row.entityName, 'june25Raised', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25Raised')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Settled === 0 ? '' : toBengaliDigits(row.june25Settled.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable1(row.entityName, 'june25Settled', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25Settled')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25UnsettledAmount === 0 ? '' : toBengaliDigits(row.june25UnsettledAmount.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable1(row.entityName, 'june25UnsettledAmount', val);
                            }}
                            onPaste={e => handlePaste(e, idx, 'june25UnsettledAmount')}
                          />
                        </td>

                        {/* Read only calculated transition values */}
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {formatNumberSimple(row.transitionRaisedCount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {row.transitionRaisedAmount === 0 ? '০' : formatNumberSimple(row.transitionRaisedAmount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {formatNumberSimple(row.transitionSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-emerald-700 font-extrabold"}>
                          {row.transitionSettledAmount === 0 ? '০' : formatNumberSimple(row.transitionSettledAmount)}
                        </td>

                        {/* Cumulative balances */}
                        <td className={numTdCls + " bg-blue-50/10 font-bold text-slate-900"}>
                          {formatNumberSimple(row.totalSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/20 font-black text-blue-900"}>
                          {formatNumberSimple(row.totalUnsettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/30 font-extrabold text-slate-900"}>
                          {row.totalUnsettledAmount === 0 ? '০' : formatNumberSimple(row.totalUnsettledAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-extrabold text-[10px] text-slate-900">
                    <td className={footerTdCls} colSpan={3}>সর্বমোট</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Raised)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25Settled)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.june25UnsettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionRaisedCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionRaisedAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionSettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.transitionSettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.totalSettledCount)}</td>
                    <td className={footerNumTdCls + " text-blue-900"}>{formatNumberSimple(prevLedgerGrandTotals.totalUnsettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerGrandTotals.totalUnsettledAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer controls */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPrevLedgerOpen(false)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 border-b-4 border-blue-800"
            >
              সংরক্ষণ করুন ও বন্ধ করুন
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderPrevLedgerTable2Modal = () => {
    if (!isPrevLedgerTable2Open) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left">
              <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                টেবিল-২ এর পূর্ব জের সেটআপ ও গণনা তালিকা
              </h2>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                ১৯৭১-৭২ হতে জুন/২০২৫ পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। জুলাই/২০২৫ হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem('qr3_table2_prev_ledger_june2025');
                    const defaults: Record<string, { june25Raised: number; june25Settled: number; june25UnsettledAmount: number }> = {};
                    table2EntitiesList.forEach(({ entityName }) => {
                      const base = getEntityStats(entityName);
                      defaults[entityName] = {
                        june25Raised: (base?.unsettledCount || 0) + (base?.settledCount || 0),
                        june25Settled: (base?.settledCount || 0),
                        june25UnsettledAmount: (base?.unsettledAmount || 0)
                      };
                    });
                    setPrevLedgerTable2Data(defaults);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-black text-[10px] border border-rose-200 transition-all cursor-pointer"
              >
                রিসেট করুন
              </button>
              <button
                type="button"
                onClick={downloadPrevLedgerTable2Excel}
                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsPrevLedgerTable2Open(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer border border-slate-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-white relative">
            <div className="p-6 pt-0">
              <table id="prev-ledger-table-2-modal" className="w-full border-separate border-spacing-0 border-l border-t border-slate-400 !table-auto text-center">
                <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className={`${thCls} w-[45px]`} rowSpan={2}>ক্র নং</th>
                    <th className={`${thCls} w-[150px]`} rowSpan={2}>মন্ত্রণালয়ের নাম</th>
                    <th className={`${thCls} w-[180px]`} rowSpan={2}>সংস্থার নাম</th>
                    <th className={`${thCls} w-[130px]`} colSpan={3}>জুন/২০২৫ পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className={`${thCls} w-[240px]`} colSpan={4}>জুলাই/২০২৫ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className={`${thCls} w-[300px]`} colSpan={3}>১৯৭১-৭২ হতে ${prevQuarterEnd.monthName}/${prevQuarterEnd.year} পর্যন্ত মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ উত্থাপিত</th>
                    <th className={thCls}>১৯৭১-৭২ হতে জুন/২৫ নিষ্পত্তিকৃত</th>
                    <th className={thCls}>জুন/২৫ অমীমাংসিত টাকা</th>
                    <th className={thCls}>উত্থাপিত সংখ্যা</th>
                    <th className={thCls}>উত্থাপিত টাকা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>নিষ্পত্তিকৃত টাকা</th>
                    <th className={thCls}>মোট নিষ্পত্তিকৃত সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন সংখ্যা</th>
                    <th className={thCls}>মোট অনিষ্পন্ন টাকা</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-500">
                    {["১", "২", "৩", "৪ (ইনপুট)", "৫ (ইনপুট)", "৬ (ইনপুট)", "৭ (উত্থাপন)", "৮ (উত্থাপন)", "৯ (মীমাংসা)", "১০ (মীমাংসা)", "১১=৫+৯", "১২=৪+৭-১১", "১৩=৬+৮-১০"].map((l, i) => (
                      <th key={i} className={thCls + " py-1"}>{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prevLedgerTable2Rows.map((row, idx) => {
                    const showMinistry = idx === 0 || prevLedgerTable2Rows[idx - 1].ministryName !== row.ministryName;
                    const rowSpan = prevLedgerTable2Rows.filter(r => r.ministryName === row.ministryName).length;

                    return (
                      <tr key={row.entityName} className="hover:bg-slate-50 transition-colors">
                        <td className={numTdCls}>{toBengaliDigits(row.sl.toString())}</td>
                        {showMinistry && (
                          <td rowSpan={rowSpan} className={tdCls + " text-[10px] font-black text-center bg-slate-50/10"}>
                            {row.ministryName}
                          </td>
                        )}
                        <td className={tdCls + " text-[10px] font-bold text-left"}>{row.entityName}</td>
                        
                        {/* Input fields with copy-paste listeners */}
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Raised === 0 ? '' : toBengaliDigits(row.june25Raised.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable2(row.entityName, 'june25Raised', val);
                            }}
                            onPaste={e => handlePasteTable2(e, idx, 'june25Raised')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25Settled === 0 ? '' : toBengaliDigits(row.june25Settled.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable2(row.entityName, 'june25Settled', val);
                            }}
                            onPaste={e => handlePasteTable2(e, idx, 'june25Settled')}
                          />
                        </td>
                        <td className="border-r border-b border-slate-400 p-1 bg-amber-50/20">
                          <input
                            type="text"
                            className="w-full text-center font-black text-xs bg-amber-50/30 hover:bg-amber-100/40 focus:bg-white border border-amber-200 hover:border-amber-300 focus:border-blue-500 rounded px-1.5 py-1 text-slate-900 outline-none transition-all"
                            value={row.june25UnsettledAmount === 0 ? '' : toBengaliDigits(row.june25UnsettledAmount.toString())}
                            placeholder="০"
                            onChange={e => {
                              const val = parseBengaliNumber(e.target.value);
                              handleInputChangeTable2(row.entityName, 'june25UnsettledAmount', val);
                            }}
                            onPaste={e => handlePasteTable2(e, idx, 'june25UnsettledAmount')}
                          />
                        </td>

                        {/* Read only calculated transition values */}
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {formatNumberSimple(row.transitionRaisedCount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {row.transitionRaisedAmount === 0 ? '০' : formatNumberSimple(row.transitionRaisedAmount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-slate-700 font-bold"}>
                          {formatNumberSimple(row.transitionSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-slate-50 text-emerald-700 font-extrabold"}>
                          {row.transitionSettledAmount === 0 ? '০' : formatNumberSimple(row.transitionSettledAmount)}
                        </td>

                        {/* Cumulative balances */}
                        <td className={numTdCls + " bg-blue-50/10 font-bold text-slate-900"}>
                          {formatNumberSimple(row.totalSettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/20 font-black text-blue-900"}>
                          {formatNumberSimple(row.totalUnsettledCount)}
                        </td>
                        <td className={numTdCls + " bg-blue-50/30 font-extrabold text-slate-900"}>
                          {row.totalUnsettledAmount === 0 ? '০' : formatNumberSimple(row.totalUnsettledAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-extrabold text-[10px] text-slate-900">
                    <td className={footerTdCls} colSpan={3}>সর্বমোট</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.june25Raised)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.june25Settled)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.june25UnsettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.transitionRaisedCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.transitionRaisedAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.transitionSettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.transitionSettledAmount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.totalSettledCount)}</td>
                    <td className={footerNumTdCls + " text-blue-900"}>{formatNumberSimple(prevLedgerTable2GrandTotals.totalUnsettledCount)}</td>
                    <td className={footerNumTdCls}>{formatNumberSimple(prevLedgerTable2GrandTotals.totalUnsettledAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer controls */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPrevLedgerTable2Open(false)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 border-b-4 border-blue-800"
            >
              সংরক্ষণ করুন ও বন্ধ করুন
            </button>
          </div>

        </div>
      </div>
    );
  };

  const downloadExcel = () => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) return;

    let tablesHtml = '';
    tables.forEach((table, tableIdx) => {
      const clonedTable = table.cloneNode(true) as HTMLTableElement;
      const interactiveElements = clonedTable.querySelectorAll('.no-print, button, svg, input, select');
      interactiveElements.forEach(el => el.remove());
      
      tablesHtml += `
        <div style="margin-bottom: 40px;">
          ${tableIdx > 0 ? '<br><hr><br>' : ''}
          ${clonedTable.outerHTML}
        </div>
      `;
    });

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_৩').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>রিপোর্ট</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Hind Siliguri', sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 8px 12px !important; text-align: center; font-size: 11px; vertical-align: middle; }
          th { background-color: #f1f5f9 !important; color: #0f172a !important; font-weight: bold !important; }
          .bg-slate-200, thead, tfoot { background-color: #e2e8f0 !important; font-weight: bold !important; }
          .bg-sky-100 { background-color: #e0f2fe !important; }
          .bg-amber-50 { background-color: #fef3c7 !important; }
          .bg-black { background-color: #090d16 !important; color: #ffffff !important; }
          tfoot td { background-color: #0f172a !important; color: #ffffff !important; font-weight: bold !important; }
        </style>
      </head>
      <body>
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ৩'}</h2>
        ${tablesHtml}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const processData = (isFI: boolean) => {
    const map = new Map<string, any>();
    const paraType = 'নন এসএফআই';
    const cycleStartStr = dateFnsFormat(startDate, 'yyyy-MM-dd');

    // Initialize with all entities from MINISTRY_ENTITY_MAP
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (isFI !== isFinancialInstitution(mName)) return;

      entities.forEach(entityName => {
        const key = `${mName}|${entityName}`;
        
        // Calculate recursive opening for this entity
        const baseMap = prevStats.entitiesNonSFI || {};
        const base = baseMap[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        
        const pastEntries = entries.filter(e => {
          if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;
          const entryDate = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
          return entryDate !== '' && entryDate < cycleStartStr && entryDate >= ENTRY_START_DATE;
        });

        let pastRC = 0, pastRA = 0, pastSC = 0, pastSA = 0;
        const processedParaIds = new Set<string>();

        pastEntries.forEach(entry => {
          const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
          if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
            pastRC += parseBengaliNumber(rCountRaw);
          }
          if (entry.manualRaisedAmount) pastRA += parseBengaliNumber(String(entry.manualRaisedAmount || '0'));

          if (entry.paragraphs) {
            entry.paragraphs.forEach(p => {
              const cleanParaNo = String(p.paraNo || '').trim();
              const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
              if (p.id && !processedParaIds.has(p.id) && hasDigit) {
                processedParaIds.add(p.id);
                const status = robustNormalize(p.status || '');
                const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
                if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                  pastSC++; 
                }
                pastSA += settledAmt;
              }
            });
          }
        });

        const ledgerRow = (isFI ? prevLedgerTable2Rows : prevLedgerRows).find(
          r => robustNormalize(r.entityName) === robustNormalize(entityName)
        );
        const pCount = ledgerRow ? ledgerRow.totalUnsettledCount : Math.max(0, base.unsettledCount + pastRC);
        const pAmount = ledgerRow ? ledgerRow.totalUnsettledAmount : Math.max(0, base.unsettledAmount + Math.round(pastRA));

        map.set(key, {
          ministryName: mName,
          entityName: entityName,
          pCount,
          pAmount,
          cCount: 0,
          cAmount: 0,
          sCount: 0,
          sAmount: 0,
        });
      });
    });

    // Process entries for the current range
    entries.forEach(e => {
      if (robustNormalize(e.paraType) !== robustNormalize(paraType)) return;
      if (isFI !== isFinancialInstitution(e.ministryName)) return;

      const key = `${e.ministryName}|${e.entityName}`;
      if (!map.has(key)) return; // Should already be in the map if it's in MINISTRY_ENTITY_MAP

      const data = map.get(key);
      const issueDateStr = e.issueDateISO || (e.createdAt ? e.createdAt.split('T')[0] : '');
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);

      if (issueDate >= startDate && issueDate <= endDate) {
        const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          data.cCount += parseBengaliNumber(rCountRaw);
        }
        if (e.manualRaisedAmount) data.cAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));
        
        if (e.paragraphs) {
          const processedParaIds = new Set<string>();
          e.paragraphs.forEach(p => {
            const cleanParaNo = String(p.paraNo || '').trim();
            const hasDigit = /[১-৯1-9]/.test(cleanParaNo);
            if (p.id && !processedParaIds.has(p.id) && hasDigit) {
              processedParaIds.add(p.id);
              const status = robustNormalize(p.status || '');
              const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
              if (status === robustNormalize('পূর্ণাঙ্গ')) { 
                data.sCount++; 
                data.sAmount += settledAmt;
              }
            }
          });
        }
      }
    });

    // Group by Ministry for the two-level display
    const ministryGroups: any[] = [];
    const ministryMap = new Map<string, any[]>();

    Array.from(map.values()).forEach(item => {
      if (!ministryMap.has(item.ministryName)) {
        ministryMap.set(item.ministryName, []);
      }
      ministryMap.get(item.ministryName)?.push(item);
    });

    ministryMap.forEach((entities, ministry) => {
      const matchMinistry = filterMinistry === '' || robustNormalize(ministry).includes(robustNormalize(filterMinistry));
      const matchSearch = searchTerm === '' || 
        robustNormalize(ministry).toLowerCase().includes(searchTerm.toLowerCase()) ||
        entities.some(ent => robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()));

      if (matchMinistry && matchSearch) {
        ministryGroups.push({
          ministry,
          entities: entities.filter(ent => {
            if (searchTerm === '') return true;
            return robustNormalize(ent.entityName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                   robustNormalize(ministry).toLowerCase().includes(searchTerm.toLowerCase());
          })
        });
      }
    });

    return ministryGroups;
  };

  const filteredTable1Data = useMemo(() => processData(false), [entries, prevStats, searchTerm, filterMinistry]);
  const filteredTable2Data = useMemo(() => processData(true), [entries, prevStats, searchTerm, filterMinistry]);

  const thCls = "border-r border-b border-slate-400 p-1 text-[8px] font-black text-slate-800 bg-slate-100 align-middle text-center";
  const tdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-700 align-middle";
  const numTdCls = "border-r border-b border-slate-400 p-1 text-[9px] text-slate-700 text-center align-middle font-bold";
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 align-middle bg-slate-200 font-extrabold";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-slate-900 text-center align-middle font-black bg-slate-200";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pC: 0, pA: 0, cC: 0, cA: 0, tC: 0, sC: 0, sA: 0, fC: 0, fA: 0 };

    return (
      <div className="table-container qr-table-container mb-10 overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg">
        <table className="w-full border-separate border-spacing-0 min-w-[950px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th rowSpan={2} className={`${thCls} w-10`}>ক্রঃ নং</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>মন্ত্রণালয়ের নাম</th>
              <th rowSpan={2} className={`${thCls} w-[calc(12%-2px)]`}>সংস্থার নাম</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত উত্থাপিত অডিট আপত্তি</th>
              <th rowSpan={2} className={thCls}>মোট অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মীমাংসিত অডিট আপত্তি</th>
              <th colSpan={2} className={thCls}>{getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত অমীমাংসিত অডিট আপত্তি</th>
              <th rowSpan={2} className={`${thCls} w-[calc(8%-2px)]`}>মন্তব্য</th>
            </tr>
            <tr className="h-[38px]">
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
              <th className={thCls}>সংখ্যা</th>
              <th className={thCls}>টাকা</th>
            </tr>
            <tr className="h-[32px]">
              {[1, 2, 3, 4, 5, 6, 7, '৮ = ৪+৬', 9, 10, '১১ = ৮-৯', '১২ = ৫+৭-১০', 13].map((n, i) => (
                <th key={i} className={thCls + " text-[9px] font-bold text-slate-500"}>{typeof n === 'string' ? toBengaliDigits(n) : toBengaliDigits(n.toString())}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((mGroup, mIdx) => (
              <React.Fragment key={mIdx}>
                {mGroup.entities.map((ent, eIdx) => {
                  const totalObjectionCount = ent.pCount + ent.cCount;
                  const finalObjectionCount = totalObjectionCount - ent.sCount;
                  const finalObjectionAmount = ent.pAmount + ent.cAmount - ent.sAmount;

                  totals.pC += ent.pCount; totals.pA += ent.pAmount;
                  totals.cC += ent.cCount; totals.cA += ent.cAmount;
                  totals.tC += totalObjectionCount;
                  totals.sC += ent.sCount; totals.sA += ent.sAmount;
                  totals.fC += finalObjectionCount; totals.fA += finalObjectionAmount;

                  return (
                    <tr key={`${mIdx}-${eIdx}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={numTdCls}>{toBengaliDigits((globalIdx++).toString())}</td>
                      )}
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>
                          <HighlightText text={mGroup.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalObjectionCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.sCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.sAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(finalObjectionCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(finalObjectionAmount.toString())}</td>
                      <td className={tdCls}></td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className={`font-black h-[28px] qr-sticky-footer ${tableId === 'table-2' ? 'qr-sticky-footer-offset' : 'qr-sticky-footer-bottom'}`}>
              <td colSpan={3} className={footerTdCls + " text-right"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.sA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.fC.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.fA.toString())}</td>
              <td className={footerTdCls}></td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom">
                <td colSpan={3} className={footerTdCls + " text-right"}>সর্বমোট</td>
                <td colSpan={10} className={footerTdCls}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="qr-3-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-3-container" />
      
      <div className="flex justify-between items-center mb-4 no-print gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrevLedgerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>পূর্ব জের (টেবিল-১)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPrevLedgerTable2Open(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>পূর্ব জের (টেবিল-২)</span>
          </button>
        </div>
        <button
          type="button"
          onClick={downloadExcel}
          className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
          title="এক্সেল ফাইল ডাউনলোড করুন"
        >
          <FileSpreadsheet size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Header Section */}
      <div className="text-center mb-3 pt-1 relative z-[260]">
        <div className="inline-block relative">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            {customTitle || "ত্রৈমাসিক রিটার্ন - ৩"}
          </h1>

          {/* Date Range Pill */}
          <div className="mt-1 mb-2 flex items-center justify-center gap-3 no-print flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-blue-50 border border-blue-100 rounded-full shadow-sm scale-95 origin-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-blue-700 font-bold text-[12px]">
                {customTitle || "ত্রৈমাসিক রিটার্ন - ৩"} | {activeCycle.label}
              </span>
            </div>
            {monthPickerElement && (
              <div className="scale-95 origin-center select-none relative z-[300]">
                {monthPickerElement}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-slate-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-slate-400"></div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">শাখাঃ</span> নন এসএফআই শাখা</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>

      {renderTable(filteredTable1Data, 'table-1')}
      
      <div className="my-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> মন্ত্রণালয়/সংস্থা ভিত্তিক অমীমাংসিত অডিট আপত্তির ত্রৈমাসিক বিবরণ</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>
      {renderTable(filteredTable2Data, 'table-2')}

      {renderPrevLedgerModal()}
      {renderPrevLedgerTable2Modal()}

    </div>
  );
};

export default QR_3;