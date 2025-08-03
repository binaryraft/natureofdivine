
import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Login to Your Account | Nature of the Divine',
  description: 'Access your account for "Nature of the Divine." Log in to view your order history, track shipping status, and manage your saved profile information and address details securely.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
    return <LoginClient />;
}
