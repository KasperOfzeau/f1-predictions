export const comparePredictions = (predicted, current) => {
  let correctCount = 0;
  predicted.forEach((item, index) => {
    if (item === current[index]?.driver || item === current[index]?.constructor) correctCount++;
  });
  return correctCount;
};

export const isCorrectLeastDNFPrediction = (prediction, leastDNFDrivers) => {
  return leastDNFDrivers.some(driver => driver.driver === prediction);
};
