import React from 'react';

const Constructors = ({ predictions, currentStandings }) => {
  const isCorrectPrediction = (prediction, index) => prediction === currentStandings[index]?.name;

  return (
    <div className="m-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
      <h2 className="text-2xl font-semibold mb-4 text-red-500">Constructors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Mattijn's Predictions</h3>
          <ol className="list-decimal pl-7">
            {predictions.Mattijn.map((team, index) => (
              <li key={index} className={`mb-1 ${isCorrectPrediction(team, index) ? 'text-green-500' : ''}`}>
                {team}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Kasper's Predictions</h3>
          <ol className="list-decimal pl-7">
            {predictions.Kasper.map((team, index) => (
              <li key={index} className={`mb-1 ${isCorrectPrediction(team, index) ? 'text-green-500' : ''}`}>
                {team}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Current Standings</h3>
          <ul className="list-decimal pl-7">
            {currentStandings.slice(0, 3).map((team, index) => (
              <li key={index} className="mb-1">
                {team.name} - {team.points} points
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Constructors;
