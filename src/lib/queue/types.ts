export type TicketStatus =
  | "waiting" | "called" | "serving" | "done" | "no_show" | "cancelled";

export interface Service {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
}

export interface Counter {
  id: string;
  name: string;
  service_id: string;
  is_open: boolean;
}

export interface Ticket {
  id: string;
  service_id: string;
  seq: number;
  number: string;
  status: TicketStatus;
  counter_id: string | null;
  recall_count: number;
  service_day: string;
  created_at: string;
  called_at: string | null;
  served_at: string | null;
  finished_at: string | null;
  device_id: string | null;
}
