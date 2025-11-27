
'use server';

import axios from 'axios';
import { addLog } from './log-store';
import { Order } from './definitions';
import { enviaCache } from './envia-cache';

const API_BASE_URL = 'https://api.envia.com';


interface EnviaCountry {
    country_code: string;
    country_name: string;
    currency?: string;
}

interface EnviaState {
    name: string;
    code: string;
}


interface RatePayload {
    origin: {
        name: string;
        company: string;
        email: string;
        phone: string;
        street: string;
        number: string;
        district: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        reference?: string;
    };
    destination: {
        name: string;
        company: string;
        email: string;
        phone: string;
        street: string;
        number: string;
        district: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        reference?: string;
    };
    packages: {
        content: string;
        amount: number;
        type: 'box';
        weight: number;
        insurance: number;
        declaredValue: number;
        weightUnit: 'KG';
        lengthUnit: 'CM';
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
    }[];
    shipment: {
        carrier?: string;
        type: number; // 0 for document, 1 for package
    };
    settings: {
        currency: string;
        printFormat: 'PDF';
        printSize: 'STOCK_4X6';
    };
}


const getEnviaToken = () => {
    const isTest = process.env.ENVIA_IS_TEST === 'true';
    return isTest ? process.env.ENVIA_TEST_API_KEY : process.env.ENVIA_API_KEY;
};

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getEnviaToken()}`
});



/**
 * Get serviceable countries from Envia API with caching
 * Uses 24-hour cache to minimize API calls
 */
export async function getServiceableCountries(): Promise<EnviaCountry[]> {
    return enviaCache.getCountries(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await axios.get('https://queries.envia.com/country', {
                headers: getHeaders(),
                signal: controller.signal,
                timeout: 10000,
            });

            clearTimeout(timeoutId);

            const countries = response.data.data;
            if (!Array.isArray(countries)) {
                throw new Error('Invalid response format from Envia countries API');
            }

            return countries.map((c: any) => ({
                country_code: c.code,
                country_name: c.name,
                currency: c.currency
            }));
        } catch (error: any) {
            addLog('error', 'Envia: Failed to get serviceable countries', {
                error: error.message,
                code: error.code
            });

            // Return fallback countries for critical markets
            return [
                { country_code: 'IN', country_name: 'India', currency: 'INR' },
                { country_code: 'US', country_name: 'United States', currency: 'USD' },
                { country_code: 'GB', country_name: 'United Kingdom', currency: 'GBP' },
                { country_code: 'CA', country_name: 'Canada', currency: 'CAD' },
                { country_code: 'AU', country_name: 'Australia', currency: 'AUD' },
            ];
        }
    });
}

/**
 * Get states for a country from Envia API with caching
 * Uses 12-hour cache per country
 */
export async function getStatesForCountry(countryCode: string): Promise<EnviaState[]> {
    if (!countryCode) {
        return [];
    }

    return enviaCache.getStates(countryCode, async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await axios.get(
                `https://queries.envia.com/state?country_code=${countryCode}`,
                {
                    headers: getHeaders(),
                    signal: controller.signal,
                    timeout: 8000,
                }
            );

            clearTimeout(timeoutId);

            const states = response.data.data;
            if (!Array.isArray(states)) {
                throw new Error('Invalid response format from Envia states API');
            }

            return states.map((s: any) => ({
                name: s.name,
                code: s.code_2_digits || s.code_3_digits || s.name
            }));
        } catch (error: any) {
            addLog('error', 'Envia: Failed to get states for country', {
                countryCode,
                error: error.message,
                code: error.code
            });

            // Return empty array - let the form handle it gracefully
            return [];
        }
    });
}


