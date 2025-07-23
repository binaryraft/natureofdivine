
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus } from './order-store';
import type { BookVariant, OrderStatus } from './definitions';
import { decreaseStock, getStock } from './stock-store';
import { fetchLocationAndPrice } from './fetch-location-price';

const getVariantPrices = async () => {
    try {
        const priceData = await fetchLocationAndPrice();
        if (!priceData) {
            throw new Error("Could not fetch price data");
        }
        return {
            paperback: priceData.paperback,
            hardcover: priceData.hardcover,
            ebook: Math.ceil(priceData.paperback * 0.5)
        };
    } catch (error) {
        console.error("Defaulting to INR prices due to error:", error);
        // Fallback to INR prices if the API fails
        return {
            paperback: 299,
            hardcover: 499,
            ebook: 149
        }
    }
};

const variantSchema = z.object({
    variant: z.enum(['paperback', 'hardcover', 'ebook'], { required_error: 'Please select a book type.' }),
});

const addressSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  address: z.string().min(5, { message: 'Address must be at least 5 characters.' }),
  street: z.string().optional(),
  city: z.string().min(2, { message: 'Please enter a valid city.' }),
  country: z.string().min(2, { message: 'Please select a country.' }),
  state: z.string().min(2, { message: 'Please select a state.' }),
  pinCode: z.string().min(3, { message: 'Please enter a valid PIN code.' }),
  variantData: z.string(), // JSON string
});

const paymentSchema = z.object({
    paymentMethod: z.enum(['cod', 'prepaid']),
    addressData: z.string(), // JSON string
    userId: z.string().optional(),
    saveAddress: z.string().optional(),
});

// For E-book orders (which skip the address step)
const ebookPaymentSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    paymentMethod: z.enum(['cod', 'prepaid']),
    variantData: z.string(), // JSON string of variant info
    userId: z.string().optional(),
});


export type State = {
  errors?: {
    variant?: string[];
    name?: string[];
    phone?: string[];
    email?: string[];
    address?: string[];
    street?: string[];
    city?: string[];
    country?: string[];
    state?: string[];
    pinCode?: string[];
    paymentMethod?: string[];
  };
  message?: string | null;
  orderId?: string | null;
  step: 'variant' | 'details' | 'payment' | 'success';
  variantData?: string | null;
  detailsData?: string | null;
};

export async function placeOrder(prevState: State, formData: FormData): Promise<State> {
  const currentStep = prevState.step;
  
  if (currentStep === 'variant') {
    const validatedVariant = variantSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedVariant.success) {
      return {
        errors: validatedVariant.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'variant',
      };
    }

    try {
        const stock = await getStock();
        if (stock[validatedVariant.data.variant] <= 0) {
            return {
                 errors: { variant: ['This item is out of stock.'] },
                 message: 'Selected variant is out of stock.',
                 step: 'variant',
            }
        }
    } catch (e) {
        return {
            message: 'Could not verify stock. Please try again.',
            step: 'variant'
        }
    }
    
    const variantData = JSON.stringify(validatedVariant.data);

    return {
        step: 'details',
        variantData: variantData,
    };
  }

  if (currentStep === 'details') {
    const variantDataString = formData.get('variantData') as string;
    if (!variantDataString) return { step: 'variant', message: 'Something went wrong.' };
    const { variant } = JSON.parse(variantDataString);

    // E-books only need name and email
    if (variant === 'ebook') {
        const validatedDetails = ebookPaymentSchema.pick({ name: true, email: true, userId: true }).safeParse(Object.fromEntries(formData.entries()));
        if (!validatedDetails.success) {
            return { ...prevState, step: 'details', errors: validatedDetails.error.flatten().fieldErrors, message: 'Missing Fields.' };
        }
        const detailsData = JSON.stringify({ variant, ...validatedDetails.data });
        return { step: 'payment', detailsData };
    }

    // Physical books need the full address
    const validatedFields = addressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        ...prevState,
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'details',
      };
    }
    
    const fullData = { variant, ...validatedFields.data };
    return {
        step: 'payment',
        detailsData: JSON.stringify(fullData),
    };
  }

  if (currentStep === 'payment') {
     const detailsDataString = formData.get('detailsData') as string;
     if (!detailsDataString) {
        return { ...prevState, message: 'Invalid data.', step: 'variant' };
     }
     
     const detailsData = JSON.parse(detailsDataString);
     const validatedPayment = z.object({ paymentMethod: z.enum(['cod', 'prepaid']) }).safeParse(Object.fromEntries(formData.entries()));

     if(!validatedPayment.success){
         return { ...prevState, step: 'payment', message: "Please select a payment method." };
     }

     const fullOrderData = {
         ...detailsData,
         paymentMethod: validatedPayment.data.paymentMethod,
         userId: formData.get('userId') || null
     };

     try {
        const prices = await getVariantPrices();
        const price = prices[fullOrderData.variant as BookVariant];
        
        if (fullOrderData.variant !== 'ebook') {
            await decreaseStock(fullOrderData.variant, 1);
        }
     
        const newOrder = await addOrder({
            ...fullOrderData,
            price: price,
            // Ensure fields exist for all order types, even if empty
            name: fullOrderData.name || '',
            email: fullOrderData.email || '',
            phone: fullOrderData.phone || '',
            address: fullOrderData.address || '',
            street: fullOrderData.street || '',
            city: fullOrderData.city || '',
            country: fullOrderData.country || '',
            state: fullOrderData.state || '',
            pinCode: fullOrderData.pinCode || '',
        });

        // Potentially save address for logged-in user
        if (fullOrderData.userId && formData.get('saveAddress') === 'true') {
            // Logic to save address can be implemented here
        }

        revalidatePath('/admin');
        revalidatePath('/orders');
        revalidatePath('/checkout');

        return { 
            step: 'success', 
            message: 'Order created successfully!', 
            orderId: newOrder.id 
        };
      } catch (error: any) {
        console.error("Place order error:", error);
        return {
          message: 'An error occurred while placing your order. Please check your details and try again.',
          step: 'payment',
          detailsData: detailsDataString,
        };
      }
  }

  // Fallback for invalid state
  return {
    step: 'variant',
    message: 'An unexpected error occurred.',
  };
}


export async function fetchOrders() {
    return await getOrders();
}

export async function fetchUserOrders(userId: string) {
    if (!userId) return [];
    return await getOrdersByUserId(userId);
}

export async function changeOrderStatus(id: string, status: OrderStatus) {
    try {
        await updateOrderStatus(id, status);
        revalidatePath('/admin');
        revalidatePath('/orders');
        return { success: true, message: `Order ${id} status updated to ${status}` };
    } catch (error) {
        return { success: false, message: 'Failed to update order status.' };
    }
}
