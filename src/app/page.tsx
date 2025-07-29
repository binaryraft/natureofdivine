
import type { Metadata } from 'next';
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Nature of the Divine | Book by Alfas B – Mind, Spirit, Awakening",
  description: "A bold philosophical book by Alfas B exploring consciousness, divinity, and spiritual growth. Available worldwide.",
  keywords: ["Nature of the Divine book", "spiritual books India", "books on consciousness and mind", "Alfas B author book", "ebooks about divinity", "new philosophical books 2025"],
};

export default function Home() {
  return <HomeClient />;
}
