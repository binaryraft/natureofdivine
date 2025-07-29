
import { HomeClient } from "./HomeClient";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Nature of the Divine | A Philosophical Book by Alfas B",
  description: "Discover 'Nature of the Divine,' a profound philosophical book by Alfas B that explores humanity's struggles and offers a transformative path to aligning with the divine essence.",
  keywords: ["Nature of the Divine", "Alfas B", "philosophical book", "spirituality", "divine essence", "self-transformation", "God"],
};

export default function Home() {
  return <HomeClient />;
}
