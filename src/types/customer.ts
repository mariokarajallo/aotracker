export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  nationalId?: string;
  address?: string;
  status: CustomerStatus;
  notes?: string;
  createdAt: Date;
}
