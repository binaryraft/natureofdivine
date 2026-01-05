
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  tags: string[];
  createdAt: number;
  published: boolean;
  views: number;
  likes: number;
}

export async function getBlogPosts(onlyPublished = true): Promise<BlogPost[]> {
  try {
    let q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    
    // Note: Firestore strictly requires an index for compound queries (where published == true AND orderBy createdAt).
    // To avoid complex index setup for this simple app, we fetch all and filter in JS if needed,
    // or we just sort by date and assume the frontend handles visibility for admins.
    
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
    
    if (onlyPublished) {
      return posts.filter(p => p.published);
    }
    return posts;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Ideally use a query with where('slug', '==', slug)
    // For now, fetching all and finding (caching strategy in real app would be better)
    const posts = await getBlogPosts(false);
    return posts.find(p => p.slug === slug) || null;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

export async function addBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'views' | 'likes'>) {
  try {
    const newPost = {
      ...post,
      createdAt: Date.now(),
      views: Math.floor(Math.random() * 100), // Start with some fake views
      likes: Math.floor(Math.random() * 20),
    };
    const docRef = await addDoc(collection(db, 'blogs'), newPost);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateBlogPost(post: BlogPost) {
  try {
    const { id, ...data } = post;
    await updateDoc(doc(db, 'blogs', id), data);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await deleteDoc(doc(db, 'blogs', id));
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
