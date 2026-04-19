import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Member } from '@/types';
import { generateInvoiceNo } from '@/lib/utils';

export interface ParkedBill {
  id: string;
  billNo: string;
  member: Member | null;
  items: CartItem[];
  discount: number;
  notes: string;
  subtotal: number;
  status: 'parked' | 'recalled' | 'completed' | 'cancelled';
  createdAt: string;
}

interface ParkedBillsStore {
  bills: ParkedBill[];
  parkBill: (bill: Omit<ParkedBill, 'id' | 'billNo' | 'createdAt' | 'status'>) => ParkedBill;
  recallBill: (id: string) => ParkedBill | null;
  cancelBill: (id: string) => void;
  completeBill: (id: string) => void;
  syncToSheets: (bill: ParkedBill) => Promise<void>;
  updateStatusInSheets: (id: string, status: string) => Promise<void>;
}

export const useParkedBillsStore = create<ParkedBillsStore>()(
  persist(
    (set, get) => ({
      bills: [],

      parkBill: (billData) => {
        const bill: ParkedBill = {
          ...billData,
          id: crypto.randomUUID(),
          billNo: generateInvoiceNo(),
          status: 'parked',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ bills: [...s.bills, bill] }));
        get().syncToSheets(bill).catch(console.error);
        return bill;
      },

      recallBill: (id) => {
        const bill = get().bills.find((b) => b.id === id);
        if (!bill) return null;
        set((s) => ({
          bills: s.bills.map((b) => b.id === id ? { ...b, status: 'recalled' } : b),
        }));
        get().updateStatusInSheets(id, 'recalled').catch(console.error);
        return { ...bill, status: 'recalled' };
      },

      cancelBill: (id) => {
        set((s) => ({
          bills: s.bills.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b),
        }));
        get().updateStatusInSheets(id, 'cancelled').catch(console.error);
      },

      completeBill: (id) => {
        set((s) => ({
          bills: s.bills.map((b) => b.id === id ? { ...b, status: 'completed' } : b),
        }));
        get().updateStatusInSheets(id, 'completed').catch(console.error);
      },

      syncToSheets: async (bill) => {
        await fetch('/api/parked-bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: bill.id,
            billNo: bill.billNo,
            memberId: bill.member?.id || '',
            memberName: bill.member?.name || '',
            items: bill.items,
            subtotal: bill.subtotal,
            discount: bill.discount,
            notes: bill.notes,
            createdAt: bill.createdAt,
          }),
        });
      },

      updateStatusInSheets: async (id, status) => {
        await fetch('/api/parked-bills', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });
      },
    }),
    { name: 'ct-parked-bills' }
  )
);
