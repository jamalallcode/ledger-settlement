export type ParaType = 'এসএফআই' | 'নন এসএফআই';
export type SettlementStatus = 'পূর্ণাঙ্গ' | 'আংশিক';
export type FinancialCategory = 'ভ্যাট' | 'আয়কর' | 'অন্যান্য';
export type EntryMode = 'আদায়' | 'সমন্বয়';
export type DesignMode = 'modern' | 'classic';

export interface ArchiveDoc {
  id: string;
  title: string;
  category: 'সার্কুলার' | 'অফিস আদেশ' | 'গেজেট' | 'অন্যান্য';
  archiveId: string; // Archive.org identifier
  docDate: string;
  description: string;
  createdAt: string;
}

export interface MinistryPrevStats {
  unsettledCount: number;
  unsettledAmount: number;
  settledCount: number;
  settledAmount: number;
}

export interface CumulativeStats {
  inv: number;
  vRec: number; vAdj: number;
  iRec: number; iAdj: number;
  oRec: number; oAdj: number;
  entitiesSFI: Record<string, MinistryPrevStats>;
  entitiesNonSFI: Record<string, MinistryPrevStats>;
}

export interface ParagraphDetail {
  id: string;
  paraNo: string;
  status: SettlementStatus;
  involvedAmount: number;   
  recoveredAmount: number;  
  adjustedAmount: number;   
  category: FinancialCategory; 
  isAdvanced: boolean;
  vatRec: number;
  vatAdj: number;
  itRec: number;
  itAdj: number;
  othersRec: number;
  othersAdj: number;
}

export interface SettlementEntry {
  id: string;
  sl: number;
  ministryName: string;
  entityName: string;
  branchName: string;
  auditYear: string;
  letterNoDate: string;
  workpaperNoDate: string;
  minutesNoDate: string;
  paraType: ParaType;
  paragraphs: ParagraphDetail[];
  involvedAmount: number;
  vatRec: number;
  vatAdj: number;
  itRec: number;
  itAdj: number;
  othersRec: number;
  othersAdj: number;
  totalRec: number;
  totalAdj: number;
  issueLetterNoDate: string;
  issueDateISO?: string; 
  cycleLabel?: string;   
  actualEntryDate?: string; 
  isLate?: boolean; 
  createdAt: string; 
  manualRaisedCount?: string | null;
  manualRaisedAmount?: number | null;
  isMeeting?: boolean;
  meetingType?: string;
  meetingResponseDate?: string;
  meetingDate?: string;
  meetingSentParaCount?: string;
  meetingRecommendedParaCount?: string; 
  meetingSettledParaCount?: string;
  meetingFullSettledParaCount?: string;
  meetingPartialSettledParaCount?: string;
  meetingUnsettledParas?: string;
  meetingUnsettledAmount?: number;
  archiveNo?: string;
  meetingWorkpaper?: string;
  meetingMinutes?: string;
  branchReceiptDate?: string;      
  receiverName?: string;           
  isSentOnline?: 'হ্যাঁ' | 'না';    
  presentationDate?: string;       
  presentedToName?: string; // New field for the person to whom it's presented
  remarks?: string;
  approvalStatus?: 'approved' | 'pending';
}

export interface GroupOption {
  label: string;
  options: string[];
}

export interface BallotVote {
  id?: string;
  voter_hash: string;
  p1: string; p2: string; p3: string;
  p4: string; p5: string; p6: string;
  p7: string;
  created_at?: string;
}

export interface CandidateResult {
  name: string;
  votes: number;
}

export interface PositionResult {
  title: string;
  id: string;
  results: CandidateResult[];
}

export interface VoterToken {
  id: number;
  token: string;
  is_used: boolean;
  created_at: string;
}