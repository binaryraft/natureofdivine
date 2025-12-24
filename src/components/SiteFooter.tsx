
import { BookHeart, Twitter, Facebook, Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#1A1A1A] text-white/80 border-t border-white/10">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
           {/* Brand */}
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <BookHeart className="h-6 w-6 text-primary" />
                 <span className="text-xl font-bold font-garamond text-white">Nature of the Divine</span>
              </div>
              <p className="text-sm leading-relaxed text-white/60 max-w-xs">
                 An exploration of the divine, consciousness, and the path to spiritual awakening.
              </p>
           </div>

           {/* Links */}
           <div className="flex flex-col gap-3 text-sm">
             <h3 className="font-semibold text-white mb-2">Legal & Support</h3>
             <Link href="/terms" className="hover:text-primary transition-colors w-fit">Terms and Conditions</Link>
             <Link href="/privacy" className="hover:text-primary transition-colors w-fit">Privacy Policy</Link>
             <Link href="/shipping" className="hover:text-primary transition-colors w-fit">Shipping Policy</Link>
             <Link href="/returns" className="hover:text-primary transition-colors w-fit">Return Policy</Link>
           </div>

           {/* Socials */}
           <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-white">Connect</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="hover:bg-white/10 hover:text-primary rounded-full">
                    <Link href="#" aria-label="Twitter"><Twitter className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="hover:bg-white/10 hover:text-primary rounded-full">
                    <Link href="#" aria-label="Facebook"><Facebook className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="hover:bg-white/10 hover:text-primary rounded-full">
                    <Link href="#" aria-label="Instagram"><Instagram className="h-5 w-5" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="hover:bg-white/10 hover:text-primary rounded-full">
                    <Link href="mailto:contact@natureofthedivine.com" aria-label="Email"><Mail className="h-5 w-5" /></Link>
                </Button>
              </div>
           </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
           <p>© {new Date().getFullYear()} Nature of the Divine. All Rights Reserved.</p>
           <p>Designed with divine intent.</p>
        </div>
      </div>
    </footer>
  );
}