export async function getShippingRates(order: Order) {
    // Create cache key based on destination details
    const cacheKey = `${order.country}-${order.state}-${order.pinCode}-${order.variant}`;

    return enviaCache.getRates(cacheKey, async () => {
        try {
            const originAddress = {
                name: "Alfas B",
                company: "Nature of the Divine",
                email: "natureofthedivine@gmail.com",
                phone: "8606281125",
                street: "Myplamootil",
                number: "1",
                district: "Kottayam",
                city: "Kottayam",
                state: "KL",
                country: "IN",
                postalCode: "686001",
            };

            const destinationAddress = {
                name: order.name,
                company: '',
                email: order.email,
                phone: order.phone,
                street: order.address,
                number: '1',
                district: order.street || order.city,
                city: order.city,
                state: order.state,
                country: order.country,
                postalCode: order.pinCode,
                reference: order.street,
            }

            const paperbackPackage = {
                content: "Book",
                amount: 1,
                type: "box" as "box",
                weight: 0.3,
                insurance: 0,
                declaredValue: order.originalPrice,
                weightUnit: "KG" as "KG",
                lengthUnit: "CM" as "CM",
                dimensions: {
                    length: 22,
                    width: 15,
                    height: 2
                }
            };

            const hardcoverPackage = {
                content: "Book",
                amount: 1,
                type: "box" as "box",
                weight: 0.5,
                insurance: 0,
                declaredValue: order.originalPrice,
                weightUnit: "KG" as "KG",
                lengthUnit: "CM" as "CM",
                dimensions: {
                    length: 23,
                    width: 16,
                    height: 3
                }
            };

            const payload: RatePayload = {
                origin: originAddress,
                destination: destinationAddress,
                packages: [order.variant === 'paperback' ? paperbackPackage : hardcoverPackage],
                shipment: { type: 1 },
                settings: {
                    currency: "INR",
                    printFormat: 'PDF',
                    printSize: 'STOCK_4X6',
                },
            };

            addLog('info', 'Envia: Fetching shipping rates', { cacheKey });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for rates

            const response = await axios.post(`${API_BASE_URL}/ship/rate/`, payload, {
                headers: getHeaders(),
                signal: controller.signal,
                timeout: 15000,
            });

            clearTimeout(timeoutId);

            addLog('info', 'Envia: Received shipping rates', { ratesCount: response.data.data?.length || 0 });

            return { success: true, rates: response.data.data };

        } catch (error: any) {
            const errorMessage = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
                ? 'Shipping service timed out. Please try again.'
                : error.response?.data?.message || 'Could not fetch shipping rates.';

            addLog('error', 'Envia: Failed to get shipping rates', {
                error: error.message,
                code: error.code,
                response: error.response?.data
            });

            return { success: false, message: errorMessage };
        }
    });
}

export async function generateLabel(order: Order, carrier: string, service: string) {
    try {
        const originAddress = {
            name: "Alfas B",
            company: "Nature of the Divine",
            email: "natureofthedivine@gmail.com",
            phone: "8606281125",
            street: "Myplamootil",
            number: "1",
            district: "Kottayam",
            city: "Kottayam",
            state: "KL",
            country: "IN",
            postalCode: "686001",
            reference: ""
        };

        const destinationAddress = {
            name: order.name,
            company: '',
            email: order.email,
            phone: order.phone,
            street: order.address,
            number: '1', // Envia requires a number
            district: order.street || order.city,
            city: order.city,
            state: order.state,
            country: order.country,
            postalCode: order.pinCode,
            reference: order.street
        };

        const paperbackPackage = {
            content: "Book", amount: 1, type: "box" as "box",
            weight: 0.3, insurance: 0, declaredValue: order.originalPrice,
            weightUnit: "KG" as "KG", lengthUnit: "CM" as "CM",
            dimensions: { length: 22, width: 15, height: 2 }
        };

        const hardcoverPackage = {
            content: "Book", amount: 1, type: "box" as "box",
            weight: 0.5, insurance: 0, declaredValue: order.originalPrice,
            weightUnit: "KG" as "KG", lengthUnit: "CM" as "CM",
            dimensions: { length: 23, width: 16, height: 3 }
        };

        const payload = {
            origin: originAddress,
            destination: destinationAddress,
            packages: [order.variant === 'paperback' ? paperbackPackage : hardcoverPackage],
            shipment: { carrier, service, type: 1 },
            settings: { printFormat: "PDF", printSize: "STOCK_4X6", comments: `Order ID: ${order.id}` }
        };

        addLog('info', 'Envia: Generating shipping label', { payload });
        const response = await axios.post(`${API_BASE_URL}/ship/generate/`, payload, { headers: getHeaders() });
        addLog('info', 'Envia: Label generated successfully', { response: response.data.data });

        return { success: true, data: response.data.data };

    } catch (error: any) {
        addLog('error', 'Envia: Failed to generate label', {
            error: error.response ? error.response.data : error.message
        });
        return { success: false, message: error.response?.data?.message || 'Could not generate shipping label.' };
    }
}
