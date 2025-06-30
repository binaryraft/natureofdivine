import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { BookOpen, Feather, Lock, MessageSquareQuote, ShoppingCart, BookText, User, GalleryHorizontal, Quote, Sparkles } from "lucide-react";
import Link from "next/link";

import { authorBio, quotes, sampleChapters, synopsis, buyLinks } from "@/lib/data";

const bookGlimpseImages = [
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279803/Screenshot_2025-06-24_123010_afcftz.png", alt: "First page of the book", locked: false },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_130046_fhaq93.png", alt: "A page from the book", locked: false },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123033_pp3uex.png", alt: "Preface of the book", locked: true },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123037_nohtck.png", alt: "Second page of the preface", locked: true },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123046_suwpld.png", alt: "Table of contents", locked: false },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279804/Screenshot_2025-06-24_114959_xv8qxd.png", alt: "Locked page", locked: true },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279804/Screenshot_2025-06-24_115433_is135r.png", alt: "Locked page", locked: true },
];

export default async function Home() {
  const summary = "Readers praise the book for its thrilling plot, deep philosophical questions, and meticulous historical detail, calling it a captivating, thought-provoking masterpiece that stays with you long after the final page.";

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-24">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-primary">
                    Nature of the Divine
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A journey into the heart of mystery, faith, and human existence.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/order">
                      Order Now <ShoppingCart className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                     <a href="#sample-chapters">
                      Read Sample <BookOpen className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
                  width="400"
                  height="600"
                  alt="Nature of the Divine Book Cover"
                  className="mx-auto aspect-[3/4] object-contain sm:w-full lg:order-last"
                  data-ai-hint="book cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Synopsis Section */}
        <section id="synopsis" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Synopsis</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-2"><BookText /> The Story</h2>
                <p className="text-muted-foreground md:text-xl/relaxed">
                  {synopsis}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Author Bio Section */}
        <section id="author" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container grid items-center justify-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex justify-center lg:order-last">
              <Image
                src="https://placehold.co/400x400.png"
                width="400"
                height="400"
                alt="Author J.D. Evergreen"
                className="rounded-full aspect-square object-cover"
                data-ai-hint="author portrait"
              />
            </div>
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">The Author</div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline flex items-center justify-center lg:justify-start gap-2"><User/> J.D. Evergreen</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto lg:mx-0">
                {authorBio}
              </p>
            </div>
          </div>
        </section>

        {/* Sample Chapters Section */}
        <section id="sample-chapters" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Preview</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-2"><BookOpen/> Sample Chapters</h2>
              </div>
            <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
              {sampleChapters.map((chapter) => (
                 <AccordionItem value={`item-${chapter.number}`} key={chapter.number}>
                  <AccordionTrigger className="text-xl font-headline">{chapter.title}</AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                    {chapter.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container px-4 md:px-6">
             <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Gallery</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-2"><GalleryHorizontal/> A Look Inside</h2>
              </div>
            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent>
                {bookGlimpseImages.map((image, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 relative">
                      <Image
                        src={image.src}
                        width="735"
                        height="960"
                        alt={image.alt}
                        className="object-contain w-full h-auto shadow-lg rounded-md"
                      />
                      {image.locked && (
                        <div className="absolute inset-1 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center text-center text-foreground rounded-md">
                          <Lock className="w-12 h-12 mb-4" />
                          <p className="font-semibold">Unlock this chapter</p>
                          <p className="text-sm">Purchase the book to read more.</p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>
        
        {/* Review Summary Section */}
        <section id="reviews" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <Card className="max-w-3xl mx-auto border-2 border-accent/50 shadow-lg bg-primary/5">
              <CardHeader className="text-center items-center p-6">
                 <Sparkles className="w-12 h-12 text-accent" />
                <CardTitle className="text-3xl font-headline mt-2">AI-Powered Review Summary</CardTitle>
                <CardDescription>We've summarized hundreds of online reviews to give you the consensus.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="border-t border-border pt-6">
                    <p className="text-lg text-center leading-relaxed text-muted-foreground italic">"{summary}"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Quotes Carousel Section */}
        <section id="quotes" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Praise</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-2"><Quote/> Critical Acclaim</h2>
              </div>
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {quotes.map((quote, index) => (
                  <CarouselItem key={index} className="md:basis-1/2">
                    <div className="p-1 h-full">
                      <Card className="h-full flex flex-col">
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                          <MessageSquareQuote className="w-12 h-12 text-accent" />
                          <p className="text-xl font-medium leading-relaxed">&ldquo;{quote.text}&rdquo;</p>
                          <footer className="text-sm text-muted-foreground">&mdash; {quote.author}</footer>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>

        {/* Buy Now Section */}
        <section id="buy" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">Get Your Copy Today</h2>
              <p className="max-w-[600px] text-primary-foreground/80 md:text-xl">
                Available at your favorite online retailers. Or place a direct order for a signed copy.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                {buyLinks.map((link) => (
                  <Button key={link.name} asChild variant="secondary" size="lg">
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {link.name}
                    </a>
                  </Button>
                ))}
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/order">
                    Order a Signed Copy <Feather className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
