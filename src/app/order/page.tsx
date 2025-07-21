import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather, ShoppingCart } from "lucide-react";
import { buyLinks } from "@/lib/data";

export const metadata = {
  title: 'Order a Copy | Nature of the Divine',
  description: 'Get your copy of "Nature of the Divine" today.',
};

export default function OrderPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
                 <Image
                  src="https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
                  width="500"
                  height="750"
                  alt="Nature of the Divine Book Cover"
                  className="mx-auto aspect-[2/3] object-contain sm:w-full rounded-lg shadow-lg"
                  data-ai-hint="book cover"
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-4xl font-headline">Get Your Copy</CardTitle>
                    <CardDescription>
                        Choose your preferred way to purchase "Nature of the Divine".
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Order a Signed Copy</h3>
                        <p className="text-muted-foreground mb-4">
                            Receive a special copy signed by the author, Alfas B.
                        </p>
                        <Button asChild size="lg" className="w-full cta-button">
                          <Link href="/checkout">
                            Buy a Signed Copy <Feather className="ml-2 h-5 w-5" />
                          </Link>
                        </Button>
                    </div>

                     <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                            Or buy from retailers
                            </span>
                        </div>
                    </div>

                     <div>
                        <h3 className="text-lg font-semibold mb-2">Online Retailers</h3>
                        <div className="space-y-3">
                         {buyLinks.map((link) => (
                          <Button key={link.name} asChild variant="outline" size="lg" className="w-full">
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.name}
                            </a>
                          </Button>
                        ))}
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        By placing an order, you agree to our <Link href="/terms" className="underline">Terms of Service</Link>.
                    </p>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
