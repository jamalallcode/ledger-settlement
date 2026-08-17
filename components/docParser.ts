import { CorrespondenceEntry } from "../types";
import { MINISTRY_ENTITY_MAP } from "../constants";
import { toBengaliDigits, formatDateBN } from "../utils/numberUtils";

export interface ParsedDocumentMetadata {
  entityName: string;
  ministryName: string;
  branchName: string;
  auditYear: string;
  letterNo: string;
  letterDate: string;
  diaryNo: string;
  diaryDate: string;
  paraNo: string;
  totalAmount: string;
  formattedAmount: string;
  fullLocationTitle: string;
  entityAndAuditYearFormatted: string;
}

/**
 * Extracts and parses full entity, ministry, branch, audit year, letter, and diary information
 * from a CorrespondenceEntry or SettlementEntry dynamically without static or unrelated fallbacks.
 */
export const parseDocumentEntry = (entry: Partial<CorrespondenceEntry> | any): ParsedDocumentMetadata => {
  if (!entry) {
    return {
      entityName: "সংশ্লিষ্ট প্রতিষ্ঠান",
      ministryName: "",
      branchName: "",
      auditYear: "",
      letterNo: "",
      letterDate: "",
      diaryNo: "",
      diaryDate: "",
      paraNo: "০১",
      totalAmount: "০",
      formattedAmount: "০",
      fullLocationTitle: "সংশ্লিষ্ট প্রতিষ্ঠান",
      entityAndAuditYearFormatted: "প্রতিষ্ঠান: সংশ্লিষ্ট প্রতিষ্ঠান",
    };
  }

  const rawDesc = (entry.description || "").trim();

  // 1. Extract Audit Year
  let detectedYear = entry.auditYear ? String(entry.auditYear).trim() : "";
  if (!detectedYear && rawDesc) {
    // Regex for matches like (২০০৯-১৪) or (২০১০-১১, ২০১৪-১৫) or (2009-14) or ২০০৯-২০১০
    const yearMatch = rawDesc.match(/\(([\d০-৯\-,/–\s]+)\)/);
    if (yearMatch) {
      detectedYear = yearMatch[1].trim();
    } else {
      const yearPattern = rawDesc.match(/([\d০-৯]{4}[\s]*[-–][\s]*[\d০-৯]{2,4})/);
      if (yearPattern) {
        detectedYear = yearPattern[1].trim();
      }
    }
  }
  const auditYear = detectedYear ? toBengaliDigits(detectedYear) : "";

  // 2. Extract Entity Name
  let detectedEntity = entry.entityName ? String(entry.entityName).trim() : "";
  if (!detectedEntity && rawDesc) {
    // Search known entities from MINISTRY_ENTITY_MAP
    for (const minKey of Object.keys(MINISTRY_ENTITY_MAP)) {
      for (const ent of MINISTRY_ENTITY_MAP[minKey]) {
        if (rawDesc.includes(ent)) {
          detectedEntity = ent;
          break;
        }
      }
      if (detectedEntity) break;
    }
  }
  if (!detectedEntity && rawDesc) {
    // Take text before the first comma or parenthesis
    const commaSplit = rawDesc.split(/[,(]/)[0].trim();
    if (commaSplit) {
      detectedEntity = commaSplit;
    }
  }
  const entityName = detectedEntity || (rawDesc ? rawDesc.split(/[,(]/)[0].trim() : "সংশ্লিষ্ট প্রতিষ্ঠান");

  // 3. Extract Ministry Name
  let detectedMinistry = entry.ministryName ? String(entry.ministryName).trim() : "";
  if (!detectedMinistry && entityName) {
    for (const [minKey, entities] of Object.entries(MINISTRY_ENTITY_MAP)) {
      if (entities.includes(entityName) || entities.some(e => entityName.includes(e) || e.includes(entityName))) {
        detectedMinistry = minKey;
        break;
      }
    }
  }
  const ministryName = detectedMinistry || "";

  // 4. Extract Branch Name
  let detectedBranch = entry.branchName ? String(entry.branchName).trim() : "";
  if (!detectedBranch && rawDesc) {
    // Remove entityName from rawDesc, remove parenthesized audit year, trim commas
    let remainder = rawDesc;
    if (entityName && remainder.includes(entityName)) {
      remainder = remainder.replace(entityName, "").trim();
    }
    remainder = remainder.replace(/\([^)]*\)/g, "").trim();
    remainder = remainder.replace(/^[,|\-\s]+|[,|\-\s]+$/g, "").trim();
    if (remainder) {
      detectedBranch = remainder;
    }
  }
  const branchName = detectedBranch || "";

  // 5. Letter & Diary Details
  const letterNo = entry.letterNo ? toBengaliDigits(String(entry.letterNo)) : (entry.issueLetterNo ? toBengaliDigits(String(entry.issueLetterNo)) : "");
  const letterDate = entry.letterDate ? formatDateBN(entry.letterDate) : (entry.issueLetterDate ? formatDateBN(entry.issueLetterDate) : "");

  const diaryNo = entry.diaryNo ? toBengaliDigits(String(entry.diaryNo)) : "";
  const diaryDate = entry.diaryDate ? formatDateBN(entry.diaryDate) : "";

  // 6. Para No & Amounts
  const rawPara = entry.paraNo || entry.totalParas || entry.sentParaCount || "০১";
  const paraNo = toBengaliDigits(String(rawPara));

  const rawAmount = entry.totalAmount ? String(entry.totalAmount) : "০";
  const totalAmount = toBengaliDigits(rawAmount);

  // Full location title
  const branchPart = branchName ? `, ${branchName}` : "";
  const fullLocationTitle = `${entityName}${branchPart}`;

  // Entity & Audit Year formatted for Table Column 3
  const entityAndAuditYearFormatted = `প্রতিষ্ঠান: ${entityName}${branchName ? `,\n${branchName}` : ""}${auditYear ? `\nনিরীক্ষা বছর: ${auditYear}` : ""}`;

  return {
    entityName,
    ministryName,
    branchName,
    auditYear,
    letterNo,
    letterDate,
    diaryNo,
    diaryDate,
    paraNo,
    totalAmount,
    formattedAmount: totalAmount,
    fullLocationTitle,
    entityAndAuditYearFormatted,
  };
};
