
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, orderBy, query, writeBatch } from 'firebase/firestore';
import type { SampleChapter } from './definitions';
import { sampleChapters as defaultChapters } from './data';
import { addLog } from './log-store';

const chaptersCollection = collection(db, 'chapters');

const docToChapter = (doc: any): SampleChapter => {
    const data = doc.data();
    return {
        id: doc.id,
        number: data.number,
        title: data.title,
        content: data.content,
        locked: data.locked,
    };
};

export const getChapters = async (): Promise<SampleChapter[]> => {
    try {
        const q = query(chaptersCollection, orderBy('number', 'asc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(docToChapter);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        addLog('error', 'getChapters failed', { error });
        return [];
    }
};

export const updateChapter = async (chapter: SampleChapter): Promise<void> => {
    try {
        const chapterRef = doc(db, 'chapters', chapter.id);
        await setDoc(chapterRef, chapter, { merge: true });
        addLog('info', 'Chapter updated', { chapterId: chapter.id });
    } catch (error) {
        console.error("Error updating chapter:", error);
        addLog('error', 'updateChapter failed', { chapterId: chapter.id, error });
        throw new Error('Failed to update chapter.');
    }
};

export const initializeChapters = async (): Promise<void> => {
    try {
        const batch = writeBatch(db);
        defaultChapters.forEach((chapter) => {
            const docRef = doc(db, 'chapters', `chapter-${chapter.number}`);
            const chapterData = {
                id: `chapter-${chapter.number}`,
                ...chapter,
            };
            batch.set(docRef, chapterData);
        });
        await batch.commit();
        addLog('info', 'Default chapters initialized in Firestore.');
    } catch (error) {
        console.error("Error initializing chapters:", error);
        addLog('error', 'initializeChapters failed', { error });
    }
};
