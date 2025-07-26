
import { BookHeart, Twitter, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function SiteFooter() {
  return (
    <footer className="w-full bg-secondary border-t">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Nature of the Divine. All Rights Reserved.
            </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
             <Link href="/terms" className="hover:text-primary transition-colors whitespace-nowrap">Terms and Conditions</Link>
             <Link href="/privacy" className="hover:text-primary transition-colors whitespace-nowrap">Privacy Policy</Link>
             <Link href="/shipping" className="hover:text-primary transition-colors whitespace-nowrap">Shipping Policy</Link>
             <Link href="/returns" className="hover:text-primary transition-colors whitespace-nowrap">Return Policy</Link>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
                <Link href="#"><Twitter className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="#"><Facebook className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="#"><Instagram className="h-4 w-4" /></Link>
            </Button>
        </div>
      </div>
    </footer>
  );
}
