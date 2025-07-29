
'use client';

import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TermsClient() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <div className="mb-4">
        <BackButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
            <p>
                <strong>Nature of the Divine</strong><br />
                Email: natureofthedivine@gmail.com<br />
                Phone: 8606281125
            </p>
            <p>Welcome to Nature of the Divine. By accessing or using our website or services, you agree to be bound by the following Terms and Conditions. Please read them carefully.</p>

            <h2>1. Acceptance of Terms</h2>
            <p>By accessing this website and/or placing an order, you agree to be legally bound by these terms. If you do not agree with any of these terms, you should not use our website or services.</p>
            
            <h2>2. Use of the Website</h2>
            <p>You agree to use the website only for lawful purposes and in a way that does not infringe the rights of others.</p>
            <p>You must not misuse this website by introducing viruses, trojans, or other malicious material.</p>

            <h2>3. Product and Service Information</h2>
            <p>We strive to ensure all product descriptions, pricing, and availability are accurate. However, we do not guarantee the accuracy of all content and reserve the right to correct errors or update information at any time without prior notice.</p>
            <p>Product colors may slightly vary due to screen settings.</p>

            <h2>4. Orders and Payments</h2>
            <p>All orders are subject to acceptance and availability.</p>
            <p>Prices for products are subject to change without notice.</p>
            <p>We reserve the right to refuse or cancel any order for any reason, including errors in pricing or stock availability.</p>

            <h2>5. Shipping and Delivery</h2>
            <p>Shipping timelines and delivery estimates are provided on a best-effort basis.</p>
            <p>Delays caused by courier services or unforeseen events are beyond our control.</p>

            <h2>6. Returns and Refunds</h2>
            <p>Please refer to our Return and Refund Policy for detailed information. Any return request must comply with our stated return guidelines.</p>

            <h2>7. Intellectual Property</h2>
            <p>All content on this website (text, images, logos, etc.) is the property of Nature of the Divine and is protected under applicable intellectual property laws.</p>
            <p>You may not reproduce, duplicate, copy, sell, or exploit any portion of the site without express written permission.</p>

            <h2>8. Limitation of Liability</h2>
            <p>We shall not be held liable for any direct, indirect, incidental, or consequential damages arising from your use of our website or products.</p>

            <h2>9. Privacy</h2>
            <p>Please refer to our Privacy Policy to understand how we collect, use, and protect your information.</p>

            <h2>10. Changes to Terms</h2>
            <p>We reserve the right to modify or replace these Terms at any time. Your continued use of the website following changes constitutes acceptance of those changes.</p>

            <h2>11. Governing Law</h2>
            <p>These terms and conditions shall be governed by and construed in accordance with the laws of India.</p>

            <p><em>Managed by Alfas</em></p>
        </CardContent>
      </Card>
    </div>
  );
}

    