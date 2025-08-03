
import type { Metadata } from 'next';
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Nature of the Divine | Official Website & Book by Alfas B",
  description: "Official website for 'Nature of the Divine' by Alfas B. A profound philosophical book exploring consciousness, the essence of existence, and humanity's path to aligning with the divine. Read samples and order your signed copy today.",
};

export default function Home() {
  return <HomeClient />;
}
