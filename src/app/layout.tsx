

import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/toaster";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/hooks/useAuth";
import { LocationProvider } from "@/hooks/useLocation";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ['400', '700'],
  style: ['normal', 'italic']
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_HOST_URL || 'https://natureofthedivine.com';

export const metadata: Metadata = {
  title: {
    default: "Nature of the Divine | A Philosophical Book by Alfas B",
    template: "%s | Nature of the Divine",
  },
  description: "A deep philosophical work explaining humanity's complex struggles alongside a singular, elegant solution, guiding readers to align their minds with the divine essence of existence. Written by Alfas B.",
  keywords: ["Nature of the Divine", "Alfas B", "philosophical book", "spirituality", "divine essence", "self-transformation", "God", "philosophy", "faith"],
  authors: [{ name: 'Alfas B' }],
  creator: 'Alfas B',
  publisher: 'Firebase Studio',
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Nature of the Divine | A Philosophical Book by Alfas B',
    description: "Explore 'Nature of the Divine', a book about the divine essence of existence and its impact on life and spirituality.",
    url: siteUrl,
    siteName: 'Nature of the Divine',
    type: 'website',
    images: [
      {
        url: 'https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png',
        width: 450,
        height: 675,
        alt: 'Nature of the Divine Book Cover',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nature of the Divine | A Philosophical Book by Alfas B',
    description: 'A deep philosophical work explaining humanity\'s complex struggles, written by Alfas B.',
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
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Nature of the Divine',
    url: siteUrl,
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          lora.variable,
          inter.variable
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

    