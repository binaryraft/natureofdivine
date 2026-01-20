import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/toaster";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/hooks/useAuth";
import { LocationProvider } from "@/hooks/useLocation";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const garamond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-garamond",
});

const siteUrl = process.env.NEXT_PUBLIC_HOST_URL || "https://natureofthedivine.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nature of the Divine | The Science of Spiritual Awakening & Universal Intelligence",
    template: "%s | Nature of the Divine",
  },
  description:
    "Stop searching. Start aligning. 'Nature of the Divine' by Alfas B is the blueprint for unshakeable clarity. Decode the architecture of your soul and find the peace that has been waiting for you.",
  keywords: [
    "Nature of the Divine",
    "Spiritual Awakening",
    "Universal Intelligence",
    "How to find inner peace",
    "Overcoming anxiety spiritually",
    "Meaning of life",
    "Alfas B",
    "Advanced Spirituality",
    "Sacred Realignment",
    "Divine Algorithms",
    "Existential Clarity",
    "Beyond Religion",
    "Pure Intelligence",
    "Higher Consciousness",
    "Modern Mysticism",
    "Transcendental Logic",
    "Spiritual Transformation 2025",
    "Best Spiritual Books 2026",
    "Conscious Living Blueprint",
  ],
  authors: [{ name: "Alfas B", url: siteUrl }],
  creator: "Alfas B",
  publisher: "Notion Press",
  category: "Religion & Spirituality",

  alternates: {
    canonical: "/",
  },


  openGraph: {
    title: "Nature of the Divine | Align with Universal Intelligence",
    description:
      "The search is over. Discover the profound logic behind your existence and how to re-align with the Infinite Pulse of reality.",
    url: siteUrl,
    siteName: "Nature of the Divine",
    images: [
      {
        url: "/logo.svg",
        alt: "Nature of the Divine Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nature of the Divine | Deciphering the Divine Algorithm",
    description:
      "Dismantle the static. Activate your brilliance. A guide to spiritual evolution for the modern seeker.",
    images: ["/logo.svg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },


  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bookSchema = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Nature of the Divine",
    author: {
      "@type": "Person",
      name: "Alfas B",
      url: siteUrl,
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        addressRegion: "Kerala",
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Notion Press",
    },
    inLanguage: "en",
    isbn: "978-9334306514",
    bookFormat: "http://schema.org/Paperback",
    url: "https://natureofthedivine.com",
    description:
      "A spiritual book by Alfas B that explores the mind, the divine, and how to improve in life by aligning with the nature of existence. This work answers questions like 'Is God real?' and explains humanity's complex struggles with an elegant solution.",
    datePublished: "2025-06-01",
    image: `${siteUrl}/logo.svg`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "1",
    },
    offers: {
      "@type": "Offer",
      price: "299.00",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Flipkart",
      },
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          garamond.variable
        )}
      >
        <AuthProvider>
          <LocationProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1 pb-24 md:pb-0">{children}</main>
              <SiteFooter />
            </div>
            <div className="md:hidden">
              <MobileBottomNav />
            </div>
            <Toaster />
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
