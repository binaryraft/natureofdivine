import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";
import { fetchChaptersAction, fetchGalleryImagesAction } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Nature of the Divine | New Eye-Opening Spiritual Book for Awakening",
  description:
    "Explore 'Nature of the Divine' by Alfas B — a new eye-opening spiritual book that guides you through a profound spiritual awakening. Understand God, consciousness, and the purpose of existence to transform your life.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Nature of the Divine | A Spiritual Book by Alfas B",
    description:
      "Discover the divine nature of existence with 'Nature of the Divine' — a book exploring consciousness, spirituality, and how to know God. It also shares daily habits that help readers align with the nature of the divine.",
    url: "https://natureofthedivine.com",
    images: [
      {
        url: "https://res.cloudinary.com/dj2w2phri/image/upload/v1761454810/Screenshot_2025-10-12_000041_ji6pkk.png",
        width: 1200,
        height: 630,
        alt: "Nature of the Divine - A guide to align with the Divine by Alfas B",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function Home() {
  // Fetch data on the server for instant loading
  const [chapters, galleryImages] = await Promise.all([
    fetchChaptersAction(),
    fetchGalleryImagesAction(),
  ]);

  return <HomeClient initialChapters={chapters} initialGalleryImages={galleryImages} />;
}
