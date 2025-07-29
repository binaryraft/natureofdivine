
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/toaster";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/hooks/useAuth";
import { LocationProvider } from "@/hooks/useLocation";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_HOST_URL || 'https://natureofthedivine.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nature of the Divine | A Book by Alfas B",
    template: "%s | Nature of the Divine",
  },
  description: "Explore 'Nature of the Divine', a profound philosophical book by Alfas B about consciousness, the essence of existence, and humanity's path to aligning with the divine. Available worldwide in paperback and hardcover.",
  keywords: ["Nature of the Divine book", "spiritual books India", "books on consciousness and mind", "Alfas B author book", "ebooks about divinity", "new philosophical books 2025"],
  authors: [{ name: 'Alfas B', url: siteUrl }],
  creator: 'Alfas B',
  publisher: 'Firebase Studio',
  
  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'Nature of the Divine | A Book by Alfas B',
    description: "Explore a profound philosophical book about the divine essence of existence and its impact on life and spirituality.",
    url: siteUrl,
    siteName: 'Nature of the Divine',
    images: [
      {
        url: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png',
        width: 450,
        height: 675,
        alt: 'Cover of Nature of the Divine book by Alfas B, featuring divine light and philosophical themes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Nature of the Divine | A Book by Alfas B',
    description: 'A deep philosophical work explaining humanity\'s complex struggles and the elegant path to aligning with the divine, written by Alfas B. Discover the true nature of existence.',
    images: ['https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    "name": "Nature of the Divine",
    "author": {
      "@type": "Person",
      "name": "Alfas B",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN",
        "addressRegion": "Kerala"
      }
    },
    "publisher": {
        "@type": "Organization",
        "name": "Independent"
    },
    "inLanguage": "en",
    "bookFormat": "http://schema.org/EBook",
    "url": "https://natureofthedivine.com",
    "description": "A philosophical and spiritual awakening book by Alfas B, exploring the mind, the divine, and the path to aligning with the nature of existence. This work explains humanity's complex struggles and offers a singular, elegant solution.",
    "datePublished": "2025-06-01"
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
          />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <AuthProvider>
          <LocationProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 pb-24 md:pb-0">{children}</main>
              <SiteFooter />
            </div>
            <MobileBottomNav />
            <Toaster />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
