
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
    data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to avoid circular references
  };
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
