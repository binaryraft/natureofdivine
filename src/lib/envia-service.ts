'use server';

import axios from 'axios';
import { addLog } from './log-store';
import { Order } from './definitions';
import { enviaCache } from './envia-cache';

// Use test or production URL based on environment
const getApiBaseUrl = () => {
    const isTest = process.env.ENVIA_IS_TEST === 'true';
    return isTest ? 'https://api-test.envia.com' : 'https://api.envia.com';
};

const QUERIES_BASE_URL = 'https://queries.envia.com';


interface EnviaCountry {
    country_code: string;
    country_name: string;
    currency?: string;
}

interface EnviaState {
    name: string;
    code: string;
}

const getEnviaToken = () => {
    const isTest = process.env.ENVIA_IS_TEST === 'true';
    const token = isTest ? process.env.ENVIA_TEST_API_KEY : process.env.ENVIA_API_KEY;
    return token;
};

const getHeaders = (isQuery: boolean = false) => {
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (!isQuery) {
        headers['Authorization'] = `Bearer ${getEnviaToken()}`;
    }

    return headers;
};

/**
 * Get serviceable countries from Envia API with caching
 */
export async function getServiceableCountries(): Promise<EnviaCountry[]> {
    return enviaCache.getCountries(async () => {
        try {
            const token = getEnviaToken();
            if (!token) return [];

            const response = await axios.get(`${QUERIES_BASE_URL}/country`, {
                headers: getHeaders(true),
                timeout: 5000,
            } as any);

            const countries = (response.data as any).data;
            if (!Array.isArray(countries)) throw new Error('Invalid response');

            return countries.map((c: any) => ({
                country_code: c.code,
                country_name: c.name,
                currency: c.currency
            }));
        } catch (error) {
            return [];
        }
    });
}

/**
 * Get states for a country from Envia API with caching
 */
export async function getStatesForCountry(countryCode: string): Promise<EnviaState[]> {
    if (!countryCode) return [];
    return enviaCache.getStates(countryCode, async () => {
        try {
            const response = await axios.get(
                `${QUERIES_BASE_URL}/state?country_code=${countryCode}`,
                { headers: getHeaders(true), timeout: 8000 } as any
            );
            const states = (response.data as any).data;
            if (!Array.isArray(states)) return [];
            return states.map((s: any) => ({
                name: s.name,
                code: s.code_2_digits || s.code_3_digits || s.name
            }));
        } catch (error) {
            return [];
        }
    });
}

/**
 * Get serviceable carriers for a country
 */
export async function getServiceableCarriers(countryCode: string): Promise<string[]> {
    return enviaCache.get(`carriers:${countryCode}`, async () => {
        try {
            const response = await axios.get(`${QUERIES_BASE_URL}/carrier?country_code=${countryCode}`, {
                headers: getHeaders(true),
                timeout: 5000,
            } as any);
            const carriers = (response.data as any).data;
            return Array.isArray(carriers) ? carriers.map((c: any) => c.name) : [];
        } catch (error) {
            return [];
        }
    }, 24 * 60 * 60 * 1000);
}

// Map state name to code
async function mapStateToCode(stateName: string, countryCode: string): Promise<string> {
    try {
        const states = await getStatesForCountry(countryCode);
        const match = states.find(s => 
            s.name.toLowerCase() === stateName.toLowerCase() || 
            s.code.toLowerCase() === stateName.toLowerCase()
        );
        return match?.code || stateName.slice(0, 2).toUpperCase();
    } catch (e) {
        return stateName.slice(0, 2).toUpperCase();
    }
}

