import React, { useMemo } from 'react';
import { Printer, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toBengaliDigits, toEnglishDigits, parseBengaliNumber, extractEntryDate } from '../utils/numberUtils';
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
  paraType?: 'এসএফআই' | 'নন এসএফআই';
}

const robustNormalize = (str: string = '') => {
  return str.normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
};

// Categorization helper
const isFinancialInstitution = (ministryName: string) => {
  return robustNormalize(ministryName).includes(robustNormalize('আর্থিক প্রতিষ্ঠান বিভাগ'));
};

const QR_4: React.FC<QRProps> = ({ entries, prevStats, activeCycle, IDBadge, searchTerm = '', filterMinistry = '', monthPickerElement, customTitle, paraType = 'এসএফআই' }) => {
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

  const [cutoffMonth, setCutoffMonth] = React.useState(() => {
    const saved = localStorage.getItem('opening_balance_cutoff_month');
    if (saved) {
      const [y, m] = saved.split('-').map(Number);
      if (y > 2025 || (y === 2025 && m >= 12)) {
        return saved;
      }
    }
    return '2026-03';
  });

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const startYear = 2024;
    const monthNamesBN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    
    for (let y = currentYear; y >= startYear; y--) {
      const maxM = (y === currentYear) ? currentMonth : 11;
      for (let m = maxM; m >= 0; m--) {
        if (y < 2026 || (y === 2026 && m < 2)) {
          continue;
        }
        const val = `${y}-${String(m + 1).padStart(2, '0')}`;
        const lbl = `${monthNamesBN[m]}/${toBengaliDigits(y.toString())}`;
        options.push({ value: val, label: lbl });
      }
    }
    return options;
  };

  const getCutoffMonthInfo = (monthStr: string) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const [yearNum, monthNum] = monthStr.split('-').map(Number);
    const mIdx = monthNum - 1;
    const monthNameBN = months[mIdx];
    const yearBN = toBengaliDigits(yearNum.toString());
    const yearShortBN = toBengaliDigits(String(yearNum).slice(-2));
    
    const nextMonthDate = new Date(yearNum, mIdx + 1, 1);
    const nextMonthNameBN = months[nextMonthDate.getMonth()];
    const nextMonthYearBN = toBengaliDigits(nextMonthDate.getFullYear().toString());
    const nextMonthStrStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

    return {
      monthNameBN,
      yearBN,
      yearShortBN,
      formattedLong: `${monthNameBN}/${yearBN}`,
      formattedShort: `${monthNameBN}/${yearShortBN}`,
      nextMonthNameBN,
      nextMonthYearBN,
      nextMonthFormattedLong: `${nextMonthNameBN}/${nextMonthYearBN}`,
      transitionStartStr: nextMonthStrStr
    };
  };

  const cutoffInfo = getCutoffMonthInfo(cutoffMonth);

  const getStorageKeyTable1 = (monthStr: string) => {
    if (monthStr === '2025-06') return `qr4_table1_prev_ledger_june2025_${paraType}`;
    return `qr4_table1_prev_ledger_${monthStr}_${paraType}`;
  };

  const getStorageKeyTable2 = (monthStr: string) => {
    if (monthStr === '2025-06') return `qr4_table2_prev_ledger_june2025_${paraType}`;
    return `qr4_table2_prev_ledger_${monthStr}_${paraType}`;
  };

  // Helper to get base starting values from prevStats
  const getEntityStats = (entName: string) => {
    const baseMap = paraType === 'এসএফআই' ? (prevStats?.entitiesSFI || {}) : (prevStats?.entitiesNonSFI || {});
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
    const initialMonth = localStorage.getItem('opening_balance_cutoff_month') || '2025-06';
    const key = initialMonth === '2025-06' ? `qr4_table1_prev_ledger_june2025_${paraType}` : `qr4_table1_prev_ledger_${initialMonth}_${paraType}`;
    const saved = localStorage.getItem(key);
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
    const initialMonth = localStorage.getItem('opening_balance_cutoff_month') || '2025-06';
    const key = initialMonth === '2025-06' ? `qr4_table2_prev_ledger_june2025_${paraType}` : `qr4_table2_prev_ledger_${initialMonth}_${paraType}`;
    const saved = localStorage.getItem(key);
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

  React.useEffect(() => {
    const key1 = getStorageKeyTable1(cutoffMonth);
    const saved1 = localStorage.getItem(key1);
    if (saved1) {
      try {
        setPrevLedgerTable1Data(JSON.parse(saved1));
      } catch (e) {
        console.error(e);
      }
    } else {
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

    const key2 = getStorageKeyTable2(cutoffMonth);
    const saved2 = localStorage.getItem(key2);
    if (saved2) {
      try {
        setPrevLedgerTable2Data(JSON.parse(saved2));
      } catch (e) {
        console.error(e);
      }
    } else {
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
  }, [paraType, table1EntitiesList, table2EntitiesList, prevStats, cutoffMonth]);

  const handleSavePrevLedgerTable1 = (updated: typeof prevLedgerTable1Data) => {
    setPrevLedgerTable1Data(updated);
    localStorage.setItem(getStorageKeyTable1(cutoffMonth), JSON.stringify(updated));
  };

  const handleSavePrevLedgerTable2 = (updated: typeof prevLedgerTable2Data) => {
    setPrevLedgerTable2Data(updated);
    localStorage.setItem(getStorageKeyTable2(cutoffMonth), JSON.stringify(updated));
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
      const cycleStartStr = dateFnsFormat(activeCycle.start, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;

        const entryDate = extractEntryDate(e);
        return entryDate !== '' && entryDate >= cutoffInfo.transitionStartStr && entryDate < cycleStartStr;
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
  }, [prevLedgerTable1Data, entries, startDate, table1EntitiesList, paraType]);

  const prevLedgerTable2Rows = useMemo(() => {
    const rows: any[] = [];
    let sl = 1;
    
    table2EntitiesList.forEach(({ ministryName, entityName }) => {
      const ledger = prevLedgerTable2Data[entityName] || { june25Raised: 0, june25Settled: 0, june25UnsettledAmount: 0 };
      
      // Calculate transition settled and raised from July 1, 2025 up to cycle start
      const cycleStartStr = dateFnsFormat(activeCycle.start, 'yyyy-MM-dd');
      const transitionEntries = entries.filter(e => {
        if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
        if (robustNormalize(e.ministryName) !== robustNormalize(ministryName)) return false;
        if (robustNormalize(e.paraType || '') !== robustNormalize(paraType)) return false;

        const entryDate = extractEntryDate(e);
        return entryDate !== '' && entryDate >= cutoffInfo.transitionStartStr && entryDate < cycleStartStr;
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
  }, [prevLedgerTable2Data, entries, startDate, table2EntitiesList, paraType]);

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

    const filename = `${(customTitle || 'ত্রৈমাসিক_রিটার্ন_৪').replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xls`;

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
        <h2 style="text-align: center; margin-bottom: 20px; color: #1e3a8a;">${customTitle || 'ত্রৈমাসিক রিটার্ন - ৪'}</h2>
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

  const getMonthNameBN = (date: Date) => {
    const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    return months[date.getMonth()];
  };

  const formatYearBN = (date: Date) => toBengaliDigits(format(date, 'yyyy'));
  const formatShortYearBN = (date: Date) => toBengaliDigits(format(date, 'yy'));

  const processData = (isFI: boolean) => {
    const map = new Map<string, any>();
    const targetParaType = paraType;
    const cycleStartStr = dateFnsFormat(startDate, 'yyyy-MM-dd');

    // Initialize with all entities from MINISTRY_ENTITY_MAP
    Object.entries(MINISTRY_ENTITY_MAP).forEach(([mName, entities]) => {
      if (isFI !== isFinancialInstitution(mName)) return;

      entities.forEach(entityName => {
        const key = `${mName}|${entityName}`;
        
        // Calculate recursive opening for this entity
        const baseMap = targetParaType === 'এসএফআই' ? (prevStats.entitiesSFI || {}) : (prevStats.entitiesNonSFI || {});
        const base = baseMap[entityName] || { unsettledCount: 0, unsettledAmount: 0, settledCount: 0, settledAmount: 0 };
        
        const pastEntries = entries.filter(e => {
          if (robustNormalize(e.entityName) !== robustNormalize(entityName)) return false;
          if (robustNormalize(e.paraType || '') !== robustNormalize(targetParaType)) return false;
          const entryDate = extractEntryDate(e);
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

        const pRaised = ledgerRow 
          ? (ledgerRow.june25Raised + ledgerRow.transitionRaisedCount)
          : Math.max(0, base.unsettledCount + pastRC);

        const pSettled = ledgerRow
          ? (ledgerRow.june25Settled + ledgerRow.transitionSettledCount)
          : 0;

        const initialPendingAmount = ledgerRow
          ? ledgerRow.totalUnsettledAmount
          : Math.max(0, base.unsettledAmount + Math.round(pastRA));

        map.set(key, {
          ministryName: mName,
          entityName: entityName,
          pRaised,
          pendingAmount: initialPendingAmount,
          cRaised: 0,
          pSettled,
          cSettled: 0,
          cSettledAmount: 0,
        });
      });
    });


    // Process entries for the current range
    entries.forEach(e => {
      if (robustNormalize(e.paraType) !== robustNormalize(targetParaType)) return;
      if (isFI !== isFinancialInstitution(e.ministryName)) return;

      const key = `${e.ministryName}|${e.entityName}`;
      if (!map.has(key)) return;

      const data = map.get(key);
      const issueDateStr = extractEntryDate(e);
      if (!issueDateStr) return;
      const issueDate = new Date(issueDateStr);

      if (issueDate >= startDate && issueDate <= endDate) {
        const rCountRaw = e.manualRaisedCount?.toString().trim() || "";
        if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
          data.cRaised += parseBengaliNumber(rCountRaw);
        }
        if (e.manualRaisedAmount) data.pendingAmount += parseBengaliNumber(String(e.manualRaisedAmount || '0'));
        
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
                data.cSettled++; 
                data.cSettledAmount += settledAmt;
              }
            }
          });
        }
      }
    });

    // Group by Ministry
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
  
  // Footer-specific classes without borders to avoid double borders with inset box-shadow
  const footerTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white align-middle bg-black";
  const footerNumTdCls = "border-r border-b border-slate-400 p-1 text-[10px] text-white text-center align-middle font-bold bg-black";

  const renderTable = (data: any[], tableId: string) => {
    let globalIdx = 1;
    const totals = { pR: 0, cR: 0, tR: 0, pS: 0, cS: 0, tS: 0, pnd: 0, cSA: 0, pndA: 0 };

    return (
      <div className={`table-container qr-table-container ${tableId === 'table-2' ? '' : 'mb-10'} overflow-auto xl:overflow-visible border border-slate-400 shadow-sm rounded-lg`}>
        <table className="w-full border-separate border-spacing-0 min-w-[1000px] !table-auto">
          <thead className="bg-slate-100">
            <tr className="h-[42px]">
              <th className={thCls + " w-10"}>ক্রঃ নং</th>
              <th className={`${thCls} w-[8%]`}>মন্ত্রণালয়ের নাম</th>
              <th className={`${thCls} w-[8%]`}>প্রতিষ্ঠানের নাম</th>
              <th className={thCls}>১৯৭১-৭২ হতে {getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} মাস পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মোট উত্থাপিত আপত্তির সংখ্যা</th>
              <th className={thCls}>১৯৭১-৭২ হতে {getMonthNameBN(prevMonthDate)}/{formatYearBN(prevMonthDate)} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত মোট নিষ্পত্তিকৃত আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত অনিষ্পন্ন আপত্তির সংখ্যা</th>
              <th className={thCls}>{getMonthNameBN(startDate)}/{formatShortYearBN(startDate)} হতে {getMonthNameBN(endDate)}/{formatShortYearBN(endDate)} পর্যন্ত নিষ্পত্তিকৃত আপত্তিতে জড়িত টাকা</th>
              <th className={thCls}>{getMonthNameBN(endDate)}/{formatYearBN(endDate)} পর্যন্ত অনিষ্পন্ন আপত্তিতে জড়িত টাকা</th>
            </tr>
          </thead>
          <tbody>
            {data.map((mGroup, mIdx) => (
              <React.Fragment key={mIdx}>
                {mGroup.entities.map((ent, eIdx) => {
                  const totalRaised = ent.pRaised + ent.cRaised;
                  const totalSettled = ent.pSettled + ent.cSettled;
                  const pendingCount = totalRaised - totalSettled;

                  totals.pR += ent.pRaised; totals.cR += ent.cRaised; totals.tR += totalRaised;
                  totals.pS += ent.pSettled; totals.cS += ent.cSettled; totals.tS += totalSettled;
                  totals.pnd += pendingCount; totals.cSA += ent.cSettledAmount; totals.pndA += ent.pendingAmount;

                  return (
                    <tr key={`${mIdx}-${eIdx}`} className="hover:bg-slate-50 transition-colors">
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={numTdCls + " w-10"}>{toBengaliDigits((globalIdx++).toString())}</td>
                      )}
                      {eIdx === 0 && (
                        <td rowSpan={mGroup.entities.length} className={tdCls + " font-black"}>
                          <HighlightText text={mGroup.ministry} searchTerm={searchTerm} />
                        </td>
                      )}
                      <td className={tdCls}>
                        <HighlightText text={ent.entityName} searchTerm={searchTerm} />
                      </td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalRaised.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(totalSettled.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(pendingCount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.cSettledAmount.toString())}</td>
                      <td className={numTdCls}>{toBengaliDigits(ent.pendingAmount.toString())}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            <tr className={`font-black h-[28px] qr-sticky-footer no-hover-row ${tableId === 'table-2' ? 'qr-sticky-footer-offset' : 'qr-sticky-footer-bottom'}`}>
              <td colSpan={3} className={footerTdCls + " text-right"}>মোট</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tR.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.tS.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pnd.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.cSA.toString())}</td>
              <td className={footerNumTdCls}>{toBengaliDigits(totals.pndA.toString())}</td>
            </tr>
            {tableId === 'table-2' && (
               <tr className="font-black h-[28px] qr-sticky-footer qr-sticky-footer-bottom no-hover-row">
                <td colSpan={3} className={footerTdCls + " text-right"}>সর্বমোট</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.tR).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.tS).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pnd).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.cSA).toString())}</td>
                <td className={footerNumTdCls}>{toBengaliDigits((totals.pndA).toString())}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPrevLedgerModal = () => {
    if (!isPrevLedgerOpen) return null;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[11000] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
        <div className="bg-white rounded-3xl border-2 border-slate-300 w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  টেবিল-১ এর পূর্ব জের সেটআপ ও গণনা তালিকা ({paraType})
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  ১৯৭১-৭২ হতে {cutoffInfo.formattedLong} পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। {cutoffInfo.nextMonthFormattedLong} হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem(getStorageKeyTable1(cutoffMonth));
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
                    <th className={`${thCls} w-[130px]`} colSpan={3}>{cutoffInfo.formattedLong} পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className={`${thCls} w-[240px]`} colSpan={4}>{cutoffInfo.nextMonthFormattedLong} হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className={`${thCls} w-[300px]`} colSpan={3}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} পর্যন্ত মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    <th className={thCls}>১৯৭১-৭২ হতে {cutoffInfo.formattedShort} উত্থাপিত</th>
                    <th className={thCls}>১৯৭১-৭২ হতে {cutoffInfo.formattedShort} নিষ্পত্তিকৃত</th>
                    <th className={thCls}>{cutoffInfo.formattedShort} অমীমাংসিত টাকা</th>
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
            <div className="text-left flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h2 className="text-[15px] font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  টেবিল-২ এর পূর্ব জের সেটআপ ও গণনা তালিকা ({paraType})
                </h2>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  ১৯৭১-৭২ হতে {cutoffInfo.formattedLong} পর্যন্ত উত্থাপিত ও নিষ্পত্তিকৃত আপত্তির সংখ্যাগুলো ইনপুট দিন। {cutoffInfo.nextMonthFormattedLong} হতে নিষ্পত্তি স্বয়ংক্রিয়ভাবে হিসাব হবে।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("আপনি কি নিশ্চিতভাবে সকল পূর্ব জের তথ্য রিসেট করতে চান?")) {
                    localStorage.removeItem(getStorageKeyTable2(cutoffMonth));
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
                    <th className={`${thCls} w-[130px]`} colSpan={3}>{cutoffInfo.formattedLong} পর্যন্ত প্রারম্ভিক জের (ইনপুট)</th>
                    <th className={`${thCls} w-[240px]`} colSpan={4}>{cutoffInfo.nextMonthFormattedLong} হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} পর্যন্ত সমন্বয় (রেজিস্টার হতে)</th>
                    <th className={`${thCls} w-[300px]`} colSpan={3}>১৯৭১-৭২ হতে {prevQuarterEnd.monthName}/{prevQuarterEnd.year} পর্যন্ত মোট সমন্বয়কৃত পূর্ব জের</th>
                  </tr>
                  <tr>
                    <th className={thCls}>১৯৭১-৭২ হতে {cutoffInfo.formattedShort} উত্থাপিত</th>
                    <th className={thCls}>১৯৭১-৭২ হতে {cutoffInfo.formattedShort} নিষ্পত্তিকৃত</th>
                    <th className={thCls}>{cutoffInfo.formattedShort} অমীমাংসিত টাকা</th>
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

  return (
    <div id="qr-4-container" className="w-full mx-auto py-4 px-[4px] bg-white rounded-xl relative animate-in fade-in duration-500 font-sans">
      <IDBadge id="qr-4-container" />
      
      <div className="flex justify-end items-center mb-4 no-print">
        <button
          type="button"
          onClick={downloadExcel}
          className="flex items-center justify-center w-10 h-10 bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer shrink-0"
          title="এক্সেল ফাইল ডাউনলোড করুন"
        >
          <FileSpreadsheet size={16} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Print-only title to ensure perfect centering in print mode */}
      <div className="hidden print:block text-center mb-3">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৪"}
        </h1>
        <p className="text-[12px] font-bold text-slate-700 mt-1">
          {activeCycle.label}
        </p>
      </div>

      {/* Header Section with symmetric layout */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5 pt-1 relative z-[260] no-print">
        {/* Left Column: Previous Ledger Setup buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-start">
          <button
            type="button"
            onClick={() => setIsPrevLedgerOpen(true)}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-300 rounded-xl text-[11px] font-black cursor-pointer shrink-0"
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>পূর্ব জের (টেবিল-১)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPrevLedgerTable2Open(true)}
            className="flex items-center gap-1.5 px-3 h-[38px] bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-300 rounded-xl text-[11px] font-black cursor-pointer shrink-0"
          >
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>পূর্ব জের (টেবিল-২)</span>
          </button>
        </div>

        {/* Center Column: Title */}
        <h1 className="text-2.5xl font-black text-slate-900 tracking-tight text-center md:absolute md:left-1/2 md:-translate-x-1/2">
          {customTitle || "ত্রৈমাসিক রিটার্ন - ৪"}
        </h1>

        {/* Right Column: Date Range Pill & Month Picker */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 h-[38px] bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-700 font-black text-[12.5px] whitespace-nowrap">
              {customTitle || "ত্রৈমাসিক রিটার্ন - ৪"} | {activeCycle.label}
            </span>
          </div>
          {monthPickerElement && (
            <div className="select-none relative z-[300]">
              {monthPickerElement}
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p className="shrink-0"><span className="text-slate-500">কালিমাঃ</span> {paraType === 'এসএফআই' ? 'এসএফআই শাখা' : 'নন এসএফআই শাখা'}</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>

      {renderTable(filteredTable1Data, 'table-1')}
      
      <div className="my-3 text-[11px] font-bold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-t border-slate-200 py-1.5 px-2 bg-slate-50/50 rounded-lg">
        <p><span className="text-slate-500">বিষয়ঃ</span> অডিট আপত্তির ত্রৈমাসিক রিটার্ন</p>
        <span className="text-slate-300 hidden md:inline font-normal">|</span>
        <p><span className="text-slate-500">মাসের নামঃ</span> {formattedRange}</p>
      </div>
      {renderTable(filteredTable2Data, 'table-2')}

      {renderPrevLedgerModal()}
      {renderPrevLedgerTable2Modal()}

    </div>
  );
};

export default QR_4;