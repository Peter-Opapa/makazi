import { apiFetch } from "./api";

/** Files a support ticket for the current user — surfaces in the Admin Portal's support queue. */
export function createSupportTicket(input: { subject: string; message: string }) {
  return apiFetch<{ id: string; ticketNumber: string }>("/support-tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
