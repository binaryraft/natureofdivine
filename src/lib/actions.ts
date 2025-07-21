
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addOrder, getOrders, getOrdersByUserId, updateOrderStatus } from './order-store';
import type { BookVariant, OrderStatus } from './definitions';
import { decreaseStock, getStock } from './stock-store';

const variantDetails: Record<BookVariant, { name: string; price: number; }> = {
    paperback: { name: 'Paperback', price: 299 },
    hardcover: { name: 'Hardcover', price: 499 },
    ebook: { name: 'E-book', price: 149 },
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

// For E-book orders
const ebookOrderSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    variantData: z.string(),
    userId: z.string().optional(),
    paymentMethod: z.enum(['cod', 'prepaid']),
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
  step: 'variant' | 'address' | 'payment' | 'success';
  variantData?: string | null;
  addressData?: string | null;
};

async function handleEbookOrder(formData: FormData) {
    const validatedFields = ebookOrderSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to place E-book order.',
            step: 'payment' as const,
            addressData: validatedFields.data.variantData,
        };
    }
    
    const { name, email, userId, paymentMethod, variantData } = validatedFields.data;
    const { variant } = JSON.parse(variantData);

    try {
        const newOrder = await addOrder({
            name,
            email,
            variant,
            price: variantDetails[variant].price,
            paymentMethod,
            userId: userId || null,
            // No shipping details for ebooks
            phone: '', address: '', street: '', city: '', country: '', state: '', pinCode: '',
        });

        revalidatePath('/admin');
        revalidatePath('/orders');
        revalidatePath('/checkout');
        
        return { 
            step: 'success' as const, 
            message: 'E-book order created successfully!', 
            orderId: newOrder.id 
        };
    } catch (error: any) {
        return {
            message: error.message || 'Database Error: Failed to Create E-book Order.',
            step: 'payment' as const,
            addressData: variantData,
        };
    }
}


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

    const stock = await getStock();
    if (stock[validatedVariant.data.variant] <= 0) {
        return {
             errors: { variant: ['This item is out of stock.'] },
             message: 'Selected variant is out of stock.',
             step: 'variant',
        }
    }

    const variantData = JSON.stringify(validatedVariant.data);

    if (validatedVariant.data.variant === 'ebook') {
        // For ebooks, we can skip the address and go directly to payment,
        // but the payment step will be simpler. Let's create a combined step.
        // For simplicity, let's just make an "ebook" payment form.
        // Or even better, handle it as a separate flow after this.
        return {
            step: 'payment',
            addressData: variantData, // Using addressData to carry the variant info
        }
    }


    return {
        step: 'address',
        variantData: variantData,
    };
  }

  if (currentStep === 'address') {
    const validatedFields = addressSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        ...prevState,
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Proceed.',
        step: 'address',
      };
    }
    
    const variantData = JSON.parse(validatedFields.data.variantData);
    const fullData = { ...variantData, ...validatedFields.data };

    return {
        step: 'payment',
        addressData: JSON.stringify(fullData),
    };
  }

  if (currentStep === 'payment') {
     const addressDataString = formData.get('addressData') as string;
     if (!addressDataString) {
        return { ...prevState, message: 'Invalid data.', step: 'variant' };
     }
     const addressData = JSON.parse(addressDataString);

     // Handle E-book order separately
     if(addressData.variant === 'ebook') {
        const validatedPayment = z.object({ paymentMethod: z.enum(['cod', 'prepaid']) }).safeParse(Object.fromEntries(formData.entries()));
        const { name, email } = addressData; // In this simple flow, we need to collect name/email differently
        
        try {
            const newOrder = await addOrder({
                name: formData.get('name') as string, // Assuming name/email fields are shown for ebook
                email: formData.get('email') as string,
                userId: formData.get('userId') as string || null,
                variant: 'ebook',
                price: variantDetails.ebook.price,
                paymentMethod: validatedPayment.success ? validatedPayment.data.paymentMethod : 'prepaid',
                phone: '', address: '', street: '', city: '', country: '', state: '', pinCode: '',
            });

            revalidatePath('/admin');
            revalidatePath('/orders');
            revalidatePath('/checkout');
            return { step: 'success', message: 'E-book Order Placed!', orderId: newOrder.id };
        } catch(e: any) {
            return {
                message: e.message || 'Database Error: Failed to Create Order.',
                step: 'payment',
                addressData: addressDataString,
            };
        }
     }

     // Handle Physical book order
     const validatedPayment = paymentSchema.safeParse(Object.fromEntries(formData.entries()));

     if (!validatedPayment.success || !validatedPayment.data.addressData) {
        return {
            ...prevState,
            message: 'Invalid payment details.',
            step: 'payment'
        }
     }
     
     const fullAddressData = JSON.parse(validatedPayment.data.addressData);
     const { userId, saveAddress } = validatedPayment.data;
     const { variant } = fullAddressData;
     
     try {
        await decreaseStock(variant, 1);
     
        const newOrder = await addOrder({
            ...fullAddressData,
            price: variantDetails[variant].price,
            paymentMethod: validatedPayment.data.paymentMethod,
            userId: userId || null,
        });

        if (userId && saveAddress === 'true') {
            // TODO: Logic to save the address to user's profile in Firestore
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
        return {
          message: error.message || 'Database Error: Failed to Create Order.',
          step: 'payment',
          addressData: validatedPayment.data.addressData,
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

    