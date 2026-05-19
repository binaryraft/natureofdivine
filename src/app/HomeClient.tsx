'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/actions";
import { books, combos, type Book, type Combo } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { BookImage } from "@/components/BookImage";
import { 
  ShoppingBag, 
  ShoppingCart,
  Sparkles, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  Zap, 
  Library, 
  Package,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

function ProductCard({ book }: { book: Book }) {
  const { addToCart } = useCart();

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <Link href={`/books/${book.id}`} className="block relative aspect-[2/3] overflow-hidden bg-slate-100">
        <BookImage 
          src={book.coverImage} 
          alt={book.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          wrapperClassName="h-full w-full"
        />
        {book.isBestSeller && (
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
            BEST SELLER
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{book.category}</p>
          <h3 className="font-headline text-base line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
          <p className="text-xs text-muted-foreground mb-3">by {book.author}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-bold">₹{book.price}</span>
            <span className="text-[10px] text-muted-foreground ml-1">+ shipping</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-white transition-colors"
            onClick={() => addToCart(book)}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ComboCard({ combo }: { combo: Combo }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden p-6 text-white shadow-2xl group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Library className="h-32 w-32" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-4">
          <span className="bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/30 uppercase tracking-widest">
            Value Bundle
          </span>
        </div>
        
        <h3 className="text-2xl font-headline mb-2">{combo.name}</h3>
        <p className="text-sm text-slate-300 mb-6 line-clamp-2">{combo.description}</p>
        
        <div className="mt-auto space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Total Price</p>
              <span className="text-3xl font-bold">₹{combo.price}</span>
            </div>
            <div className="pb-1">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Only</p>
              <span className="text-lg font-medium text-emerald-400">₹{combo.pricePerBook}/book</span>
            </div>
          </div>
          
          <Button className="w-full bg-white text-slate-900 hover:bg-primary hover:text-white transition-all font-bold rounded-xl h-11" asChild>
            <Link href={`/bundles/${combo.id}`}>
              View Bundle Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function HomeClient() {
  useEffect(() => {
    trackEvent('page_view_publisher_home', { sessionId: crypto.randomUUID() });
  }, []);

  const latestBooks = books.filter(b => b.isLatest || b.category === 'Spiritual');
  const bestSellers = books.filter(b => b.isBestSeller);

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-900">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="h-4 w-4" /> Curated Wisdom For Seekers
            </div>
            <h1 className="text-5xl md:text-7xl font-headline leading-tight mb-6">
              Nature of the Divine <br/>
              <span className="text-primary italic">& Publisher</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              We curate and publish essential spiritual and self-help literature to guide your awakening. Access masterpieces at prices that welcome everyone.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-14 font-bold text-base shadow-xl shadow-primary/20" asChild>
                <Link href="#shop-all">Explore Catalog</Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 font-bold text-base bg-white/50 backdrop-blur" asChild>
                <Link href="#combos">View Combo Deals</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK STATS */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Flat Price</p>
              <p className="font-bold">₹199 / Book</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Fast Delivery</p>
              <p className="font-bold">Pan-India Shipping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
              <Star className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Community</p>
              <p className="font-bold">50k+ Readers</p>
            </div>
          </div>
        </div>
      </div>


      {/* WELCOME DISCOUNT BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">🎉 New Customer Welcome Offer</p>
                <p className="text-emerald-100 text-sm">Free shipping on all orders + 20% off your first purchase</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-white/20 border border-white/40 rounded-xl px-4 py-2 font-mono font-bold text-lg tracking-widest">
                WELCOME20
              </div>
              <Button 
                size="sm" 
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl px-5 h-10 shadow-lg"
                asChild
              >
                <Link href="/checkout?code=WELCOME20">
                  Claim 20% Off <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 space-y-24">
        
        {/* SECTION: BEST SELLERS */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-widest mb-2">
                <TrendingUp className="h-4 w-4" /> Everyone's Reading
              </div>
              <h2 className="text-3xl md:text-4xl font-headline">Best Sellers</h2>
            </div>
            <Link href="#shop-all" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {bestSellers.map(book => (
              <ProductCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* SECTION: COMBOS (THE LITERARY PACKS) */}
        <section id="combos" className="scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <Library className="h-5 w-5" /> Maximum Wisdom, Minimum Price
            </div>
            <h2 className="text-4xl md:text-5xl font-headline mb-4">Unbeatable Combo Deals</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Build your library in one go. Our combo packs offer the best value per book, perfect for serious students of self-mastery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {combos.map(combo => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
          
          {/* Combo details info */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-headline text-xl mb-2">How Combos Work</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When you order a combo, you can either let our editors curate the best mix for you, or specify your preferred titles in the order notes. We ensure each book is sourced and quality-checked before shipment.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: LATEST RELEASES */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                <Sparkles className="h-4 w-4" /> New Arrivals
              </div>
              <h2 className="text-3xl md:text-4xl font-headline">Latest Releases</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {latestBooks.map(book => (
              <ProductCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        {/* SECTION: SHOP ALL GRID */}
        <section id="shop-all" className="scroll-mt-24">
          <div className="border-t border-slate-200 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-headline mb-4">Complete Catalog</h2>
              <p className="text-muted-foreground">Every single book in our collection is priced at ₹199 to ensure wisdom is accessible to all.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {books.map(book => (
                <ProductCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER CALL TO ACTION */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
          <Image 
            src="https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2000&auto=format&fit=crop" 
            alt="Library" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 max-w-2xl">
          <Library className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-headline mb-6">Start Your Spiritual Library Today</h2>
          <p className="text-slate-400 mb-10 text-lg">
            From individual masterpieces to 40-book collections, we provide the tools you need for a life of purpose and alignment.
          </p>
          <Button size="lg" className="rounded-full px-10 h-14 font-bold text-lg" asChild>
            <Link href="#shop-all">Browse All Books</Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
