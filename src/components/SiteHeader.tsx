
'use client';

import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Package2, Settings, LogOut } from 'lucide-react';
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

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#synopsis', label: 'About' },
  { href: '/#reviews', label: 'Reviews' },
];

function SunflowerIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.75 16c.64-.63 1.22-1.33 1.7-2.12.57-.96.98-2.07 1.14-3.24.18-1.3.12-2.68-.15-4.02" />
        <path d="M8.5 19.5c.34-.63.6-1.32.78-2.06.22-.9.2-1.9.02-2.88-.2-1.12-.6-2.22-1.16-3.24" />
        <path d="M12 21c.21-.63.33-1.3.36-1.98.05-1.18-.15-2.35-.55-3.48-.42-1.2-.95-2.3-1.58-3.34" />
        <path d="M15.5 19.5c-.34-.63-.6-1.32-.78-2.06-.22-.9-.2-1.9-.02-2.88.2-1.12.6-2.22 1.16-3.24" />
        <path d="M19.25 16c-.64-.63-1.22-1.33-1.7-2.12-.57-.96-.98-2.07-1.14-3.24-.18-1.3-.12-2.68.15-4.02" />
        <path d="M16.5 6.25c.34.63.6 1.32.78 2.06.22.9.2 1.9.02 2.88-.2 1.12-.6-2.22-1.16-3.24" />
        <path d="M4.75 8c-.64.63-1.22 1.33-1.7 2.12C2.48 11.08 2.07 12.2 1.9 13.36c-.18 1.3-.12 2.68.15 4.02" />
        <path d="M7.5 17.75c-.34-.63-.6-1.32-.78-2.06-.22-.9-.2-1.9-.02-2.88.2-1.12.6-2.22 1.16-3.24" />
        <path d="M12 3c-.21.63-.33 1.3-.36 1.98-.05-1.18.15 2.35.55 3.48.42 1.2.95 2.3 1.58 3.34" />
        <path d="M15.5 19.5c-.34-.63-.6-1.32-.78-2.06-.22-.9-.2-1.9-.02-2.88.2-1.12.6-2.22 1.16-3.24" />
        <path d="M19.25 16c-.64-.63-1.22-1.33-1.7-2.12-.57-.96-.98-2.07-1.14-3.24-.18-1.3-.12-2.68.15-4.02" />
        <path d="M16.5 6.25c.34.63.6 1.32.78 2.06.22.9.2 1.9.02 2.88-.2 1.12-.6-2.22-1.16-3.24" />
        <path d="M8.5 6.25c-.34.63-.6 1.32-.78-2.06-.22-.9-.2-1.9-.02-2.88.2-1.12.6-2.22 1.16-3.24" />
        <circle cx="12" cy="12" r="2.5" fill="hsl(var(--primary))"/>
      </svg>
    )
}

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <SunflowerIcon className="h-6 w-6" />
            <span className="font-bold font-headline whitespace-nowrap">Nature of the Divine</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
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
                  <SunflowerIcon className="h-6 w-6" />
                  <span className="sr-only">Nature of the Divine</span>
                </Link>
                {navLinks.map(link => (
                    <Link href={link.href} key={link.href} className="hover:text-foreground">{link.label}</Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 w-full items-center justify-end gap-4">
           {locationLoading ? (
               <div className="h-6 w-10 animate-pulse rounded-md bg-muted" />
           ) : (
                priceData && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getCountryFlag(priceData.country)}</span>
                        <span>{priceData.country}</span>
                    </div>
                )
           )}

           {authLoading ? (
             <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
           ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
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
                    <Link href="/orders"><Package2 className="mr-2 h-4 w-4" /> My Orders</Link>
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
