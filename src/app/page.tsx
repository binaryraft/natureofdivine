import type { Metadata } from "next";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Nature of the Divine | Spiritual Book on How to Know God & Improve Your Life",
  description:
    "Explore 'Nature of the Divine' by Alfas B — a spiritual and philosophical book that helps you understand God, consciousness, and the purpose of existence. Learn the habits that align you with the divine nature and improve your life through awareness and understanding.",
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

export default function Home() {
  return <HomeClient />;
}
