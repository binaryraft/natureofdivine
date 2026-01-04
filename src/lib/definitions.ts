

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
  shippingDetails: {
    carrier: string;
    service: string;
    cost: number;
    trackingNumber: string | null;
    labelUrl: string | null;
  } | null;
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

export type TimeSeriesDataPoint = {
    date: string;
    value: number;
};

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
    communityVisits: number;
    sampleChapters: Record<string, number>;
    reviews: {
        total: number;
        averageRating: number;
    };
    visitorsOverTime: TimeSeriesDataPoint[];
    salesOverTime: TimeSeriesDataPoint[];
    ordersOverTime: TimeSeriesDataPoint[];
}

export type SampleChapter = {
    id: string;
    number: number;
    title: string;
    content: string;
    locked: boolean;
};

export type GalleryItemType = 'image' | 'text';

export type GalleryImage = {
    id: string;
    type: GalleryItemType;
    src?: string;
    alt?: string;
    content?: string;
    styles?: {
        textAlign?: 'left' | 'center' | 'right' | 'justify';
        fontStyle?: 'normal' | 'italic';
        fontWeight?: 'normal' | 'bold';
        fontSize?: string;
    };
    locked: boolean;
    aiHint?: string;
    createdAt: number;
};

export type SiteSettings = {
    codEnabled: boolean; // India COD
    codEnabledInternational: boolean; // International COD
    footerLinks: { label: string; url: string }[];
    socialLinks: { platform: string; url: string }[];
};
