
import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Login to your Account',
  description: 'Access your account to view your orders for "Nature of the Divine".',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
    return <LoginClient />;
}
