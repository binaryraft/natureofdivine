import { Product } from './definitions';

export const merchProducts: Omit<Product, 'id' | 'createdAt'>[] = [
    {
        name: "Sacred Geometry Hoodie",
        description: "Premium cotton hoodie featuring the Flower of Life pattern. Breathable, soft, and aligned with universal harmony.",
        price: 2499,
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
        stock: 50,
        isActive: true
    },
    {
        name: "Divine Intelligence Journal",
        description: "A high-quality linen-bound journal for recording your daily reflections, meditation insights, and spiritual growth.",
        price: 899,
        imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800",
        stock: 100,
        isActive: true
    },
    {
        name: "Sandalwood Meditation Mala",
        description: "108 authentic sandalwood beads, hand-knotted. Perfect for mantra recitation and finding inner calm.",
        price: 1299,
        imageUrl: "https://images.unsplash.com/photo-1595186835335-9005085e6830?auto=format&fit=crop&q=80&w=800",
        stock: 30,
        isActive: true
    },
    {
        name: "Aurora Aura Sticker Pack",
        description: "Holographic stickers inspired by the Nature of the Divine aurora effects. Durable, waterproof, and visually stunning.",
        price: 499,
        imageUrl: "https://images.unsplash.com/photo-1572375927902-1c09ce802221?auto=format&fit=crop&q=80&w=800",
        stock: 200,
        isActive: true
    }
];
