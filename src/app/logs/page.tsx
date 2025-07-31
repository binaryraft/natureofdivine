
import type { Metadata } from 'next';
import { LogsClient } from './LogsClient';

export const metadata: Metadata = {
  title: 'Server Logs',
  description: 'View server-side logs for debugging purposes.',
  robots: { index: false, follow: false },
};

export default function LogsPage() {
    return <LogsClient />;
}
