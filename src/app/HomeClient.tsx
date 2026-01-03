
'use client';

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent, fetchAnalytics } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { authorBio, buyLinks, synopsis } from "@/lib/data";
import { SampleChapter, Stock } from "@/lib/definitions";
import { BookOpen, Lock, BookText, User, Quote, Star, ArrowRight, Maximize2, X, ChevronRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicTestimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials), {
  loading: () => (
    <div className="w-full py-24 flex justify-center">
       <Skeleton className="h-64 w-full max-w-4xl rounded-2xl" />
    </div>
  ),
  ssr: false
});

function StarRating({ rating, totalReviews }: { rating: number, totalReviews: number }) {
  if (totalReviews === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
    >
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={cn("h-4 w-4", i < Math.round(rating) ? "text-primary fill-primary" : "text-muted-foreground/30")} />
        ))}
      </div>
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {rating.toFixed(1)} ({totalReviews} reviews)
      </span>
    </motion.div>
  );
}

interface Book3DProps {
  src: string;
}

function Book3D({ src }: Book3DProps) {
  return (
    <div className="relative w-[260px] md:w-[320px] aspect-[2/3]">
      <Image
        src={src}
        fill
        alt="Nature of the Divine Book Cover"
        className="object-cover rounded-lg"
        priority
      />
    </div>
  );
}

interface HomeClientProps {
  initialChapters: SampleChapter[];
  stock: Stock;
}

