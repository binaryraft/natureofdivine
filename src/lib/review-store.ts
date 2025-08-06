
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Review } from './definitions';

const reviewsCollection = collection(db, 'reviews');

const docToReview = (doc: any): Review => {
    const data = doc.data();
    const createdAtMillis = data.createdAt instanceof Timestamp 
        ? data.createdAt.toMillis() 
        : (typeof data.createdAt === 'number' ? data.createdAt : Date.now());

    return {
        id: doc.id,
        orderId: data.orderId,
        userId: data.userId,
        userName: data.userName,
        rating: data.rating,
        title: data.title || 'Review',
        reviewText: data.reviewText,
        imageUrls: data.imageUrls || [],
        createdAt: createdAtMillis,
    };
};

type NewReviewData = Omit<Review, 'id' | 'createdAt'>;

export const addReview = async (reviewData: NewReviewData): Promise<Review> => {
    try {
        const newReviewDocument = {
            ...reviewData,
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(reviewsCollection, newReviewDocument);
        return {
            ...reviewData,
            id: docRef.id,
            createdAt: newReviewDocument.createdAt.toMillis(),
        };
    } catch (error) {
        console.error("Error adding review:", error);
        throw new Error("Could not submit your review.");
    }
};

export const getReviews = async (): Promise<Review[]> => {
    try {
        const q = query(reviewsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docToReview);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw new Error("Could not fetch reviews.");
    }
};

export const getReviewsByOrderId = async (orderId: string): Promise<Review | null> => {
    try {
        const q = query(reviewsCollection, where('orderId', '==', orderId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        return docToReview(snapshot.docs[0]);
    } catch (error) {
        console.error(`Error fetching review for order ${orderId}:`, error);
        throw new Error("Could not fetch the review for the specified order.");
    }
};
