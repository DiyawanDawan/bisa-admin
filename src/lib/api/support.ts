import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types/support";

export async function fetchSupportTickets(params?: {
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  search?: string;
}): Promise<SupportTicket[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.search) query.set("search", params.search);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const response = await apiGet<{ tickets: SupportTicket[] }>(
    `/admin/support/tickets${suffix}`,
  );
  return response.data.tickets;
}

export async function fetchSupportTicket(id: string): Promise<SupportTicket> {
  const response = await apiGet<SupportTicket>(`/admin/support/tickets/${id}`);
  return response.data;
}

export async function updateSupportTicket(
  id: string,
  payload: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedAdminId?: string | null;
  },
): Promise<SupportTicket> {
  const response = await apiPatch<SupportTicket>(
    `/admin/support/tickets/${id}`,
    payload,
  );
  return response.data;
}

export async function replySupportTicket(
  id: string,
  content: string,
): Promise<SupportTicket> {
  const response = await apiPost<SupportTicket>(
    `/admin/support/tickets/${id}/messages`,
    { content },
  );
  return response.data;
}

export async function resolveSupportTicket(
  id: string,
  resolutionMessage?: string,
): Promise<SupportTicket> {
  const response = await apiPost<SupportTicket>(
    `/admin/support/tickets/${id}/resolve`,
    { resolutionMessage },
  );
  return response.data;
}
