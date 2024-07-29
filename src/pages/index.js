import { query } from '../../lib/db';
import path from 'path';
import { promises as fs } from 'fs';
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
  const safetyCarsDifferenceMattijn = Math.abs(predictions.safetyCar.safetyCars.Mattijn - predictions.safetyCar.safetyCars.Current);
  const safetyCarsDifferenceKasper = Math.abs(predictions.safetyCar.safetyCars.Kasper - predictions.safetyCar.safetyCars.Current);
  const safetyCarsClosest = safetyCarsDifferenceMattijn < safetyCarsDifferenceKasper ? 'Mattijn' : 'Kasper';

  const polesDifferenceMattijn = Math.abs(predictions.poles.polesMax.Mattijn - predictions.poles.polesMax.Current);
  const polesDifferenceKasper = Math.abs(predictions.poles.polesMax.Kasper - predictions.poles.polesMax.Current);
  const polesClosest = polesDifferenceMattijn < polesDifferenceKasper ? 'Mattijn' : 'Kasper';

  const totalScore = calculateTotalScore(predictions, currentConstructorStandings, currentDriverStandings, polesClosest, safetyCarsClosest, grid2025Scores, currentMostDNF, currentLeastDNF);

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-4">
        <h1 className="text-3xl font-bold mb-8 font-formula1 text-red-500">F1 2024 Predictions vs Current Standings</h1>
        <Constructors predictions={predictions.constructors} currentStandings={currentConstructorStandings} />
        <Drivers predictions={predictions.drivers} currentStandings={currentDriverStandings} />
        <DNFs mostDnfs={predictions.dnfs.mostDnfs} leastDnfs={predictions.dnfs.leastDnfs} currentMostDNF={currentMostDNF} currentLeastDNF={currentLeastDNF} />
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

  // Fetch predictions from the database
  const predictionsResult = await query(`
    SELECT u.name, p.category, p.sub_category, p.prediction
    FROM predictions p
    JOIN users u ON p.user_id = u.id;
  `);

  // Fetch current values from the database
  const currentValuesResult = await query(`
    SELECT category, value
    FROM current_values;
  `);

  // Parse predictions and current values
  const predictions = {};
  predictionsResult.rows.forEach(row => {
    if (!predictions[row.category]) {
      predictions[row.category] = {};
    }
    if (!predictions[row.category][row.sub_category]) {
      predictions[row.category][row.sub_category] = {};
    }
    predictions[row.category][row.sub_category][row.name] = row.prediction;
  });

  const currentValues = {};
  currentValuesResult.rows.forEach(row => {
    const [category, subCategory] = row.category.split('_');
    if (!currentValues[category]) {
      currentValues[category] = {};
    }
    currentValues[category][subCategory] = row.value;
  });

  // Read 2025 grid predictions and actual grid from JSON files (assuming they are still stored in JSON files)
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
      currentMostDNF: currentValues.dnfs.mostDnfs,
      currentLeastDNF: currentValues.dnfs.leastDnfs,
    },
  };
}
