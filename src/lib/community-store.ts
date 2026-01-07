
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, arrayUnion, arrayRemove, query, orderBy, getDoc, Timestamp, where } from 'firebase/firestore';
import { addLog } from './log-store';
import { revalidatePath } from 'next/cache';

export type Answer = {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: number;
};

export type PostType = 'question' | 'article';

export type Post = {
    id: string;
    userId: string;
    userName: string;
    title: string;
    content: string;
    likes: string[]; // User IDs who liked
    createdAt: number;
    answers: Answer[];
    type: PostType;
    tags: string[];
    isVerified: boolean;
    coverImage?: string;
};

const postsCollection = collection(db, 'community_posts');

export type PostOptions = {
    type?: PostType;
    tags?: string[];
    isVerified?: boolean;
    coverImage?: string;
}

export async function addPost(userId: string, userName: string, title: string, content: string, options: PostOptions = {}) {
    try {
        const newPost: Omit<Post, 'id'> = {
            userId,
            userName,
            title,
            content,
            likes: [],
            answers: [],
            createdAt: Timestamp.now().toMillis(),
            type: options.type || 'question',
            tags: options.tags || [],
            isVerified: options.isVerified || false,
            ...(options.coverImage ? { coverImage: options.coverImage } : {})
        };
        const docRef = await addDoc(postsCollection, newPost);
        revalidatePath('/community');
        revalidatePath('/blogs');
        return { success: true, message: 'Post created successfully.', id: docRef.id };
    } catch (error: any) {
        await addLog('error', 'addPost failed', { error: error.message });
        return { success: false, message: `Failed to create post: ${error.message}` };
    }
}

export async function getPosts(type?: PostType): Promise<Post[]> {
    try {
        // Fetch all posts sorted by date
        // Note: Avoiding 'where' clause with 'orderBy' to prevent Firestore index requirements
        // Filtering is done in-memory since the dataset is relatively small.
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
       
        const snapshot = await getDocs(q);
        const allPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Post));

        if (type) {
            return allPosts.filter(post => {
                // Treat undefined type as 'question' for legacy posts
                const postType = post.type || 'question';
                return postType === type;
            });
        }
        
        return allPosts;
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

export async function deletePost(postId: string) {
    try {
        await deleteDoc(doc(postsCollection, postId));
        revalidatePath('/community');
        return { success: true, message: 'Post deleted.' };
    } catch (error: any) {
        await addLog('error', 'deletePost failed', { error: error.message });
        return { success: false, message: 'Failed to delete post.' };
    }
}