// Common payload generator based on Laynered implementation
async function generatePayload(order: Order, carrier?: string, service?: string, isRateQuery: boolean = false) {
    const countryCode = order.country.slice(0, 2).toUpperCase();
    const stateCode = await mapStateToCode(order.state, countryCode);
    
    // Determine package details based on variant
    // Laynered logic: groups items. Here we have a single book variant per order for now (or simplified).
    // Using fixed dimensions as per our logic, but structure from Laynered.
    const weight = order.variant === 'paperback' ? 0.3 : 0.5;
    const dimensions = order.variant === 'paperback' ? { length: 22, width: 15, height: 2 } : { length: 23, width: 16, height: 3 };
    
    // Laynered calculates quantity * weight. We assume 1 item for now or logic from order.
    // Assuming quantity 1 for quoting if not present (simplified checkout).
    const quantity = 1; 

    const packageData = {
        content: `Book - ${order.variant}`,
        amount: quantity,
        type: 'box',
        weight: weight * quantity,
        insurance: 0,
        declaredValue: order.originalPrice || order.price || 1, // camelCase as per Laynered
        weightUnit: 'KG',      // camelCase as per Laynered
        lengthUnit: 'CM',      // Laynered uses lengthUnit, not dimensionUnit
        dimensions
    };

    return {
        origin: {
            name: "Nature of the Divine",
            company: "Nature of the Divine",
            email: "natureofthedivine@gmail.com",
            phone: "8606281125",
            street: "Myplamootil",
            number: "1",
            district: "Kottayam",
            city: "Kottayam",
            state: "KL",
            country: "IN",
            postalCode: "686001", // camelCase
            reference: ""
        },
        destination: {
            name: order.name,
            company: '',
            email: order.email,
            phone: order.phone,
            street: order.address,
            number: '1',
            district: order.street || order.city,
            city: order.city,
            state: stateCode,
            country: countryCode,
            postalCode: order.pinCode, // camelCase
            reference: order.street || ''
        },
        packages: [packageData],
        shipment: carrier ? {
            carrier: carrier.toLowerCase(),
            service: service,
            type: 1
        } : undefined,
        settings: {
            currency: "INR",
            printFormat: "PDF",      // camelCase
            printSize: "STOCK_4X6",  // camelCase
            comments: isRateQuery ? undefined : `Order ID: ${order.id}`
        }
    };
}


export async function getShippingRates(order: Order) {
    const cacheKey = `${order.country}-${order.state}-${order.pinCode}-${order.variant}`;

    return enviaCache.getRates(cacheKey, async () => {
        try {
            const token = getEnviaToken();
            if (!token) throw new Error('Envia API Key is missing.');

            const carriers = await getServiceableCarriers(order.country);
            if (carriers.length === 0) addLog('warn', 'Envia: No carriers found', { country: order.country });

            // Generate base payload without carrier (partially) or we iterate
            // We need to iterate carriers.
            
            // Construct payload base - wait, generatePayload takes carrier/service.
            // But we don't have them yet for rate query across ALL carriers.
            // Laynered's createRateQuery takes specific carrier/service. 
            // Envia has a generic rate endpoint too? 
            // Laynered uses `${BASE_URL}/ship/rate/` which requires carrier/service in payload usually?
            // Or maybe not? Let's check Utils.js again.
            // Utils.js: createRateQuery takes carrier, serviceName.
            // NatureOfTheDivine needs ALL rates.
            
            // Strategy: Loop through carriers like before, but use generatePayload.
            
            const ratePromises = carriers.map(async (carrier) => {
                // For rate query, service is optional/wildcard? 
                // Laynered passes serviceName. 
                // If we don't know service, can we pass empty? 
                // Envia docs usually allow omitting service to get all services for a carrier.
                
                try {
                    const payload = await generatePayload(order, carrier, undefined, true);
                    
                    // Fix: Envia API for rate often expects 'shipment' object even if service is missing?
                    // Payload generator adds it if carrier is passed.
                    
                    const response = await axios.post(`${getApiBaseUrl()}/ship/rate/`, payload, {
                        headers: getHeaders(false),
                        timeout: 8000
                    } as any);
                    
                    const data = (response.data as any).data;
                    return Array.isArray(data) ? data : [];
                } catch (e) {
                    return [];
                }
            });

            const results = await Promise.all(ratePromises);
            const allRates = results.flat();

            addLog('info', 'Envia: Received rates', { count: allRates.length });

            const rates = allRates.map((rate: any) => {
                const originalPrice = rate.totalPrice || rate.total_price;
                const priceWithMargin = originalPrice * 1.15;
                return {
                    carrier: rate.carrier,
                    service: rate.service,
                    totalPrice: Math.ceil(priceWithMargin),
                    currency: rate.currency,
                    deliveryDate: rate.deliveryDate || rate.delivery_date,
                };
            });

            return { success: true, rates };

        } catch (error: any) {
             addLog('error', 'Envia: Rate fetch failed', { error: error.message });
             return { success: false, message: 'Could not fetch shipping rates.' };
        }
    });
}

export async function generateLabel(order: Order, carrier: string, service: string) {
    try {
        const token = getEnviaToken();
        if (!token) throw new Error('Envia API Key is missing.');

        const payload = await generatePayload(order, carrier, service, false);
        
        addLog('info', 'Envia: Generating label', { payload });
        const response = await axios.post(`${getApiBaseUrl()}/ship/generate/`, payload, { headers: getHeaders(false) });
        addLog('info', 'Envia: Label generated', { response: (response.data as any).data });

        return { success: true, data: (response.data as any).data };

    } catch (error: any) {
        addLog('error', 'Envia: Label generation failed', { error: error.message });
        return { success: false, message: 'Could not generate shipping label.' };
    }
}