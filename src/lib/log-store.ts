
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { headers } from 'next/headers';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogStatus = 'success' | 'failure' | 'pending';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  duration?: number; // in ms
  status?: LogStatus;
  userId?: string;
  path?: string;
  action?: string;
}

const logsCollection = collection(db, 'system_logs');

export const addLog = async (level: LogLevel, message: string, data?: any, meta?: { duration?: number; status?: LogStatus; userId?: string; action?: string }): Promise<void> => {
  try {
    const headersList = await headers();
    const path = headersList.get('referer') || 'server-action';

    const entry: Omit<LogEntry, 'id'> = {
      timestamp: Date.now(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data, (key, value) => 
        typeof value === 'object' && value !== null && 'message' in value && 'stack' in value ? 
        { message: value.message, stack: value.stack, name: value.name, code: (value as any).code } : value
      )) : null,
      duration: meta?.duration,
      status: meta?.status,
      userId: meta?.userId || 'system',
      path,
      action: meta?.action
    };

    // Console log for immediate server feedback
    if (level === 'error') {
      console.error(`[LOG:ERROR] ${message}`, entry);
    } else {
      console.log(`[LOG:INFO] ${message} (${meta?.duration || 0}ms)`);
    }

    // Fire-and-forget Firestore write to avoid blocking main thread too much
    // Note: in Server Actions we should ideally await, but for logging we might want speed.
    // However, Vercel/Next.js serverless might kill the process if we don't await.
    await addDoc(logsCollection, entry);
    
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
  }
};

export const getLogs = async (limitCount = 100): Promise<LogEntry[]> => {
  try {
    const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return [];
  }
};

/**
 * Wraps a server action to automatically log its execution, duration, and status.
 */
export async function logAction<T>(
    actionName: string,
    actionFn: () => Promise<T>,
    userId: string = 'system'
): Promise<T> {
    const start = performance.now();
    try {
        const result = await actionFn();
        const duration = Math.round(performance.now() - start);
        
        await addLog('info', `${actionName} completed`, null, {
            duration,
            status: 'success',
            userId,
            action: actionName
        });
        
        return result;
    } catch (error: any) {
        const duration = Math.round(performance.now() - start);
        await addLog('error', `${actionName} failed`, { error: error.message, stack: error.stack }, {
            duration,
            status: 'failure',
            userId,
            action: actionName
        });
        throw error;
    }
}

export const clearLogs = async (): Promise<void> => {
  // Not implemented for Firestore to prevent accidental mass deletion
  console.warn('clearLogs not supported for persistent storage');
};
