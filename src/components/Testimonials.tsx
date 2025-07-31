
'use client';

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Quote, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchReviews } from "@/lib/actions";
import { Review } from "@/lib/definitions";


function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn("h-5 w-5", i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50")} />
            ))}
        </div>
    );
}

export function Testimonials() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getReviews() {
            try {
                const fetchedReviews = await fetchReviews();
                setReviews(fetchedReviews);
            } catch (error) {
                console.error("Failed to fetch reviews", error);
            } finally {
                setIsLoading(false);
            }
        }
        getReviews();
    }, []);

    if (isLoading) {
        return (
             <section id="quotes" className="w-full py-16 md:py-24 lg:py-32">
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
        )
    }

    if (reviews.length === 0) {
        return null;
    }

    return (
        <section id="quotes" className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-12">
                <div className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground font-medium tracking-wide">Testimonials</div>
                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-headline flex items-center justify-center gap-3"><Quote/> From Our Readers</h2>
              </div>
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent>
                {reviews.map((review) => (
                  <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2 h-full">
                      <Card className="h-full flex flex-col justify-between border-l-4 border-primary bg-secondary/50 p-6">
                        <CardContent className="p-0 text-left space-y-4">
                           <div className="flex items-center justify-between">
                             <h3 className="text-xl font-bold font-headline">{review.userName || 'Anonymous'}</h3>
                             <StarRating rating={review.rating} />
                           </div>
                          <p className="text-lg/relaxed text-muted-foreground">&ldquo;{review.reviewText}&rdquo;</p>
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
    );
}