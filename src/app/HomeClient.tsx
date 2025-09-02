
'use client';

import Image from "next/image";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { BookOpen, Feather, Lock, ShoppingCart, BookText, User, GalleryHorizontal, Quote, Star, Maximize, X } from "lucide-react";
import Link from "next/link";
import { authorBio, quotes, buyLinks, synopsis } from "@/lib/data";
import { HomePrice } from "@/components/HomePrice";
import { Suspense, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Testimonials } from "@/components/Testimonials";
import { trackEvent, fetchAnalytics, fetchChaptersAction, fetchGalleryImagesAction } from "@/lib/actions";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { SampleChapter, GalleryImage } from "@/lib/definitions";

const DynamicTestimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials), {
  loading: () => (
    <section className="w-full py-16 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground font-medium tracking-wide">Testimonials</div>
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><Quote/> From Our Readers</h2>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    </section>
  ),
  ssr: false
});

function StarRating({ rating, totalReviews }: { rating: number, totalReviews: number }) {
    if (totalReviews === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-5 w-5", i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                ))}
            </div>
            <span className="text-muted-foreground text-sm font-medium">
                {rating.toFixed(1)} ({totalReviews} reviews)
            </span>
        </div>
    );
}


function FullscreenImageViewer({ isOpen, onOpenChange, image }: { isOpen: boolean, onOpenChange: (open: boolean) => void, image: GalleryImage | null }) {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 max-w-none w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center">
        <DialogClose className="absolute right-4 top-4 z-50">
            <div className="bg-background/50 hover:bg-background/80 rounded-full p-2">
                <X className="h-6 w-6" />
            </div>
        </DialogClose>
        <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
            {image.locked ? (
                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 text-foreground z-10">
                    <Lock className="w-16 h-16 mb-4 text-accent" />
                    <p className="text-2xl font-semibold font-headline">Unlock This Chapter</p>
                    <p className="text-md text-muted-foreground mt-2 max-w-md">This is a premium preview. Purchase the book to read the full story and access all locked content.</p>
                    <Button asChild size="lg" className="mt-6 cta-button" onClick={() => trackEvent('click_buy_signed_gallery')}>
                        <Link href="/checkout">Buy Signed Copy</Link>
                    </Button>
                </div>
            ) : null}
            <Image
                src={image.src}
                fill
                style={{objectFit: 'contain'}}
                alt={image.alt}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function HomeClient() {
  const [isClient, setIsClient] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [sampleChapters, setSampleChapters] = useState<SampleChapter[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    trackEvent('page_view_home', { sessionId: crypto.randomUUID() });
    setIsClient(true);
    fetchAnalytics().then(setAnalytics);

    async function loadContent() {
        try {
            const [chapters, images] = await Promise.all([
                fetchChaptersAction(),
                fetchGalleryImagesAction()
            ]);
            setSampleChapters(chapters);
            setGalleryImages(images);
        } catch (error) {
            console.error("Failed to load dynamic content", error);
        } finally {
            setLoadingContent(false);
        }
    }
    loadContent();
  }, [])

  const showAuthorPhoto = false;
  const visibleBuyLinks = buyLinks.filter(link => link.visible);
  
  const buttonStyles: Record<string, string> = {
    Amazon: 'bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-bold shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-105',
    Flipkart: 'bg-[#2874F0] hover:bg-[#2874F0]/90 text-white shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-105',
  };

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <main className="flex-1">
          <div className="w-full py-20 md:py-32 lg:py-40">
            <div className="container px-4 md:px-6">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-24">
                <div className="flex flex-col justify-center space-y-6">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-16 w-48 mt-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Skeleton className="aspect-[2/3] w-full max-w-[450px] rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 relative overflow-hidden bg-background">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-background"></div>
           <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[radial-gradient(circle_400px_at_50%_300px,#E6E6FA,transparent)]"></div>
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-24">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none font-headline text-primary">
                    Nature of the Divine
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    A profound <i className="font-garamond">philosophical journey</i> into the <i className="font-garamond">nature of God</i>, the complex struggles of <i className="font-garamond">humanity</i>, and the simple, elegant <i className="font-garamond">path to aligning with divine existence</i>.
                  </p>
                  {analytics?.reviews ? (
                     <StarRating rating={analytics.reviews.averageRating} totalReviews={analytics.reviews.total} />
                  ) : (
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                  )}
                </div>
                 <Suspense fallback={
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-48" />
                        <div className="flex gap-4">
                            <Skeleton className="h-12 w-1/2" />
                            <Skeleton className="h-12 w-1/2" />
                        </div>
                    </div>
                 }>
                    <HomePrice />
                 </Suspense>
                 <div className="flex flex-col gap-4 items-start">
                    <Button asChild size="lg" className="w-full sm:w-auto cta-button" onClick={() => trackEvent('click_buy_hero')}>
                        <Link href="/checkout">Buy</Link>
                    </Button>
                    <a href="#sample-chapters" onClick={() => trackEvent('click_read_sample_hero')} className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
                        Read a Sample <BookOpen className="inline-block ml-1 h-4 w-4" />
                    </a>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
                  width="450"
                  height="675"
                  alt="Official book cover for Nature of the Divine by Alfas B, featuring an ethereal, divine light over a philosophical design."
                  className="mx-auto aspect-[2/3] object-contain sm:w-full lg:order-last rounded-lg"
                  data-ai-hint="book cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* About the Book Section */}
        <section id="synopsis" className="w-full py-16 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4 max-w-4xl">
                <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground font-medium tracking-wide">About the Book</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><BookText /> Nature of the Divine</h2>
                <div 
                    className="text-muted-foreground text-lg/relaxed md:text-xl/relaxed prose"
                    dangerouslySetInnerHTML={{ __html: synopsis }}
                >
                </div>
                 <p className="text-muted-foreground text-lg/relaxed md:text-xl/relaxed">Learn more about the <a href="#author" className="underline hover:text-primary">author</a> or <a href="#sample-chapters" className="underline hover:text-primary">read a sample chapter</a>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Author Bio Section */}
        <section id="author" className="w-full py-16 md:py-24 lg:py-32 bg-secondary">
          <div className={`container grid items-center justify-center gap-8 px-4 md:px-6 ${showAuthorPhoto ? 'lg:grid-cols-2 lg:gap-16' : 'lg:grid-cols-1'}`}>
            {showAuthorPhoto && (
                <div className="flex justify-center lg:order-last">
                  <Image
                    src="https://placehold.co/400x400.png"
                    width="400"
                    height="400"
                    alt="Author Alfas B"
                    className="rounded-full aspect-square object-cover shadow-lg"
                    data-ai-hint="author portrait"
                  />
                </div>
            )}
            <div className={`space-y-6 ${showAuthorPhoto ? 'text-center lg:text-left' : 'text-center'}`}>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-background px-4 py-2 text-sm text-foreground font-medium tracking-wide">The Author</div>
                <h2 className={`text-4xl font-bold tracking-tighter md:text-5xl/tight font-headline flex items-center gap-3 ${showAuthorPhoto ? 'justify-center lg:justify-start' : 'justify-center'}`}><User/> Alfas B</h2>
              </div>
              <div 
                className={`max-w-[600px] text-muted-foreground text-lg/relaxed prose ${showAuthorPhoto ? 'mx-auto lg:mx-0' : 'mx-auto'}`}
                dangerouslySetInnerHTML={{ __html: authorBio }}
              >
              </div>
               <p className={`max-w-[600px] text-muted-foreground text-lg/relaxed prose ${showAuthorPhoto ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>Discover the author's work in the <a href="#synopsis" className="underline hover:text-primary">book synopsis</a>.</p>
            </div>
          </div>
        </section>

        {/* Sample Chapters Section */}
        <section id="sample-chapters" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
                <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground font-medium tracking-wide">Preview</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><BookOpen/> Sample Chapters</h2>
              </div>
            {loadingContent ? <Skeleton className="h-64 w-full max-w-4xl mx-auto" /> : (
            <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto" defaultValue="item-1">
              {sampleChapters.map((chapter) => (
                 <AccordionItem value={`item-${chapter.number}`} key={chapter.number} onClick={() => trackEvent('view_sample_chapter', { chapter: chapter.number })}>
                  <AccordionTrigger className="text-2xl md:text-3xl font-headline text-left hover:no-underline">
                    <div className="flex items-center gap-4">
                      {chapter.locked && <Lock className="w-6 h-6 text-accent/50" />}
                      <span>{`Chapter ${chapter.number}: ${chapter.title}`}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 text-lg/relaxed text-muted-foreground">
                    {!chapter.locked ? chapter.content : (
                      <div className="p-8 text-center bg-secondary rounded-lg">
                            <Button asChild size="lg" className="cta-button" onClick={() => trackEvent('click_buy_signed_sample_chapter')}>
                                <Link href="/checkout">Buy Signed Copy</Link>
                            </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            )}
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="w-full py-16 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
                <div className="inline-block rounded-lg bg-background px-4 py-2 text-sm text-foreground font-medium tracking-wide">Gallery</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><GalleryHorizontal/> A Look Inside</h2>
              </div>
            {loadingContent ? <Skeleton className="h-96 w-full max-w-6xl mx-auto" /> : (
            <Carousel className="w-full max-w-6xl mx-auto">
              <CarouselContent>
                {galleryImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden group">
                        <CardContent className="p-0 relative aspect-[3/4]">
                          <Image
                            src={image.src}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{objectFit: 'cover'}}
                            alt={image.alt}
                            className="transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={image.aiHint}
                          />
                          <div 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => setSelectedImage(image)}
                          >
                                <Maximize className="h-12 w-12 text-white" />
                          </div>
                          {image.locked && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 text-foreground">
                              <Lock className="w-12 h-12 mb-4 text-accent" />
                              <p className="text-lg font-semibold font-headline">Unlock This Chapter</p>
                              <p className="text-sm text-muted-foreground mt-1">Purchase the book to read the full story.</p>
                                <Button asChild size="sm" className="mt-4 cta-button" onClick={() => trackEvent('click_buy_signed_gallery')}>
                                  <Link href="/checkout">Buy Signed Copy</Link>
                                </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            )}
          </div>
        </section>
        
        <FullscreenImageViewer isOpen={!!selectedImage} onOpenChange={() => setSelectedImage(null)} image={selectedImage} />
        
        <DynamicTestimonials />

        {/* Buy Now Section */}
        <section id="buy" className="w-full py-20 md:py-28 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">Get Your Copy Today</h2>
              <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
                Available at your favorite online retailers. Or place a direct order for a signed copy.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
                {visibleBuyLinks.map((link) => (
                  <Button key={link.name} asChild size="lg" className={buttonStyles[link.name]} onClick={() => trackEvent(`click_buy_${link.name.toLowerCase()}_footer`)}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      Buy on {link.name}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
