
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
import Head from "next/head";

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

export const metadata: Metadata = {
  title: "Nature of the Divine | Book by Alfas B",
  description: "Explore the awakening of human consciousness in 'Nature of the Divine' – a spiritual and psychological guide by Alfas B.",
  keywords: [
    "Nature of the Divine",
    "Alfas B book",
    "spiritual awakening",
    "human consciousness",
    "mind and soul",
    "personal growth book",
    "buy Nature of the Divine",
    "Nature of the Divine PDF",
  ],
  authors: [{ name: "Alfas B", url: "https://natureofthedivine.com" }],
  creator: "Alfas B",
  robots: "index, follow",
  openGraph: {
    title: "Nature of the Divine – A Transformative Book by Alfas B",
    description: "A non-fiction book that explores divinity, human focus, and inner clarity. Written by Alfas B.",
    url: "https://natureofthedivine.com",
    siteName: "Nature of the Divine",
    images: [
      {
        url: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png",
        width: 1200,
        height: 630,
        alt: "Nature of the Divine Book Cover",
      },
    ],
    type: "book",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nature of the Divine by Alfas B",
    description: "Explore a journey of mind and mystery through the pages of Nature of the Divine.",
    images: [
      "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png"
    ],
    creator: "@alfas_b", // if you have a handle
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <Head>
  <link rel="canonical" href="https://natureofthedivine.com" />
</Head>


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

        <script type="application/ld+json" dangerouslySetInnerHTML={{
  __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Book",
    "name": "Nature of the Divine",
    "author": {
      "@type": "Person",
      "name": "Alfas B"
    },
    "description": "A non-fiction book exploring spirituality, self-awareness, and the divine connection within.",
    "url": "https://natureofthedivine.com",
    "image": "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279827/1_3_qzfmjp.png",
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "name": "Divine Publications"
    },
    "datePublished": "2025-07-20"
  })
}} />

      </body>
    </html>
  );
}
