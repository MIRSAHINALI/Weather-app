// src/script.js
import axios from "axios";

const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const notFoundMessageElement = notFoundSection.querySelector('.regular-txt'); // Get the h4 for the message
const searchCitySection = document.querySelector('.search-city');

const countryTxtElement = document.querySelector('.location'); // The div containing the location h4
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.Wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');

const backendBaseUrl = 'https://weather-app-backend-jade.vercel.app/api'; // Ensure this matches your backend

// --- ROUTER LOGIC ---

// Function to parse the hash and call the appropriate handler
async function handleRouteChange() {
    const hash = window.location.hash || '#/search'; // Default to search if no hash
    weatherInfoSection.classList.add('hidden'); // Hide by default before routing
    searchCitySection.classList.add('hidden');
    notFoundSection.classList.add('hidden');

    if (hash.startsWith('#/weather/')) {
        const cityName = decodeURIComponent(hash.substring('#/weather/'.length));
        if (cityName) {
            await displayWeatherForCity(cityName);
        } else {
            showDisplaySection(searchCitySection); // Fallback if city name is missing
        }
    } else if (hash.startsWith('#/notfound')) {
        let searchedCity = '';
        if (hash.startsWith('#/notfound/')) {
            searchedCity = decodeURIComponent(hash.substring('#/notfound/'.length));
        }
        notFoundMessageElement.textContent = searchedCity
            ? `Could not find weather data for "${searchedCity}". Please try another city.`
            : "The city you searched for was not found. Please try another city.";
        showDisplaySection(notFoundSection);
    } else { // #/search or empty hash
        showDisplaySection(searchCitySection);
    }
}

// Listen for hash changes and initial page load
window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('load', () => {
    window.location.hash = '#/search';
    handleRouteChange();
});

// --- END ROUTER LOGIC ---


searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city !== '') {
        window.location.hash = `#/weather/${encodeURIComponent(city)}`; // Change hash to trigger route
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city !== '') {
            window.location.hash = `#/weather/${encodeURIComponent(city)}`; // Change hash
            cityInput.value = '';
            cityInput.blur();
        }
    }
});

async function getApiData(endpoint, city) {
    const apiUrl = `${backendBaseUrl}/${endpoint}/${encodeURIComponent(city)}`;
    console.log(apiUrl)
    try {
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint} for ${city} from backend:`, error.response ? error.response.data : error.message);
        return { cod: error.response ? String(error.response.status) : '500', message: error.response ? error.response.data.message : 'Failed to fetch data' };
    }
}

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg';
    if (id <= 321) return 'drizzle.svg';
    if (id <= 531) return 'rain.svg';
    if (id <= 622) return 'snow.svg';
    if (id <= 781) return 'atmosphere.svg';
    if (id === 800) return 'clear.svg';
    return 'clouds.svg';
}

function getCurrentDate() {
    const currentDate = new Date();
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return currentDate.toLocaleDateString('en-GB', options);
}

// Renamed from updateWeatherInfo to be more specific to the router's call
async function displayWeatherForCity(city) {
    const weatherData = await getApiData('weather', city);

    if (String(weatherData.cod) !== "200") {
        console.error("Weather data error:", weatherData.message || "Unknown error");
        // Instead of directly showing notFoundSection, change the hash. The router will handle it.
        window.location.hash = `#/notfound/${encodeURIComponent(city)}`;
        return;
    }

    const {
        name: locationName,
        main: { temp, humidity },
        weather: [{ id, main: weatherMain }], // Renamed main to weatherMain to avoid conflict
        wind: { speed }
    } = weatherData;

    countryTxtElement.innerHTML = ''; // Clear previous content
    const locationTextElement = document.createElement('h4');
    locationTextElement.classList.add('country-txt');
    locationTextElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EFEFEF"><path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z"/></svg>${locationName}`;
    countryTxtElement.appendChild(locationTextElement);

    tempTxt.textContent = Math.round(temp) + ' °C';
    conditionTxt.textContent = weatherMain;
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + ' M/s';
    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `/assets/weather/${getWeatherIcon(id)}`;

    await displayForecastForCity(city); // Changed to call a more specific forecast display function
    showDisplaySection(weatherInfoSection); // Show the weather info section
}

// Renamed from updateForecastInfo
async function displayForecastForCity(city) {
    const forecastsData = await getApiData('forecast', city);
    forecastItemsContainer.innerHTML = ''; // Clear previous forecast items

    if (String(forecastsData.cod) !== "200") {
        console.error("Forecast data error:", forecastsData.message || "Unknown error");
        forecastItemsContainer.innerHTML = '<p class="regular-txt" style="text-align:center; width:100%;">Could not load forecast.</p>';
        return;
    }

    const timetaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];
    let forecastCount = 0;

    forecastsData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timetaken) &&
            !forecastWeather.dt_txt.includes(todayDate) && forecastCount < 4) {
            renderForecastItem(forecastWeather); // Changed to call a rendering function
            forecastCount++;
        }
    });

    if (forecastCount === 0) {
        forecastItemsContainer.innerHTML = '<p class="regular-txt" style="text-align:center; width:100%;">No forecast available for upcoming days at 12:00.</p>';
    }
}

// Renamed from updateForecastItems to be more specific
function renderForecastItem(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dateTaken = new Date(date);
    const dateOption = { day: '2-digit', month: 'short' };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItemHTML = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="/assets/weather/${getWeatherIcon(id)}" class="forecast-item-img" alt="${getWeatherIcon(id).split('.')[0]} icon">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `;
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItemHTML);
}

function showDisplaySection(sectionToShow) {
    sectionToShow.classList.remove('hidden');
}
