
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Settings, LogOut, BookHeart, ShoppingCart, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLocation } from '@/hooks/useLocation';
import { getCountryFlag } from '@/lib/countries';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/community', label: 'Community' },
  { href: '/#synopsis', label: 'About' },
  { href: '/orders', label: 'My Orders' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { priceData, loading: locationLoading } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const activeLinks = user ? navLinks : navLinks.filter(link => link.href !== '/orders');

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-md border-border shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative h-8 w-8 group-hover:scale-110 transition-transform duration-300">
               <Image 
                 src="/logo.svg" 
                 alt="Nature of the Divine Logo" 
                 fill
                 className="object-contain"
               />
            </div>
            <span className="font-bold font-headline text-lg tracking-tight group-hover:text-primary transition-colors">Nature of the Divine</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {activeLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-all hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full',
                  pathname === link.href ? 'text-primary after:w-full' : 'text-foreground/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="flex flex-col gap-6 mt-8">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xl font-bold font-headline text-primary"
                >
                  <div className="relative h-8 w-8">
                     <Image 
                       src="/logo.svg" 
                       alt="Logo" 
                       fill
                       className="object-contain"
                     />
                  </div>
                  <span>Nature of the Divine</span>
                </Link>
                <div className="flex flex-col gap-4">
                  {activeLinks.map(link => (
                    <Link 
                      href={link.href} 
                      key={link.href} 
                      className={cn(
                        "text-lg font-medium hover:text-primary transition-colors",
                         pathname === link.href ? "text-primary" : "text-foreground/80"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {!user && (
                   <Button asChild className="cta-button w-full mt-4">
                     <Link href="/checkout?variant=paperback">Buy Now</Link>
                   </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-4">
          {locationLoading ? (
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted/50" />
          ) : priceData?.country ? (
            <div className="text-xl opacity-80 hover:opacity-100 transition-opacity cursor-help" title={`Detected Country: ${priceData.country}`}>{getCountryFlag(priceData.country)}</div>
          ) : null}

          {authLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted/50" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-border/50 bg-background/95 backdrop-blur-sm">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Reader'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary">
                  <Link href="/orders"><BookHeart className="mr-2 h-4 w-4" /> My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-primary/10 focus:text-primary">
                  <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild className="hover:bg-primary/5 hover:text-primary">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="cta-button h-9 px-6 text-sm">
                <Link href="/checkout?variant=paperback">Buy Now</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
