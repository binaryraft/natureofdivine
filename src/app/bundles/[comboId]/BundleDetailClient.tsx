'use client';

import { BookImage } from '@/components/BookImage';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Book, Combo } from '@/lib/data';
import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShoppingCart,
  Star,
  TrendingDown,
  Users,
  Zap,
  ChevronLeft,
  Library,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  Spiritual: 'bg-violet-100 text-violet-700',
  'Self-Help': 'bg-amber-100 text-amber-700',
  Philosophy: 'bg-emerald-100 text-emerald-700',
  Productivity: 'bg-sky-100 text-sky-700',
};

function BookRow({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 group"
    >
      {/* Cover */}
      <div className="relative h-16 w-12 flex-shrink-0 rounded-lg overflow-hidden shadow-sm bg-slate-100">
        <BookImage
          src={book.coverImage}
          alt={book.title}
          fill
          sizes="48px"
          className="object-cover"
          wrapperClassName="h-full w-full"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h4 className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
            {book.title}
          </h4>
          {book.isBestSeller && (
            <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
              Best Seller
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">by {book.author}</p>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block', categoryColors[book.category] || 'bg-slate-100 text-slate-600')}>
          {book.category}
        </span>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-muted-foreground line-through">₹{book.price}</p>
        <p className="text-xs font-bold text-emerald-600">Included</p>
      </div>
    </motion.div>
  );
}

export function BundleDetailClient({
  combo,
  comboBooks,
}: {
  combo: Combo;
  comboBooks: Book[];
}) {
  const savings = combo.bookCount * 199 - combo.price;
  const savingsPercent = Math.round((savings / (combo.bookCount * 199)) * 100);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">

      {/* BACK BREADCRUMB */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <Link
            href="/#combos"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Combo Deals
          </Link>
        </div>
      </div>

      {/* HERO BANNER */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] rounded-full bg-primary blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[120%] rounded-full bg-violet-500 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6"
            >
              <Library className="h-4 w-4" />
              Value Bundle · {combo.bookCount} Books
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-headline leading-tight mb-4"
            >
              {combo.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-300 mb-10 max-w-2xl leading-relaxed"
            >
              {combo.description}
            </motion.p>

            {/* Pricing Block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-wrap items-end gap-6 mb-10"
            >
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">Bundle Total</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-xl text-slate-500 line-through">₹{combo.bookCount * 199}</span>
                  <span className="text-5xl font-bold">₹{combo.price}</span>
                </div>
              </div>
              <div className="pb-2 space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold text-lg">₹{combo.pricePerBook}/book</span>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-bold px-3 py-1 rounded-full w-fit">
                  Save {savingsPercent}% · ₹{savings} off
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="lg"
                className="h-16 px-12 text-lg font-bold rounded-2xl bg-white text-slate-900 hover:bg-primary hover:text-white shadow-2xl shadow-black/30 transition-all duration-300 group"
                asChild
              >
                <Link href={`/checkout?comboId=${combo.id}`}>
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  Get This Bundle — ₹{combo.price}
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="text-slate-400 text-sm mt-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Fast shipping · COD available · Secure payment
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST STATS */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Package, label: 'Books Included', value: `${combo.bookCount} Titles` },
              { icon: TrendingDown, label: 'Price Per Book', value: `₹${combo.pricePerBook}` },
              { icon: Star, label: 'You Save', value: `₹${savings}` },
              { icon: Users, label: 'Readers Served', value: '50,000+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
                  <p className="font-bold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* LEFT: Book List */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
                <BookOpen className="h-4 w-4" />
                What's Inside
              </div>
              <h2 className="text-3xl font-headline mb-2">
                {comboBooks.length} Handpicked Titles
              </h2>
              <p className="text-muted-foreground">
                Every book in this bundle is a proven classic — curated to complement your journey toward self-mastery and wisdom.
              </p>
            </div>

            <div className="space-y-3">
              {comboBooks.map((book, i) => (
                <BookRow key={book.id} book={book} index={i} />
              ))}
            </div>

          </div>

          {/* RIGHT: Sticky Order Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Pricing Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
                  <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">Bundle Price</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm text-slate-500 line-through">₹{combo.bookCount * 199}</span>
                    <span className="text-4xl font-bold">₹{combo.price}</span>
                  </div>
                  <p className="text-emerald-400 font-bold text-sm">
                    Only ₹{combo.pricePerBook} per book · Save {savingsPercent}%
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* What's included */}
                  <ul className="space-y-2.5">
                    {[
                      `${combo.bookCount} curated books`,
                      'Verified physical copies',
                      'Fast pan-India shipping',
                      'Order tracking & support',
                      'COD available',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-bold rounded-2xl shadow-lg shadow-primary/20 group"
                    asChild
                  >
                    <Link href={`/checkout?comboId=${combo.id}`}>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Order Now — ₹{combo.price}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground">
                    🔒 Secure checkout · 100% satisfaction
                  </p>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-headline text-base">How It Works</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Order & Pay', desc: 'Choose COD or online payment at checkout.' },
                    { step: '2', title: 'We Source', desc: 'Our team sources and quality-checks each book.' },
                    { step: '3', title: 'Delivered', desc: 'Shipped fast to your doorstep across India.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {step}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA BANNER */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Library className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-headline mb-4">Ready to build your library?</h2>
          <p className="text-primary-foreground/80 mb-8">
            {combo.bookCount} books at ₹{combo.pricePerBook} each. Start your journey today.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-10 text-base font-bold rounded-2xl bg-white text-primary hover:bg-white/90 shadow-xl"
            asChild
          >
            <Link href={`/checkout?comboId=${combo.id}`}>
              Get the {combo.name} — ₹{combo.price}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
