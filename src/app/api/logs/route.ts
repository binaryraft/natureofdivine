
import { NextResponse } from 'next/server';
import { getLogs, clearLogs, addLog } from '@/lib/log-store';

export async function GET() {
  try {
    const logs = getLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch logs', details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearLogs();
    addLog('info', 'Logs cleared via API');
    return NextResponse.json({ message: 'Logs cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to clear logs', details: error.message }, { status: 500 });
  }
}

// Optional: prevent caching of this dynamic route
export const dynamic = 'force-dynamic';
