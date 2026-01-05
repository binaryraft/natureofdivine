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
    default: "Nature of the Divine | Eye-Opening Spiritual Book on Awakening & Consciousness",
    template: "%s | Nature of the Divine",
  },
  description:
    "Discover 'Nature of the Divine', a new eye-opening spiritual book by Alfas B. Explore the nature of God, consciousness, and spiritual awakening. Learn how to know God, improve your life, and align with the divine nature of existence.",
  keywords: [
    "Nature of the Divine",
    "how to know God",
    "is God real",
    "eye opening books",
    "spiritual awakening books",
    "new spiritual books",
    "books on consciousness",
    "best spiritual books 2025",
    "transformational books",
    "spiritual enlightenment",
    "is religion true",
    "how to improve in life",
    "how to be better",
    "spiritual book",
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
    "new philosophical books",
  ],
  authors: [{ name: "Alfas B", url: siteUrl }],
  creator: "Alfas B",
  publisher: "Notion Press",
  category: "Religion & Spirituality",

  alternates: {
    canonical: "/",
  },


  openGraph: {
    title: "Nature of the Divine | A Spiritual Book by Alfas B on How to Know God",
    description:
      "A profound spiritual book exploring the divine nature of God, existence, and consciousness. Learn how to improve your life by aligning with your own divine nature.",
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
    title: "Nature of the Divine | Is God Real? A Spiritual Book by Alfas B",
    description:
      "A philosophical and spiritual book explaining humanity's complex struggles and the elegant path to aligning with our divine nature. Discover how to know God and improve your life.",
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
