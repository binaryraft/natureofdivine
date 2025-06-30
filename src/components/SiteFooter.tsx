import { BookHeart, Twitter, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function SiteFooter() {
  return (
    <footer className="w-full bg-primary/10">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © {new Date().getFullYear()} Nature of the Divine. All Rights Reserved.
            </p>
        </div>
        <div className="flex items-center gap-2">
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
