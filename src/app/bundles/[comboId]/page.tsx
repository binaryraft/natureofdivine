import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { combos, books } from '@/lib/data';
import { BundleDetailClient } from './BundleDetailClient';

type Props = {
  params: Promise<{ comboId: string }>;
};

export async function generateStaticParams() {
  return combos.map((c) => ({ comboId: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { comboId } = await params;
  const combo = combos.find((c) => c.id === comboId);
  if (!combo) return { title: 'Bundle Not Found' };

  return {
    title: `${combo.name} | Nature of the Divine Publisher`,
    description: `${combo.description} Get ${combo.bookCount} books for just ₹${combo.price} — only ₹${combo.pricePerBook}/book.`,
    openGraph: {
      title: combo.name,
      description: combo.description,
    },
  };
}

export default async function BundlePage({ params }: Props) {
  const { comboId } = await params;
  const combo = combos.find((c) => c.id === comboId);
  if (!combo) notFound();

  // Resolve actual book objects for the unique IDs in the combo
  const uniqueBookIds = [...new Set(combo.books)];
  const comboBooks = uniqueBookIds
    .map((id) => books.find((b) => b.id === id))
    .filter(Boolean) as typeof books;

  return <BundleDetailClient combo={combo} comboBooks={comboBooks} />;
}
