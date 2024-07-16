import React from 'react';

const TotalScore = ({ totalScore }) => {
  return (
    <div className="m-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
      <h2 className="text-2xl font-semibold mb-4 text-red-500">Total Score</h2>
      <p className="mb-2">Mattijn: <span className="font-bold">{totalScore.Mattijn}</span> correct</p>
      <p>Kasper: <span className="font-bold">{totalScore.Kasper}</span> correct</p>
    </div>
  );
};

export default TotalScore;
