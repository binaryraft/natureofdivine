
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, Timestamp, query, orderBy, limit, arrayUnion } from 'firebase/firestore';

export interface BlogComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

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
  comments: BlogComment[];
}

export async function addComment(blogId: string, comment: Omit<BlogComment, 'id' | 'createdAt'>) {
  try {
    const blogRef = doc(db, 'blogs', blogId);
    const newComment = {
      ...comment,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    await updateDoc(blogRef, {
      comments: arrayUnion(newComment)
    });
    return { success: true, message: 'Comment added.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteComment(blogId: string, commentId: string) {
  try {
    const blogRef = doc(db, 'blogs', blogId);
    const blogSnap = await getDocs(query(collection(db, 'blogs')));
    // Since we need the full object to remove from array, we first fetch the blog
    // Optimization: In a real app, we might store comments in a subcollection.
    // Here we have to fetch, filter, and update.
    // Actually, arrayRemove requires the EXACT object. Without subcollections, this is tricky if we only have ID.
    // So we read the doc, filter the array, and write it back.
    
    // NOTE: For this simple store, we iterate to find the blog.
    const blog = (await getBlogPosts(false)).find(b => b.id === blogId);
    if (!blog) throw new Error('Blog not found');

    const updatedComments = blog.comments.filter(c => c.id !== commentId);
    
    await updateDoc(blogRef, { comments: updatedComments });
    return { success: true, message: 'Comment deleted.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateComment(blogId: string, commentId: string, newContent: string) {
  try {
    const blogRef = doc(db, 'blogs', blogId);
    const blog = (await getBlogPosts(false)).find(b => b.id === blogId);
    if (!blog) throw new Error('Blog not found');

    const updatedComments = blog.comments.map(c => 
      c.id === commentId ? { ...c, content: newContent } : c
    );

    await updateDoc(blogRef, { comments: updatedComments });
    return { success: true, message: 'Comment updated.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
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
