import axios from 'axios';

export const fetchCurrentStandings = async () => {
  try {
    const response = await axios.get('https://ergast.com/api/f1/current/constructorStandings.json');
    return response.data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings || [];
  } catch (error) {
    console.error('Error fetching current standings', error);
    return [];
  }
};

export const fetchCurrentDriverStandings = async () => {
  try {
    const response = await axios.get('https://ergast.com/api/f1/current/driverStandings.json');
    return response.data.MRData.StandingsTable.StandingsLists[0].DriverStandings || [];
  } catch (error) {
    console.error('Error fetching current driver standings', error);
    return [];
  }
};

export const fetchDriverDNFs = async () => {
  try {
    const resultsResponse = await axios.get('https://ergast.com/api/f1/current/results.json?limit=1000');
    const driversResponse = await axios.get('https://ergast.com/api/f1/current/drivers.json');

    const nonFinishStatuses = ["Finished", "+1 Lap", "+2 Laps"];
    const dnfs = {};

    // Initialize all drivers with 0 DNFs
    driversResponse.data.MRData.DriverTable.Drivers.forEach(driver => {
      const driverId = driver.driverId;
      if (!dnfs[driverId]) {
        dnfs[driverId] = {
          driver: `${driver.givenName} ${driver.familyName}`,
          count: 0
        };
      }
    });

    resultsResponse.data.MRData.RaceTable.Races.forEach(race => {
      race.Results.forEach(result => {
        if (!nonFinishStatuses.includes(result.status)) {
          const driverId = result.Driver.driverId;
          dnfs[driverId].count++;
        }
      });
    });

    const sortedDNFs = Object.values(dnfs).sort((a, b) => b.count - a.count);
    const top3MostDNFs = sortedDNFs.slice(0, 3);
    const top3LeastDNFs = sortedDNFs.filter(driver => driver.count === 0);

    return { top3MostDNFDrivers: top3MostDNFs || [], top3LeastDNFDrivers: top3LeastDNFs || [] };
  } catch (error) {
    console.error('Error fetching driver DNFs', error);
    return { top3MostDNFDrivers: [], top3LeastDNFDrivers: [] };
  }
};
