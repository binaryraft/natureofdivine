
import type { Metadata } from 'next';
import { LoginClient } from './LoginClient';

export const metadata: Metadata = {
  title: 'Login to Your Account',
  description: 'Access your account for "Nature of the Divine." Log in to view your order history, track shipping status, and manage your profile information securely.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
    return <LoginClient />;
}
