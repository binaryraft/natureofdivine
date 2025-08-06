

export type OrderStatus = 'new' | 'dispatched' | 'delivered' | 'cancelled' | 'pending';

export type BookVariant = 'paperback' | 'hardcover' | 'ebook';

export type Order = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  street: string;
  city: string;
  country: string;
  state: string;
  pinCode:string;
  paymentMethod: 'cod' | 'prepaid';
  variant: Exclude<BookVariant, 'ebook'>;
  price: number;
  originalPrice: number;
  discountCode: string;
  discountAmount: number;
  status: OrderStatus;
  createdAt: number; // Storing as timestamp for Firestore
  hasReview: boolean;
  paymentDetails: any | null;
};

export type Stock = {
  paperback: number;
  hardcover: number;
  ebook: number;
};

export type Review = {
    id: string;
    orderId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    reviewText?: string;
    imageUrls: string[];
    createdAt: number;
};

export type Discount = {
    id: string; // The code itself
    percent: number;
    usageCount: number;
    createdAt: number;
};

export type AnalyticsEvent = {
    id: string;
    type: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export type AnalyticsData = {
    totalVisitors: number;
    clicks: Record<string, number>;
    checkoutFunnel: {
        reachedShipping: number;
        completedShipping: number;
    };
    orders: {
        cod: number;
        prepaid: number;
        prepaidInitiated: number;
    };
    users: {
        login: number;
        signup: number;
    };
    sampleChapters: Record<string, number>;
    reviews: {
        total: number;
        averageRating: number;
    }
}
