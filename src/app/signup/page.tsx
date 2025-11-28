
import type { Metadata } from 'next';
import { SignupClient } from './SignupClient';

export const metadata: Metadata = {
  title: 'Create an Account | Nature of the Divine',
  description: 'Sign up for a free account to purchase the spiritual book "Nature of the Divine." Creating an account allows you to track your orders, save shipping information, and get updates.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
  return <SignupClient />;
}
