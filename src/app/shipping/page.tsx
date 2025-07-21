import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: 'Shipping Policy | Nature of the Divine',
};

export default function ShippingPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Shipping Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Processing Time</h2>
          <p>All orders are processed within 2-3 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.</p>
          
          <h2>2. Shipping Rates & Delivery Estimates</h2>
          <p>Shipping charges for your order will be calculated and displayed at checkout. Delivery estimates will be provided once your order is placed.</p>
          <ul>
            <li>Standard Shipping: 5-7 business days</li>
            <li>Expedited Shipping: 2-3 business days</li>
          </ul>

          <h2>3. Shipment Confirmation & Order Tracking</h2>
          <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.</p>

          <h2>4. Damages</h2>
          <p>We are not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.</p>
        </CardContent>
      </Card>
    </div>
  );
}
