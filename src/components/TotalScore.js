import React from 'react';

const TotalScore = ({ totalScore }) => {
  return (
    <div className="mb-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
    <h2 className="text-2xl font-semibold mb-4 text-red-500">Total Score</h2>
    <p className={`mb-2 ${totalScore.Mattijn > totalScore.Kasper ? 'text-green-500' : ''}`}>
      Mattijn: {totalScore.Mattijn} points <br/> 
      ({totalScore.breakdown.Mattijn.normal} normal + {totalScore.breakdown.Mattijn.grid2025} grid 2025)
    </p>
    <p className={`${totalScore.Kasper > totalScore.Mattijn ? 'text-green-500' : ''}`}>
      Kasper: {totalScore.Kasper} points <br/> 
      ({totalScore.breakdown.Kasper.normal} normal + {totalScore.breakdown.Kasper.grid2025} grid 2025)
    </p>
  </div>
  
  );
};

export default TotalScore;
