
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchLocationAndPrice, type PriceData } from '@/lib/fetch-location-price';

interface LocationContextType {
  priceData: PriceData | null;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getLocationData() {
        try {
            const data = await fetchLocationAndPrice();
            setPriceData(data);
        } catch (error) {
            console.error("Failed to fetch location and price data", error);
            // Set a default fallback if the API fails
            setPriceData({
                paperback: 299,
                hardcover: 499,
                symbol: '₹',
                country: 'IN',
                currencyCode: 'INR'
            });
        } finally {
            setLoading(false);
        }
    }
    getLocationData();
  }, []);

  return (
    <LocationContext.Provider value={{ priceData, loading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
