import { fetchProductByIdAction, getSettingsAction } from '@/lib/actions';
import { ProductDetailClient } from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await fetchProductByIdAction(id);

    if (!product) {
        return {
            title: 'Product Not Found | Nature of the Divine',
        };
    }

    return {
        title: `${product.name} | Nature of the Divine Shop`,
        description: product.description,
        openGraph: {
            images: [product.imageUrl],
        },
    };
}

export default async function ProductDetailPage({ params }: Props) {
    const { id } = await params;
    const product = await fetchProductByIdAction(id);
    const settings = await getSettingsAction();

    if (!product) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-accent/5 rounded-full blur-[100px] animate-pulse" />
            </div>

            <ProductDetailClient product={product} settings={settings} />
        </main>
    );
}
