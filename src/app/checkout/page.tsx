
import type { Metadata } from 'next';
import { CheckoutClient } from './CheckoutClient';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Secure Checkout | Nature of the Divine',
  description: 'Complete your order for "Nature of the Divine." Fill out your shipping and payment details on our secure, streamlined checkout page to get your copy of this transformative philosophical work by Alfas B.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/checkout',
  },
};

const isProd = process.env.NEXT_PUBLIC_PHONEPE_ENV === 'PRODUCTION';
const phonePeSdkUrl = isProd 
    ? 'https://phonetpe.mycloudrepo.io/public/repositories/phonepe-web-sdk/latest/bundle.js'
    : 'https://phonetpe.mycloudrepo.io/public/repositories/phonepe-web-sdk-uat/latest/bundle.js';


export default function CheckoutPage() {
    return (
        <>
            <Script src={phonePeSdkUrl} strategy="lazyOnload" />
            <CheckoutClient />
        </>
    );
}
