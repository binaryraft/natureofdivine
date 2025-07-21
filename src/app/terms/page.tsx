import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: 'Terms of Service | Nature of the Divine',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>Welcome to the official website for the book "Nature of the Divine". By accessing our website, you agree to these terms of service. Please read them carefully.</p>
          
          <h2>2. Intellectual Property</h2>
          <p>The content on this website, including text, graphics, logos, and book excerpts, is the property of the author and protected by copyright laws. You may not reproduce, distribute, or create derivative works without explicit permission.</p>

          <h2>3. Orders and Payment</h2>
          <p>When you place an order on our site, you agree to provide current, complete, and accurate purchase and account information. We reserve the right to refuse any order you place with us.</p>

          <h2>4. Limitation of Liability</h2>
          <p>We do not guarantee that your use of our service will be uninterrupted, timely, secure, or error-free. We are not liable for any damages that result from the use of this website.</p>

          <h2>5. Governing Law</h2>
          <p>These terms are governed by the laws of the jurisdiction in which the author resides, without regard to its conflict of law principles.</p>
        </CardContent>
      </Card>
    </div>
  );
}
