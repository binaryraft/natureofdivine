
'use server';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

// This is a simple in-memory store. Logs will be cleared on server restart.
let logs: LogEntry[] = [];
let logId = 0;

export const addLog = async (level: LogLevel, message: string, data?: any): Promise<void> => {
  const entry: LogEntry = {
    id: logId++,
    timestamp: new Date().toISOString(),
    level,
    message,
    // Deep clone to avoid circular references and ensure serializability
    data: data ? JSON.parse(JSON.stringify(data, (key, value) => 
      typeof value === 'object' && value !== null && 'message' in value && 'stack' in value ? 
      { message: value.message, stack: value.stack, name: value.name, code: (value as any).code } : value
    )) : undefined, 
  };

  // Also log to the actual server console for persistent debugging in production
  if (level === 'error') {
    console.error(`[SERVER LOG] ${message}`, entry.data || '');
  } else {
    console.log(`[SERVER LOG] ${message}`, entry.data || '');
  }

  logs.unshift(entry); // Add to the top
  // Keep the log size manageable
  if (logs.length > 100) {
    logs.pop();
  }
};

export const getLogs = async (): Promise<LogEntry[]> => {
  return logs;
};

export const clearLogs = async (): Promise<void> => {
  logs = [];
  logId = 0;
};
