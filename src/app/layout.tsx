
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
    default: "Nature of the Divine: A Philosophical Book on God, Nature & Existence",
    template: "%s | Nature of the Divine",
  },
  description: "Explore the 'Nature of the Divine' by Alfas B, a profound philosophical book on the nature of God, consciousness, and our place in the universe. Discover the divine connection between humanity, nature, and existence.",
  keywords: [
    "Nature of the Divine", 
    "nature of God", 
    "spiritual books", 
    "philosophy of nature", 
    "divine nature",
    "spiritual awakening", 
    "philosophy of life", 
    "consciousness explained", 
    "divinity within", 
    "Indian philosophy", 
    "existentialism", 
    "mindfulness and consciousness", 
    "self discovery", 
    "metaphysical books",
    "Alfas B author",
    "divine nature of reality",
    "consciousness and the universe",
    "spiritual books about nature",
    "new philosophical books"
  ],
  authors: [{ name: 'Alfas B', url: siteUrl }],
  creator: 'Alfas B',
  publisher: 'Notion Press',
  
  alternates: {
    canonical: '/',
  },
  
  sitemap: `${siteUrl}/sitemap.xml`,

  openGraph: {
    title: 'Nature of the Divine | A Philosophical Book by Alfas B',
    description: "A profound book exploring the divine nature of God, existence, and consciousness. Discover the path to aligning with your own divine nature.",
    url: siteUrl,
    siteName: 'Nature of the Divine',
    images: [
      {
        url: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cover of Nature of the Divine book by Alfas B, featuring divine light over a natural landscape.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Nature of the Divine | Official Book Website by Alfas B',
    description: 'A philosophical book explaining humanity\'s complex struggles and the elegant path to aligning with our divine nature. Discover the true nature of God and existence.',
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
