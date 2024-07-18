import React from 'react';

const DNFs = ({ predictions, leastDnfs, top3MostDNFDrivers, top3LeastDNFDrivers }) => {
  const isCorrectPrediction = (prediction, driverList) => {
    return driverList.some(driver => driver.driver === prediction);
  };

  return (
    <div>
      <div className="mb-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
        <h2 className="text-2xl font-semibold mb-4 text-red-500">Most DNFs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Mattijn's Prediction</h3>
            <p className={isCorrectPrediction(predictions.Mattijn, top3MostDNFDrivers) ? 'text-green-500' : ''}>{predictions.Mattijn}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Kasper's Prediction</h3>
            <p className={isCorrectPrediction(predictions.Kasper, top3MostDNFDrivers) ? 'text-green-500' : ''}>{predictions.Kasper}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Current Top 3 Most DNFs</h3>
            <ol className="list-decimal pl-7">
              {top3MostDNFDrivers.map((driver, index) => (
                <li key={index}>{driver.driver} - {driver.count} DNFs</li>
              ))}
            </ol>
          </div>
        </div>
        <h2 className="text-2xl font-semibold my-4 text-red-500">Least DNFs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Mattijn's Least DNFs Prediction</h3>
            <p className={isCorrectPrediction(leastDnfs.Mattijn, top3LeastDNFDrivers) ? 'text-green-500' : ''}>{leastDnfs.Mattijn}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Kasper's Least DNFs Prediction</h3>
            <p className={isCorrectPrediction(leastDnfs.Kasper, top3LeastDNFDrivers) ? 'text-green-500' : ''}>{leastDnfs.Kasper}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Current Top 3 Least DNFs</h3>
            <ol className="list-decimal pl-7">
              {top3LeastDNFDrivers.map((driver, index) => (
                <li key={index}>{driver.driver} - {driver.count} DNFs</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DNFs;
