import React from 'react';

const SafetyCars = ({ predictions, safetyCarsClosest }) => {
  return (
    <div className="m-8 p-4 border-2 border-red-500 rounded-lg bg-gray-800 text-white">
      <h2 className="text-2xl font-semibold text-red-500">Safety Cars Deployed</h2>
      <p className='mb-4'>(Who's closest)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p>Mattijn's Prediction: <span className={`${safetyCarsClosest === 'Mattijn' ? 'text-green-500' : ''}`}>{predictions.safetyCars.Mattijn}</span></p>
          <p>Kasper's Prediction: <span className={`${safetyCarsClosest === 'Kasper' ? 'text-green-500' : ''}`}>{predictions.safetyCars.Kasper}</span></p>
        </div>
        <div>
          <p>Current: {predictions.safetyCars.Current}</p>
        </div>
      </div>
    </div>
  );
};

export default SafetyCars;
