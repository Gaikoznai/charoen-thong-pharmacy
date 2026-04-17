import { create } from 'zustand';
import { CartItem, Member } from '@/types';

interface CartStore {
  items: CartItem[];
  member: Member | null;
  discount: number;
  notes: string;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setMember: (member: Member | null) => void;
  setDiscount: (discount: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  finalAmount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  member: null,
  discount: 0,
  notes: '',

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity, totalPrice: (i.quantity + item.quantity) * i.price * (1 - i.discount / 100) }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    });
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity, totalPrice: quantity * i.price * (1 - i.discount / 100) }
          : i
      ),
    }));
  },

  updateItemDiscount: (productId, discount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? { ...i, discount, totalPrice: i.quantity * i.price * (1 - discount / 100) }
          : i
      ),
    }));
  },

  setMember: (member) => set({ member }),
  setDiscount: (discount) => set({ discount }),
  setNotes: (notes) => set({ notes }),
  clearCart: () => set({ items: [], member: null, discount: 0, notes: '' }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.totalPrice, 0),
  finalAmount: () => Math.max(0, get().subtotal() - get().discount),
}));
