import { RiverTripInput } from "../types/trip";

type SortableTrip = Pick<RiverTripInput, "startedAt" | "endedAt"> & {
  createdAt?: string;
};

function getTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function compareTripsBySailDateDesc(left: SortableTrip, right: SortableTrip) {
  const startedDiff = getTime(right.startedAt) - getTime(left.startedAt);

  if (startedDiff !== 0) {
    return startedDiff;
  }

  const endedDiff = getTime(right.endedAt) - getTime(left.endedAt);

  if (endedDiff !== 0) {
    return endedDiff;
  }

  return getTime(right.createdAt) - getTime(left.createdAt);
}

export function sortTripsBySailDateDesc<Trip extends SortableTrip>(trips: Trip[]) {
  return [...trips].sort(compareTripsBySailDateDesc);
}
