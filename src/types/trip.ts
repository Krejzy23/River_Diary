export const tripDifficultyOptions = [
  "ZWA-",
  "ZWA",
  "ZWA+",
  "ZWA-ZWB",
  "ZWB-",
  "ZWB",
  "ZWB+",
  "ZWB-ZWC",
  "ZWC-",
  "ZWC",
  "ZWC+",
  "ZWC-WWI",
  "WWI-",
  "WWI",
  "WWI+",
  "WWI-WWII",
  "WWII-",
  "WWII",
  "WWII+",
  "WWII-WWIII",
  "WWIII-",
  "WWIII",
  "WWIII+",
  "WWIII-WWIV",
  "WWIV-",
  "WWIV",
  "WWIV+",
  "WWIV-WWV",
  "WWV-",
  "WWV",
  "WWV+",
] as const;
export const boatTypeOptions = [
  "Zet",
  "Packraft",
  "Vydra",
  "Samba",
  "Scout",
  "Baraka",
  "Colorado",
  "Hobit",
] as const;

export const maxRouteCoordinateCount = 1000;

export type TripDifficulty = (typeof tripDifficultyOptions)[number];
export type BoatType = (typeof boatTypeOptions)[number];

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type WaterConditionStatus =
  | "unknown"
  | "dry"
  | "low"
  | "good"
  | "high"
  | "flood";

export type WaterCondition = {
  distanceKm?: number;
  flowM3s?: number;
  gaugeId?: string;
  latitude?: number;
  levelCm?: number;
  longitude?: number;
  measuredAt?: string;
  note?: string;
  source?: string;
  sourceUrl?: string;
  stationName?: string;
  status?: WaterConditionStatus;
  statusLabel?: string;
  streamName?: string;
  updatedAt?: string;
};

export type RiverTripInput = {
  river: string;
  from: string;
  to: string;
  distanceKm: number;
  crew: string[];
  difficulty: TripDifficulty;
  boatType: BoatType;
  startedAt: string;
  endedAt: string;
  routeCoordinates?: RouteCoordinate[];
  waterCondition?: WaterCondition;
  notes?: string;
};

export type RiverTrip = RiverTripInput & {
  id: string;
  createdAt: string;
  ownerId: string;
};
