import Head from 'next/head';
import { promises as fs } from 'fs';
import path from 'path';
import { fetchCurrentStandings, fetchCurrentDriverStandings, fetchDriverDNFs } from '../../lib/fetchData';
import { comparePredictions, isCorrectLeastDNFPrediction, calculateTotalScore } from '../../lib/utils';
import Navbar from '../components/Navbar';
import Constructors from '../components/Constructors';
import Drivers from '../components/Drivers';
import DNFs from '../components/DNFs';
import TotalScore from '../components/TotalScore';
import Poles from '../components/Poles';
import SafetyCars from '../components/SafetyCars';

export default function Home({ predictions, currentConstructorStandings, currentDriverStandings, top3MostDNFDrivers, top3LeastDNFDrivers }) {
  const safetyCarsDifferenceMattijn = Math.abs(predictions.safetyCars.Mattijn - predictions.safetyCars.Current);
  const safetyCarsDifferenceKasper = Math.abs(predictions.safetyCars.Kasper - predictions.safetyCars.Current);
  const safetyCarsClosest = safetyCarsDifferenceMattijn < safetyCarsDifferenceKasper ? 'Mattijn' : 'Kasper';

  const polesDifferenceMattijn = Math.abs(predictions.polesMax.Mattijn - predictions.polesMax.Current);
  const polesDifferenceKasper = Math.abs(predictions.polesMax.Kasper - predictions.polesMax.Current);
  const polesClosest = polesDifferenceMattijn < polesDifferenceKasper ? 'Mattijn' : 'Kasper';

  const totalScore = calculateTotalScore(predictions, currentConstructorStandings, currentDriverStandings, top3MostDNFDrivers, top3LeastDNFDrivers, polesClosest, safetyCarsClosest);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Head>
        <title>F1 2024 Predictions vs Current Standings</title>
      </Head>
      <Navbar />
      <main className="flex-grow p-4">
        <h1 className="text-3xl font-bold mb-8 font-formula1 text-red-500">F1 2024 Predictions vs Current Standings</h1>
        <Constructors predictions={predictions.constructors} currentStandings={currentConstructorStandings} />
        <Drivers predictions={predictions.drivers} currentStandings={currentDriverStandings} />
        <DNFs predictions={predictions.dnfs} leastDnfs={predictions.leastDnfs} top3MostDNFDrivers={top3MostDNFDrivers} top3LeastDNFDrivers={top3LeastDNFDrivers} />
        <Poles predictions={predictions} polesClosest={polesClosest} />
        <SafetyCars predictions={predictions} safetyCarsClosest={safetyCarsClosest} />
        <TotalScore totalScore={totalScore} />
      </main>
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
