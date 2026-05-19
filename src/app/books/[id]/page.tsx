import { books } from '@/lib/data';
import { notFound } from 'next/navigation';
import { BookDetailClient } from './BookDetailClient';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const book = books.find(b => b.id === id);

    if (!book) {
        return {
            title: 'Book Not Found | Nature of the Divine',
        };
    }

    return {
        title: `${book.title} | Nature of the Divine`,
        description: book.description,
        openGraph: {
            images: [book.coverImage],
        },
    };
}

export default async function BookDetailPage({ params }: Props) {
    const { id } = await params;
    const book = books.find(b => b.id === id);

    if (!book) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background relative overflow-hidden">
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
            </div>
            <BookDetailClient book={book} />
        </main>
    );
}
