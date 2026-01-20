'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, BookOpen, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/definitions';

interface ProductsSliderProps {
    products: Product[];
    bookProduct?: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        isBook: true;
        stock: number;
    };
}

export function ProductsSlider({ products, bookProduct }: ProductsSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const constraintsRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    // Combine book and shop products
    const allProducts = bookProduct ? [bookProduct, ...products] : products;
    const totalProducts = allProducts.length;

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying || totalProducts === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalProducts);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, totalProducts]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + totalProducts) % totalProducts);
        setIsAutoPlaying(false);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % totalProducts);
        setIsAutoPlaying(false);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
    };

    if (totalProducts === 0) return null;

    return (
        <section className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 md:px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium uppercase tracking-wider text-primary">
                            Sacred Collection
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold font-garamond">
                        Explore Our <span className="text-primary">Divine Offerings</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        From the transformative book to carefully curated spiritual merchandise
                    </p>
                </motion.div>

                {/* Desktop Slider */}
                <div className="hidden md:block">
                    <div className="relative max-w-7xl mx-auto">
                        {/* Main Slider */}
                        <div className="relative overflow-hidden rounded-3xl">
                            <motion.div
                                className="flex transition-transform duration-500 ease-out"
                                style={{
                                    transform: `translateX(-${currentIndex * 100}%)`,
                                }}
                            >
                                {allProducts.map((product, index) => {
                                    const isBook = 'isBook' in product && product.isBook;
                                    return (
                                        <div
                                            key={product.id}
                                            className="min-w-full px-4"
                                            onMouseEnter={() => setIsAutoPlaying(false)}
                                            onMouseLeave={() => setIsAutoPlaying(true)}
                                        >
                                            <div className="grid md:grid-cols-2 gap-12 items-center bg-card border border-border rounded-2xl p-8 md:p-12 shadow-xl">
                                                {/* Product Image */}
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                    className="relative aspect-square rounded-xl overflow-hidden bg-secondary/20"
                                                >
                                                    <Image
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover hover:scale-110 transition-transform duration-700"
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        priority={index === 0}
                                                    />
                                                    {product.stock <= 0 && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <span className="text-white text-2xl font-bold">Out of Stock</span>
                                                        </div>
                                                    )}
                                                    {isBook && (
                                                        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                                            Bestseller
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {/* Product Details */}
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    className="space-y-6"
                                                >
                                                    <div className="space-y-3">
                                                        <h3 className="text-3xl md:text-4xl font-bold font-garamond">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-muted-foreground text-lg leading-relaxed">
                                                            {product.description}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-baseline gap-3">
                                                        <span className="text-4xl font-bold text-primary">
                                                            ₹{product.price}
                                                        </span>
                                                        {isBook && (
                                                            <span className="text-sm text-muted-foreground line-through">
                                                                ₹399
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Stock & Delivery Info */}
                                                    <div className="flex items-center gap-6 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                product.stock > 10 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"
                                                            )} />
                                                            <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                                                        </div>
                                                        {product.stock > 0 && (
                                                            <>
                                                                <div className="h-4 w-[1px] bg-border" />
                                                                <div className="flex items-center gap-2 text-primary font-medium">
                                                                    <Truck className="w-4 h-4" />
                                                                    <span>2-7 Days Delivery</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* CTA Buttons */}
                                                    <div className="flex flex-wrap gap-4 pt-4">
                                                        {isBook ? (
                                                            <>
                                                                <Button
                                                                    asChild
                                                                    size="lg"
                                                                    disabled={product.stock <= 0}
                                                                    className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
                                                                >
                                                                    <Link href="/checkout?variant=paperback">
                                                                        <BookOpen className="w-5 h-5 mr-2" />
                                                                        Buy Signed Copy
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    asChild
                                                                    variant="outline"
                                                                    size="lg"
                                                                    className="h-14 px-8 rounded-full border-primary/20 hover:bg-primary/10"
                                                                >
                                                                    <Link href="#sample-chapters">
                                                                        Read Sample
                                                                    </Link>
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    asChild
                                                                    size="lg"
                                                                    disabled={product.stock <= 0}
                                                                    className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold shadow-lg hover:shadow-xl transition-all"
                                                                >
                                                                    <Link href={`/shop?product=${product.id}`}>
                                                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                                                        Add to Cart
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    asChild
                                                                    variant="outline"
                                                                    size="lg"
                                                                    className="h-14 px-8 rounded-full border-primary/20 hover:bg-primary/10"
                                                                >
                                                                    <Link href="/shop">
                                                                        View All Products
                                                                    </Link>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={handlePrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all z-10"
                            aria-label="Previous product"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all z-10"
                            aria-label="Next product"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Dots Navigation */}
                        <div className="flex justify-center gap-2 mt-8">
                            {allProducts.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleDotClick(index)}
                                    className={cn(
                                        "h-2 rounded-full transition-all",
                                        index === currentIndex
                                            ? "w-8 bg-primary"
                                            : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                    )}
                                    aria-label={`Go to product ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Scrollable Grid */}
                <div className="md:hidden">
                    <div className="overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide">
                        <div className="flex gap-6" style={{ width: `${totalProducts * 320}px` }}>
                            {allProducts.map((product) => {
                                const isBook = 'isBook' in product && product.isBook;
                                return (
                                    <div
                                        key={product.id}
                                        className="w-80 flex-shrink-0"
                                    >
                                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg h-full flex flex-col">
                                            {/* Image */}
                                            <div className="relative aspect-square bg-secondary/20">
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="320px"
                                                />
                                                {product.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <span className="text-white font-bold">Out of Stock</span>
                                                    </div>
                                                )}
                                                {isBook && (
                                                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                                                        Bestseller
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex flex-col flex-1">
                                                <h3 className="text-xl font-bold font-garamond mb-2">
                                                    {product.name}
                                                </h3>
                                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                                                    {product.description}
                                                </p>

                                                <div className="space-y-4">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-bold text-primary">
                                                            ₹{product.price}
                                                        </span>
                                                        {isBook && (
                                                            <span className="text-xs text-muted-foreground line-through">
                                                                ₹399
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            product.stock > 10 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"
                                                        )} />
                                                        <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                                                    </div>

                                                    {isBook ? (
                                                        <Button
                                                            asChild
                                                            disabled={product.stock <= 0}
                                                            className="w-full rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold"
                                                        >
                                                            <Link href="/checkout?variant=paperback">
                                                                <BookOpen className="w-4 h-4 mr-2" />
                                                                Buy Now
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            asChild
                                                            disabled={product.stock <= 0}
                                                            className="w-full rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold"
                                                        >
                                                            <Link href={`/shop?product=${product.id}`}>
                                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                                Add to Cart
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile scroll indicator */}
                    <div className="flex justify-center gap-1 mt-4">
                        {allProducts.map((_, index) => (
                            <div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
