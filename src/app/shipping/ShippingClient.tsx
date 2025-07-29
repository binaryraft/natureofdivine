
'use client';

import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ShippingClient() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
       <div className="mb-4">
        <BackButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Shipping Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
              <strong>Nature of the Divine</strong><br />
              Email: natureofthedivine@gmail.com<br />
              Phone: 8606281125
          </p>
          <p>At Nature of the Divine, we are committed to delivering your products in a timely and secure manner. Please read our shipping policy for details on how and when your order will be delivered.</p>
          
          <h2>Shipping Coverage</h2>
          <p>We currently ship across India. If your location is not serviceable, we will inform you promptly after order placement.</p>

          <h2>Processing Time</h2>
          <p>All orders are processed within 1–3 business days after receiving payment confirmation.</p>
          <p>Orders are not shipped or delivered on Sundays or public holidays.</p>

          <h2>Shipping Time</h2>
          <p>Standard delivery takes 5–7 business days from the date of dispatch, depending on your location.</p>
          <p>Delays may occur due to unforeseen circumstances or courier issues. We appreciate your understanding and patience in such cases.</p>

          <h2>Shipping Charges</h2>
          <p>Shipping charges, if any, will be mentioned at checkout before you complete your purchase.</p>
          <p>We may offer free shipping on select products or order values from time to time.</p>

          <h2>Order Tracking</h2>
          <p>Once your order is shipped, you will receive a tracking ID and courier details via email or SMS to monitor the delivery status.</p>
          
          <h2>Incorrect Address or Delivery Issues</h2>
          <p>Please ensure that the shipping address and contact details provided are accurate.</p>
          <p>We are not responsible for orders delivered to incorrectly provided addresses or unclaimed deliveries.</p>
          
          <h2>Damaged Packages</h2>
          <p>If the package appears damaged or tampered with upon delivery, please do not accept it and contact us immediately.</p>

          <h2>Contact Us</h2>
          <p>For any questions or concerns about your order or shipping, please contact:<br/>
          Email: natureofthedivine@gmail.com<br/>
          Phone: 8606281125</p>
        </CardContent>
      </Card>
    </div>
  );
}

    