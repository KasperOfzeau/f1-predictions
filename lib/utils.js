export const comparePredictions = (predicted, current) => {
    let correctCount = 0;
    predicted.forEach((item, index) => {
      if (item === current[index]?.name) correctCount++;
    });
    return correctCount;
  };
  
  export const isCorrectLeastDNFPrediction = (prediction, leastDNFDrivers) => {
    return leastDNFDrivers.some(driver => driver.driver === prediction);
  };
  
  export const calculateTotalScore = (predictions, currentConstructorStandings, currentDriverStandings, top3MostDNFDrivers, top3LeastDNFDrivers, polesClosest, safetyCarsClosest) => {
    const lastDriver = currentDriverStandings[currentDriverStandings.length - 1]?.name;
    const lastConstructor = currentConstructorStandings[currentConstructorStandings.length - 1]?.name;
  
    return {
      Mattijn: comparePredictions(predictions.constructors.top3.Mattijn, currentConstructorStandings)
        + comparePredictions(predictions.drivers.top3.Mattijn, currentDriverStandings)
        + (predictions.dnfs.Mattijn === top3MostDNFDrivers[0]?.driver ? 1 : 0)
        + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Mattijn, top3LeastDNFDrivers) ? 1 : 0)
        + (predictions.drivers.lastDriver.Mattijn === lastDriver ? 1 : 0)
        + (predictions.constructors.lastConstructor.Mattijn === lastConstructor ? 1 : 0)
        + (polesClosest === 'Mattijn' ? 1 : 0)
        + (safetyCarsClosest === 'Mattijn' ? 1 : 0),
      Kasper: comparePredictions(predictions.constructors.top3.Kasper, currentConstructorStandings)
        + comparePredictions(predictions.drivers.top3.Kasper, currentDriverStandings)
        + (predictions.dnfs.Kasper === top3MostDNFDrivers[0]?.driver ? 1 : 0)
        + (isCorrectLeastDNFPrediction(predictions.leastDnfs.Kasper, top3LeastDNFDrivers) ? 1 : 0)
        + (predictions.drivers.lastDriver.Kasper === lastDriver ? 1 : 0)
        + (predictions.constructors.lastConstructor.Kasper === lastConstructor ? 1 : 0)
        + (polesClosest === 'Kasper' ? 1 : 0)
        + (safetyCarsClosest === 'Kasper' ? 1 : 0),
    };
  };
  