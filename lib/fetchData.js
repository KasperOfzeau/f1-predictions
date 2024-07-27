import axios from 'axios';
import Bottleneck from 'bottleneck';
import axiosRetry from 'axios-retry';
import NodeCache from 'node-cache';

const RAPIDAPI_HOST = 'hyprace-api.p.rapidapi.com';
const RAPIDAPI_KEY = '5b5a072d4amsh3034dafde7a748ap11ba07jsn8b4332a31cb6'; // Ensure this is correct

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache data for 1 hour

const axiosInstance = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'X-RapidAPI-Key': RAPIDAPI_KEY
  }
});

// Apply retry logic to the axios instance
axiosRetry(axiosInstance, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => error.response && error.response.status === 429
});

// Create a limiter to manage rate limits
const limiter = new Bottleneck({
  minTime: 500 // 500ms delay between requests
});

const handleError = (error) => {
  if (error.response) {
    console.error(`Error: ${error.response.status} - ${error.response.statusText}`);
    console.error('Response data:', error.response.data);
    if (error.response.status === 403) {
      console.error('Check your API key, subscription plan, and endpoint permissions.');
    }
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
  throw error;
};

const fetchConstructorDetails = async (constructorId) => {
  const cacheKey = `constructor-${constructorId}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await limiter.schedule(() => axiosInstance.get(`/v1/constructors/${constructorId}`));
    const data = response.data || {};
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchCurrentStandings = async () => {
  try {
    const response = await limiter.schedule(() => axiosInstance.get('/v1/constructors-standings?isLastStanding=true&seasonId=8ac404c1-7494-4b04-b8a6-ee97913de526'));
    const standingsData = response.data.items[0].standings;

    // Get the top 3 and the last constructor standings
    const top3Standings = standingsData.slice(0, 3);
    const lastStanding = standingsData[standingsData.length - 1];

    // Combine top 3 and last standing into a single array
    const relevantStandings = [...top3Standings, lastStanding];

    const standings = await Promise.all(relevantStandings.map(async (standing) => {
      const constructorDetails = await fetchConstructorDetails(standing.constructor.id);
      return {
        constructor: constructorDetails.name, // Assuming constructorDetails contains the name field
        points: standing.points,
        position: standing.position
      };
    }));

    return standings;
  } catch (error) {
    handleError(error);
  }
};


const fetchDriverDetails = async (driverId) => {
  const cacheKey = `driver-${driverId}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await limiter.schedule(() => axiosInstance.get(`/v1/drivers/${driverId}`));
    const data = response.data || {};
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchCurrentDriverStandings = async () => {
  const cacheKey = 'current-driver-standings';
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await limiter.schedule(() => axiosInstance.get('/v1/drivers-standings?isLastStanding=true&seasonId=8ac404c1-7494-4b04-b8a6-ee97913de526'));
    const standingsData = response.data.items[0].standings;

    // Get the top 3 and the last driver standings
    const top3Standings = standingsData.slice(0, 3);
    const lastStanding = standingsData[standingsData.length - 1];

    // Combine top 3 and last standing into a single array
    const relevantStandings = [...top3Standings, lastStanding];

    const standings = await Promise.all(relevantStandings.map(async (standing) => {
      const driverDetails = await fetchDriverDetails(standing.driverId);
      const constructorDetails = await Promise.all(standing.constructorIds.map(fetchConstructorDetails));
      return {
        driver: driverDetails.firstName + ' ' + driverDetails.lastName, // Assuming driverDetails contains the name field
        constructors: constructorDetails.map(c => c.name), // Assuming constructorDetails contains the name field
        points: standing.points,
        position: standing.position
      };
    }));
    
    cache.set(cacheKey, standings);
    console.log('Driver Standings:', standings);
    return standings;
  } catch (error) {
    handleError(error);
  }
};
