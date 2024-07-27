import React from 'react';

const DNFs = ({ predictions, leastDnfs, currentMostDNF, currentLeastDNF }) => {
  const isCorrectPrediction = (prediction, current) => {
    return prediction === current;
  };

  return (
    <div>
      <div className="mb-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
        <h2 className="text-2xl font-semibold mb-4 text-red-500">Most DNFs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Mattijn's Prediction</h3>
            <p className={isCorrectPrediction(predictions.Mattijn, currentMostDNF) ? 'text-green-500' : ''}>{predictions.Mattijn}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Kasper's Prediction</h3>
            <p className={isCorrectPrediction(predictions.Kasper, currentMostDNF) ? 'text-green-500' : ''}>{predictions.Kasper}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Current Most DNFs</h3>
            <p>{currentMostDNF}</p>
          </div>
        </div>
        <h2 className="text-2xl font-semibold my-4 text-red-500">Least DNFs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Mattijn's Least DNFs Prediction</h3>
            <p className={isCorrectPrediction(leastDnfs.Mattijn, currentLeastDNF) ? 'text-green-500' : ''}>{leastDnfs.Mattijn}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Kasper's Least DNFs Prediction</h3>
            <p className={isCorrectPrediction(leastDnfs.Kasper, currentLeastDNF) ? 'text-green-500' : ''}>{leastDnfs.Kasper}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Current Least DNFs</h3>
            <p>{currentLeastDNF}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DNFs;
