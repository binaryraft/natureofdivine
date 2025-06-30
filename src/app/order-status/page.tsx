import { OrderStatusChecker } from './OrderStatusChecker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Track Your Order | Nature of the Divine',
  description: 'Check the status of your order for the book "Nature of the Divine".',
};

export default function OrderStatusPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Track Your Order</CardTitle>
          <CardDescription>
            Enter your Order ID below to see the current status of your shipment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusChecker />
        </CardContent>
      </Card>
    </div>
  );
}
