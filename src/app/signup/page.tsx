
import type { Metadata } from 'next';
import { SignupClient } from './SignupClient';

export const metadata: Metadata = {
  title: 'Create an Account',
  description: 'Sign up for an account to purchase "Nature of the Divine" and track your orders.',
  robots: { index: false, follow: true },
};

export default function SignupPage() {
    return <SignupClient />;
}
