export interface Product {
  id: string;
  name: string;
  genericName: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  minStock: number;
  expiryDate: string;
  supplierId: string;
  supplierName?: string;
  description: string;
  requirePrescription: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  points: number;
  totalSpent: number;
  joinDate: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  memberId: string;
  memberName: string;
  subtotal: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'credit';
  cashReceived: number;
  change: number;
  pointsEarned: number;
  pointsUsed: number;
  notes: string;
  status: 'completed' | 'voided';
  createdAt: string;
  items?: SaleItem[];
}

export interface CartItem {
  productId: string;
  productName: string;
  barcode: string;
  price: number;
  quantity: number;
  discount: number;
  totalPrice: number;
  stock: number;
  requirePrescription: boolean;
}

export interface SheetsConfig {
  spreadsheetId: string;
  credentials: string;
}
