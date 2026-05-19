'use client';

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { type Book } from './data';
import { useAuth } from '@/hooks/useAuth';
import { db, isDummyConfig } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ── Bundle tier pricing ─────────────────────────────────────────────────────
export const BUNDLE_TIERS = [
  { minBooks: 40, pricePerBook: 99,  label: 'Ultimate Collection (40+)', saving: 100 },
  { minBooks: 30, pricePerBook: 119, label: 'Divine Library (30+)',       saving: 80  },
  { minBooks: 20, pricePerBook: 129, label: 'Seeker Suite (20+)',         saving: 70  },
  { minBooks: 10, pricePerBook: 149, label: 'Wisdom Starter (10+)',       saving: 50  },
  { minBooks: 1,  pricePerBook: 199, label: 'Single Book',                saving: 0   },
];

export function getBundleTier(totalBooks: number) {
  // Find the highest tier we qualify for, or default to the lowest (Single Book)
  return BUNDLE_TIERS.find(t => totalBooks >= t.minBooks) || BUNDLE_TIERS[BUNDLE_TIERS.length - 1];
}

export function getNextTier(totalBooks: number) {
  const currentTierIdx = BUNDLE_TIERS.findIndex(t => totalBooks >= t.minBooks);
  
  // If we don't qualify for any tier (0 books), the first goal is the 1-book tier (base)
  // but usually we want to show progress to the first DISCOUNT tier (10 books)
  if (currentTierIdx === -1) {
    return BUNDLE_TIERS[BUNDLE_TIERS.length - 2]; // The 10-book tier
  }
  
  const nextIdx = currentTierIdx - 1;
  if (nextIdx < 0) return null;
  return BUNDLE_TIERS[nextIdx];
}

// ── Types ───────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  quantity: number;
  unitPrice: number; // base ₹199
}

export interface CartState {
  items: CartItem[];
  discountCode: string;
  discountPercent: number; // e.g. 20 for WELCOME20
  open: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM';    book: Book }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'INCREMENT';   id: string }
  | { type: 'DECREMENT';   id: string }
  | { type: 'CLEAR' }
  | { type: 'SET_CART';    items: CartItem[] }
  | { type: 'SET_DISCOUNT'; code: string; percent: number }
  | { type: 'CLEAR_DISCOUNT' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

// ── Derived totals ───────────────────────────────────────────────────────────
export function cartTotals(items: CartItem[], discountPercent: number) {
  const totalBooks = items.reduce((s, i) => s + i.quantity, 0);
  const tier       = getBundleTier(totalBooks);
  const subtotal   = totalBooks * tier.pricePerBook;           // after bundle pricing
  const original   = totalBooks * 199;                         // without any discount
  const bundleSave = original - subtotal;
  const discount   = Math.round(subtotal * (discountPercent / 100));
  const total      = subtotal - discount;
  return { totalBooks, tier, subtotal, original, bundleSave, discount, total };
}

// ── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.book.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.book.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, {
          id: action.book.id,
          title: action.book.title,
          author: action.book.author,
          coverImage: action.book.coverImage,
          quantity: 1,
          unitPrice: action.book.price,
        }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case 'DECREMENT':
      return {
        ...state,
        items: state.items
          .map(i => i.id === action.id ? { ...i, quantity: i.quantity - 1 } : i)
          .filter(i => i.quantity > 0),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'SET_CART':
      return { ...state, items: action.items };
    case 'SET_DISCOUNT':
      return { ...state, discountCode: action.code, discountPercent: action.percent };
    case 'CLEAR_DISCOUNT':
      return { ...state, discountCode: '', discountPercent: 0 };
    case 'OPEN_CART':
      return { ...state, open: true };
    case 'CLOSE_CART':
      return { ...state, open: false };
    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  discountCode: '',
  discountPercent: 0,
  open: false,
};

// ── Context ──────────────────────────────────────────────────────────────────
interface CartContextValue {
  state: CartState;
  addToCart: (book: Book) => void;
  removeFromCart: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setDiscount: (code: string, percent: number) => void;
  clearDiscount: () => void;
  totals: ReturnType<typeof cartTotals>;
}

const CartContext = createContext<CartContextValue | null>(null);

const LS_KEY = 'ntd_cart_v1';

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(items: CartItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [state, dispatch] = useReducer(cartReducer, initialState, (init) => {
    // Hydrate from localStorage on first render (client only)
    if (typeof window === 'undefined') return init;
    return { ...init, items: loadFromStorage() };
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveToStorage(state.items);
  }, [state.items]);

  // Sync to / from Firestore when user logs in
  useEffect(() => {
    if (!user || isDummyConfig) return;
    const ref = doc(db, 'carts', user.uid);

    // Load from Firestore first
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as { items: CartItem[] };
        // Merge: Firestore wins if localStorage is empty; otherwise merge
        const local = loadFromStorage();
        if (local.length === 0 && data.items?.length > 0) {
          dispatch({ type: 'SET_CART', items: data.items });
        }
      }
    }).catch(() => {});

    // Save back whenever items change (debounced via useEffect)
  }, [user]);

  // Push cart to Firestore whenever items change (when logged in)
  useEffect(() => {
    if (!user || isDummyConfig) return;
    const ref = doc(db, 'carts', user.uid);
    setDoc(ref, { items: state.items, updatedAt: Date.now() }, { merge: true }).catch(() => {});
  }, [state.items, user]);

  const addToCart = useCallback((book: Book) => {
    dispatch({ type: 'ADD_ITEM', book });
    dispatch({ type: 'OPEN_CART' });
  }, []);

  const removeFromCart = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', id }), []);
  const increment = useCallback((id: string) => dispatch({ type: 'INCREMENT', id }), []);
  const decrement = useCallback((id: string) => dispatch({ type: 'DECREMENT', id }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const openCart = useCallback(() => dispatch({ type: 'OPEN_CART' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE_CART' }), []);
  const setDiscount = useCallback((code: string, percent: number) =>
    dispatch({ type: 'SET_DISCOUNT', code, percent }), []);
  const clearDiscount = useCallback(() => dispatch({ type: 'CLEAR_DISCOUNT' }), []);

  const totals = cartTotals(state.items, state.discountPercent);

  return (
    <CartContext.Provider value={{
      state, addToCart, removeFromCart, increment, decrement,
      clearCart, openCart, closeCart, setDiscount, clearDiscount, totals,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
