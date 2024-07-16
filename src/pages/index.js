import Head from 'next/head';
import { promises as fs } from 'fs';
import path from 'path';
import { fetchCurrentStandings, fetchCurrentDriverStandings, fetchDriverDNFs } from '../../lib/fetchData';
import Constructors from '../components/Constructors';
import Drivers from '../components/Drivers';
import DNFs from '../components/DNFs';
import TotalScore from '../components/TotalScore';

export default function Home({ predictions, currentConstructorStandings, currentDriverStandings, top3MostDNFDrivers, top3LeastDNFDrivers }) {
  const comparePredictions = (predicted, current) => {
    let correctCount = 0;
    predicted.forEach((item, index) => {
      if (item === current[index]?.name) correctCount++;
    });
    return correctCount;
  };

  const isCorrectLeastDNFPrediction = (prediction, leastDNFDrivers) => {
    return leastDNFDrivers.some(driver => driver.driver === prediction);
  };

  const lastDriver = currentDriverStandings[currentDriverStandings.length - 1]?.name;

  const totalScore = {
    Mattijn: comparePredictions(predictions.constructors.Mattijn, currentConstructorStandings)
      + comparePredictions(predictions.drivers.top3.Mattijn, currentDriverStandings)
      + (predictions.dnfs.Mattijn === top3MostDNFDrivers[0]?.driver ? 1 : 0)
      + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Mattijn, top3LeastDNFDrivers) ? 1 : 0)
      + (predictions.drivers.lastDriver.Mattijn === lastDriver ? 1 : 0),
    Kasper: comparePredictions(predictions.constructors.Kasper, currentConstructorStandings)
      + comparePredictions(predictions.drivers.top3.Kasper, currentDriverStandings)
      + (predictions.dnfs.Kasper === top3MostDNFDrivers[0]?.driver ? 1 : 0)
      + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Kasper, top3LeastDNFDrivers) ? 1 : 0)
      + (predictions.drivers.lastDriver.Kasper === lastDriver ? 1 : 0),
  };

  return (
    <div className="bg-gray-900 text-white">
      <Head>
        <title>F1 2024 Predictions vs Current Standings</title>
      </Head>
      <h1 className="text-3xl font-bold px-8 pt-8 font-formula1 text-red-500">F1 2024 Predictions vs Current Standings</h1>
      <Constructors predictions={predictions.constructors} currentStandings={currentConstructorStandings} />
      <Drivers predictions={predictions.drivers} currentStandings={currentDriverStandings} />
      <DNFs predictions={predictions.dnfs} leastDnfs={predictions.leastDnfs} top3MostDNFDrivers={top3MostDNFDrivers} top3LeastDNFDrivers={top3LeastDNFDrivers} />
      <TotalScore totalScore={totalScore} />
      <footer className="mt-8 p-4 border-t-2 border-red-500 bg-gray-800 text-white text-center">
        <p>Data provided by the <a href="https://ergast.com/mrd/" className="text-red-500 hover:underline">Ergast Motor Racing Data API</a>.</p>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  // Fetch current standings from the API
  const currentConstructorStandings = await fetchCurrentStandings();
  const currentDriverStandings = await fetchCurrentDriverStandings();
  const { top3MostDNFDrivers, top3LeastDNFDrivers } = await fetchDriverDNFs();

  // Read predictions from the JSON file
  const filePath = path.join(process.cwd(), 'public', 'predictions.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const predictions = JSON.parse(jsonData);

  // Format driver standings for comparison
  const formattedDriverStandings = currentDriverStandings.map(driver => ({
    name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
    points: driver.points,
  }));

  // Format constructor standings for comparison
  const formattedConstructorStandings = currentConstructorStandings.map(constructor => ({
    name: constructor.Constructor.name,
    points: constructor.points,
  }));

  return {
    props: {
      predictions,
      currentConstructorStandings: formattedConstructorStandings,
      currentDriverStandings: formattedDriverStandings,
      top3MostDNFDrivers: top3MostDNFDrivers || [],
      top3LeastDNFDrivers: top3LeastDNFDrivers || [],
    },
  };
}
