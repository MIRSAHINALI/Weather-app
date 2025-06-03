// weather-app-backend/server.js
import 'dotenv/config'; // Simpler way to load .env for ES modules
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHERMAP_API_KEY;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

//Home route to check whether server is running or not!
app.get('/',(req,res)=>{
    res.send("Server is running!");
})

// Route to get current weather data
app.get('/api/weather/:city', async (req, res) => {
    const city = req.params.city;
    if (!apiKey) {
        console.error("API Key is missing.");
        return res.status(500).json({ message: 'Server configuration error: API key missing' });
    }
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(openWeatherUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching current weather:", error.response ? error.response.data : error.message);
        if (error.response) {
            res.status(error.response.status).json({ message: error.response.data.message || 'Error fetching weather data' });
        } else {
            res.status(500).json({ message: 'Internal server error while fetching weather' });
        }
    }
});

// Route to get forecast data
app.get('/api/forecast/:city', async (req, res) => {
    const city = req.params.city;
    if (!apiKey) {
        console.error("API Key is missing.");
        return res.status(500).json({ message: 'Server configuration error: API key missing' });
    }
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(openWeatherUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching forecast data:", error.response ? error.response.data : error.message);
        if (error.response) {
            res.status(error.response.status).json({ message: error.response.data.message || 'Error fetching forecast data' });
        } else {
            res.status(500).json({ message: 'Internal server error while fetching forecast' });
        }
    }
});

//Uncomment the following snippet if run in a local environment
app.listen(port, () => {
    console.log(`Weather app backend (ESM) listening at http://localhost:${port}`);
    if (!apiKey) {
        console.warn("Warning: OPENWEATHERMAP_API_KEY is not set in the .env file. API calls will fail.");
    }
});

export default app;
