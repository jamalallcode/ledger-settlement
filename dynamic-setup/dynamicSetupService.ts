import { SettlementEntry, CumulativeStats, MinistryPrevStats, DynamicSetupConfig } from '../types';
import { parseBengaliNumber } from '../utils/numberUtils';

export const calculateDynamicOpeningBalance = (
  entries: SettlementEntry[],
  config: DynamicSetupConfig
): CumulativeStats => {
  const stats: CumulativeStats = {
    inv: 0,
    vRec: 0, vAdj: 0,
    iRec: 0, iAdj: 0,
    oRec: 0, oAdj: 0,
    entitiesSFI: {},
    entitiesNonSFI: {}
  };

  if (!config.enabled) return stats;

  const { startDate, endDate } = config;

  entries.forEach(entry => {
    const entryDate = entry.issueDateISO || (entry.createdAt ? entry.createdAt.split('T')[0] : '');
    
    // Check if the entry falls within the specified range
    if (entryDate >= startDate && entryDate <= endDate) {
      const isSFI = entry.paraType === 'এসএফআই';
      const entityName = entry.entityName;
      const targetMap = isSFI ? stats.entitiesSFI : stats.entitiesNonSFI;

      if (!targetMap[entityName]) {
        targetMap[entityName] = {
          unsettledCount: 0,
          unsettledAmount: 0,
          settledCount: 0,
          settledAmount: 0
        };
      }

      const entityStats = targetMap[entityName];

      // Raised (Unsettled)
      const rCountRaw = entry.manualRaisedCount?.toString().trim() || "";
      if (rCountRaw !== "" && rCountRaw !== "0" && rCountRaw !== "০") {
        entityStats.unsettledCount += parseBengaliNumber(rCountRaw);
      }
      if (entry.manualRaisedAmount) {
        entityStats.unsettledAmount += parseBengaliNumber(String(entry.manualRaisedAmount));
      }

      // Settled
      if (entry.paragraphs) {
        entry.paragraphs.forEach(p => {
          const status = p.status;
          const settledAmt = parseBengaliNumber(String(p.recoveredAmount || '0')) + parseBengaliNumber(String(p.adjustedAmount || '0'));
          
          if (status === 'পূর্ণাঙ্গ') {
            entityStats.settledCount++;
          }
          entityStats.settledAmount += settledAmt;
        });
      }
    }
  });

  return stats;
};
