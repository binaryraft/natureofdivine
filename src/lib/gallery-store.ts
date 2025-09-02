
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc, orderBy, query, writeBatch, Timestamp } from 'firebase/firestore';
import type { GalleryImage } from './definitions';
import { addLog } from './log-store';
import { v4 as uuidv4 } from 'uuid';

const galleryCollection = collection(db, 'gallery');

const defaultGalleryImages = [
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279803/Screenshot_2025-06-24_123010_afcftz.png", alt: "First page of the book Nature of the Divine", locked: false, aiHint: "book page" },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_130046_fhaq93.png", alt: "A page from inside the book showing a chapter start", locked: false, aiHint: "book page" },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123033_pp3uex.png", alt: "The preface page of the book Nature of the Divine", locked: false, aiHint: "book page" },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123037_nohtck.png", alt: "Second page of the book's preface", locked: false, aiHint: "book page" },
  { src: "https://res.cloudinary.com/dj2w2phri/image/upload/v1751279805/Screenshot_2025-06-24_123046_suwpld.png", alt: "Table of contents for the book", locked: false, aiHint: "book page" },
  { src: "https://placehold.co/600x800.png", alt: "A locked chapter page from the book", locked: true, aiHint: "book page" },
  { src: "https://placehold.co/600x800.png", alt: "A locked chapter page from the book", locked: true, aiHint: "book page" },
  { src: "https://placehold.co/600x800.png", alt: "A locked chapter page from the book", locked: true, aiHint: "book page" },
];


const docToImage = (doc: any): GalleryImage => {
    const data = doc.data();
    const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
    return {
        id: doc.id,
        src: data.src,
        alt: data.alt,
        locked: data.locked,
        aiHint: data.aiHint,
        createdAt: createdAt,
    };
};

export const getGalleryImages = async (): Promise<GalleryImage[]> => {
    try {
        const q = query(galleryCollection, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docToImage);
    } catch (error) {
        console.error("Error fetching gallery images:", error);
        addLog('error', 'getGalleryImages failed', { error });
        return [];
    }
};

export const addGalleryImage = async (imageData: Omit<GalleryImage, 'id' | 'createdAt'>): Promise<GalleryImage> => {
    try {
        const newImage = {
            ...imageData,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(galleryCollection, newImage);
        return {
            id: docRef.id,
            ...imageData,
            createdAt: newImage.createdAt.toMillis()
        };
    } catch (error) {
        console.error("Error adding gallery image:", error);
        addLog('error', 'addGalleryImage failed', { error });
        throw new Error('Failed to add gallery image.');
    }
};

export const updateGalleryImage = async (image: GalleryImage): Promise<void> => {
    try {
        const imageRef = doc(db, 'gallery', image.id);
        const { id, ...imageData } = image;
        await setDoc(imageRef, imageData, { merge: true });
    } catch (error) {
        console.error("Error updating gallery image:", error);
        addLog('error', 'updateGalleryImage failed', { imageId: image.id, error });
        throw new Error('Failed to update gallery image.');
    }
};

export const deleteGalleryImage = async (id: string): Promise<void> => {
    try {
        const imageRef = doc(db, 'gallery', id);
        await deleteDoc(imageRef);
    } catch (error) {
        console.error("Error deleting gallery image:", error);
        addLog('error', 'deleteGalleryImage failed', { imageId: id, error });
        throw new Error('Failed to delete gallery image.');
    }
};

export const initializeGalleryImages = async (): Promise<void> => {
    try {
        const batch = writeBatch(db);
        defaultGalleryImages.forEach((image) => {
            const docRef = doc(galleryCollection);
            const imageData = {
                ...image,
                createdAt: Timestamp.now(),
            };
            batch.set(docRef, imageData);
        });
        await batch.commit();
        addLog('info', 'Default gallery images initialized in Firestore.');
    } catch (error) {
        console.error("Error initializing gallery images:", error);
        addLog('error', 'initializeGalleryImages failed', { error });
    }
};
