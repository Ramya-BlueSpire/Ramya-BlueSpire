const express = require('express');
const axios = require('axios');
const CircuitBreaker = require('opossum');

const app = express();


const fetchDataFromService1 = () => {
    return axios.get('http://localhost:3000/api/data')
        .then(response => response.data)
        .catch(error => {
            throw error;
        });
};


const circuitBreakerOptions = {
    timeout: 1000,
    errorThresholdPercentage: 50,
    resetTimeout: 5000
};0


const breaker = new CircuitBreaker(fetchDataFromService1, circuitBreakerOptions);


breaker.fallback(() => ({ body: 'Service 1 is unavailable right now. Try later.' }));


breaker.on('success', (result) => {
    console.log(`SUCCESS: ${JSON.stringify(result)}`);
});

breaker.on('timeout', () => {
    console.log('TIMEOUT: Service 1 is taking too long to respond.');
});

breaker.on('reject', () => {
    console.log('REJECTED: The circuit breaker is open. Failing fast.');
});

breaker.on('open', () => {
    console.log('OPEN: The circuit breaker just opened.');
});

breaker.on('halfOpen', () => {
    console.log('HALF_OPEN: The circuit breaker is half open.');
});

breaker.on('close', () => {
    console.log('CLOSE: The circuit breaker has closed. Service OK.');
});

breaker.on('fallback', (data) => {
    console.log(`FALLBACK: ${JSON.stringify(data)}`);
});


app.get('/api/fetch-data', async (req, res) => {
    try {
        const result = await breaker.fire();
        res.json({ data: result });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Service 2 is running on port ${PORT}`);
});
