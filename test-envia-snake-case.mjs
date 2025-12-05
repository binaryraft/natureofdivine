import axios from 'axios';
import fs from 'fs';

const ENVIA_TEST_API_KEY = '489d6aa975eb6becce074d39464e945bce83b0968cdbe3dfadd9997797563095';
const API_BASE_URL = 'https://api-test.envia.com';

// Test with SNAKE_CASE properties (as Envia might expect)
const testPayload = {
    origin: {
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
        postal_code: "686001"
    },
    destination: {
        name: "Test User",
        company: "",
        email: "test@example.com",
        phone: "9876543210",
        street: "Test Street",
        number: "1",
        district: "Bangalore",
        city: "Bangalore",
        state: "KA",
        country: "IN",
        postal_code: "560001",
        reference: ""
    },
    packages: [{
        content: "Book",
        amount: 1,
        type: "box",
        weight: 0.3,
        insurance: 0,
        declared_value: 500,
        weight_unit: "KG",
        dimensions: {
            length: 22,
            width: 15,
            height: 2
        }
    }]
};

let output = '=== ENVIA API TEST (SNAKE_CASE) ===\n\n';
output += 'Payload:\n' + JSON.stringify(testPayload, null, 2) + '\n\n';

try {
    const response = await axios.post(`${API_BASE_URL}/ship/rate/`, testPayload, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENVIA_TEST_API_KEY}`
        },
        timeout: 15000
    });

    output += '✅ SUCCESS!\n\n';
    output += 'Response:\n' + JSON.stringify(response.data, null, 2);
    console.log('✅ SUCCESS! Got shipping rates!');
} catch (error) {
    output += '❌ ERROR!\n\n';
    if (error.response) {
        output += 'Status: ' + error.response.status + '\n';
        output += 'Response:\n' + JSON.stringify(error.response.data, null, 2);
        console.log('❌ ERROR! Status:', error.response.status);
    } else {
        output += error.message;
        console.log('❌ ERROR:', error.message);
    }
}

fs.writeFileSync('envia-test-snake-case.txt', output);
console.log('Results written to: envia-test-snake-case.txt');
