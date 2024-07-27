import { promises as fs } from 'fs';
import path from 'path';
import { fetchCurrentStandings, fetchCurrentDriverStandings } from '../../lib/fetchData';
import { comparePredictions, calculateTotalScore } from '../../lib/utils';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Constructors from '../components/Constructors';
import Drivers from '../components/Drivers';
import Poles from '../components/Poles';
import SafetyCars from '../components/SafetyCars';
import TotalScore from '../components/TotalScore';
import DNFs from '../components/DNFs';
import { compareGrid2025Predictions } from '../../lib/grid2025Utils';

export default function Home({ predictions, currentConstructorStandings, currentDriverStandings, grid2025Scores, currentMostDNF, currentLeastDNF }) {
  const safetyCarsDifferenceMattijn = Math.abs(predictions.safetyCars.Mattijn - predictions.safetyCars.Current);
  const safetyCarsDifferenceKasper = Math.abs(predictions.safetyCars.Kasper - predictions.safetyCars.Current);
  const safetyCarsClosest = safetyCarsDifferenceMattijn < safetyCarsDifferenceKasper ? 'Mattijn' : 'Kasper';

  const polesDifferenceMattijn = Math.abs(predictions.polesMax.Mattijn - predictions.polesMax.Current);
  const polesDifferenceKasper = Math.abs(predictions.polesMax.Kasper - predictions.polesMax.Current);
  const polesClosest = polesDifferenceMattijn < polesDifferenceKasper ? 'Mattijn' : 'Kasper';

  const totalScore = calculateTotalScore(predictions, currentConstructorStandings, currentDriverStandings, polesClosest, safetyCarsClosest, grid2025Scores, currentMostDNF, currentLeastDNF);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-4">
        <h1 className="text-3xl font-bold mb-8 font-formula1 text-red-500">F1 2024 Predictions vs Current Standings</h1>
        <Constructors predictions={predictions.constructors} currentStandings={currentConstructorStandings} />
        <Drivers predictions={predictions.drivers} currentStandings={currentDriverStandings} />
        <DNFs predictions={predictions.dnfs} leastDnfs={predictions.leastDnfs} currentMostDNF={currentMostDNF} currentLeastDNF={currentLeastDNF} />
        <Poles predictions={predictions} polesClosest={polesClosest} />
        <SafetyCars predictions={predictions} safetyCarsClosest={safetyCarsClosest} />
        <TotalScore totalScore={totalScore} />
      </main>
      <Footer />
    </div>
  );
}

export async function getServerSideProps() {
  // Fetch current standings from the API
  const currentConstructorStandings = await fetchCurrentStandings();
  const currentDriverStandings = await fetchCurrentDriverStandings();

  // Read predictions from the JSON file
  const filePath = path.join(process.cwd(), 'public', 'predictions.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const predictions = JSON.parse(jsonData);

  // Read 2025 grid predictions and actual grid from JSON files
  const predictionsPath = path.join(process.cwd(), 'public', 'gridPredictions.json');
  const actualGridPath = path.join(process.cwd(), 'public', '2025grid.json');
  const predictionsData = await fs.readFile(predictionsPath, 'utf-8');
  const actualGridData = await fs.readFile(actualGridPath, 'utf-8');
  const grid2025Predictions = JSON.parse(predictionsData);
  const actualGrid = JSON.parse(actualGridData);

  // Calculate the 2025 grid scores
  const grid2025Scores = compareGrid2025Predictions(grid2025Predictions, actualGrid);

  return {
    props: {
      predictions,
      currentConstructorStandings,
      currentDriverStandings,
      grid2025Scores,
      currentMostDNF: predictions.dnfs.Current,
      currentLeastDNF: predictions.leastDnfs.Current,
    },
  };
}
