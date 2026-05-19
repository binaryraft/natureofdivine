import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";
import { fetchChaptersAction } from "@/lib/actions";
import { getStock } from "@/lib/stock-store";

export const metadata: Metadata = {
  title: "Nature of the Divine | Spiritual Philosophy Book by Alfas B",
  description: "Master your soul journey with Nature of the Divine. Explore peak consciousness, meditation for inner peace, and divine intelligence in this transformative spiritual philosophy book by Alfas B.",
  alternates: {
    canonical: '/',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function Home() {
  // Fetch data on the server for instant loading
  const [chapters, stock] = await Promise.all([
    fetchChaptersAction(),
    getStock(),
  ]);

  return <HomeClient initialChapters={chapters} stock={stock} />;
}
