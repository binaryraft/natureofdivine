
import type { Metadata } from 'next';
import { SignupClient } from './SignupClient';

export const metadata: Metadata = {
  title: 'Create an Account | Nature of the Divine',
  description: 'Sign up for a free account to purchase "Nature of the Divine." Creating an account allows you to easily track your current and past orders, save your shipping information, and manage your profile for future purchases.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
    return <SignupClient />;
}
