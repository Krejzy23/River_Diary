import { RouteCoordinate } from "../types/trip";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function isValidRouteCoordinate(
  value: unknown,
): value is RouteCoordinate {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RouteCoordinate>;

  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

export function normalizeRouteCoordinates(
  value: unknown,
): RouteCoordinate[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const coordinates = value.filter(isValidRouteCoordinate);

  return coordinates.length > 0 ? coordinates : undefined;
}

export function getDistanceKm(start: RouteCoordinate, end: RouteCoordinate) {
  const latitudeDistance = toRadians(end.latitude - start.latitude);
  const longitudeDistance = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const haversine =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2);

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function calculateRouteDistanceKm(coordinates: RouteCoordinate[]) {
  if (coordinates.length < 2) {
    return 0;
  }

  return coordinates.slice(1).reduce((distance, coordinate, index) => {
    const previous = coordinates[index];
    return distance + getDistanceKm(previous, coordinate);
  }, 0);
}

export function formatRouteDistance(coordinates: RouteCoordinate[]) {
  return calculateRouteDistanceKm(coordinates).toFixed(1);
}

export function toLngLat(coordinate: RouteCoordinate): [number, number] {
  return [coordinate.longitude, coordinate.latitude];
}

export function getRouteBounds(
  coordinates: RouteCoordinate[],
): [number, number, number, number] | undefined {
  if (coordinates.length < 2) {
    return undefined;
  }

  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const latitudes = coordinates.map((coordinate) => coordinate.latitude);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}

export function getRouteCenter(
  coordinates: RouteCoordinate[],
  fallback: [number, number],
): [number, number] {
  const bounds = getRouteBounds(coordinates);

  if (!bounds) {
    return coordinates[0] ? toLngLat(coordinates[0]) : fallback;
  }

  return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
}
