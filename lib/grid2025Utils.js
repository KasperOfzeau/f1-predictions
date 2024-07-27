export const compareGrid2025Predictions = (predictions, actualGrid) => {
    let score = { Kasper: 0, Mattijn: 0 };
  
    Object.keys(actualGrid).forEach(team => {
      const actualDrivers = actualGrid[team].Drivers;
  
      ['Kasper', 'Mattijn'].forEach(person => {
        const predictedDrivers = predictions[person][team]?.Drivers || [];
        predictedDrivers.forEach(driver => {
          if (actualDrivers.includes(driver)) {
            score[person]++;
          }
        });
      });
    });
  
    return score;
  };
  