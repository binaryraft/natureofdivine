'use client';

import { useState } from 'react';
import { Book } from '@/lib/data';
import { BookImage } from '@/components/BookImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, ShieldCheck, Truck, BookOpen, Clock, Globe, Languages, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function BookDetailClient({ book }: { book: Book }) {
    const { addToCart } = useCart();
    const [selectedFormat, setSelectedFormat] = useState<'paperback' | 'hardcover'>('paperback');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Mock extra data for a richer experience
    const mockDetails = {
        pages: Math.floor(Math.random() * 200) + 150,
        language: 'English',
        publisher: 'Nature of the Divine Publishing',
        publicationDate: 'October 2023',
        dimensions: '5.5 x 8.5 inches',
        weight: '350g',
        isbn: `978-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    };

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Breadcrumb (Mocked) */}
            <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <span>/</span>
                <Link href="/#shop-all" className="hover:text-primary transition-colors">Books</Link>
                <span>/</span>
                <span className="text-foreground font-medium">{book.category}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
                
                {/* Image Section (Left Column) */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-white"
                    >
                        <BookImage
                            src={book.coverImage}
                            alt={book.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-700"
                            wrapperClassName="w-full h-full"
                        />
                        {book.isBestSeller && (
                            <div className="absolute top-4 left-4 z-10">
                                <Badge className="bg-rose-500 text-white hover:bg-rose-600 px-3 py-1 text-[10px] uppercase tracking-widest font-bold shadow-lg border-none">
                                    #1 Bestseller
                                </Badge>
                            </div>
                        )}
                        {book.isLatest && (
                            <div className="absolute top-4 right-4 z-10">
                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-1 text-[10px] uppercase tracking-widest font-bold shadow-lg border-none">
                                    New Release
                                </Badge>
                            </div>
                        )}
                    </motion.div>
                    
                    {/* Trust indicators under image */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-3"
                    >
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Authentic Print</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1">
                            <Truck className="h-5 w-5 text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Free Shipping</span>
                        </div>
                    </motion.div>
                </div>

                {/* Main Details Section (Middle/Right Column) */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* Header & Pricing */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-6"
                    >
                        <div className="space-y-3">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-garamond font-bold leading-tight text-slate-900 tracking-tight">
                                {book.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
                                <p className="text-lg">
                                    By <span className="font-bold text-primary cursor-pointer hover:underline">{book.author}</span> (Author)
                                </p>
                                <div className="flex items-center gap-1">
                                    <div className="flex text-amber-400">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className="h-4 w-4 fill-current" />
                                        ))}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 ml-1">4.9</span>
                                    <span className="text-sm ml-1 hover:text-primary cursor-pointer underline underline-offset-4">(128 ratings)</span>
                                </div>
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div className="pt-4 space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Select Format</h3>
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => setSelectedFormat('paperback')}
                                    className={cn(
                                        "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left w-40",
                                        selectedFormat === 'paperback' 
                                            ? "border-primary bg-primary/5 shadow-sm" 
                                            : "border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn("text-sm font-bold", selectedFormat === 'paperback' ? "text-primary" : "text-slate-700")}>Paperback</span>
                                    <span className="text-2xl font-headline font-bold text-slate-900 mt-1">₹{book.price}</span>
                                </button>
                                <button 
                                    onClick={() => setSelectedFormat('hardcover')}
                                    className={cn(
                                        "flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left w-40",
                                        selectedFormat === 'hardcover' 
                                            ? "border-primary bg-primary/5 shadow-sm" 
                                            : "border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                                    )}
                                >
                                    <span className={cn("text-sm font-bold", selectedFormat === 'hardcover' ? "text-primary" : "text-slate-700")}>Hardcover</span>
                                    <span className="text-2xl font-headline font-bold text-slate-900 mt-1">₹{Math.ceil(book.price * 1.66)}</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 pb-8 border-b border-border">
                            <Button
                                className="flex-1 h-14 rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:scale-[1.02] hover:shadow-primary/30"
                                size="lg"
                                asChild
                            >
                                <Link href={`/checkout?bookId=${book.id}&variant=${selectedFormat}`}>
                                    <BookOpen className="h-5 w-5 mr-2" /> Buy Now
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-14 rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 border-primary/20 hover:bg-primary/5 text-primary"
                                size="lg"
                                onClick={() => addToCart({ ...book, price: selectedFormat === 'hardcover' ? Math.ceil(book.price * 1.66) : book.price })}
                            >
                                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                            </Button>
                        </div>
                    </motion.div>

                    {/* Quick Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4"
                    >
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl text-center space-y-2">
                            <FileText className="h-6 w-6 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Print Length</p>
                                <p className="font-medium text-slate-900">{mockDetails.pages} pages</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl text-center space-y-2">
                            <Languages className="h-6 w-6 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Language</p>
                                <p className="font-medium text-slate-900">{mockDetails.language}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl text-center space-y-2">
                            <Clock className="h-6 w-6 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Publication Date</p>
                                <p className="font-medium text-slate-900">{mockDetails.publicationDate}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl text-center space-y-2">
                            <Globe className="h-6 w-6 text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dimensions</p>
                                <p className="font-medium text-slate-900">{mockDetails.dimensions}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Book Synopsis/Description */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl font-headline font-bold text-slate-900">About this book</h2>
                        <div className="prose prose-lg dark:prose-invert text-slate-600 leading-relaxed max-w-none">
                            <p className={cn("transition-all duration-300", !isDescriptionExpanded && "line-clamp-4")}>
                                {book.description}
                                <br/><br/>
                                Step into a world of profound insight and transformative wisdom. This masterpiece by <strong>{book.author}</strong> isn't just another addition to the {book.category} genre—it is a deeply engaging journey designed to challenge your perspectives and elevate your understanding. 
                                <br/><br/>
                                Whether you're a lifelong seeker or taking your first steps toward self-discovery, the pages within offer practical applications, vivid narratives, and timeless truths that resonate with the modern soul. Prepare to be inspired, challenged, and ultimately transformed.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="flex items-center gap-1 text-primary font-bold text-sm hover:underline"
                        >
                            {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
                        </button>
                    </motion.div>

                    {/* Product Details List */}
                    <div className="pt-8 border-t border-border">
                        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-6">Product Details</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Publisher</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.publisher}</span>
                            </li>
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Language</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.language}</span>
                            </li>
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">{selectedFormat === 'paperback' ? 'Paperback' : 'Hardcover'}</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.pages} Pages</span>
                            </li>
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">ISBN-13</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.isbn}</span>
                            </li>
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Item Weight</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.weight}</span>
                            </li>
                            <li className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Dimensions</span>
                                <span className="text-slate-900 font-bold text-right">{mockDetails.dimensions}</span>
                            </li>
                        </ul>
                    </div>

                    {/* About the Author */}
                    <div className="pt-8 pb-12 border-t border-border">
                        <h2 className="text-2xl font-headline font-bold text-slate-900 mb-6">About the Author</h2>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-garamond text-slate-400 shrink-0 border-4 border-white shadow-lg">
                                {book.author.charAt(0)}
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-900">{book.author}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {book.author} is a renowned voice in the field of {book.category.toLowerCase()}, known for bridging the gap between profound theoretical concepts and practical, everyday application. With years of dedicated study and a passionate commitment to guiding others, the author's works have resonated with thousands of readers worldwide, sparking meaningful conversations and inspiring lasting change.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
