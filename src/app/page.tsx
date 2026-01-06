import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";
import { fetchChaptersAction, fetchBlogPostsAction } from "@/lib/actions";
import { getStock } from "@/lib/stock-store";

export const metadata: Metadata = {
// ... existing metadata code ...
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function Home() {
  // Fetch data on the server for instant loading
  const [chapters, stock, blogs] = await Promise.all([
    fetchChaptersAction(),
    getStock(),
    fetchBlogPostsAction(true),
  ]);

  return <HomeClient initialChapters={chapters} stock={stock} latestBlogs={blogs.slice(0, 3)} />;
}
