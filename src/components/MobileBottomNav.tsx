
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PackageSearch, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, public: true },
    { href: '/orders', label: 'Orders', icon: PackageSearch, public: false },
    { href: '/login', label: 'Login', icon: LogIn, public: true, hideWhenLoggedIn: true },
    { href: '/settings', label: 'You', icon: User, public: false },
  ];

  const visibleLinks = navLinks.filter(link => {
    if (loading) return false;
    if (link.public) {
        if (link.hideWhenLoggedIn && user) return false;
        return true;
    }
    return !!user;
  });


  if (pathname === '/admin' || pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/checkout')) {
    return null;
  }
  
  if (loading) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="mx-auto grid h-full max-w-lg grid-cols-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center justify-center">
                        <div className="h-6 w-6 rounded-md bg-muted"></div>
                        <div className="mt-1 h-2 w-10 rounded bg-muted"></div>
                    </div>
                ))}
            </div>
        </div>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className={cn("mx-auto grid h-full max-w-lg font-medium", 
        `grid-cols-${visibleLinks.length}`
      )}>
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-5 transition-colors hover:bg-muted',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="mb-1 h-6 w-6" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
