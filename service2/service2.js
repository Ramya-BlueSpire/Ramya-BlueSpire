const express = require('express');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const sequelize = require('./utils/db'); // Assuming sequelize is properly configured in ./utils/db
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING
    }
});

(async () => {
    await sequelize.sync();
    console.log("User model synchronized with database");
})();

const fetchDataFromService1 = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            axios.get('http://localhost:3000/api/data')
                .then(response => resolve(response.data))
                .catch(error => reject(error));
        }, 100);
    });
};

const circuitBreakerOptions = {
    timeout: 1000,
    errorThresholdPercentage: 80,
    capacity:1,
    resetTimeout: 5000
};

const handleRequest = async (req, res) => {
    try {
        const breaker = new CircuitBreaker(fetchDataFromService1, circuitBreakerOptions);
        breaker.fallback(() => ({ body: 'Service 1 is unavailable right now. Try later.' }));

        breaker.on('success', async (result) => {
            console.log(`SUCCESS: ${JSON.stringify(result)}`);

            // Inserting data into the users table
            try {
                await User.create({ name: result.name });
            } catch (error) {
                console.error('Error inserting data into the database:', error.message);
            }
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

        const result = await breaker.fire();
        res.json({ data: result });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// API endpoint to fetch data from Service 1
app.get('/api/fetch-data', handleRequest);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Service 2 is running on port ${PORT}`);
});
