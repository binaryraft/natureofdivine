
'use server';

import axios from 'axios';
import { addLog } from './log-store';
import { Order } from './definitions';

const API_BASE_URL = 'https://api.envia.com';

interface EnviaCountry {
    country_code: string;
    country_name: string;
    currency: string;
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


export async function getServiceableCountries(): Promise<EnviaCountry[]> {
    try {
        const response = await axios.get('https://queries.envia.com/country', { headers: getHeaders() });
        return response.data.data;
    } catch (error) {
        addLog('error', 'Envia: Failed to get serviceable countries', { error });
        return [];
    }
}

export async function getStatesForCountry(countryCode: string): Promise<EnviaState[]> {
    try {
        const response = await axios.get(`https://queries.envia.com/state?country_code=${countryCode}`, { headers: getHeaders() });
        return response.data.data;
    } catch (error) {
        addLog('error', 'Envia: Failed to get states for country', { countryCode, error });
        return [];
    }
}

export async function getShippingRates(order: Order) {
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
            number: '1', // Envia requires a number
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
            weight: 0.3, // kg
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
            weight: 0.5, // kg
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
        
        addLog('info', 'Envia: Fetching shipping rates', { payload });
        const response = await axios.post(`${API_BASE_URL}/ship/rate/`, payload, { headers: getHeaders() });
        addLog('info', 'Envia: Received shipping rates', { rates: response.data.data });

        return { success: true, rates: response.data.data };

    } catch (error: any) {
        addLog('error', 'Envia: Failed to get shipping rates', { 
            error: error.response ? error.response.data : error.message 
        });
        return { success: false, message: error.response?.data?.message || 'Could not fetch shipping rates.' };
    }
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
