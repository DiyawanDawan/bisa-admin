export type SupportTicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketCategory = "ACCOUNT" | "PAYMENT" | "KYC" | "ORDER" | "OTHER";
export type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH";

export interface SupportUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

export interface SupportMessage {
  id: string;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  content: string;
  createdAt: string;
  sender?: SupportUser | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: SupportTicketStatus;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  source: "AI_HANDOFF" | "HELP_CENTER";
  aiTranscript?: Array<{ role: "user" | "assistant"; content: string }> | null;
  createdAt: string;
  updatedAt: string;
  user: SupportUser;
  assignedAdmin?: SupportUser | null;
  messages: SupportMessage[];
  _count?: { messages: number };
}
