import { OrderForm } from './OrderForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Order a Signed Copy | Nature of the Divine',
  description: 'Place an order for a signed copy of the book "Nature of the Divine".',
};

export default function OrderPage() {
  return (
    <div className="container mx-auto py-12 md:py-24 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Order a Signed Copy</CardTitle>
          <CardDescription>
            Fill out the form below to get a personalized, signed copy of "Nature of the Divine" delivered to your doorstep.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
