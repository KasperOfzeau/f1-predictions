import React from 'react';

const Poles = ({ predictions, polesClosest }) => {
  return (
    <div className="mb-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
      <h2 className="text-2xl font-semibold text-red-500">Poles by Max Verstappen</h2>
      <p className='mb-4'>(Who's closest)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p>Mattijn's Prediction: <span className={`${polesClosest === 'Mattijn' ? 'text-green-500' : ''}`}>{predictions.polesMax.Mattijn}</span></p>
          <p>Kasper's Prediction: <span className={`${polesClosest === 'Kasper' ? 'text-green-500' : ''}`}>{predictions.polesMax.Kasper}</span></p>
        </div>
        <div>
          <p>Current: {predictions.polesMax.Current}</p>
        </div>
      </div>
    </div>
  );
};

export default Poles;