export function HomeClient({ initialChapters, stock }: HomeClientProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const isOutOfStock = stock.paperback <= 0;

  useEffect(() => {
    trackEvent('page_view_home', { sessionId: crypto.randomUUID() });
    fetchAnalytics().then(setAnalytics);
  }, [])

  const buttonStyles: Record<string, string> = {
    Amazon: 'bg-[#FF9900] text-black hover:bg-[#FF9900]/90',
    Flipkart: 'bg-[#2874F0] text-white hover:bg-[#2874F0]/90',
  };

  const visibleBuyLinks = buyLinks.filter(link => link.visible);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-10 bg-background">
           
           {/* Animated Background System - Optimized */}
           <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
              
              {/* Aurora Effects - CSS Gradients (Faster than blur filters) */}
              <div 
                 className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,hsl(var(--primary)/0.15)_0%,transparent_70%)] opacity-60 animate-aurora" 
                 style={{ willChange: 'opacity, transform' }}
              />
              <div 
                 className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,hsl(var(--accent)/0.15)_0%,transparent_70%)] opacity-50 animate-aurora" 
                 style={{ animationDelay: '2s', willChange: 'opacity, transform' }}
              />
              
              {/* Subtle Noise Texture */}
              <div className="absolute inset-0 bg-noise opacity-[0.02] mix-blend-overlay" />
           </div>

           <div className="container relative z-10 px-4 md:px-6">
             <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
                >
                   {/* Badge */}
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1, duration: 0.8 }}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-md shadow-lg"
                   >
                     <Sparkles className="w-3 h-3 text-primary" />
                     <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">A Spiritual Masterpiece</span>
                   </motion.div>

                   {/* Main Title */}
                   <div className="space-y-2">
                     <h1 className="flex flex-col font-garamond leading-[0.85]">
                       <motion.span 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-4xl md:text-5xl font-medium italic text-muted-foreground font-serif tracking-wide"
                       >
                         The Nature of
                       </motion.span>
                       <motion.span 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 50 }}
                          className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary drop-shadow-2xl"
                       >
                         DIVINE
                       </motion.span>
                     </h1>
                   </div>

                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.3 }}
                     className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl font-light"
                   >
                     An eye-opening philosophical journey into the nature of God and spiritual awakening. Discover the complex struggles of humanity and the elegant path to aligning with divine existence.
                   </motion.p>
                   
                   {/* Buttons */}
                   <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto"
                   >
                      {isOutOfStock ? (
                        <Button 
                          size="lg" 
                          disabled 
                          className="h-14 px-10 rounded-full bg-muted text-muted-foreground font-semibold text-lg cursor-not-allowed w-full sm:w-auto"
                        >
                          Out of Stock
                        </Button>
                      ) : (
                        <Button asChild size="lg" className="h-14 px-10 rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold text-lg shadow-[0_0_20px_rgba(219,192,124,0.3)] hover:shadow-[0_0_30px_rgba(219,192,124,0.5)] transition-all duration-300 w-full sm:w-auto" onClick={() => trackEvent('click_buy_hero')}>
                          <Link href="/checkout?variant=paperback">
                            <span className="flex items-center gap-2">
                               Buy Signed Copy 
                            </span>
                          </Link>
                        </Button>
                      )}
                      
                      <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full border-primary/20 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary/40 text-lg w-full sm:w-auto transition-all" onClick={() => trackEvent('click_read_sample_hero')}>
                        <Link href="#sample-chapters">
                           Read Sample 
                        </Link>
                      </Button>
                   </motion.div>
                   
                   {/* Social Proof */}
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 0.5 }}
                     className="pt-2"
                   >
                     {analytics?.reviews && (
                       <StarRating rating={analytics.reviews.averageRating} totalReviews={analytics.reviews.total} />
                     )}
                   </motion.div>
                </motion.div>

                {/* Hero 3D Book */}
                <motion.div 
                  style={{ y: y2 }}
                  className="relative flex justify-center lg:justify-center py-10 lg:py-0"
                >
                   {/* Sacred Geometry / Halo Effect behind book */}
                   <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full -z-10"
                   >
                      <div className="w-full h-full animate-spin-slow rounded-full">
                        <div className="absolute inset-[20px] border border-white/5 rounded-full" />
                        <div className="absolute inset-[100px] border border-dashed border-white/5 rounded-full opacity-50" />
                      </div>
                   </div>

                   <Book3D src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png" />
                   
                   {/* Light Flares */}
                   <div 
                      className="absolute top-0 right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -z-10 mix-blend-screen animate-flare"
                   />
                </motion.div>
             </div>
           </div>
           
           {/* Scroll Indicator */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1, y: [0, 10, 0] }}
             transition={{ delay: 2, duration: 2, repeat: Infinity }}
             className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-3"
           >
             <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to Explore</span>
             <div className="w-[1px] h-12 bg-gradient-to-b from-gray-500/0 via-gray-500/50 to-gray-500/0" />
           </motion.div>
        </section>


        {/* SYNOPSIS SECTION */}
        <section id="synopsis" className="py-24 md:py-32 relative overflow-hidden">
           <div className="container px-4 md:px-6">
              <div className="max-w-4xl mx-auto space-y-12">
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-100px" }}
                   className="text-center space-y-4"
                 >
                    <BookText className="w-10 h-10 mx-auto text-primary opacity-80" />
                    <h2 className="text-3xl md:text-5xl font-bold font-garamond text-foreground">A Journey Within</h2>
                    <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full" />
                 </motion.div>

                 <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-lg md:prose-xl prose-stone dark:prose-invert mx-auto text-muted-foreground leading-loose text-center font-light"
                    dangerouslySetInnerHTML={{ __html: synopsis }}
                 />
              </div>
           </div>
        </section>


        {/* CHAPTERS SECTION */}
        <section id="sample-chapters" className="py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="space-y-4"
               >
                  <h2 className="text-4xl md:text-6xl font-bold font-garamond">Sample <br/><span className="text-primary">Chapters</span></h2>
                  <p className="text-muted-foreground max-w-md">Experience the wisdom contained within before you commit to the journey.</p>
               </motion.div>
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
               >
                 <Button asChild variant="outline" className="group">
                    <Link href="#buy">
                      Get Full Access <Lock className="w-4 h-4 ml-2 group-hover:text-primary transition-colors" />
                    </Link>
                 </Button>
               </motion.div>
            </div>

            <div className="grid gap-6 max-w-5xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={`item-${initialChapters[0]?.number}`}>
                {initialChapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AccordionItem
                      value={`item-${chapter.number}`}
                      className="border border-border rounded-xl bg-card overflow-hidden data-[state=open]:ring-1 data-[state=open]:ring-primary/20 shadow-sm transition-all duration-300"
                    >
                      <AccordionTrigger 
                        onClick={() => trackEvent('view_sample_chapter', { chapter: chapter.number })}
                        className="px-6 py-5 hover:bg-secondary/50 transition-colors hover:no-underline group"
                      >
                        <div className="flex items-center gap-6">
                           <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-garamond font-bold text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                             {chapter.number}
                           </span>
                           <div className="text-left">
                              <h3 className={cn("text-xl md:text-2xl font-garamond font-medium transition-colors", chapter.locked ? "text-muted-foreground" : "text-foreground group-hover:text-primary")}>
                                {chapter.title}
                              </h3>
                              {chapter.locked && <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-1"><Lock className="w-3 h-3"/> Premium</span>}
                           </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-8 pt-2">
                         <div className="pl-[4rem]">
                            {!chapter.locked ? (
                              <div className="prose prose-lg prose-stone dark:prose-invert max-w-none font-serif leading-relaxed text-muted-foreground">
                                {chapter.content}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-12 bg-secondary/20 rounded-lg border border-dashed border-border text-center">
                                <Lock className="w-10 h-10 text-muted-foreground/50 mb-4" />
                                <h4 className="text-xl font-medium mb-2">This Chapter is Locked</h4>
                                <p className="text-muted-foreground mb-6 max-w-md">Purchase the full book to unlock all chapters and discover the complete philosophy.</p>
                                {isOutOfStock ? (
                                    <Button disabled className="cta-button opacity-50 cursor-not-allowed">
                                        Out of Stock
                                    </Button>
                                ) : (
                                    <Button asChild className="cta-button" onClick={() => trackEvent('click_buy_signed_sample_chapter')}>
                                        <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
                                    </Button>
                                )}
                              </div>
                            )}
                         </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          </div>
        </section>


        {/* AUTHOR SECTION */}
        <section id="author" className="py-24 md:py-32">
           <div className="container px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                 <motion.div 
                   initial={{ opacity: 0, x: -50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="relative order-2 lg:order-1"
                 >
                    <div className="aspect-square relative rounded-full overflow-hidden border-2 border-primary/20 p-2 max-w-md mx-auto">
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-secondary">
                          <Image
                             src="https://placehold.co/600x600/1a1a1a/FFF?text=Alfas+B"
                             fill
                             alt="Alfas B"
                             className="object-cover"
                          />
                        </div>
                    </div>
                    {/* Decorative orbit */}
                    <div className="absolute inset-0 border border-primary/10 rounded-full scale-110 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-0 border border-dashed border-primary/20 rounded-full scale-125 animate-[spin_30s_linear_infinite_reverse]" />
                 </motion.div>

                 <motion.div 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="space-y-8 order-1 lg:order-2 text-center lg:text-left"
                 >
                    <div>
                       <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground font-medium mb-4">The Mind Behind</div>
                       <h2 className="text-4xl md:text-5xl font-bold font-garamond">Alfas B</h2>
                    </div>
                    <div 
                      className="prose prose-lg prose-stone dark:prose-invert text-muted-foreground font-light leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: authorBio }}
                    />
                    <div className="pt-4">
                       <Image 
                          src="/signature.png" 
                          width={200} 
                          height={80} 
                          alt="Signature" 
                          className="opacity-80 dark:invert mx-auto lg:mx-0"
                          style={{ display: 'none' }} // Placeholder if signature image exists
                       />
                    </div>
                 </motion.div>
              </div>
           </div>
        </section>


        {/* TESTIMONIALS */}
        <DynamicTestimonials />

        {/* CTA / FOOTER HERO */}
        <section id="buy" className="py-32 relative bg-primary text-primary-foreground overflow-hidden">
           <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
           
           <div className="container px-4 md:px-6 relative z-10 text-center space-y-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                 <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary-foreground/80" />
                 <h2 className="text-5xl md:text-7xl font-bold font-garamond tracking-tight">Begin Your Awakening</h2>
                 <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto mt-6 font-light">
                   The path to the divine is waiting. Order your signed copy today and transform your understanding of existence.
                 </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center items-center gap-6"
              >
                 {visibleBuyLinks.map((link) => (
                  <Button 
                    key={link.name} 
                    asChild 
                    size="lg" 
                    className={cn(buttonStyles[link.name], "h-16 px-10 text-lg rounded-full font-bold shadow-2xl hover:scale-105 transition-all duration-300")}
                    onClick={() => trackEvent(`click_buy_${link.name.toLowerCase()}_footer`)}
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      Buy on {link.name}
                    </a>
                  </Button>
                ))}
              </motion.div>
           </div>
        </section>

      </main>
      
    </div>
  );
}
