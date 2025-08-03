
import type { Metadata } from 'next';
import { SignupClient } from './SignupClient';

export const metadata: Metadata = {
  title: 'Create an Account | Nature of the Divine',
  description: 'Sign up for a free account to purchase a signed copy of "Nature of the Divine." Creating an account allows you to track your orders, save your shipping information, and manage your profile.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
    return <SignupClient />;
}
