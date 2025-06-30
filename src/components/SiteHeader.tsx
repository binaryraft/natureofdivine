'use client';

import Link from 'next/link';
import { BookHeart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/order', label: 'Order' },
  { href: '/order-status', label: 'Track Order' },
  { href: '/admin', label: 'Admin' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookHeart className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Nature of the Divine</span>
          </Link>
          <nav className="hidden gap-6 text-sm md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="px-0 text-base md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                >
                    <BookHeart className="h-6 w-6 text-primary" />
                    <span className="sr-only">Nature of the Divine</span>
                </Link>
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn("hover:text-foreground",
                            pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
                </nav>
            </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
