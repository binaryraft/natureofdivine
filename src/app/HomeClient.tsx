
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
import { BookOpen, Lock, BookText, User, GalleryHorizontal, Quote, Star, Maximize, X } from "lucide-react";
import Link from "next/link";
import { authorBio, quotes, buyLinks, synopsis } from "@/lib/data";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent, fetchAnalytics } from "@/lib/actions";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { SampleChapter, GalleryImage } from "@/lib/definitions";

const DynamicTestimonials = dynamic(() => import('@/components/Testimonials').then(mod => mod.Testimonials), {
  loading: () => (
    <section className="w-full py-16 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
          <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground font-medium tracking-wide">Testimonials</div>
          <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><Quote className="text-primary" /> From Our Readers</h2>
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
    <div className="flex items-center gap-2 animate-fade-in">
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
      <DialogContent className="p-0 border-0 max-w-none w-screen h-screen bg-black/90 backdrop-blur-xl flex items-center justify-center duration-300">
        <DialogClose className="absolute right-6 top-6 z-50">
          <div className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-2 transition-colors">
            <X className="h-6 w-6 text-white" />
          </div>
        </DialogClose>
        <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4">
          {image.locked ? (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 text-foreground z-10 rounded-xl">
              <Lock className="w-16 h-16 mb-6 text-primary animate-pulse" />
              <p className="text-3xl font-semibold font-headline mb-2">Unlock This Chapter</p>
              <p className="text-lg text-muted-foreground mt-2 max-w-md">This is a premium preview. Purchase the book to read the full story and access all locked content.</p>
              <Button asChild size="lg" className="mt-8 cta-button" onClick={() => trackEvent('click_buy_signed_gallery')}>
                <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
              </Button>
            </div>
          ) : null}
          <Image
            src={image.src}
            fill
            style={{ objectFit: 'contain' }}
            alt={image.alt}
            className="rounded-lg shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface HomeClientProps {
  initialChapters: SampleChapter[];
  initialGalleryImages: GalleryImage[];
}

export function HomeClient({ initialChapters, initialGalleryImages }: HomeClientProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    trackEvent('page_view_home', { sessionId: crypto.randomUUID() });
    fetchAnalytics().then(setAnalytics);
  }, [])

  const showAuthorPhoto = false;
  const visibleBuyLinks = buyLinks.filter(link => link.visible);

  const buttonStyles: Record<string, string> = {
    Amazon: 'bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-bold shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-105',
    Flipkart: 'bg-[#2874F0] hover:bg-[#2874F0]/90 text-white shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-105',
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 relative overflow-hidden bg-background">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
          <div className="absolute top-0 left-0 -z-10 h-full w-full bg-[url('/noise.png')] opacity-[0.03]"></div>
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-24 items-center">
              <div className="flex flex-col justify-center space-y-8 animate-fade-in-up">
                <div className="space-y-6">
                  <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl xl:text-8xl/none font-headline text-primary drop-shadow-sm">
                    Nature of the Divine
                  </h1>
                  <p
                    className="max-w-[600px] text-muted-foreground md:text-xl/relaxed leading-loose"
                    dangerouslySetInnerHTML={{ __html: "A profound <i class='font-garamond text-foreground font-semibold'>philosophical journey</i> into the <i class='font-garamond text-foreground font-semibold'>nature of God</i>, the complex struggles of <i class='font-garamond text-foreground font-semibold'>humanity</i>, and the simple, elegant <i class='font-garamond text-foreground font-semibold'>path to aligning with divine existence</i>." }}
                  >
                  </p>
                  {analytics?.reviews ? (
                    <StarRating rating={analytics.reviews.averageRating} totalReviews={analytics.reviews.total} />
                  ) : (
                    <div className="flex items-center gap-2 h-5">
                      {/* Placeholder for layout stability */}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Button asChild size="lg" className="w-full sm:w-auto cta-button h-12 text-lg" onClick={() => trackEvent('click_buy_hero')}>
                    <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
                  </Button>
                  <a href="#sample-chapters" onClick={() => trackEvent('click_read_sample_hero')} className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-4 py-2">
                    Read a Sample <BookOpen className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center animate-fade-in-up animate-delay-200">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <Image
                    src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
                    width="450"
                    height="675"
                    alt="Official book cover for Nature of the Divine by Alfas B"
                    className="relative mx-auto aspect-[2/3] object-contain sm:w-full lg:order-last rounded-lg shadow-2xl transform transition-transform duration-500 hover:scale-[1.02]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About the Book Section */}
        <section id="synopsis" className="w-full py-16 md:py-24 lg:py-32 bg-background relative">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center animate-fade-in-up">
              <div className="space-y-6 max-w-4xl">
                <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground font-medium tracking-wide">About the Book</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><BookText className="text-primary" /> Nature of the Divine</h2>
                <div
                  className="text-muted-foreground text-lg/relaxed md:text-xl/relaxed prose prose-lg prose-stone dark:prose-invert mx-auto"
                  dangerouslySetInnerHTML={{ __html: synopsis }}
                >
                </div>
                <p className="text-muted-foreground text-lg/relaxed md:text-xl/relaxed pt-4">Learn more about the <a href="#author" className="text-primary font-medium hover:underline underline-offset-4">author</a> or <a href="#sample-chapters" className="text-primary font-medium hover:underline underline-offset-4">read a sample chapter</a>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Author Bio Section */}
        <section id="author" className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className={`container grid items-center justify-center gap-12 px-4 md:px-6 ${showAuthorPhoto ? 'lg:grid-cols-2 lg:gap-16' : 'lg:grid-cols-1'}`}>
            {showAuthorPhoto && (
              <div className="flex justify-center lg:order-last animate-fade-in-up">
                <Image
                  src="https://placehold.co/400x400.png"
                  width="400"
                  height="400"
                  alt="Author Alfas B"
                  className="rounded-2xl aspect-square object-cover shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500"
                />
              </div>
            )}
            <div className={`space-y-8 ${showAuthorPhoto ? 'text-center lg:text-left' : 'text-center'} animate-fade-in-up`}>
              <div className="space-y-6">
                <div className="inline-block rounded-full bg-background px-4 py-1.5 text-sm text-foreground font-medium tracking-wide shadow-sm">The Author</div>
                <h2 className={`text-4xl font-bold tracking-tighter md:text-5xl/tight font-headline flex items-center gap-3 ${showAuthorPhoto ? 'justify-center lg:justify-start' : 'justify-center'}`}><User className="text-primary" /> Alfas B</h2>
              </div>
              <div
                className={`max-w-[700px] text-muted-foreground text-lg/relaxed prose prose-lg ${showAuthorPhoto ? 'mx-auto lg:mx-0' : 'mx-auto'}`}
                dangerouslySetInnerHTML={{ __html: authorBio }}
              >
              </div>
              <p className={`max-w-[600px] text-muted-foreground text-lg/relaxed ${showAuthorPhoto ? 'mx-auto lg:mx-0' : 'mx-auto'}`}>Discover the author's work in the <a href="#synopsis" className="text-primary font-medium hover:underline underline-offset-4">book synopsis</a>.</p>
            </div>
          </div>
        </section>

        {/* Sample Chapters Section */}
        <section id="sample-chapters" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16 animate-fade-in-up">
              <div className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground font-medium tracking-wide">Preview</div>
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><BookOpen className="text-primary" /> Sample Chapters</h2>
            </div>

            <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto space-y-4" defaultValue="item-1">
              {initialChapters.map((chapter, index) => (
                <AccordionItem
                  value={`item-${chapter.number}`}
                  key={chapter.number}
                  onClick={() => trackEvent('view_sample_chapter', { chapter: chapter.number })}
                  className="border border-border/50 rounded-xl bg-card px-4 shadow-sm data-[state=open]:border-primary/50 data-[state=open]:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-xl md:text-2xl font-headline text-left hover:no-underline py-6">
                    <div className="flex items-center gap-4">
                      {chapter.locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">{chapter.number}</span>}
                      <span className={cn(chapter.locked && "text-muted-foreground")}>{chapter.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-8 text-lg/relaxed text-muted-foreground px-2 md:px-4">
                    {!chapter.locked ? (
                      <div className="prose prose-stone dark:prose-invert max-w-none">
                        {chapter.content}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-secondary/30 rounded-lg border border-dashed border-border">
                        <p className="mb-6 font-medium">Unlock the full wisdom of this chapter.</p>
                        <Button asChild size="lg" className="cta-button" onClick={() => trackEvent('click_buy_signed_sample_chapter')}>
                          <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16 animate-fade-in-up">
              <div className="inline-block rounded-full bg-background px-4 py-1.5 text-sm text-foreground font-medium tracking-wide shadow-sm">Gallery</div>
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><GalleryHorizontal className="text-primary" /> A Look Inside</h2>
            </div>

            <Carousel className="w-full max-w-6xl mx-auto animate-fade-in-up animate-delay-200">
              <CarouselContent>
                {initialGalleryImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-6">
                    <div className="p-1 h-full">
                      <Card className="overflow-hidden group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-card">
                        <CardContent className="p-0 relative aspect-[3/4]">
                          <Image
                            src={image.src}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ objectFit: 'cover' }}
                            alt={image.alt}
                            className="transition-transform duration-700 group-hover:scale-110"
                          />
                          <div
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer backdrop-blur-[2px]"
                            onClick={() => setSelectedImage(image)}
                          >
                            <Maximize className="h-12 w-12 text-white drop-shadow-md transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                          </div>
                          {image.locked && (
                            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-foreground">
                              <Lock className="w-12 h-12 mb-4 text-primary" />
                              <p className="text-xl font-bold font-headline">Premium Content</p>
                              <p className="text-sm text-muted-foreground mt-2 mb-6">Purchase the book to unlock.</p>
                              <Button asChild size="sm" className="cta-button" onClick={() => trackEvent('click_buy_signed_gallery')}>
                                <Link href="/checkout?variant=paperback">Buy Signed Copy</Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" />
              <CarouselNext className="hidden md:flex -right-12 h-12 w-12 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" />
            </Carousel>
          </div>
        </section>

        <FullscreenImageViewer isOpen={!!selectedImage} onOpenChange={() => setSelectedImage(null)} image={selectedImage} />

        <DynamicTestimonials />

        {/* Buy Now Section */}
        <section id="buy" className="w-full py-20 md:py-28 lg:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center animate-fade-in-up">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">Get Your Copy Today</h2>
              <p className="max-w-[600px] text-primary-foreground/90 md:text-xl font-light tracking-wide">
                Available at your favorite online retailers. Or place a direct order for a signed copy.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-6 pt-8">
                {visibleBuyLinks.map((link) => (
                  <Button key={link.name} asChild size="lg" className={cn(buttonStyles[link.name], "h-14 px-8 text-lg rounded-full")} onClick={() => trackEvent(`click_buy_${link.name.toLowerCase()}_footer`)}>
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
