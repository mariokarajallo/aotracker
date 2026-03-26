export interface Product {
  id: string;
  code: string;
  description: string;
  brand?: string;
  size?: string;
  costPrice: number;
  salePrice: number;
  margin: number; // calculated: ((salePrice - costPrice) / costPrice) * 100
  createdAt: Date;
  updatedAt: Date;
}
