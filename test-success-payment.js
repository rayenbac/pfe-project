// Test script to simulate successful payment
const axios = require('axios');

async function simulateSuccessfulPayment() {
    try {
        // Replace this with the actual payment reference from your latest failed payment
        const paymentRef = '688e265d82951becccc7ebe5'; // Use the payment reference from your logs
        
        console.log(`🧪 Simulating successful payment for: ${paymentRef}`);
        
        const response = await axios.post('http://localhost:3000/api/konnect/simulate-success', {
            paymentRef: paymentRef
        });
        
        console.log('✅ Success simulation result:', response.data);
        
        // Now test the webhook redirect
        console.log(`🔄 Testing webhook redirect...`);
        console.log(`Visit this URL in your browser to see the success page:`);
        console.log(`https://98e4988a363e.ngrok-free.app/api/konnect/webhook?payment_ref=${paymentRef}`);
        
    } catch (error) {
        console.error('❌ Error simulating payment:', error.response?.data || error.message);
    }
}

simulateSuccessfulPayment();
