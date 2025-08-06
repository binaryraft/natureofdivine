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
    default: "Nature of the Divine | Official Website & Book by Alfas B",
    template: "%s | Nature of the Divine",
  },
  description: "Official website for 'Nature of the Divine' by Alfas B. A profound philosophical book exploring consciousness, the essence of existence, and humanity's path to aligning with the divine. Read samples and order your copy.",
  keywords: ["spiritual awakening books", "philosophy of life books", "consciousness explained", "divinity within", "Indian philosophy books", "existential philosophy", "mindfulness and consciousness", "self discovery books", "metaphysical books", "new age spirituality", "Nature of the Divine book", "spiritual books India", "Alfas B author book", "new philosophical books 2025", "philosophy of existence"],
  authors: [{ name: 'Alfas B', url: siteUrl }],
  creator: 'Alfas B',
  publisher: 'Notion Press',
  
  alternates: {
    canonical: '/',
  },
  
  sitemap: `${siteUrl}/sitemap.xml`,

  openGraph: {
    title: 'Nature of the Divine | A Book by Alfas B',
    description: "Explore a profound philosophical book about the divine essence of existence and its impact on life and spirituality. Written by Alfas B.",
    url: siteUrl,
    siteName: 'Nature of the Divine',
    images: [
      {
        url: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cover of Nature of the Divine book by Alfas B, featuring divine light and philosophical themes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Nature of the Divine | Official Book Website by Alfas B',
    description: 'A deep philosophical work explaining humanity\'s complex struggles and the elegant path to aligning with the divine, written by Alfas B. Discover the true nature of existence.',
    images: [`${siteUrl}/twitter-image.png`],
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
       "url": siteUrl,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN",
        "addressRegion": "Kerala"
      }
    },
    "publisher": {
        "@type": "Organization",
        "name": "Notion Press"
    },
    "inLanguage": "en",
    "isbn": "978-9334306514",
    "bookFormat": "http://schema.org/Paperback",
    "url": "https://natureofthedivine.com",
    "description": "A philosophical and spiritual awakening book by Alfas B, exploring the mind, the divine, and the path to aligning with the nature of existence. This work explains humanity's complex struggles and offers a singular, elegant solution.",
    "datePublished": "2025-06-01",
    "image": "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png",
     "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "reviewCount": "1"
    },
    "offers": {
        "@type": "Offer",
        "price": "299.00",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "seller": {
            "@type": "Organization",
            "name": "Flipkart"
        }
    }
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
