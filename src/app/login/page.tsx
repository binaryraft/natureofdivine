
import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Login to Your Account | Nature of the Divine',
  description: 'Access your account for "Nature of the Divine." Log in to view your order history for our spiritual book, track shipping status, and manage your saved profile information.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
