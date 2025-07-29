
'use client';

import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacyClient() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <div className="mb-4">
        <BackButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
            <p>
                <strong>Nature of the Divine</strong><br />
                Email: natureofthedivine@gmail.com<br />
                Phone: 8606281125
            </p>
            <p>At Nature of the Divine, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website or engage with our services.</p>

            <h2>1. Information We Collect</h2>
            <p>We may collect the following types of personal information:</p>
            <ul>
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Shipping and billing address</li>
                <li>Payment information (processed securely via third-party payment gateways)</li>
                <li>Any other information you provide voluntarily</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
                <li>Process your orders and payments</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send order updates and promotional offers</li>
                <li>Improve our website, products, and services</li>
                <li>Comply with legal requirements</li>
            </ul>

            <h2>3. Sharing of Information</h2>
            <p>We do not sell, trade, or rent your personal information to others. Your information may be shared with:</p>
            <ul>
                <li>Trusted third-party service providers (e.g., courier companies, payment processors) strictly for order fulfillment and related services</li>
                <li>Government or legal authorities, if required by law</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data from unauthorized access, loss, misuse, or disclosure.</p>

            <h2>5. Cookies and Tracking</h2>
            <p>Our website may use cookies and similar technologies to enhance user experience, analyze website traffic, and personalize content. You can manage cookie preferences through your browser settings.</p>

            <h2>6. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.</p>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction or deletion of your information</li>
                <li>Opt out of receiving marketing communications at any time</li>
            </ul>

            <h2>8. Changes to This Policy</h2>
            <p>We reserve the right to update or change this Privacy Policy at any time. Any changes will be posted on this page, and your continued use of the website constitutes acceptance of the revised policy.</p>

            <h2>9. Contact Us</h2>
            <p>If you have any questions or concerns regarding this Privacy Policy or the handling of your information, please contact us at:<br />
            Email: natureofthedivine@gmail.com<br />
            Phone: 8606281125</p>
        </CardContent>
      </Card>
    </div>
  );
}

    