export type DocumentType = "quote" | "invoice" | "proposal";
export type DocumentStatus = "draft" | "sent" | "paid";

export type Client = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  business_name: string | null;
  full_name: string | null;
  address: string | null;
  bank_info: string | null;
};

export type DocumentItem = {
  id?: string;
  description: string;
  unit_price: number;
  quantity: number;
  sort_order: number;
};

export type ProposalSection = {
  heading: string;
  body: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  client_id: string;
  type: DocumentType;
  doc_number: string;
  status: DocumentStatus;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  source_quote_id: string | null;
  created_at: string;
  clients?: Client;
  document_items?: DocumentItem[];
  proposal_sections?: ProposalSection[] | null;
};

export const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: "下書き",
  sent: "送付済み",
  paid: "入金済み",
};

export const TYPE_LABEL: Record<DocumentType, string> = {
  quote: "見積書",
  invoice: "請求書",
  proposal: "提案書",
};
