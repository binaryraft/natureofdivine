import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: 'Return Policy | Nature of the Divine',
};

export default function ReturnsPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Return Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. General Policy</h2>
          <p>We accept returns on new, unopened items within 30 days of delivery for a full refund. We'll also pay the return shipping costs if the return is a result of our error (you received an incorrect or defective item, etc.).</p>
          
          <h2>2. How to Initiate a Return</h2>
          <p>To initiate a return, please contact our support team with your order number and details about the product you would like to return. We will respond quickly with instructions for how to return items from your order.</p>

          <h2>3. Refunds</h2>
          <p>You should expect to receive your refund within four weeks of giving your package to the return shipper; however, in many cases, you will receive a refund more quickly. This time period includes the transit time for us to receive your return from the shipper (5 to 10 business days), the time it takes us to process your return once we receive it (3 to 5 business days), and the time it takes your bank to process our refund request (5 to 10 business days).</p>

        </CardContent>
      </Card>
    </div>
  );
}
