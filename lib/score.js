import { comparePredictions } from './utils';
import { compareGrid2025Predictions } from './grid2025Utils';

export const calculateTotalScores = (predictions, currentConstructorStandings, currentDriverStandings, polesClosest, safetyCarsClosest, grid2025Scores, currentMostDNF, currentLeastDNF) => {
  const lastDriver = currentDriverStandings[currentDriverStandings.length - 1]?.driver;
  const lastConstructor = currentConstructorStandings[currentConstructorStandings.length - 1]?.constructor;

  const normalScoreMattijn = comparePredictions(predictions.constructors.top3.Mattijn, currentConstructorStandings)
    + comparePredictions(predictions.drivers.top3.Mattijn, currentDriverStandings)
    + (predictions.drivers.lastDriver.Mattijn === lastDriver ? 1 : 0)
    + (predictions.constructors.lastConstructor.Mattijn === lastConstructor ? 1 : 0)
    + (polesClosest === 'Mattijn' ? 1 : 0)
    + (safetyCarsClosest === 'Mattijn' ? 1 : 0)
    + (predictions.dnfs.mostDnfs.Mattijn === currentMostDNF ? 1 : 0)
    + (predictions.dnfs.leastDnfs.Mattijn === currentLeastDNF ? 1 : 0);

  const normalScoreKasper = comparePredictions(predictions.constructors.top3.Kasper, currentConstructorStandings)
    + comparePredictions(predictions.drivers.top3.Kasper, currentDriverStandings)
    + (predictions.drivers.lastDriver.Kasper === lastDriver ? 1 : 0)
    + (predictions.constructors.lastConstructor.Kasper === lastConstructor ? 1 : 0)
    + (polesClosest === 'Kasper' ? 1 : 0)
    + (safetyCarsClosest === 'Kasper' ? 1 : 0)
    + (predictions.dnfs.mostDnfs.Kasper === currentMostDNF ? 1 : 0)
    + (predictions.dnfs.leastDnfs.Kasper === currentLeastDNF ? 1 : 0);

  return {
    Mattijn: normalScoreMattijn + grid2025Scores.Mattijn,
    Kasper: normalScoreKasper + grid2025Scores.Kasper,
    breakdown: {
      Mattijn: { normal: normalScoreMattijn, grid2025: grid2025Scores.Mattijn },
      Kasper: { normal: normalScoreKasper, grid2025: grid2025Scores.Kasper }
    }
  };
};
