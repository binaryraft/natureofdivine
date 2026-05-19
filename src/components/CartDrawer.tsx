'use client';

import Image from 'next/image';
import { BookImage } from '@/components/BookImage';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart, cartTotals, getBundleTier, getNextTier, BUNDLE_TIERS } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  TrendingDown,
  Gift,
  Package,
  X,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tierColors = [
  'bg-amber-500',    // 1-9
  'bg-emerald-500',  // 10+
  'bg-teal-500',     // 20+
  'bg-violet-500',   // 30+
  'bg-rose-500',     // 40+
];

function TierProgressBar({ totalBooks }: { totalBooks: number }) {
  const tier = getBundleTier(totalBooks);
  const next = getNextTier(totalBooks);

  if (!next) {
    return (
      <div className="px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-sm">
          <Sparkles className="h-4 w-4" />
          Ultimate tier! ₹{tier.pricePerBook}/book — Max savings!
        </div>
      </div>
    );
  }

  const needed = next.minBooks - totalBooks;
  const progress = ((totalBooks - tier.minBooks) / (next.minBooks - tier.minBooks)) * 100;

  return (
    <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700">
          {tier.label} · <span className="text-primary">₹{tier.pricePerBook}/book</span>
        </span>
        <span className="text-emerald-700 font-bold">
          +{needed} for ₹{next.pricePerBook}/book!
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Add {needed} more book{needed > 1 ? 's' : ''} to unlock <strong>{next.label}</strong> pricing
      </p>
    </div>
  );
}

function CartItemRow({ item }: { item: ReturnType<typeof useCart>['state']['items'][0] }) {
  const { increment, decrement, removeFromCart } = useCart();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0"
    >
      <div className="relative h-14 w-10 flex-shrink-0 rounded-md overflow-hidden shadow-sm bg-slate-100">
        <BookImage
          src={item.coverImage}
          alt={item.title}
          fill
          sizes="40px"
          className="object-cover"
          wrapperClassName="h-full w-full"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 truncate leading-tight">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{item.author}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => decrement(item.id)}
          className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
        <button
          onClick={() => increment(item.id)}
          className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button
          onClick={() => removeFromCart(item.id)}
          className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

export function CartDrawer() {
  const { state, closeCart, clearCart, totals } = useCart();
  const { items, open, discountCode, discountPercent } = state;

  // Build checkout URL with cart items
  const checkoutUrl = (() => {
    if (items.length === 0) return '/checkout';
    const params = new URLSearchParams();
    items.forEach(item => {
      params.append('bookId[]', item.id);
      params.append('qty[]', String(item.quantity));
    });
    if (discountCode) params.set('code', discountCode);
    return `/checkout?${params.toString()}`;
  })();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeCart()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] p-0 flex flex-col bg-[#fdfbf7]"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-200 bg-white">
          <SheetTitle className="flex items-center gap-2 text-base font-headline">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Your Cart
            {items.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {totals.totalBooks} book{totals.totalBooks !== 1 ? 's' : ''}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-10 w-10 text-primary/40" />
            </div>
            <div>
              <p className="font-headline text-xl mb-1">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Browse our catalog and add books you love.</p>
            </div>
            <Button className="rounded-full px-8 mt-2" onClick={closeCart} asChild>
              <Link href="/#shop-all">Explore Books</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Tier progress */}
            <div className="px-5 pt-4">
              <TierProgressBar totalBooks={totals.totalBooks} />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <AnimatePresence>
                {items.map(item => <CartItemRow key={item.id} item={item} />)}
              </AnimatePresence>
            </div>

            {/* Pricing summary */}
            <div className="border-t border-slate-200 bg-white px-5 py-4 space-y-3">

              {/* Active tier badge */}
              <div className="flex items-center gap-2 text-[11px]">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-bold text-emerald-700">
                  {totals.tier.label} · ₹{totals.tier.pricePerBook}/book
                </span>
                {totals.bundleSave > 0 && (
                  <span className="ml-auto bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    Bundle saves ₹{totals.bundleSave}
                  </span>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Original ({totals.totalBooks}× ₹199)</span>
                  <span>₹{totals.original}</span>
                </div>
                {totals.bundleSave > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Bundle discount</span>
                    <span>−₹{totals.bundleSave}</span>
                  </div>
                )}
                {discountPercent > 0 && (
                  <div className="flex justify-between text-primary font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> {discountCode} ({discountPercent}%)
                    </span>
                    <span>−₹{totals.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-bold">FREE 🎉</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-primary text-lg">₹{totals.total}</span>
                </div>
              </div>

              {/* Discount code hint */}
              {!discountCode && (
                <button
                  className="w-full flex items-center gap-2 text-[11px] text-primary font-medium hover:underline"
                  onClick={() => {
                    closeCart();
                    window.location.href = `/checkout?code=WELCOME20`;
                  }}
                >
                  <Gift className="h-3.5 w-3.5" />
                  Have a code? WELCOME20 = 20% off new customers
                </button>
              )}

              {/* CTA */}
              <Button
                className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 group"
                asChild
              >
                <Link href={checkoutUrl} onClick={closeCart}>
                  Proceed to Order — ₹{totals.total}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <button
                onClick={clearCart}
                className="w-full text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
