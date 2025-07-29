
import type { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Account Settings',
  description: 'Manage your profile, password, and other account settings.',
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
    return <SettingsClient />;
}
