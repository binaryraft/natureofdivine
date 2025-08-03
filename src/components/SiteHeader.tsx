
'use client';

import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Settings, LogOut, BookHeart, ShoppingCart } from 'lucide-react';
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
import { buyLinks } from '@/lib/data';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#synopsis', label: 'About' },
  { href: '/orders', label: 'My Orders' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { priceData, loading: locationLoading } = useLocation();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  
  const activeLinks = user ? navLinks : navLinks.filter(link => link.href !== '/orders');
  const flipkartLink = buyLinks.find(link => link.name === 'Flipkart')?.url;
  const amazonLink = buyLinks.find(link => link.name === 'Amazon')?.url;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookHeart className="h-6 w-6 text-accent" />
            <span className="font-bold font-headline whitespace-nowrap">Nature of the Divine</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {activeLinks.map((link) => (
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

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
               <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <BookHeart className="h-6 w-6 text-accent" />
                  <span className="sr-only">Nature of the Divine</span>
                </Link>
                {activeLinks.map(link => (
                    <Link href={link.href} key={link.href} className="hover:text-foreground">{link.label}</Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
           {locationLoading ? (
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
           ) : priceData?.country ? (
            <div className="text-2xl">{getCountryFlag(priceData.country)}</div>
           ) : null}
            
            {amazonLink && (
                 <Button asChild className="hidden sm:inline-flex bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-bold">
                    <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                        Buy on Amazon
                    </a>
                </Button>
            )}

          {flipkartLink && (
            <Button asChild className="hidden sm:inline-flex bg-[#2874F0] hover:bg-[#2874F0]/90 text-white">
                <a href={flipkartLink} target="_blank" rel="noopener noreferrer">
                    Buy on Flipkart
                </a>
            </Button>
           )}

           {authLoading ? (
             <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
           ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/orders"><BookHeart className="mr-2 h-4 w-4" /> My Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
            <div className="hidden md:flex items-center gap-2">
                 <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
           )}
        </div>
      </div>
    </header>
  );
}
