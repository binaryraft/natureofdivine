
import type { Metadata } from 'next';
import { SignupClient } from './SignupClient';

export const metadata: Metadata = {
  title: 'Create an Account',
  description: 'Sign up for a free account to purchase "Nature of the Divine." Creating an account allows you to easily track your orders and save your shipping information for future purchases.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
    return <SignupClient />;
}
