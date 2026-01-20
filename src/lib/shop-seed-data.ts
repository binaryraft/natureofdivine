import { Product } from './definitions';

export const merchProducts: Omit<Product, 'id' | 'createdAt'>[] = [
    {
        name: "Sacred Geometry Hoodie",
        description: "Wear your frequency. A premium cotton sanctuary featuring the Flower of Life. Soft enough to sleep in, sharp enough to wake up in.",
        price: 2499,
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
        stock: 50,
        isActive: true
    },
    {
        name: "Divine Intelligence Journal",
        description: "Your soul's laboratory. A linen-bound space to decode your thoughts, track your growth, and document your journey back to yourself.",
        price: 899,
        imageUrl: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800",
        stock: 100,
        isActive: true
    },
    {
        name: "Sandalwood Meditation Mala",
        description: "Anchor your mind. 108 authentic sandalwood beads that serve as tactile reminders to return to the present moment, one breath at a time.",
        price: 1299,
        imageUrl: "https://images.unsplash.com/photo-1595186835335-9005085e6830?auto=format&fit=crop&q=80&w=800",
        stock: 30,
        isActive: true
    },
    {
        name: "Aurora Aura Sticker Pack",
        description: "Little sparks of light. Holographic reminders of the infinite that you can stick on your laptop, water bottle, or anywhere that needs a vibration lift.",
        price: 499,
        imageUrl: "https://images.unsplash.com/photo-1572375927902-1c09ce802221?auto=format&fit=crop&q=80&w=800",
        stock: 200,
        isActive: true
    }
];