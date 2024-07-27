import Head from 'next/head';
import Navbar from '../components/Navbar';
import { promises as fs } from 'fs';
import path from 'path';
import Footer from '@/components/Footer';

export default function Grid2025({ predictions, actualGrid, totalScore }) {
  const comparePredictionsGrid = (predictions, actualGrid) => {
    let score = { Kasper: 0, Mattijn: 0 };
    let results = { Kasper: {}, Mattijn: {} };

    Object.keys(actualGrid).forEach(team => {
      const actualDrivers = actualGrid[team].Drivers;

      ['Kasper', 'Mattijn'].forEach(person => {
        const predictedDrivers = predictions[person][team]?.Drivers || [];
        results[person][team] = { correct: [], incorrect: [] };

        predictedDrivers.forEach(driver => {
          if (actualDrivers.includes(driver)) {
            score[person]++;
            results[person][team].correct.push(driver);
          } else {
            results[person][team].incorrect.push(driver);
          }
        });
      });
    });

    return { score, results };
  };

  const { score: scores, results } = comparePredictionsGrid(predictions, actualGrid);

  const renderTable = (title, person) => (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-center text-red-500">{title}</h2>
      <table className="table-auto w-full text-left text-xs">
        <thead>
          <tr>
            <th className="px-4 py-2">Team</th>
            <th className="px-4 py-2">Driver 1</th>
            <th className="px-4 py-2">Driver 2</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(predictions[person]).map(team => (
            <tr key={team} className="border-t">
              <td className="px-4 py-2">{team}</td>
              <td className={`px-4 py-2 ${results[person][team].correct.includes(predictions[person][team].Drivers[0]) ? 'bg-green-500' : ''}`}>
                {predictions[person][team].Drivers[0]}
              </td>
              <td className={`px-4 py-2 ${results[person][team].correct.includes(predictions[person][team].Drivers[1]) ? 'bg-green-500' : ''}`}>
                {predictions[person][team].Drivers[1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <Head>
        <title>F1 2025 Grid Prediction</title>
      </Head>
      <Navbar />
      <main className="flex-grow py-8">
        <h1 className="text-3xl font-bold mb-8 mx-4 font-formula1 text-red-500">F1 2025 Grid Prediction</h1>
        {renderTable("Kasper's Predictions", 'Kasper')}
        {renderTable("Mattijn's Predictions", 'Mattijn')}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-center text-red-500">Actual Grid</h2>
          <table className="table-auto w-full text-left text-xs">
            <thead>
              <tr>
                <th className="px-4 py-2">Team</th>
                <th className="px-4 py-2">Driver 1</th>
                <th className="px-4 py-2">Driver 2</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(actualGrid).map(team => (
                <tr key={team} className="border-t">
                  <td className="px-4 py-2">{team}</td>
                  <td className="px-4 py-2">{actualGrid[team].Drivers[0]}</td>
                  <td className="px-4 py-2">{actualGrid[team].Drivers[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function getServerSideProps() {
  // Read predictions and actual grid from JSON files
  const predictionsPath = path.join(process.cwd(), 'public', 'gridPredictions.json');
  const actualGridPath = path.join(process.cwd(), 'public', '2025grid.json');
  const predictionsData = await fs.readFile(predictionsPath, 'utf-8');
  const actualGridData = await fs.readFile(actualGridPath, 'utf-8');
  const predictions = JSON.parse(predictionsData);
  const actualGrid = JSON.parse(actualGridData);

  // Read total score from the main predictions file
  const totalScorePath = path.join(process.cwd(), 'public', 'predictions.json');
  const totalScoreData = await fs.readFile(totalScorePath, 'utf-8');
  const totalScore = JSON.parse(totalScoreData).totalScore || { Kasper: 0, Mattijn: 0 };

  return {
    props: {
      predictions,
      actualGrid,
      totalScore,
    },
  };
}
