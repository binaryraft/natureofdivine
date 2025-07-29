
'use client';

import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReturnsClient() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <div className="mb-4">
        <BackButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Return and Refund Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
              <strong>Nature of the Divine</strong><br />
              Email: natureofthedivine@gmail.com<br />
              Phone: 8606281125
          </p>
          <p>At Nature of the Divine, we strive to ensure that you are completely satisfied with your purchase. Please read our return and refund policy carefully to understand your rights and our obligations.</p>
          
          <h2>Returns</h2>
          <p>If you are not satisfied with your purchase, you may request a return within 7 days of receiving the product.</p>
          <p>To be eligible for a return, the item must be unused, in its original condition, and in the original packaging.</p>
          <p>You must provide proof of purchase (such as order confirmation or invoice).</p>
          <p>As we will not provide any replacement or exchange, if you received any damaged or defective products, you should inform us within 48 hours of receiving the product to raise a return request. Once we approve the return, you should send back the product to the address from which it came to process the refund.</p>

          <h2>Refunds</h2>
          <p>Once we receive and inspect the returned product, we will notify you about the approval or rejection of your refund.</p>
          <p>If approved, your refund will be credited to your original method of payment within 7–10 business days.</p>
          <p>Shipping charges are non-refundable unless the return is due to our error or a defective product.</p>

          <h2>Cancellations</h2>
          <p>Orders once placed can only be canceled within 12 hours or before dispatch, whichever is earlier.</p>

          <h2>Contact Us</h2>
          <p>For any queries related to returns or refunds, you may reach us at:<br/>
          Email: natureofthedivine@gmail.com<br/>
          Phone: 8606281125</p>

        </CardContent>
      </Card>
    </div>
  );
}

    