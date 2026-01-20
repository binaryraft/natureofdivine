import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";
import { fetchChaptersAction, fetchBlogPostsAction, fetchProductsAction } from "@/lib/actions";
import { getStock } from "@/lib/stock-store";

export const metadata: Metadata = {
  title: "Nature of the Divine | Peak Consciousness & Divine Intelligence",
  description: "Experience the ultimate spiritual realignment. Decode the metaphysics of the soul and activate unshakeable clarity with the groundbreaking work of Alfas B.",
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
  const [chapters, stock, blogs, products] = await Promise.all([
    fetchChaptersAction(),
    getStock(),
    fetchBlogPostsAction(true),
    fetchProductsAction(true), // Only fetch active products
  ]);

  return <HomeClient initialChapters={chapters} stock={stock} latestBlogs={blogs.slice(0, 3)} products={products} />;
}
