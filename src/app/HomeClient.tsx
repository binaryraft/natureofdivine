
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
import { SampleChapter, GalleryImage } from "@/lib/definitions";
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

function FullscreenImageViewer({ isOpen, onOpenChange, image }: { isOpen: boolean, onOpenChange: (open: boolean) => void, image: GalleryImage | null }) {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 max-w-none w-screen h-screen bg-black/95 backdrop-blur-xl flex items-center justify-center overflow-hidden">
        <DialogTitle className="sr-only">Content Preview</DialogTitle>
        <DialogClose className="absolute right-6 top-6 z-50 focus:outline-none">
          <div className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 transition-colors group">
            <X className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </div>
        </DialogClose>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full h-full max-w-7xl max-h-[90vh] p-4 flex items-center justify-center"
        >
          {image.locked ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 text-white bg-black/60 backdrop-blur-sm rounded-xl">
              <Lock className="w-16 h-16 mb-6 text-primary animate-pulse" />
              <p className="text-4xl font-bold font-garamond mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">Premium Content</p>
              <p className="text-lg text-gray-300 max-w-md mb-8">This glimpse into the divine is reserved for our readers.</p>
              <Button asChild size="lg" className="cta-button text-lg px-10" onClick={() => trackEvent('click_buy_signed_gallery')}>
                <Link href="/checkout?variant=paperback">Unlock Now</Link>
              </Button>
            </div>
          ) : null}
          
          <div className="relative w-full h-full flex items-center justify-center">
             {image.type === 'text' ? (
                 <div className="w-full max-w-2xl aspect-[3/4] bg-[#FDFBF7] rounded-lg shadow-2xl p-12 md:p-16 flex flex-col justify-center text-slate-900 overflow-y-auto">
                    <div className="h-full border-2 border-transparent flex flex-col justify-center">
                        <p style={{
                            textAlign: image.styles?.textAlign || 'left',
                            fontStyle: image.styles?.fontStyle || 'normal',
                            fontWeight: image.styles?.fontWeight || 'normal',
                            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                        }} className="font-garamond leading-loose">
                            {image.content}
                        </p>
                    </div>
                 </div>
             ) : (
                <Image
                    src={image.src || ''}
                    fill
                    style={{ objectFit: 'contain' }}
                    alt={image.alt || 'Gallery Image'}
                    className={cn("rounded-lg shadow-2xl", image.locked && "blur-md scale-105")}
                />
             )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface Book3DProps {
  src: string;
}

function Book3D({ src }: Book3DProps) {
  return (
    <div className="group relative cursor-pointer" style={{ perspective: "2000px" }}>
      <motion.div
        initial={{ rotateY: -25, rotateX: 2, y: 0 }}
        animate={{ 
          rotateY: [-25, -20, -25], 
          rotateX: [2, 0, 2]
        }}
        transition={{ 
          rotateY: { duration: 12, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 15, repeat: Infinity, ease: "easeInOut" }
        }}
        whileHover={{ 
          rotateY: -10,
          scale: 1.05, 
          transition: { duration: 0.5 } 
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-[260px] md:w-[320px] aspect-[2/3]"
      >
        {/* Front Cover */}
        <div 
          className="absolute inset-0 z-20 rounded-r-sm rounded-l-md shadow-2xl"
          style={{ transform: "translateZ(25px)" }}
        >
          <Image
            src={src}
            fill
            alt="Book Cover"
            className="object-cover rounded-r-sm rounded-l-md"
            priority
          />
          {/* Lighting/Gloss Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/30 rounded-r-sm rounded-l-md mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20 rounded-r-sm rounded-l-md pointer-events-none" />
        </div>

        {/* Back Cover */}
        <div 
          className="absolute inset-0 bg-[#0f0f0f] rounded-l-sm rounded-r-md border border-white/5"
          style={{ transform: "rotateY(180deg) translateZ(25px)" }}
        >
           <div className="absolute inset-4 border border-white/10 rounded-sm flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 blur-xl" />
           </div>
        </div>

        {/* Spine (Left) */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808]"
          style={{ 
            width: "50px", 
            height: "100%", 
            transform: "rotateY(-90deg) translateZ(130px) md:translateZ(160px)" 
            /* 
               Width is 260(mobile)/320(desktop). 
               Half width is 130/160. 
               TranslateZ moves it to the edge.
            */
          }}
        >
           <div className="w-full h-full relative overflow-hidden flex items-center justify-center border-x border-white/10">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
              <span className="whitespace-nowrap rotate-90 text-primary font-garamond font-bold tracking-[0.3em] text-xs md:text-sm opacity-80">
                NATURE OF THE DIVINE
              </span>
           </div>
        </div>

        {/* Pages (Right) */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f8f8]"
          style={{ 
            width: "48px", 
            height: "98%", 
            transform: "rotateY(90deg) translateZ(130px) md:translateZ(160px)" 
          }}
        >
           <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#f8f8f8_0px,#f8f8f8_1px,#e5e5e5_1px,#e5e5e5_2px)] shadow-inner" />
        </div>

      </motion.div>
      
      {/* Floating Shadow */}
      <motion.div
        animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-black/40 blur-2xl rounded-[100%]"
      />
    </div>
  );
}

interface HomeClientProps {
  initialChapters: SampleChapter[];
  initialGalleryImages: GalleryImage[];
}

export function HomeClient({ initialChapters, initialGalleryImages }: HomeClientProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
           
           {/* Animated Background System */}
           <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
              
              {/* Aurora Effects - Optimized */}
              <div 
                 className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full mix-blend-screen animate-pulse" 
                 style={{ filter: 'blur(100px)', willChange: 'opacity' }}
              />
              <div 
                 className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-accent/5 rounded-full mix-blend-screen animate-pulse" 
                 style={{ filter: 'blur(80px)', animationDelay: '2s', willChange: 'opacity' }}
              />
              
              {/* Subtle Noise Texture */}
              <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
              
              {/* Floating Particles - Optimized */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                   <motion.div
                     key={i}
                     className="absolute bg-white/10 rounded-full"
                     initial={{ 
                        x: Math.random() * 100 + "vw", 
                        y: Math.random() * 100 + "vh", 
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: Math.random() * 0.5
                     }}
                     animate={{ 
                        y: [null, Math.random() * -100 + "vh"],
                        opacity: [0, 0.5, 0]
                     }}
                     transition={{ 
                        duration: Math.random() * 10 + 20, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 10
                     }}
                     style={{ 
                        width: Math.random() * 4 + 1 + "px", 
                        height: Math.random() * 4 + 1 + "px",
                        willChange: "transform, opacity" 
                     }}
                   />
                ))}
              </div>
           </div>

           <div className="container relative z-10 px-4 md:px-6">
             <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
                >
                   {/* Badge */}
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.5, duration: 0.8 }}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg"
                   >
                     <Sparkles className="w-3 h-3 text-primary" />
                     <span className="text-xs font-medium tracking-widest uppercase text-gray-300">A Spiritual Masterpiece</span>
                   </motion.div>

                   {/* Main Title */}
                   <div className="space-y-2">
                     <h1 className="flex flex-col font-garamond leading-[0.85]">
                       <motion.span 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="text-4xl md:text-5xl font-medium italic text-gray-400 font-serif tracking-wide"
                       >
                         The Nature of
                       </motion.span>
                       <motion.span 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8, type: "spring", stiffness: 50 }}
                          className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#DBC07C] via-[#FFF8E7] to-[#DBC07C] drop-shadow-2xl"
                       >
                         DIVINE
                       </motion.span>
                     </h1>
                   </div>

                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 1 }}
                     className="text-lg md:text-xl text-gray-400/90 leading-relaxed max-w-xl font-light"
                   >
                     An eye-opening philosophical journey into the nature of God and spiritual awakening. Discover the complex struggles of humanity and the elegant path to aligning with divine existence.
                   </motion.p>
                   
                   {/* Buttons */}
                   <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex flex-col sm:flex-row items-center gap-5 pt-4 w-full sm:w-auto"
                   >
                      <Button asChild size="lg" className="h-14 px-10 rounded-full bg-gradient-to-r from-primary to-[#C6A55C] hover:brightness-110 text-black font-semibold text-lg shadow-[0_0_20px_rgba(219,192,124,0.3)] hover:shadow-[0_0_30px_rgba(219,192,124,0.5)] transition-all duration-300 w-full sm:w-auto" onClick={() => trackEvent('click_buy_hero')}>
                        <Link href="/checkout?variant=paperback">
                          <span className="flex items-center gap-2">
                             Buy Signed Copy 
                          </span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white hover:border-white/40 text-lg w-full sm:w-auto transition-all" onClick={() => trackEvent('click_read_sample_hero')}>
                        <Link href="#sample-chapters">
                           Read Sample 
                        </Link>
                      </Button>
                   </motion.div>
                   
                   {/* Social Proof */}
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ delay: 1.4 }}
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
                   <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full -z-10"
                   >
                      <div className="absolute inset-[20px] border border-white/5 rounded-full" />
                      <div className="absolute inset-[100px] border border-dashed border-white/5 rounded-full opacity-50" />
                   </motion.div>

                   <Book3D src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png" />
                   
                   {/* Light Flares */}
                   <motion.div 
                      animate={{ 
                        opacity: [0, 0.4, 0],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-0 right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full -z-10 mix-blend-screen"
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
                                <Button asChild className="cta-button" onClick={() => trackEvent('click_buy_signed_sample_chapter')}>
                                  <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
                                </Button>
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


        {/* GALLERY SECTION */}
        <section id="gallery" className="py-24 md:py-32 overflow-hidden relative">
          <div className="container px-4 md:px-6 mb-12">
             <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                  <h2 className="text-4xl md:text-6xl font-bold font-garamond mb-4">Visual <span className="text-primary">Journey</span></h2>
                  <p className="text-gray-400 max-w-md">Glimpses into the illustrated world of the divine.</p>
                </div>
                <div className="flex gap-2">
                   {/* Navigation controls could go here */}
                </div>
             </div>
          </div>

          <div className="relative w-full overflow-x-auto pb-12 hide-scrollbar pl-4 md:pl-[max(1rem,calc((100vw-80rem)/2))]">
             <div className="flex gap-6 w-max pr-12">
                {initialGalleryImages.map((image, index) => (
                   <motion.div
                     key={image.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     viewport={{ once: true }}
                     transition={{ delay: index * 0.1 }}
                     className="relative w-[300px] md:w-[400px] aspect-[3/4] group cursor-pointer"
                     onClick={() => setSelectedImage(image)}
                   >
                      <div className="absolute inset-0 bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                         {image.type === 'text' ? (
                            <div className="w-full h-full bg-[#FDFBF7] p-8 flex flex-col justify-center text-slate-900">
                                <div className="h-full border-2 border-transparent flex flex-col justify-center overflow-hidden">
                                     <p style={{
                                        textAlign: image.styles?.textAlign || 'left',
                                        fontStyle: image.styles?.fontStyle || 'normal',
                                        fontWeight: image.styles?.fontWeight || 'normal',
                                        fontSize: image.styles?.fontSize || '1.1rem',
                                    }} className="font-garamond leading-relaxed">
                                        {image.content}
                                    </p>
                                </div>
                            </div>
                         ) : (
                             <Image
                               src={image.src || ''}
                               fill
                               alt={image.alt || 'Gallery Image'}
                               className={cn("object-cover transition-all duration-700 group-hover:scale-110", image.locked && "blur-sm opacity-50")}
                             />
                         )}

                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />
                         
                         <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            {image.locked ? (
                               <div className="flex items-center gap-2 text-primary font-medium">
                                  <Lock className="w-5 h-5" />
                                  <span>Locked Content</span>
                               </div>
                            ) : (
                               <div className="flex items-center gap-2 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                  <Maximize2 className="w-5 h-5" />
                                  <span>View Fullscreen</span>
                               </div>
                            )}
                         </div>
                      </div>
                   </motion.div>
                ))}
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
      
      <FullscreenImageViewer isOpen={!!selectedImage} onOpenChange={() => setSelectedImage(null)} image={selectedImage} />
    </div>
  );
}
