import { RiverTrip, TripDifficulty, tripDifficultyOptions } from "../types/trip";

export type RankingItem = {
  count: number;
  distanceKm: number;
  label: string;
};

export type DifficultyStat = {
  count: number;
  difficulty: TripDifficulty;
  ratio: number;
};

export type TripStats = {
  averageDistanceKm: number;
  longestTrip?: RiverTrip;
  mappedTrips: number;
  mostFrequentBoat?: RankingItem;
  mostFrequentCrewMember?: RankingItem;
  mostFrequentRiver?: RankingItem;
  topDifficulty?: TripDifficulty;
  totalDistanceKm: number;
  totalTrips: number;
  yearlyDistanceKm: number;
  yearlyTrips: number;
  difficultyStats: DifficultyStat[];
};

const difficultyRank = new Map<TripDifficulty, number>(
  tripDifficultyOptions.map((difficulty, index) => [difficulty, index]),
);

function countByLabel(trips: RiverTrip[], getLabels: (trip: RiverTrip) => string[]) {
  const counts = new Map<string, RankingItem>();

  trips.forEach((trip) => {
    getLabels(trip).forEach((label) => {
      const normalizedLabel = label.trim();

      if (!normalizedLabel) {
        return;
      }

      const current = counts.get(normalizedLabel) ?? {
        count: 0,
        distanceKm: 0,
        label: normalizedLabel,
      };

      counts.set(normalizedLabel, {
        ...current,
        count: current.count + 1,
        distanceKm: current.distanceKm + trip.distanceKm,
      });
    });
  });

  return [...counts.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return right.distanceKm - left.distanceKm;
  })[0];
}

export function createTripStats(trips: RiverTrip[], year = new Date().getFullYear()): TripStats {
  const totalDistanceKm = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const yearlyTripsList = trips.filter((trip) => new Date(trip.startedAt).getFullYear() === year);
  const yearlyDistanceKm = yearlyTripsList.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const longestTrip = [...trips].sort((left, right) => right.distanceKm - left.distanceKm)[0];
  const topDifficulty = [...trips]
    .sort(
      (left, right) =>
        (difficultyRank.get(right.difficulty) ?? 0) - (difficultyRank.get(left.difficulty) ?? 0),
    )[0]?.difficulty;

  const difficultyStats = tripDifficultyOptions.map((difficulty) => {
    const count = trips.filter((trip) => trip.difficulty === difficulty).length;

    return {
      count,
      difficulty,
      ratio: trips.length > 0 ? count / trips.length : 0,
    };
  });

  return {
    averageDistanceKm: trips.length > 0 ? totalDistanceKm / trips.length : 0,
    difficultyStats,
    longestTrip,
    mappedTrips: trips.filter((trip) => (trip.routeCoordinates?.length ?? 0) >= 2).length,
    mostFrequentBoat: countByLabel(trips, (trip) => [trip.boatType]),
    mostFrequentCrewMember: countByLabel(trips, (trip) => trip.crew),
    mostFrequentRiver: countByLabel(trips, (trip) => [trip.river]),
    topDifficulty,
    totalDistanceKm,
    totalTrips: trips.length,
    yearlyDistanceKm,
    yearlyTrips: yearlyTripsList.length,
  };
}
