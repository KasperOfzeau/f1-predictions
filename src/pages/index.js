import Head from 'next/head';
import { useState } from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { fetchCurrentStandings, fetchCurrentDriverStandings, fetchDriverDNFs } from '../../lib/fetchData';
import Constructors from '../components/Constructors';
import Drivers from '../components/Drivers';
import DNFs from '../components/DNFs';
import TotalScore from '../components/TotalScore';
import Poles from '../components/Poles';
import SafetyCars from '../components/SafetyCars';

export default function Home({ predictions, currentConstructorStandings, currentDriverStandings, top3MostDNFDrivers, top3LeastDNFDrivers }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
  const lastConstructor = currentConstructorStandings[currentConstructorStandings.length - 1]?.name;

  const safetyCarsDifferenceMattijn = Math.abs(predictions.safetyCars.Mattijn - predictions.safetyCars.Current);
  const safetyCarsDifferenceKasper = Math.abs(predictions.safetyCars.Kasper - predictions.safetyCars.Current);
  const safetyCarsClosest = safetyCarsDifferenceMattijn < safetyCarsDifferenceKasper ? 'Mattijn' : 'Kasper';

  const polesDifferenceMattijn = Math.abs(predictions.polesMax.Mattijn - predictions.polesMax.Current);
  const polesDifferenceKasper = Math.abs(predictions.polesMax.Kasper - predictions.polesMax.Current);
  const polesClosest = polesDifferenceMattijn < polesDifferenceKasper ? 'Mattijn' : 'Kasper';

  const totalScore = {
    Mattijn: comparePredictions(predictions.constructors.top3.Mattijn, currentConstructorStandings)
      + comparePredictions(predictions.drivers.top3.Mattijn, currentDriverStandings)
      + (predictions.dnfs.Mattijn === top3MostDNFDrivers[0]?.driver ? 1 : 0)
      + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Mattijn, top3LeastDNFDrivers) ? 1 : 0)
      + (predictions.drivers.lastDriver.Mattijn === lastDriver ? 1 : 0)
      + (predictions.constructors.lastConstructor.Mattijn === lastConstructor ? 1 : 0)
      + (polesClosest === 'Mattijn' ? 1 : 0)
      + (safetyCarsClosest === 'Mattijn' ? 1 : 0),
    Kasper: comparePredictions(predictions.constructors.top3.Kasper, currentConstructorStandings)
      + comparePredictions(predictions.drivers.top3.Kasper, currentDriverStandings)
      + (predictions.dnfs.Kasper === top3MostDNFDrivers[0]?.driver ? 1 : 0)
      + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Kasper, top3LeastDNFDrivers) ? 1 : 0)
      + (predictions.drivers.lastDriver.Kasper === lastDriver ? 1 : 0)
      + (predictions.constructors.lastConstructor.Kasper === lastConstructor ? 1 : 0)
      + (polesClosest === 'Kasper' ? 1 : 0)
      + (safetyCarsClosest === 'Kasper' ? 1 : 0),
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Head>
        <title>F1 2024 Predictions vs Current Standings</title>
      </Head>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
              <h1 className="text-2xl font-bold font-formula1 text-red-500">F1 Predictions</h1>
          </a>
          <button
            data-collapse-toggle="navbar-default"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
              </svg>
          </button>
          <div className={`w-full md:block md:w-auto ${isMenuOpen ? 'block' : 'hidden'}`} id="navbar-default">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a href="/" className="block py-2 px-3 text-white bg-red-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500" aria-current="page">2024 Predictions</a>
              </li>
              <li>
                <a href="/grid2025" className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">2025 Grid Prediction</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main className="flex-grow p-5">
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
