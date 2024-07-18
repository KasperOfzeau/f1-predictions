import React from 'react';

const Constructors = ({ predictions, currentStandings }) => {
  const isCorrectPrediction = (prediction, index) => prediction === currentStandings[index]?.name;
  const lastConstructor = currentStandings[currentStandings.length - 1]?.name;

  return (
    <div className="m-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
      <h2 className="text-2xl font-semibold mb-4 text-red-500">Constructors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Mattijn's Predictions</h3>
          <ol className="list-decimal pl-7">
            {predictions.top3.Mattijn.map((constructor, index) => (
              <li key={index} className={`mb-1 ${isCorrectPrediction(constructor, index) ? 'text-green-500' : ''}`}>
                {constructor}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Kasper's Predictions</h3>
          <ol className="list-decimal pl-7">
            {predictions.top3.Kasper.map((constructor, index) => (
              <li key={index} className={`mb-1 ${isCorrectPrediction(constructor, index) ? 'text-green-500' : ''}`}>
                {constructor}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Current Standings</h3>
          <ol className="list-decimal pl-7">
            {currentStandings.slice(0, 3).map((constructor, index) => (
              <li key={index} className="mb-1">
                {constructor.name} - {constructor.points} points
              </li>
            ))}
            <li className="mb-1">
              {lastConstructor} - {currentStandings[currentStandings.length - 1]?.points} points
            </li>
          </ol>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-4 text-red-500 mt-8">Predictions for Last Place</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Mattijn's Prediction for Last Place</h3>
          <p className={`mb-1 ${predictions.lastConstructor.Mattijn === lastConstructor ? 'text-green-500' : ''}`}>
            {predictions.lastConstructor.Mattijn}
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Kasper's Prediction for Last Place</h3>
          <p className={`mb-1 ${predictions.lastConstructor.Kasper === lastConstructor ? 'text-green-500' : ''}`}>
            {predictions.lastConstructor.Kasper}
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Last in Current Standings</h3>
          <p>
            {lastConstructor} - {currentStandings[currentStandings.length - 1]?.points} points
          </p>
        </div>
      </div>
    </div>
  );
};

export default Constructors;
