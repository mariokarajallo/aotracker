export type OrderStatus =
  | "pending_settlement"
  | "settled_zero_balance"
  | "settled_pending_balance";

export interface OrderItem {
  id: string;
  productId: string;
  code: string;
  description: string;
  size?: string;
  salePrice: number;
  deliveredQty: number;
  returnedQty: number;
  soldQty: number;    // calculated: deliveredQty - returnedQty
  subtotal: number;   // calculated: soldQty * salePrice
}

export interface Order {
  id: string;
  orderNumber: number;  // sequential — assigned at creation via Firestore counter
  customerId: string;
  customerName: string; // denormalized
  status: OrderStatus;
  items: OrderItem[];
  totalDelivered: number;
  totalReturned: number;
  totalSold: number;
  totalDue: number;
  penalty: number;
  grandTotal: number;   // totalDue + penalty
  amountPaid: number;
  balance: number;      // grandTotal - amountPaid
  notes?: string;
  createdAt: Date;
  settledAt?: Date;
}
