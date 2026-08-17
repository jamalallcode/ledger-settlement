import { CorrespondenceEntry } from "../types";

export interface DocumentManagementModuleProps {
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

export interface TableRow {
  id: string;
  cells: Record<string, string>;
  cellColors?: Record<string, string>;
}

export interface CrossVerificationSummary {
  objectionSummary?: string;
  appendixSummary?: string;
  replyAdequacy?: string;
  isFullyAddressed?: boolean;
  unresolvedPoints?: string[];
  recommendation?: string;
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
  crossVerification?: CrossVerificationSummary;
}
