export interface Note {
  id: string;
  date: string;        // e.g. "2025-09-20"
  division: "DMV" | "NYC" | "Academy" | "Other";
  driver: string;
  status: string;
  vehicle?: string;
  notes?: string;
  createdBy: string;   // user id/email
  createdAt: number;   // timestamp
}
