
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, arrayUnion, arrayRemove, query, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { addLog } from './log-store';
import { revalidatePath } from 'next/cache';

export type Answer = {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: number;
};

export type Post = {
    id: string;
    userId: string;
    userName: string;
    title: string;
    content: string;
    likes: string[]; // User IDs who liked
    createdAt: number;
    answers: Answer[];
};

const postsCollection = collection(db, 'community_posts');

export async function addPost(userId: string, userName: string, title: string, content: string) {
    try {
        const newPost = {
            userId,
            userName,
            title,
            content,
            likes: [],
            answers: [],
            createdAt: Timestamp.now().toMillis()
        };
        await addDoc(postsCollection, newPost);
        revalidatePath('/community');
        return { success: true, message: 'Question posted successfully.' };
    } catch (error: any) {
        await addLog('error', 'addPost failed', { error: error.message });
        return { success: false, message: 'Failed to post question.' };
    }
}

export async function getPosts(): Promise<Post[]> {
    try {
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Post));
    } catch (error: any) {
        await addLog('error', 'getPosts failed', { error: error.message });
        return [];
    }
}

export async function getPostById(postId: string): Promise<Post | null> {
    try {
        const docRef = doc(postsCollection, postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Post;
        }
        return null;
    } catch (error: any) {
        await addLog('error', 'getPostById failed', { postId, error: error.message });
        return null;
    }
}

export async function addAnswer(postId: string, userId: string, userName: string, content: string) {
    try {
        const postRef = doc(postsCollection, postId);
        const newAnswer: Answer = {
            id: crypto.randomUUID(),
            userId,
            userName,
            content,
            createdAt: Date.now()
        };
        await updateDoc(postRef, {
            answers: arrayUnion(newAnswer)
        });
        revalidatePath('/community');
        return { success: true, message: 'Answer added successfully.' };
    } catch (error: any) {
        await addLog('error', 'addAnswer failed', { error: error.message });
        return { success: false, message: 'Failed to add answer.' };
    }
}

export async function toggleLike(postId: string, userId: string, isLiked: boolean) {
    try {
        const postRef = doc(postsCollection, postId);
        if (isLiked) {
            await updateDoc(postRef, {
                likes: arrayRemove(userId)
            });
        } else {
            await updateDoc(postRef, {
                likes: arrayUnion(userId)
            });
        }
        revalidatePath('/community');
        return { success: true };
    } catch (error: any) {
        await addLog('error', 'toggleLike failed', { error: error.message });
        return { success: false };
    }
}
