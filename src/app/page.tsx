
import type { Metadata } from 'next';
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Nature of the Divine | Official Book Website",
  description: "Official website for 'Nature of the Divine' by Alfas B. A profound philosophical book exploring consciousness, divinity, and the path to spiritual growth. Read samples, check reviews, and order your copy today.",
};

export default function Home() {
  return <HomeClient />;
}
